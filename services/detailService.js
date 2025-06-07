import FetchService from "./fetchService.js";
import CacheService from "./CacheService.js";
import DataHandlerService from "./dataHandlerService.js";
import { addLabelFields } from "../utils/createLabelFields.js";

/**
 * Service voor het ophalen, cachen en verwerken van detail-gegevens voor individuele items.
 * Haalt specifieke item-data op van API-endpoints en beheert caching per item.
 */
class DetailService {
  /**
   * Maakt een nieuwe DetailService instantie aan.
   * 
   * @constructor
   */
  constructor() {
    /**
     * FetchService-instantie voor API-aanroepen.
     * @type {FetchService}
     */
    this.FetchService = new FetchService();

    /**
     * Verlooptijd van de cache in milliseconden (1 uur).
     * @type {number}
     */
    this.cacheExpiry = 60 * 60 * 1000;
    
    /**
     * API endpoint voor het ophalen van detail-data.
     * Wordt ingesteld via setIdentifier() methode.
     * @type {string|null}
     */
    this.endpoint = null;
    
    /**
     * Cache sleutel voor het opslaan van getransformeerde data.
     * Wordt ingesteld via setIdentifier() methode.
     * @type {string|null}
     */
    this.cacheKey = null;
  }

  /**
   * Stelt de identifier in voor dit detail-item.
   * Configureert zowel het API-endpoint als de cache-sleutel.
   * 
   * @param {string} identifier - Unieke identifier voor het item (bijv. ID).
   */
  setIdentifier(identifier) {
    this.endpoint = `detail/${identifier}`;
    this.cacheKey = `detail-${identifier}`;
  }

  /**
   * Haalt ruwe data op van de API of uit de cache voor een specifiek item.
   * 
   * Transformeert de oude metadata-indeling (array) naar objectvorm voor betere toegankelijkheid.
   * Voegt label-velden toe voor weergave-doeleinden.
   *
   * @async
   * @returns {Promise<Object>} Het getransformeerde item-object.
   * @throws {Error} Als het ophalen of transformeren mislukt.
   */
  async getRawData() {
    try {
      if (await CacheService.isValid(this.cacheKey, this.cacheExpiry)) {
        return await CacheService.get(this.cacheKey);
      }

      const rawData = await this.FetchService.get(this.endpoint);

      if (!rawData || typeof rawData !== 'object') {
        console.error("API response is geen object:", rawData);
        throw new Error("Ongeldig API-responsformaat");
      }

      
      let transformedData = rawData;

      if (!transformedData.metadata) {
        console.warn(`Item mist metadata:`, transformedData);
        transformedData = { ...transformedData, metadata: {} };
      } else if (Array.isArray(transformedData.metadata)) {
        
        const metaObj = {};
        transformedData.metadata.forEach((meta, metaIndex) => {
          if (!meta || typeof meta !== "object") {
            console.warn(`Ongeldige metadata bij meta ${metaIndex}:`, meta);
            return;
          }

          if (!meta.field) {
            console.warn(`Metadata mist 'field' bij meta ${metaIndex}:`, meta);
            return;
          }

          metaObj[meta.field] =
            Array.isArray(meta.value) && meta.value.length === 1
              ? meta.value[0]
              : meta.value;
        });

        transformedData = { ...transformedData, metadata: metaObj };
      }

      transformedData = addLabelFields(transformedData);

      await CacheService.set(this.cacheKey, transformedData);
      return transformedData;
    } catch (error) {
      console.error("Ophalen van ruwe data mislukt:", error);
      throw error;
    }
  }

  /**
   * Vernieuwt de cache handmatig door deze te verwijderen en nieuwe data op te halen.
   * Nuttig voor het forceren van fresh data zonder te wachten op cache-expiry.
   * 
   * @async
   * @returns {Promise<Object>} De opnieuw opgehaalde en getransformeerde data.
   */
  async refreshCache() {
    console.log("Cache geforceerd vernieuwen...");
    await CacheService.delete(this.cacheKey);
    return await this.getRawData();
  }
}

/**
 * Factory functie voor het maken van een DetailService met een specifieke identifier.
 * 
 * @param {string} identifier - Unieke identifier voor het item.
 * @returns {DetailService} Een geconfigureerde DetailService instantie.
 */
export function createDetailService(identifier) {
  const service = new DetailService();
  service.setIdentifier(identifier);
  return service;
}

