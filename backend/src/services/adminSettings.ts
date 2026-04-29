import { inject, injectable } from "tsyringe";
import type { Logger } from "pino";
import type { AppConfig } from "../config.js";
import type { Knex } from "knex";
import _debug from "debug";

const debug = _debug("repliers:services:adminSettings");

export interface AdminSetting {
  id: number;
  key: string;
  value: any;
  description?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PpcRegistrationSettings {
  enabled: boolean;
  sources: string[];
  viewThreshold: number; // Which property view number to show registration (e.g., 1 = first view)
}

export interface OrganicRegistrationSettings {
  enabled: boolean;
  viewThreshold: number; // Which property view number to show registration (e.g., 4 = fourth view)
}

@injectable()
export default class AdminSettingsService {
  constructor(
    @inject("logger") private logger: Logger,
    @inject("config") private config: AppConfig,
    @inject("knex") private knex: Knex
  ) {}

  /**
   * Gets a setting by key
   */
  async getSetting(key: string): Promise<AdminSetting | null> {
    try {
      if (this.config.app.disable_persistence) {
        return this.getDefaultSetting(key);
      }

      const record = await this.knex("admin_settings")
        .where("key", key)
        .first();

      return record ? this.mapRecord(record) : this.getDefaultSetting(key);
    } catch (err) {
      this.logger.error({ err, key }, "Failed to get setting");
      return this.getDefaultSetting(key);
    }
  }

  /**
   * Updates a setting
   */
  async updateSetting(
    key: string,
    value: any,
    updatedBy?: string
  ): Promise<AdminSetting | null> {
    try {
      if (this.config.app.disable_persistence) {
        debug("Persistence disabled, skipping setting update");
        return null;
      }

      const [record] = await this.knex("admin_settings")
        .where("key", key)
        .update({
          value: JSON.stringify(value),
          updated_by: updatedBy,
          updated_at: new Date()
        })
        .returning("*");

      return this.mapRecord(record);
    } catch (err) {
      this.logger.error({ err, key, value }, "Failed to update setting");
      return null;
    }
  }

  /**
   * Creates a new setting
   */
  async createSetting(
    key: string,
    value: any,
    description?: string,
    updatedBy?: string
  ): Promise<AdminSetting | null> {
    try {
      if (this.config.app.disable_persistence) {
        debug("Persistence disabled, skipping setting creation");
        return null;
      }

      const [record] = await this.knex("admin_settings")
        .insert({
          key,
          value: JSON.stringify(value),
          description,
          updated_by: updatedBy
        })
        .returning("*");

      return this.mapRecord(record);
    } catch (err) {
      this.logger.error({ err, key, value }, "Failed to create setting");
      return null;
    }
  }

  /**
   * Gets PPC registration settings
   */
  async getPpcRegistrationSettings(): Promise<PpcRegistrationSettings> {
    const setting = await this.getSetting("ppc_registration_required");
    return setting?.value || { enabled: true, sources: ["ppc", "cpc", "paid"], viewThreshold: 1 };
  }

  /**
   * Gets organic registration settings
   */
  async getOrganicRegistrationSettings(): Promise<OrganicRegistrationSettings> {
    const setting = await this.getSetting("organic_registration_optional");
    return setting?.value || { enabled: true, viewThreshold: 4 };
  }

  /**
   * Updates PPC registration settings
   */
  async updatePpcRegistrationSettings(
    settings: PpcRegistrationSettings,
    updatedBy?: string
  ): Promise<AdminSetting | null> {
    return this.updateSetting("ppc_registration_required", settings, updatedBy);
  }

  /**
   * Updates organic registration settings
   */
  async updateOrganicRegistrationSettings(
    settings: OrganicRegistrationSettings,
    updatedBy?: string
  ): Promise<AdminSetting | null> {
    return this.updateSetting("organic_registration_optional", settings, updatedBy);
  }

  /**
   * Gets all settings
   */
  async getAllSettings(): Promise<AdminSetting[]> {
    try {
      if (this.config.app.disable_persistence) {
        return [];
      }

      const records = await this.knex("admin_settings").select("*");
      return records.map(this.mapRecord);
    } catch (err) {
      this.logger.error({ err }, "Failed to get all settings");
      return [];
    }
  }

  private getDefaultSetting(key: string): AdminSetting | null {
    const defaults: Record<string, any> = {
      ppc_registration_required: {
        enabled: true,
        sources: ["ppc", "cpc", "paid"],
        viewThreshold: 1
      },
      organic_registration_optional: {
        enabled: true,
        viewThreshold: 4
      }
    };

    if (key in defaults) {
      return {
        id: 0,
        key,
        value: defaults[key],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    return null;
  }

  private mapRecord(record: any): AdminSetting {
    return {
      id: record.id,
      key: record.key,
      value: typeof record.value === "string" ? JSON.parse(record.value) : record.value,
      description: record.description,
      updatedBy: record.updated_by,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
