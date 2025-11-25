import { injectable } from "tsyringe";
import _debug from "debug";
import BaseEventCollectionSelector from "./baseEventCollectionSelector.js";
import { RplClientsClient } from "../../../services/repliers/clients.js";
import { BossEventsCreateRequest, CustomPeopleFields } from "../../../services/boss.js";
import { secureFubAvmLink } from "../../../lib/utils.js";
const debug = _debug("repliers:services:SelectClientRegistrationParams");
@injectable()
export default class SelectClientRegistrationParams extends BaseEventCollectionSelector {
   select = async ({
      user,
      provider,
      referer,
      trafficSource
   }: {
      user: RplClientsClient;
      provider: string;
      referer?: string;
      trafficSource?: {
         utmSource?: string;
         utmMedium?: string;
         utmCampaign?: string;
         trafficType?: string;
         landingPage?: string;
      };
   }): Promise<BossEventsCreateRequest | null> => {
      if (!user) {
         debug("[SelectClientRegistrationParams] user is not defined");
         return null;
      }

      // Determine source and sourceUrl based on traffic source
      let source = provider;
      let sourceUrl = referer;

      if (trafficSource) {
         if (trafficSource.utmSource) {
            source = `${trafficSource.utmSource} (${trafficSource.utmMedium || 'unknown'})`;
         }
         if (trafficSource.landingPage) {
            sourceUrl = trafficSource.landingPage;
         }
      }

      return {
         person: {
            ...this.envSpecificPersonFields(user, provider, trafficSource),
            firstName: user.fname,
            lastName: user.lname,
            emails: [{
               value: user.email,
               type: "main"
            }],
            phones: user.phone ? [{
               value: user.phone,
               type: "main"
            }] : [],
            tags: ["Registration"],
            source,
            sourceUrl
         },
         type: "Registration",
         occurredAt: new Date().toISOString(),
         pageReferrer: referer
      };
   };
   envSpecificPersonFields(
      user: RplClientsClient,
      provider: string,
      trafficSource?: {
         utmSource?: string;
         utmMedium?: string;
         utmCampaign?: string;
         trafficType?: string;
      }
   ): CustomPeopleFields {
      const defaultFields: CustomPeopleFields = {
         customAuthType: provider
      };

      // Add traffic source as custom fields if available
      if (trafficSource) {
         if (trafficSource.utmSource) {
            (defaultFields as any).customUtmSource = trafficSource.utmSource;
         }
         if (trafficSource.utmMedium) {
            (defaultFields as any).customUtmMedium = trafficSource.utmMedium;
         }
         if (trafficSource.utmCampaign) {
            (defaultFields as any).customUtmCampaign = trafficSource.utmCampaign;
         }
         if (trafficSource.trafficType) {
            (defaultFields as any).customTrafficType = trafficSource.trafficType;
         }
      }

      if (!this.config.boss.custom_AVM_field) {
         return defaultFields;
      }
      const fieldName = this.config.boss.custom_AVM_field;
      const clientId = user.clientId;
      return {
         ...defaultFields,
         [fieldName as string]: clientId ? secureFubAvmLink(this.config.eventsCollection.clientUrl, clientId.toString(), this.config.auth.agents_signature_salt) : undefined
      };
   }
}