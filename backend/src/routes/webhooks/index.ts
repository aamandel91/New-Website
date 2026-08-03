import Router from '@koa/router'
import bossWebhooksRouter from './boss.js'
import repliersWebhooksRouter from './repliers.js'
import repliersEventsRouter from './repliersEvents.js'
import suresendWebhooksRouter from './suresend.js'
import sendgridInboundRouter from './sendgrid-inbound.js'
const router = new Router({
  prefix: '/webhooks'
})
router.use(bossWebhooksRouter.routes(), bossWebhooksRouter.allowedMethods())
router.use(
  repliersWebhooksRouter.routes(),
  repliersWebhooksRouter.allowedMethods()
)
router.use(repliersEventsRouter.routes(), repliersEventsRouter.allowedMethods())
router.use(
  suresendWebhooksRouter.routes(),
  suresendWebhooksRouter.allowedMethods()
)
router.use(
  sendgridInboundRouter.routes(),
  sendgridInboundRouter.allowedMethods()
)
export default router
