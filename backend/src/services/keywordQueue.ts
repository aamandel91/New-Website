import { injectable, inject } from 'tsyringe'
import type { Knex } from 'knex'
import { AIContentService } from './aiContent.js'
import { BlogService } from './blogs.js'
import type {
  KeywordQueueRow,
  KeywordQueueListFilters,
  KeywordQueueInsertItem,
  KeywordQueueProcessResult,
  KeywordQueueStatus
} from '../types/keywordQueue.js'

const TABLE = 'keyword_queue'

function formatRow(row: any): KeywordQueueRow {
  return {
    id: String(row.id),
    keyword: row.keyword,
    city: row.city,
    status: row.status as KeywordQueueStatus,
    priority: Number(row.priority),
    blog_post_id: row.blog_post_id != null ? String(row.blog_post_id) : null,
    target_url: row.target_url,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

@injectable()
export class KeywordQueueService {
  constructor(
    @inject('db') private db: Knex,
    @inject(AIContentService) private aiService: AIContentService,
    @inject(BlogService) private blogService: BlogService
  ) {}

  async list(filters: KeywordQueueListFilters = {}): Promise<KeywordQueueRow[]> {
    const limit = Math.min(filters.limit ?? 500, 500)
    let query = this.db(TABLE).select('*')

    if (filters.status) query = query.where('status', filters.status)
    if (filters.city) query = query.where('city', filters.city)
    if (typeof filters.priority_min === 'number') {
      query = query.where('priority', '>=', filters.priority_min)
    }

    const rows = await query
      .orderBy('priority', 'desc')
      .orderBy('created_at', 'asc')
      .limit(limit)

    return rows.map(formatRow)
  }

  async addMany(items: KeywordQueueInsertItem[]): Promise<KeywordQueueRow[]> {
    if (items.length === 0) return []

    const now = new Date()
    const toInsert = items.map(item => ({
      keyword: item.keyword.trim(),
      city: item.city?.trim() || null,
      priority: item.priority ?? 0,
      target_url: item.targetUrl?.trim() || null,
      notes: item.notes?.trim() || null,
      status: 'pending' as KeywordQueueStatus,
      created_at: now,
      updated_at: now
    }))

    const rows = await this.db(TABLE).insert(toInsert).returning('*')
    return rows.map(formatRow)
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.db(TABLE).where({ id }).delete()
    return result > 0
  }

  /**
   * Process up to `count` pending keywords.
   *
   * Step 1 atomically claims the next N highest-priority pending rows
   * (priority DESC, created_at ASC) by flipping their status to
   * `generating` inside a transaction with row-level locking — this is
   * what prevents two concurrent calls from grabbing the same row.
   *
   * Step 2 generates a blog post per claimed row serially (to keep
   * Anthropic rate limits and error attribution clean) and writes back
   * `done` + the new blog id, or `failed` + the error text.
   */
  async processNext(
    count: number,
    authorEmail: string
  ): Promise<KeywordQueueProcessResult> {
    const claimed = await this.db.transaction(async trx => {
      const rows = await trx(TABLE)
        .select('*')
        .where('status', 'pending')
        .orderBy('priority', 'desc')
        .orderBy('created_at', 'asc')
        .limit(count)
        .forUpdate()
        .skipLocked()

      if (rows.length === 0) return []

      const ids = rows.map(r => r.id)
      await trx(TABLE)
        .whereIn('id', ids)
        .update({ status: 'generating', updated_at: new Date() })

      return rows.map(formatRow)
    })

    const result: KeywordQueueProcessResult = {
      processed: claimed.length,
      succeeded: 0,
      failed: 0,
      results: []
    }

    for (const row of claimed) {
      try {
        const blogPostId = await this.generateAndPersistBlog(row, authorEmail)
        await this.db(TABLE)
          .where({ id: row.id })
          .update({
            status: 'done',
            blog_post_id: blogPostId,
            updated_at: new Date()
          })
        result.succeeded += 1
        result.results.push({
          id: row.id,
          keyword: row.keyword,
          status: 'done',
          blogPostId: String(blogPostId)
        })
      } catch (error: any) {
        const message = error?.message || 'Failed to generate blog post'
        const appendedNotes = row.notes
          ? `${row.notes}\n[${new Date().toISOString()}] ${message}`
          : `[${new Date().toISOString()}] ${message}`
        await this.db(TABLE)
          .where({ id: row.id })
          .update({
            status: 'failed',
            notes: appendedNotes,
            updated_at: new Date()
          })
        result.failed += 1
        result.results.push({
          id: row.id,
          keyword: row.keyword,
          status: 'failed',
          error: message
        })
      }
    }

    return result
  }

  /**
   * Thin wrapper over the existing AI + blog persistence flow:
   * AIContentService.generateBlogPost → BlogService.createBlog (draft).
   * Returns the new blog row id (bigint) so the caller can link it back.
   */
  private async generateAndPersistBlog(
    row: KeywordQueueRow,
    authorEmail: string
  ): Promise<bigint> {
    const aiReq: { keyword: string; city?: string } = { keyword: row.keyword }
    if (row.city) aiReq.city = row.city
    const ai = await this.aiService.generateBlogPost(aiReq)

    const blog = await this.blogService.createBlog({
      title: ai.title,
      description: ai.excerpt || ai.meta_description || row.keyword,
      content: ai.content,
      author_email: authorEmail,
      status: 'draft',
      tags: ai.tags || [],
      meta_title: ai.meta_title,
      meta_description: ai.meta_description,
      meta_keywords: ai.meta_keywords || []
    })

    return blog.id
  }
}
