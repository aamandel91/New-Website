import { instanceCachingFactory } from 'tsyringe'
import { PgBoss } from 'pg-boss'
import type { Logger } from 'pino'
import type { AppConfig } from '../config.js'

/**
 * pg-boss job queue singleton. Reuses the knex Postgres connection settings
 * (there is no DATABASE_URL in this repo — config.db.connection carries
 * host/port/user/password/database/ssl). pg-boss manages its own `pgboss`
 * schema outside of knex migrations by design.
 *
 * The instance is created lazily and NOT started here — src/jobs/index.ts
 * starts it inside the server process at boot.
 */
export default {
  token: 'pgboss',
  useFactory: instanceCachingFactory((container) => {
    const config = container.resolve<AppConfig>('config')
    const logger = container.resolve<Logger>('logger.global')
    const connection = config.db.connection as {
      host: string
      port: number
      user: string
      password: string
      database: string
      ssl: false | { rejectUnauthorized: boolean }
    }
    const boss = new PgBoss({
      host: connection.host,
      port: connection.port,
      user: connection.user,
      password: connection.password,
      database: connection.database,
      ...(connection.ssl ? { ssl: connection.ssl } : {}),
      schema: 'pgboss'
    })
    boss.on('error', (err: Error) => {
      logger.error({ err }, '[pgboss]: queue error')
    })
    return boss
  })
}
