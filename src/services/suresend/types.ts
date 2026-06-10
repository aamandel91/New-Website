// ─── SureSend CRM Types ────────────────────────────────────────

// ─── Person ────────────────────────────────────────────────────

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

// ─── Events ────────────────────────────────────────────────────

export type SureSendEventType =
  | 'page_view'
  | 'property_view'
  | 'saved_property'
  | 'form_submission'
  | 'search'
  | 'inquiry'

export interface SureSendEventInput {
  type: SureSendEventType
  personId?: string
  email?: string
  property?: {
    mlsNumber?: string
    address?: string
    price?: number
    propertyType?: string
  }
  propertySearch?: {
    query?: string
    filters?: Record<string, string | number | boolean>
    resultCount?: number
  }
  metadata?: Record<string, string | number | boolean>
}

export interface SureSendEvent {
  id: string
  type: SureSendEventType
  personId?: string
  createdAt?: string
}

// ─── Tags ──────────────────────────────────────────────────────

export interface SureSendTagsInput {
  tags: string[]
}

// ─── Notes ─────────────────────────────────────────────────────

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

// ─── Tasks ─────────────────────────────────────────────────────

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

// ─── Appointments ──────────────────────────────────────────────

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

// ─── Webhooks ──────────────────────────────────────────────────

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
  createdAt?: string
}

export interface SureSendWebhookEvent {
  name: string
  description?: string
}

// ─── Custom Fields ─────────────────────────────────────────────

export type SureSendCustomFieldType =
  | 'text'
  | 'number'
  | 'dropdown'
  | 'date'
  | 'boolean'

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

// ─── API Response Wrapper ──────────────────────────────────────

export interface SureSendApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

// ─── Lead Submission (internal form → API route) ───────────────

export type LeadFormType = 'tour_request' | 'contact' | 'open_house' | 'offer'

export interface LeadSubmission {
  name: string
  email: string
  phone: string
  message: string
  formType: LeadFormType
  propertyAddress?: string
  mlsNumber?: string
  source?: string
}
