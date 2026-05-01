import Router from '@koa/router'
import joi from 'joi'
import { ApiError } from '../lib/errors.js'
import RepliersService from '../services/repliers.js'

const router = new Router({
  prefix: '/places'
})

const placesSchema = joi.object<{ lat: string; long: string }>().keys({
  lat: joi
    .string()
    .regex(/^(-?\d+(\.\d+)?)$/)
    .required(),
  long: joi
    .string()
    .regex(/^(-?\d+(\.\d+)?)$/)
    .required()
})

/**
 * @openapi
 * /api/places:
 *   get:
 *     tags:
 *       - Places
 *     summary: Nearby places (schools, parks, transit, dining, etc.)
 *     description: |
 *       Server-side proxy for the Repliers `/places` endpoint. Per the
 *       Repliers OpenAPI spec, `/places` is only documented on the
 *       server-side base URL (api.repliers.io), so this route forwards
 *       the call with the server-side API key.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^(-?\d+(\.\d+)?)$
 *       - in: query
 *         name: long
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^(-?\d+(\.\d+)?)$
 *     responses:
 *       200:
 *         description: Nearby places grouped by category.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/', async (ctx) => {
  ctx.state['enable.xff'] = true
  const { error, value } = placesSchema.validate(ctx.request.query)
  if (error) {
    ctx.throw(new ApiError(error.message, 400))
    return
  }
  const repliers = ctx.state.container.resolve(RepliersService)
  ctx.body = await repliers.listings.places(value)
})

export default router
