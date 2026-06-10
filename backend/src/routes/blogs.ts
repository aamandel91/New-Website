import Router from '@koa/router'
import { container } from 'tsyringe'
import type { Middleware } from 'koa-jwt'
import { BlogService } from '../services/blogs.js'
import { ApiError } from '../lib/errors.js'
import {
  createBlogSchema,
  updateBlogSchema,
  getBlogSchema,
  listBlogsSchema,
  aiSuggestionsSchema,
  publishBlogSchema,
  deleteBlogSchema
} from '../validate/blogs.js'
import { RoleMiddlewareCreator } from '../providers/middleware/role.js'
import { UserRole } from '../constants.js'

const router = new Router({ prefix: '/blogs' })
const authMiddleware = container.resolve<Middleware>('middleware.jwt')
const roleMiddleware =
  container.resolve<RoleMiddlewareCreator>('middleware.role')

// PUBLIC ROUTES

/**
 * GET /api/blogs - List published blogs
 */
router.get('/', async (ctx) => {
  const { error, value } = listBlogsSchema.validate(ctx.query)
  if (error) ctx.throw(new ApiError(error.message, 400))

  const blogsService = ctx.state['container'].resolve(BlogService)

  const result = await blogsService.getBlogs({
    status: 'published',
    limit: value.limit,
    offset: value.offset,
    search: value.search,
    tag: value.tag,
    category: value.category
  })

  ctx.body = result
})

/**
 * GET /api/blogs/featured - Get featured blogs
 */
router.get('/featured', async (ctx) => {
  const blogsService = ctx.state['container'].resolve(BlogService)
  const blogs = await blogsService.getFeaturedBlogs(3)
  ctx.body = { blogs }
})

/**
 * GET /api/blogs/tags - Get all tags
 */
router.get('/tags', async (ctx) => {
  const blogsService = ctx.state['container'].resolve(BlogService)
  const tags = await blogsService.getTags(50)
  ctx.body = { tags }
})

/**
 * GET /api/blogs/categories - Get all categories
 */
router.get('/categories', async (ctx) => {
  const blogsService = ctx.state['container'].resolve(BlogService)
  const categories = await blogsService.getCategories()
  ctx.body = { categories }
})

/**
 * GET /api/blogs/:slug - Get blog by slug
 */
router.get('/:slug', async (ctx) => {
  const blogsService = ctx.state['container'].resolve(BlogService)

  const slug = ctx.params['slug']
  if (!slug) {
    ctx.status = 400
    ctx.body = { error: 'Slug is required' }
    return
  }
  const blog = await blogsService.getBlogBySlug(slug)

  if (!blog) {
    ctx.status = 404
    ctx.body = { error: 'Blog not found' }
    return
  }

  if (blog.status !== 'published') {
    ctx.status = 404
    ctx.body = { error: 'Blog not available' }
    return
  }

  // Get related blogs
  const related = await blogsService.getRelatedBlogs(blog.id, 3)

  ctx.body = { blog, related }
})

/**
 * GET /api/blogs/:id/related - Get related blogs
 */
router.get('/:id/related', async (ctx) => {
  const blogsService = ctx.state['container'].resolve(BlogService)

  const idParam = ctx.params['id']
  if (!idParam) {
    ctx.status = 400
    ctx.body = { error: 'Id is required' }
    return
  }
  const id = BigInt(idParam)
  const related = await blogsService.getRelatedBlogs(id, 5)

  ctx.body = { related }
})

// ADMIN ROUTES (protected)

/**
 * POST /api/blogs - Create a new blog
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const { error, value } = createBlogSchema.validate(ctx.request.body)
    if (error) ctx.throw(new ApiError(error.message, 400))

    const blogsService = ctx.state['container'].resolve(BlogService)

    const blog = await blogsService.createBlog({
      ...value,
      author_email: ctx.state['user'].email
    })

    ctx.status = 201
    ctx.body = { blog }
  }
)

/**
 * GET /api/blogs/admin/all - Get all blogs (draft + published) - Admin only
 */
router.get(
  '/admin/all',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const { error, value } = listBlogsSchema.validate(ctx.query)
    if (error) ctx.throw(new ApiError(error.message, 400))

    const blogsService = ctx.state['container'].resolve(BlogService)

    // Get all blogs regardless of status
    const result = await blogsService.getBlogs({
      author_email: ctx.state['user'].email,
      limit: value.limit,
      offset: value.offset,
      search: value.search,
      tag: value.tag,
      category: value.category
    })

    ctx.body = result
  }
)

/**
 * GET /api/blogs/admin/:id - Get blog for editing - Admin only
 */
router.get(
  '/admin/:id',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const { error, value } = getBlogSchema.validate({ id: ctx.params['id'] })
    if (error) ctx.throw(new ApiError(error.message, 400))

    const blogsService = ctx.state['container'].resolve(BlogService)

    const blog = await blogsService.getBlogById(BigInt(value.id))

    if (!blog) {
      ctx.status = 404
      ctx.body = { error: 'Blog not found' }
      return
    }

    // Check authorization - only admin who created or root can edit
    if (
      blog.author_email !== ctx.state['user'].email &&
      ctx.state['user'].role !== UserRole.Root
    ) {
      ctx.throw(new ApiError('Insufficient privileges', 403))
    }

    ctx.body = { blog }
  }
)

/**
 * PATCH /api/blogs/:id - Update blog
 */
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const { error, value } = updateBlogSchema.validate({
      id: ctx.params['id'],
      ...(ctx.request.body as Record<string, unknown>)
    })
    if (error) ctx.throw(new ApiError(error.message, 400))

    const blogsService = ctx.state['container'].resolve(BlogService)

    const blog = await blogsService.getBlogById(BigInt(value.id))

    if (!blog) {
      ctx.status = 404
      ctx.body = { error: 'Blog not found' }
      return
    }

    // Check authorization
    if (
      blog.author_email !== ctx.state['user'].email &&
      ctx.state['user'].role !== UserRole.Root
    ) {
      ctx.throw(new ApiError('Insufficient privileges', 403))
    }

    const updated = await blogsService.updateBlog(BigInt(value.id), value)

    ctx.body = { blog: updated }
  }
)

/**
 * POST /api/blogs/:id/publish - Publish a blog
 */
router.post(
  '/:id/publish',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const { error, value } = publishBlogSchema.validate({
      id: ctx.params['id']
    })
    if (error) ctx.throw(new ApiError(error.message, 400))

    const blogsService = ctx.state['container'].resolve(BlogService)

    const blog = await blogsService.getBlogById(BigInt(value.id))

    if (!blog) {
      ctx.status = 404
      ctx.body = { error: 'Blog not found' }
      return
    }

    // Check authorization
    if (
      blog.author_email !== ctx.state['user'].email &&
      ctx.state['user'].role !== UserRole.Root
    ) {
      ctx.throw(new ApiError('Insufficient privileges', 403))
    }

    const published = await blogsService.publishBlog(BigInt(value.id))

    ctx.body = { blog: published }
  }
)

/**
 * DELETE /api/blogs/:id - Delete blog
 */
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const { error, value } = deleteBlogSchema.validate({ id: ctx.params['id'] })
    if (error) ctx.throw(new ApiError(error.message, 400))

    const blogsService = ctx.state['container'].resolve(BlogService)

    const blog = await blogsService.getBlogById(BigInt(value.id))

    if (!blog) {
      ctx.status = 404
      ctx.body = { error: 'Blog not found' }
      return
    }

    // Check authorization
    if (
      blog.author_email !== ctx.state['user'].email &&
      ctx.state['user'].role !== UserRole.Root
    ) {
      ctx.throw(new ApiError('Insufficient privileges', 403))
    }

    const deleted = await blogsService.deleteBlog(BigInt(value.id))

    if (!deleted) {
      ctx.throw(new ApiError('Failed to delete blog', 500))
    }

    ctx.body = { success: true }
  }
)

/**
 * POST /api/blogs/ai/suggestions - Get AI suggestions for meta and tags
 */
router.post(
  '/ai/suggestions',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const { error, value } = aiSuggestionsSchema.validate(ctx.request.body)
    if (error) ctx.throw(new ApiError(error.message, 400))

    const blogsService = ctx.state['container'].resolve(BlogService)

    const suggestions = await blogsService.generateAISuggestions(
      value.title,
      value.description,
      value.content
    )

    ctx.body = { suggestions }
  }
)

/**
 * POST /api/blogs/admin/:id/auto-tag - Manual re-run of AI auto-tagging
 *   (Track 3). Returns the structured suggestion so the UI can show fresh
 *   results without re-fetching the blog.
 */
router.post(
  '/admin/:id/auto-tag',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const idParam = ctx.params['id']
    if (!idParam) ctx.throw(new ApiError('Id is required', 400))

    const blogsService = ctx.state['container'].resolve(BlogService)
    const blog = await blogsService.getBlogById(BigInt(idParam!))
    if (!blog) {
      ctx.status = 404
      ctx.body = { error: 'Blog not found' }
      return
    }
    if (
      blog.author_email !== ctx.state['user'].email &&
      ctx.state['user'].role !== UserRole.Root
    ) {
      ctx.throw(new ApiError('Insufficient privileges', 403))
    }

    const result = await blogsService.runAutoTag(blog)
    const refreshed = await blogsService.getBlogById(blog.id)
    ctx.body = { result, blog: refreshed }
  }
)

/**
 * POST /api/blogs/admin/:id/auto-tag/apply - Apply admin decisions on the
 *   latest AI suggestions: merge accepted tags into blog.tags, remember
 *   rejected tags so the next AI run won't re-propose them.
 */
router.post(
  '/admin/:id/auto-tag/apply',
  authMiddleware,
  roleMiddleware([UserRole.Admin, UserRole.Root]),
  async (ctx) => {
    const idParam = ctx.params['id']
    if (!idParam) ctx.throw(new ApiError('Id is required', 400))

    const body = (ctx.request.body || {}) as {
      accepted?: unknown
      rejected?: unknown
    }
    const accepted = Array.isArray(body.accepted)
      ? body.accepted.filter((t): t is string => typeof t === 'string')
      : []
    const rejected = Array.isArray(body.rejected)
      ? body.rejected.filter((t): t is string => typeof t === 'string')
      : []

    const blogsService = ctx.state['container'].resolve(BlogService)
    const existing = await blogsService.getBlogById(BigInt(idParam!))
    if (!existing) {
      ctx.status = 404
      ctx.body = { error: 'Blog not found' }
      return
    }
    if (
      existing.author_email !== ctx.state['user'].email &&
      ctx.state['user'].role !== UserRole.Root
    ) {
      ctx.throw(new ApiError('Insufficient privileges', 403))
    }

    const updated = await blogsService.applyAutoTagDecisions(BigInt(idParam!), {
      accepted,
      rejected
    })
    ctx.body = { blog: updated }
  }
)

export default router
