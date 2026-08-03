// ─── SureSend Partner API types (backend) ──────────────────────
//
// Mirrors the shapes used by the frontend src/services/suresend/types.ts,
// extended with the endpoints the backend integration needs (identity,
// groups, users, texts/emails, webhooks). Base URL:
// https://api.suresend.ai/api/partner — Bearer auth, 600 req/min.

export interface SureSendPersonInput {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  tags?: string[]
  customFields?: Record<string, string | number | boolean>
  source?: string
}

export interface SureSendPerson {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  tags?: string[]
  stage?: string
  customFields?: Record<string, string | number | boolean>
  source?: string
  createdAt?: string
  updatedAt?: string
}

export interface SureSendPersonSearchResult {
  data: SureSendPerson[]
  total: number
}

/** Query flags for PUT /people/:id — merge instead of replace. */
export interface SureSendUpdateFlags {
  mergeTags?: boolean
  mergeEmails?: boolean
  mergePhones?: boolean
}

export type SureSendEventType =
  | 'page_view'
  | 'property_view'
  | 'saved_property'
  | 'form_submission'
  | 'search'
  | 'inquiry'
  | 'Property Search'

export interface SureSendEventInput {
  type: SureSendEventType
  personId?: string | undefined
  email?: string | undefined
  property?:
    | {
        mlsNumber?: string | undefined
        address?: string | undefined
        price?: number | undefined
        propertyType?: string | undefined
        bedrooms?: number | undefined
        bathrooms?: number | undefined
        sqft?: number | undefined
        url?: string | undefined
        imageUrl?: string | undefined
      }
    | undefined
  propertySearch?:
    | {
        query?: string | undefined
        city?: string | undefined
        state?: string | undefined
        minPrice?: number | undefined
        maxPrice?: number | undefined
        minBedrooms?: number | undefined
        searchUrl?: string | undefined
        filters?: Record<string, string | number | boolean> | undefined
        resultCount?: number | undefined
      }
    | undefined
  metadata?: Record<string, string | number | boolean> | undefined
}

export interface SureSendEvent {
  id: string
  type: SureSendEventType
  personId?: string
  createdAt?: string
}

export interface SureSendNoteInput {
  personId: string
  subject: string
  body: string
}

export interface SureSendNote {
  id: string
  personId: string
  subject: string
  body: string
  createdAt?: string
}

export type SureSendTaskType = 'call' | 'email' | 'todo' | 'follow_up'

export interface SureSendTaskInput {
  personId: string
  name: string
  type: SureSendTaskType
  dueDateTime?: string
}

export interface SureSendTask {
  id: string
  personId: string
  name: string
  type: SureSendTaskType
  dueDateTime?: string
  completed?: boolean
  createdAt?: string
}

export type SureSendAppointmentType = 'showing' | 'meeting' | 'call' | 'other'

export interface SureSendAppointmentInput {
  personId: string
  title: string
  startsAt: string
  endsAt?: string
  type?: SureSendAppointmentType
  location?: string
}

export interface SureSendAppointment {
  id: string
  personId: string
  title: string
  startsAt: string
  endsAt?: string
  type?: SureSendAppointmentType
  location?: string
  createdAt?: string
}

/**
 * Texts and emails share a `send` flag: send:true delivers to the lead,
 * send:false only logs the message on the person's timeline.
 */
export interface SureSendTextInput {
  personId: string
  message: string
  send: boolean
}

export interface SureSendEmailInput {
  personId: string
  subject: string
  body: string
  send: boolean
}

export interface SureSendMessage {
  id: string
  personId: string
  createdAt?: string
}

export interface SureSendGroup {
  id: string
  name: string
  userIds?: string[]
}

export interface SureSendUser {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  role?: string
}

export interface SureSendIdentity {
  teamId?: string
  teamName?: string
  name?: string
  email?: string
}

export type SureSendCustomFieldType =
  | 'text'
  | 'number'
  | 'dropdown'
  | 'date'
  | 'boolean'
  | 'multi_select'

export interface SureSendCustomFieldInput {
  name: string
  type: SureSendCustomFieldType
  options?: string[]
}

export interface SureSendCustomField {
  id: string
  name: string
  type: SureSendCustomFieldType
  options?: string[]
}

export interface SureSendWebhookInput {
  name: string
  url: string
  events: string[]
}

export interface SureSendWebhook {
  id: string
  name: string
  url: string
  events: string[]
  /** Returned ONCE at creation — store as SURESEND_WEBHOOK_SECRET. */
  secretKey?: string
  status?: string
  createdAt?: string
}

export interface SureSendApiResponse<T> {
  data: T
  success: boolean
  message?: string
}
