import { inject, injectable } from 'tsyringe'
import type { Logger } from 'pino'
import SureSendService from '../../services/suresend/client.js'
import { SureSendIntegrationRepository } from '../../repository/suresendIntegration.js'
import PersonMapService from '../lib/personMap.js'
import { PORTAL_SOURCE, TENANT, payloadHash } from '../lib/portal.js'
import {
  clientDetails,
  updatedOn,
  type WebhookPayload
} from '../lib/payload.js'

/**
 * repliers.client-created / client-updated / client-deleted
 *
 * Portal registrations become SureSend people (SureSend dedupes by email)
 * with source "<Tenant> Portal" and tag portal-registration. Updates go
 * through PUT with merge flags so CRM-side data is preserved.
 */
@injectable()
export default class RepliersClientWorker {
  constructor(
    @inject('logger') private logger: Logger,
    private suresend: SureSendService,
    private repo: SureSendIntegrationRepository,
    private personMap: PersonMapService
  ) {}

  async created(payload: WebhookPayload): Promise<void> {
    const client = clientDetails(payload)
    if (!client.email) {
      this.logger.warn(
        { data: { clientId: client.clientId } },
        '[repliers.client-created]: payload has no email; skipping'
      )
      return
    }
    const key = `client-created:${client.clientId ?? client.email}:${updatedOn(payload) ?? payloadHash(payload)}`
    if (!(await this.repo.markProcessed('repliers', key))) return

    const personId = await this.personMap.ensurePerson({
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      repliersClientId: client.clientId,
      tags: ['portal-registration'],
      source: PORTAL_SOURCE
    })
    await this.suresend.applyTags(personId, ['portal-registration'])
  }

  async updated(payload: WebhookPayload): Promise<void> {
    const client = clientDetails(payload)
    if (!client.email) return
    const key = `client-updated:${client.clientId ?? client.email}:${updatedOn(payload) ?? payloadHash(payload)}`
    if (!(await this.repo.markProcessed('repliers', key))) return

    const personId = await this.personMap.ensurePerson({
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      repliersClientId: client.clientId,
      source: PORTAL_SOURCE
    })
    await this.suresend.updatePerson(
      personId,
      {
        ...(client.firstName ? { firstName: client.firstName } : {}),
        ...(client.lastName ? { lastName: client.lastName } : {}),
        ...(client.email ? { email: client.email } : {}),
        ...(client.phone ? { phone: client.phone } : {})
      },
      { mergeTags: true, mergeEmails: true, mergePhones: true }
    )
  }

  async deleted(payload: WebhookPayload): Promise<void> {
    const client = clientDetails(payload)
    const key = `client-deleted:${client.clientId ?? client.email ?? payloadHash(payload)}`
    if (!(await this.repo.markProcessed('repliers', key))) return

    const personId = client.clientId
      ? await this.personMap.findByClientId(client.clientId)
      : client.email
        ? ((await this.repo.getPersonByEmail(TENANT, client.email))
            ?.suresend_person_id ?? null)
        : null
    if (!personId) {
      this.logger.info(
        { data: { clientId: client.clientId } },
        '[repliers.client-deleted]: no SureSend mapping; nothing to do'
      )
      return
    }
    await this.suresend.createNote({
      personId,
      subject: 'Portal account deleted',
      body: 'This contact deleted their portal account (Repliers client-deleted webhook). The CRM record is kept for history.'
    })
    await this.suresend.applyTags(personId, ['portal-account-deleted'])
  }
}
