import { injectable, inject } from 'tsyringe'
import { LeadsRepository } from '../repository/leads.js'
import type {
  Lead,
  CreateLeadInput,
  UpdateLeadInput,
  LeadActivity,
  CreateActivityInput,
  LeadFilters
} from '../types/lead.js'
import { ApiError } from '../lib/errors.js'

@injectable()
export class LeadsService {
  constructor(@inject(LeadsRepository) private leadsRepo: LeadsRepository) {}

  /**
   * Create a new lead
   */
  async createLead(orgId: bigint, input: CreateLeadInput): Promise<Lead> {
    // Validate email
    if (!input.email) {
      throw new ApiError('Email is required', { status: 400 })
    }

    const lead = await this.leadsRepo.createLead(orgId, input)

    // Create activity
    await this.leadsRepo.addActivity(orgId, lead.id, {
      activity_type: 'lead_created',
      description: 'Lead was created',
      metadata: { source: input.source || 'unknown' }
    })

    return lead
  }

  /**
   * Update a lead
   */
  async updateLead(orgId: bigint, id: bigint, input: UpdateLeadInput): Promise<Lead> {
    const existing = await this.leadsRepo.getLeadById(orgId, id)

    if (!existing) {
      throw new ApiError('Lead not found', { status: 404 })
    }

    const lead = await this.leadsRepo.updateLead(orgId, id, input)

    // Track status change
    if (input.status && input.status !== existing.status) {
      await this.leadsRepo.addActivity(orgId, id, {
        activity_type: 'status_change',
        description: `Status changed from ${existing.status} to ${input.status}`,
        metadata: {
          old_status: existing.status,
          new_status: input.status
        }
      })
    }

    // Track assignment change
    if (input.assigned_to && input.assigned_to !== existing.assigned_to) {
      await this.leadsRepo.addActivity(orgId, id, {
        activity_type: 'assigned',
        description: `Assigned to ${input.assigned_to}`,
        metadata: {
          old_assignee: existing.assigned_to,
          new_assignee: input.assigned_to
        }
      })
    }

    return lead
  }

  /**
   * Get lead by ID
   */
  async getLeadById(orgId: bigint, id: bigint): Promise<Lead | null> {
    return this.leadsRepo.getLeadById(orgId, id)
  }

  /**
   * Get leads with filtering
   */
  async getLeads(orgId: bigint, filters: LeadFilters = {}) {
    return this.leadsRepo.getLeads(orgId, filters)
  }

  /**
   * Delete a lead
   */
  async deleteLead(orgId: bigint, id: bigint): Promise<boolean> {
    const existing = await this.leadsRepo.getLeadById(orgId, id)

    if (!existing) {
      throw new ApiError('Lead not found', { status: 404 })
    }

    return this.leadsRepo.deleteLead(orgId, id)
  }

  /**
   * Add activity to lead
   */
  async addActivity(
    orgId: bigint,
    leadId: bigint,
    input: CreateActivityInput,
    performedBy?: string
  ): Promise<LeadActivity> {
    const lead = await this.leadsRepo.getLeadById(orgId, leadId)

    if (!lead) {
      throw new ApiError('Lead not found', { status: 404 })
    }

    const activityInput: CreateActivityInput = { ...input }
    if (performedBy !== undefined) activityInput.performed_by = performedBy
    return this.leadsRepo.addActivity(orgId, leadId, activityInput)
  }

  /**
   * Get activities for a lead
   */
  async getActivities(orgId: bigint, leadId: bigint): Promise<LeadActivity[]> {
    return this.leadsRepo.getActivities(orgId, leadId)
  }

  /**
   * Get lead statistics
   */
  async getStats(orgId: bigint) {
    return this.leadsRepo.getStats(orgId)
  }

  /**
   * Bulk update leads
   */
  async bulkUpdate(
    orgId: bigint,
    leadIds: bigint[],
    updates: UpdateLeadInput
  ): Promise<Lead[]> {
    const results = []

    for (const leadId of leadIds) {
      try {
        const updated = await this.updateLead(orgId, leadId, updates)
        results.push(updated)
      } catch (error) {
        console.error(`Failed to update lead ${leadId}:`, error)
      }
    }

    return results
  }
}
