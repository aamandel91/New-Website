import Joi from 'joi'

export const createBlogSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().required().min(10).max(500),
  content: Joi.string().required().min(50),
  featured_image_url: Joi.string().uri().optional().allow(null),
  featured_image_cloudinary_id: Joi.string().optional().allow(null),
  status: Joi.string().valid('draft', 'published').default('draft'),
  tags: Joi.array().items(Joi.string()).optional(),
  categories: Joi.array().items(Joi.string()).optional(),
  meta_title: Joi.string().max(60).optional().allow(null),
  meta_description: Joi.string().max(160).optional().allow(null),
  meta_keywords: Joi.array().items(Joi.string()).optional(),
  published_at: Joi.date().optional().allow(null)
})

export const updateBlogSchema = Joi.object({
  id: Joi.number().required(),
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).max(500).optional(),
  content: Joi.string().min(50).optional(),
  featured_image_url: Joi.string().uri().optional().allow(null),
  featured_image_cloudinary_id: Joi.string().optional().allow(null),
  status: Joi.string().valid('draft', 'published').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  categories: Joi.array().items(Joi.string()).optional(),
  meta_title: Joi.string().max(60).optional().allow(null),
  meta_description: Joi.string().max(160).optional().allow(null),
  meta_keywords: Joi.array().items(Joi.string()).optional(),
  published_at: Joi.date().optional().allow(null)
})

export const getBlogSchema = Joi.object({
  id: Joi.number().required()
})

export const getBlogBySlugSchema = Joi.object({
  slug: Joi.string().required()
})

export const listBlogsSchema = Joi.object({
  status: Joi.string().valid('draft', 'published').optional(),
  author_email: Joi.string().email().optional(),
  tag: Joi.string().optional(),
  category: Joi.string().optional(),
  search: Joi.string().optional(),
  limit: Joi.number().default(10).max(50),
  offset: Joi.number().default(0),
  sort_by: Joi.string().valid('recent', 'oldest', 'popular').default('recent')
})

export const aiSuggestionsSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  content: Joi.string().required()
})

export const publishBlogSchema = Joi.object({
  id: Joi.number().required()
})

export const deleteBlogSchema = Joi.object({
  id: Joi.number().required()
})

export const imageUploadSchema = Joi.object({
  file: Joi.any().required() // File buffer from multer
})
