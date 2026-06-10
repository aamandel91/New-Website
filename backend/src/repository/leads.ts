import { injectable, inject } from 'tsyringe'
import type { Knex } from 'knex'
import type {
  Lead,
  CreateLeadInput,
  UpdateLeadInput,
  LeadActivity,
  CreateActivityInput,
  LeadFilters
} from '../types/lead.js'

@injectable()
export class LeadsRepository {
  constructor(@inject('db') private db: Knex) {}

  /**
   * Create a new lead
   */
  async createLead(orgId: bigint, input: CreateLeadInput): Promise<Lead> {
    const now = new Date()

    const [lead] = await this.db('leads')
      .insert({
        org_id: orgId,
        first_name: input.first_name || null,
        last_name: input.last_name || null,
        email: input.email,
        phone: input.phone || null,
        source: input.source || null,
        status: input.status || 'new',
        assigned_to: input.assigned_to || null,
        property_interest: input.property_interest || null,
        tags: JSON.stringify(input.tags || []),
        custom_fields: JSON.stringify(input.custom_fields || {}),
        notes: input.notes || null,
        created_at: now,
        updated_at: now
      })
      .returning('*')

    return this.formatLead(lead)
  }

  /**
   * Update a lead
   */
  async updateLead(
    orgId: bigint,
    id: bigint,
    input: UpdateLeadInput
  ): Promise<Lead> {
    const updateData: any = {
      updated_at: new Date()
    }

    if (input.first_name !== undefined) updateData.first_name = input.first_name
    if (input.last_name !== undefined) updateData.last_name = input.last_name
    if (input.email !== undefined) updateData.email = input.email
    if (input.phone !== undefined) updateData.phone = input.phone
    if (input.source !== undefined) updateData.source = input.source
    if (input.status !== undefined) updateData.status = input.status
    if (input.assigned_to !== undefined)
      updateData.assigned_to = input.assigned_to
    if (input.property_interest !== undefined)
      updateData.property_interest = input.property_interest
    if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags)
    if (input.custom_fields !== undefined)
      updateData.custom_fields = JSON.stringify(input.custom_fields)
    if (input.notes !== undefined) updateData.notes = input.notes
    if (input.last_contact_at !== undefined)
      updateData.last_contact_at = input.last_contact_at

    const [lead] = await this.db('leads')
      .where({ id, org_id: orgId })
      .update(updateData)
      .returning('*')

    return this.formatLead(lead)
  }

  /**
   * Get lead by ID
   */
  async getLeadById(orgId: bigint, id: bigint): Promise<Lead | null> {
    const lead = await this.db('leads').where({ id, org_id: orgId }).first()

    return lead ? this.formatLead(lead) : null
  }

  /**
   * Get leads with filtering and pagination
   */
  async getLeads(
    orgId: bigint,
    filters: LeadFilters = {}
  ): Promise<{ leads: Lead[]; total: number }> {
    let query = this.db('leads').where({ org_id: orgId })

    if (filters.status) {
      query = query.where({ status: filters.status })
    }

    if (filters.source) {
      query = query.where({ source: filters.source })
    }

    if (filters.assigned_to) {
      query = query.where({ assigned_to: filters.assigned_to })
    }

    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where('first_name', 'ilike', `%${filters.search}%`)
          .orWhere('last_name', 'ilike', `%${filters.search}%`)
          .orWhere('email', 'ilike', `%${filters.search}%`)
          .orWhere('phone', 'ilike', `%${filters.search}%`)
      })
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.whereRaw('tags @> ?::jsonb', [JSON.stringify(filters.tags)])
    }

    // Get total count
    const countRow = await query.clone().count('* as count').first()
    const count = Number(countRow?.['count'] ?? 0)

    // Apply pagination
    const limit = filters.limit || 20
    const offset = filters.offset || 0

    const leads = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)

    return {
      leads: leads.map((lead) => this.formatLead(lead)),
      total: Number(count)
    }
  }

  /**
   * Delete a lead
   */
  async deleteLead(orgId: bigint, id: bigint): Promise<boolean> {
    const deleted = await this.db('leads').where({ id, org_id: orgId }).delete()

    return deleted > 0
  }

  /**
   * Add activity to lead
   */
  async addActivity(
    orgId: bigint,
    leadId: bigint,
    input: CreateActivityInput
  ): Promise<LeadActivity> {
    const now = new Date()

    const [activity] = await this.db('lead_activities')
      .insert({
        org_id: orgId,
        lead_id: leadId,
        activity_type: input.activity_type,
        description: input.description || null,
        performed_by: input.performed_by || null,
        metadata: JSON.stringify(input.metadata || {}),
        created_at: now
      })
      .returning('*')

    return this.formatActivity(activity)
  }

  /**
   * Get activities for a lead
   */
  async getActivities(orgId: bigint, leadId: bigint): Promise<LeadActivity[]> {
    const activities = await this.db('lead_activities')
      .where({ org_id: orgId, lead_id: leadId })
      .orderBy('created_at', 'desc')

    return activities.map((activity) => this.formatActivity(activity))
  }

  /**
   * Get lead statistics
   */
  async getStats(orgId: bigint): Promise<{
    total: number
    byStatus: Record<string, number>
    bySource: Record<string, number>
  }> {
    const totalRow = await this.db('leads')
      .where({ org_id: orgId })
      .count('* as count')
      .first()
    const total = Number(totalRow?.['count'] ?? 0)

    const byStatus = await this.db('leads')
      .where({ org_id: orgId })
      .select('status')
      .count('* as count')
      .groupBy('status')

    const bySource = await this.db('leads')
      .where({ org_id: orgId })
      .select('source')
      .count('* as count')
      .groupBy('source')

    return {
      total,
      byStatus: byStatus.reduce<Record<string, number>>((acc, row: any) => {
        const key = row['status'] ?? 'unknown'
        acc[key] = Number(row['count'])
        return acc
      }, {}),
      bySource: bySource.reduce<Record<string, number>>((acc, row: any) => {
        acc[row['source'] || 'unknown'] = Number(row['count'])
        return acc
      }, {})
    }
  }

  /**
   * Format lead object
   */
  private formatLead(lead: any): Lead {
    return {
      ...lead,
      tags: JSON.parse(lead.tags || '[]'),
      custom_fields: JSON.parse(lead.custom_fields || '{}')
    }
  }

  /**
   * Format activity object
   */
  private formatActivity(activity: any): LeadActivity {
    return {
      ...activity,
      metadata: JSON.parse(activity.metadata || '{}')
    }
  }
}
