export type KeywordQueueStatus = 'pending' | 'generating' | 'done' | 'failed'

export interface KeywordQueueRow {
  id: string
  keyword: string
  city: string | null
  status: KeywordQueueStatus
  priority: number
  blog_post_id: string | null
  target_url: string | null
  notes: string | null
  created_at: Date
  updated_at: Date
}

export interface KeywordQueueListFilters {
  status?: KeywordQueueStatus
  city?: string
  priority_min?: number
  limit?: number
}

export interface KeywordQueueInsertItem {
  keyword: string
  city?: string
  priority?: number
  targetUrl?: string
  notes?: string
}

export interface KeywordQueueProcessResult {
  processed: number
  succeeded: number
  failed: number
  results: Array<{
    id: string
    keyword: string
    status: KeywordQueueStatus
    blogPostId?: string
    error?: string
  }>
}
