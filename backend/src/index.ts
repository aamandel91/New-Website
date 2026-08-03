import 'reflect-metadata'
import './providers/index.js'
import http from 'node:http'
import type { Logger } from 'pino'
import { container } from 'tsyringe'
import app from './app.js'
import config from './config.js'
import BossWebhooksService from './services/boss/webhook.js'
import { startJobQueue } from './jobs/index.js'
const logger = container.resolve<Logger>('logger.global')

// setup nats connection on start, testing resolving on actual use
// import { JetStreamClient } from "@nats-io/jetstream";
// await container.resolve<Promise<JetStreamClient>>("nats");

import _debug from 'debug'
const debug = _debug('repliers:server')
debug(`process.env.PORT:`, process.env['PORT'])
debug(`Starting server with config:`, config)
http.createServer(app.callback()).listen(config.app.port, () => {
  logger.info(`Server is running on port ${config.app.port}`)
})
const webhook = container.resolve(BossWebhooksService)
await webhook.installHooks()
// pg-boss job queue (Repliers/SureSend webhook processing) — logs and
// continues if Postgres is unavailable.
await startJobQueue()
process.on('SIGINT', () => {
  logger.info('Shutting down')
  webhook.uninstallHooks().finally(() => {
    process.exit(0)
  })
})
process.on('SIGTERM', () => {
  logger.info('Shutting down')
  webhook.uninstallHooks().finally(() => {
    process.exit(0)
  })
})
