import type {
  SureSendPerson,
  SureSendPersonInput,
  SureSendPersonSearchResult,
  SureSendEventInput,
  SureSendEvent,
  SureSendNoteInput,
  SureSendNote,
  SureSendTaskInput,
  SureSendTask,
  SureSendAppointmentInput,
  SureSendAppointment,
  SureSendWebhookInput,
  SureSendWebhook,
  SureSendWebhookEvent,
  SureSendCustomFieldInput,
  SureSendCustomField,
  SureSendApiResponse,
} from './types'

const BASE_URL = 'https://api.suresend.ai/api/partner'

function getHeaders(): HeadersInit {
  const token = process.env.SURESEND_API_TOKEN
  const systemId = process.env.SURESEND_SYSTEM_ID

  if (!token) {
    throw new Error('SURESEND_API_TOKEN environment variable is not set')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  if (systemId) {
    headers['X-System-Id'] = systemId
  }

  return headers
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  })

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After')
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000
    await new Promise((resolve) => setTimeout(resolve, waitMs))
    return request<T>(path, options)
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    throw new Error(
      `SureSend API error: ${response.status} ${response.statusText} — ${errorBody}`
    )
  }

  // Some endpoints may return 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

// ─── People ────────────────────────────────────────────────────

export async function createPerson(
  data: SureSendPersonInput
): Promise<SureSendApiResponse<SureSendPerson>> {
  return request<SureSendApiResponse<SureSendPerson>>('/people', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePerson(
  id: string,
  data: Partial<SureSendPersonInput>
): Promise<SureSendApiResponse<SureSendPerson>> {
  return request<SureSendApiResponse<SureSendPerson>>(`/people/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function getPerson(
  id: string
): Promise<SureSendApiResponse<SureSendPerson>> {
  return request<SureSendApiResponse<SureSendPerson>>(`/people/${id}`)
}

export async function searchPeople(
  email?: string,
  phone?: string
): Promise<SureSendPersonSearchResult> {
  const params = new URLSearchParams()
  if (email) params.set('email', email)
  if (phone) params.set('phone', phone)
  return request<SureSendPersonSearchResult>(`/people/search?${params.toString()}`)
}

// ─── Tags ──────────────────────────────────────────────────────

export async function applyTags(
  personId: string,
  tags: string[]
): Promise<SureSendApiResponse<void>> {
  return request<SureSendApiResponse<void>>(`/people/${personId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tags }),
  })
}

export async function removeTags(
  personId: string,
  tags: string[]
): Promise<SureSendApiResponse<void>> {
  return request<SureSendApiResponse<void>>(`/people/${personId}/tags`, {
    method: 'DELETE',
    body: JSON.stringify({ tags }),
  })
}

// ─── Events ────────────────────────────────────────────────────

export async function createEvent(
  data: SureSendEventInput
): Promise<SureSendApiResponse<SureSendEvent>> {
  return request<SureSendApiResponse<SureSendEvent>>('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── Notes ─────────────────────────────────────────────────────

export async function createNote(
  personId: string,
  subject: string,
  body: string
): Promise<SureSendApiResponse<SureSendNote>> {
  return request<SureSendApiResponse<SureSendNote>>('/notes', {
    method: 'POST',
    body: JSON.stringify({ personId, subject, body } satisfies SureSendNoteInput),
  })
}

// ─── Tasks ─────────────────────────────────────────────────────

export async function createTask(
  personId: string,
  name: string,
  type: SureSendTaskInput['type'],
  dueDateTime?: string
): Promise<SureSendApiResponse<SureSendTask>> {
  return request<SureSendApiResponse<SureSendTask>>('/tasks', {
    method: 'POST',
    body: JSON.stringify({ personId, name, type, dueDateTime } satisfies SureSendTaskInput),
  })
}

// ─── Appointments ──────────────────────────────────────────────

export async function createAppointment(
  personId: string,
  title: string,
  startsAt: string,
  endsAt?: string,
  type?: SureSendAppointmentInput['type'],
  location?: string
): Promise<SureSendApiResponse<SureSendAppointment>> {
  const payload: SureSendAppointmentInput = {
    personId,
    title,
    startsAt,
    ...(endsAt && { endsAt }),
    ...(type && { type }),
    ...(location && { location }),
  }
  return request<SureSendApiResponse<SureSendAppointment>>('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Webhooks ──────────────────────────────────────────────────

export async function createWebhook(
  name: string,
  url: string,
  events: string[]
): Promise<SureSendApiResponse<SureSendWebhook>> {
  return request<SureSendApiResponse<SureSendWebhook>>('/webhooks', {
    method: 'POST',
    body: JSON.stringify({ name, url, events } satisfies SureSendWebhookInput),
  })
}

export async function listWebhookEvents(): Promise<SureSendApiResponse<SureSendWebhookEvent[]>> {
  return request<SureSendApiResponse<SureSendWebhookEvent[]>>('/webhooks/events')
}

// ─── Custom Fields ─────────────────────────────────────────────

export async function listCustomFields(): Promise<SureSendApiResponse<SureSendCustomField[]>> {
  return request<SureSendApiResponse<SureSendCustomField[]>>('/custom-fields')
}

export async function createCustomField(
  data: SureSendCustomFieldInput
): Promise<SureSendApiResponse<SureSendCustomField>> {
  return request<SureSendApiResponse<SureSendCustomField>>('/custom-fields', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── List People (for admin dashboard) ─────────────────────────

export async function listPeople(
  limit = 20,
  offset = 0
): Promise<SureSendPersonSearchResult> {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return request<SureSendPersonSearchResult>(`/people?${params.toString()}`)
}
