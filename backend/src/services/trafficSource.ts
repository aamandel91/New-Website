import { inject, injectable } from "tsyringe";
import type { Logger } from "pino";
import type { AppConfig } from "../config.js";
import { Knex } from "knex";
import _debug from "debug";

const debug = _debug("repliers:services:trafficSource");

export interface TrafficSourceData {
  clientId: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  trafficType: string;
  referer?: string;
  landingPage?: string;
}

export interface TrafficSourceRecord extends TrafficSourceData {
  id: number;
  createdAt: Date;
}

@injectable()
export default class TrafficSourceService {
  constructor(
    @inject("logger") private logger: Logger,
    @inject("config") private config: AppConfig,
    @inject("knex") private knex: Knex
  ) {}

  /**
   * Determines traffic type based on UTM parameters
   */
  private determineTrafficType(utmSource?: string, utmMedium?: string): string {
    if (!utmSource && !utmMedium) {
      return "direct";
    }

    const source = (utmSource || "").toLowerCase();
    const medium = (utmMedium || "").toLowerCase();

    // Check for paid traffic indicators
    const paidMediums = ["cpc", "ppc", "paid", "paidsearch", "cpm", "banner"];
    const paidSources = ["google", "bing", "facebook", "linkedin", "twitter", "instagram"];

    if (paidMediums.includes(medium)) {
      return "ppc";
    }

    // If source is a known ad platform and medium suggests paid
    if (paidSources.includes(source) && medium.includes("ad")) {
      return "ppc";
    }

    // Organic traffic
    if (medium === "organic" || source === "google" || source === "bing") {
      return "organic";
    }

    // Referral traffic
    if (medium === "referral") {
      return "referral";
    }

    // Social traffic
    if (["social", "facebook", "twitter", "linkedin", "instagram"].includes(source)) {
      return "social";
    }

    // Email traffic
    if (medium === "email") {
      return "email";
    }

    return "other";
  }

  /**
   * Stores traffic source information for a client
   */
  async storeTrafficSource(data: Omit<TrafficSourceData, "trafficType">): Promise<TrafficSourceRecord | null> {
    try {
      if (this.config.app.disable_persistence) {
        debug("Persistence disabled, skipping traffic source storage");
        return null;
      }

      const trafficType = this.determineTrafficType(data.utmSource, data.utmMedium);

      const [record] = await this.knex("client_traffic_sources")
        .insert({
          client_id: data.clientId,
          utm_source: data.utmSource,
          utm_medium: data.utmMedium,
          utm_campaign: data.utmCampaign,
          utm_term: data.utmTerm,
          utm_content: data.utmContent,
          traffic_type: trafficType,
          referer: data.referer,
          landing_page: data.landingPage
        })
        .returning("*");

      return this.mapRecord(record);
    } catch (err) {
      this.logger.error({ err, data }, "Failed to store traffic source");
      debug("Error storing traffic source: %O", err);
      return null;
    }
  }

  /**
   * Gets traffic source for a client
   */
  async getTrafficSource(clientId: number): Promise<TrafficSourceRecord | null> {
    try {
      if (this.config.app.disable_persistence) {
        return null;
      }

      const record = await this.knex("client_traffic_sources")
        .where("client_id", clientId)
        .orderBy("created_at", "desc")
        .first();

      return record ? this.mapRecord(record) : null;
    } catch (err) {
      this.logger.error({ err, clientId }, "Failed to get traffic source");
      return null;
    }
  }

  /**
   * Gets all clients by traffic type
   */
  async getClientsByTrafficType(trafficType: string): Promise<number[]> {
    try {
      if (this.config.app.disable_persistence) {
        return [];
      }

      const records = await this.knex("client_traffic_sources")
        .where("traffic_type", trafficType)
        .select("client_id")
        .distinct();

      return records.map((r) => r.client_id);
    } catch (err) {
      this.logger.error({ err, trafficType }, "Failed to get clients by traffic type");
      return [];
    }
  }

  /**
   * Checks if a client is from PPC traffic
   */
  async isPpcTraffic(clientId: number): Promise<boolean> {
    const trafficSource = await this.getTrafficSource(clientId);
    return trafficSource?.trafficType === "ppc";
  }

  private mapRecord(record: any): TrafficSourceRecord {
    return {
      id: record.id,
      clientId: record.client_id,
      utmSource: record.utm_source,
      utmMedium: record.utm_medium,
      utmCampaign: record.utm_campaign,
      utmTerm: record.utm_term,
      utmContent: record.utm_content,
      trafficType: record.traffic_type,
      referer: record.referer,
      landingPage: record.landing_page,
      createdAt: record.created_at
    };
  }
}
