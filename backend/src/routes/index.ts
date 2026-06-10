import Router from '@koa/router'
import listingsRouter from './listings.js'
import authRouter from './auth.js'
import autosuggestRouter from './autosuggest.js'
import favoritesRouter from './favorites.js'
import contactsRouter from './contact.js'
import searchesRouter from './searches.js'
import userRouter from './user.js'
import estimateRouter from './estimate.js'
import statsRouter from './stats.js'
import vtourRouter from './vtour.js'
import agentRouter from './agent.js'
import adminRouter from './admin.js'
import webookRouter from './webhooks/index.js'
import blogsRouter from './blogs.js'
import organizationRouter from './organization.js'
import leadsRouter from './leads.js'
import contentPagesRouter from './contentPages.js'
import navigationRouter from './navigation.js'
import aiContentRouter from './aiContent.js'
import placesRouter from './places.js'
import searchWithSchoolsRouter from './searchWithSchools.js'
import seoMetaTemplatesRouter from './seoMetaTemplates.js'
import relatedBlogPostsRouter from './relatedBlogPosts.js'
const router = new Router({
  prefix: '/api'
})
router.use(authRouter.routes(), authRouter.allowedMethods())
router.use(listingsRouter.routes(), listingsRouter.allowedMethods())
router.use(autosuggestRouter.routes(), autosuggestRouter.allowedMethods())
router.use(favoritesRouter.routes(), favoritesRouter.allowedMethods())
router.use(contactsRouter.routes(), contactsRouter.allowedMethods())
router.use(searchesRouter.routes(), searchesRouter.allowedMethods())
router.use(userRouter.routes(), userRouter.allowedMethods())
router.use(estimateRouter.routes(), estimateRouter.allowedMethods())
router.use(statsRouter.routes(), statsRouter.allowedMethods())
router.use(vtourRouter.routes(), vtourRouter.allowedMethods())
router.use(agentRouter.routes(), agentRouter.allowedMethods())
router.use(adminRouter.routes(), adminRouter.allowedMethods())
router.use(webookRouter.routes(), webookRouter.allowedMethods())
router.use(blogsRouter.routes(), blogsRouter.allowedMethods())
router.use(organizationRouter.routes(), organizationRouter.allowedMethods())
router.use(leadsRouter.routes(), leadsRouter.allowedMethods())
router.use(contentPagesRouter.routes(), contentPagesRouter.allowedMethods())
router.use(navigationRouter.routes(), navigationRouter.allowedMethods())
router.use(aiContentRouter.routes(), aiContentRouter.allowedMethods())
router.use(placesRouter.routes(), placesRouter.allowedMethods())
router.use(
  searchWithSchoolsRouter.routes(),
  searchWithSchoolsRouter.allowedMethods()
)
router.use(
  seoMetaTemplatesRouter.routes(),
  seoMetaTemplatesRouter.allowedMethods()
)
router.use(
  relatedBlogPostsRouter.routes(),
  relatedBlogPostsRouter.allowedMethods()
)
export default router
