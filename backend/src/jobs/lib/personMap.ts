import { injectable } from 'tsyringe'
import type { Logger } from 'pino'
import { inject } from 'tsyringe'
import SureSendService from '../../services/suresend/client.js'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import { PORTAL_SOURCE, TENANT } from './portal.js'

export interface EnsurePersonParams {
  email: string
  firstName?: string | undefined
  lastName?: string | undefined
  phone?: string | undefined
  repliersClientId?: number | undefined
  tags?: string[] | undefined
  source?: string | undefined
}

/**
 * Resolves a portal identity to a SureSend person id via the local
 * suresend_person_map table, creating the person in SureSend when no
 * mapping exists (SureSend itself dedupes by email, and we double-check
 * with findPeople before creating).
 */
@injectable()
export default class PersonMapService {
  constructor(
    @inject('logger') private logger: Logger,
    private suresend: SureSendService,
    private repo: SureSendIntegrationRepository
  ) {}

  async ensurePerson(params: EnsurePersonParams): Promise<string> {
    const email = params.email.toLowerCase()
    const existing = await this.repo.getPersonByEmail(TENANT, email)
    if (existing) {
      if (!existing.repliers_client_id && params.repliersClientId) {
        await this.repo.upsertPersonMap({
          tenant: TENANT,
          email,
          suresendPersonId: existing.suresend_person_id,
          repliersClientId: params.repliersClientId
        })
      }
      return existing.suresend_person_id
    }

    let personId: string | undefined
    const found = await this.suresend.findPeople({ email }).catch(() => null)
    if (found?.data?.length) {
      personId = found.data[0]?.id
    }
    if (!personId) {
      const created = await this.suresend.createPerson({
        firstName: params.firstName || email.split('@')[0] || 'Portal',
        lastName: params.lastName || 'Lead',
        email,
        ...(params.phone ? { phone: params.phone } : {}),
        ...(params.tags ? { tags: params.tags } : {}),
        source: params.source || PORTAL_SOURCE
      })
      personId = created.data?.id
    }
    if (!personId) {
      throw new Error(`Unable to resolve SureSend person for ${email}`)
    }

    await this.repo.upsertPersonMap({
      tenant: TENANT,
      email,
      suresendPersonId: personId,
      repliersClientId: params.repliersClientId ?? null
    })
    this.logger.info(
      { data: { email, personId } },
      '[PersonMapService]: mapped portal identity to SureSend person'
    )
    return personId
  }

  /**
   * Resolves by repliers client id when the payload has no email (e.g.
   * favorite events). Returns null when the client was never mapped.
   */
  async findByClientId(repliersClientId: number): Promise<string | null> {
    const row = await this.repo.getPersonByClientId(TENANT, repliersClientId)
    return row?.suresend_person_id ?? null
  }
}
