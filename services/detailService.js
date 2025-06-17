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

      // Keep assets as is for now - we'll process them on demand
      // Just ensure the structure is consistent
      if (transformedData.assets && Array.isArray(transformedData.assets)) {
        console.log(`Found ${transformedData.assets.length} assets - will process on demand`);
      }

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
   * Processes specific assets on demand based on current page and lookahead
   * 
   * @async
   * @param {number} currentPage - The current page/asset index
   * @param {number} lookahead - How many additional assets to process ahead (default: 5)
   * @returns {Promise<Object>} The data with processed assets
   */
  async getDataWithProcessedAssets(currentPage = 0, lookahead = 5) {
    try {
      const rawData = await this.getRawData();
      
      if (!rawData.assets || !Array.isArray(rawData.assets)) {
        return rawData;
      }

      // Calculate which assets to process
      const startIndex = Math.max(0, currentPage);
      const endIndex = Math.min(rawData.assets.length, startIndex + lookahead);
      
      // Check which assets need processing
      const assetsToProcess = [];
      for (let i = startIndex; i < endIndex; i++) {
        const asset = rawData.assets[i];
        if (asset && typeof asset === 'string') {
          assetsToProcess.push(i);
        } else if (asset && typeof asset === 'object' && !asset.medium?.width) {
          assetsToProcess.push(i);
        }
      }
      
      if (assetsToProcess.length === 0) {
        console.log(`Assets ${startIndex} to ${endIndex - 1} already processed for page ${currentPage}`);
        return rawData;
      }
      
      console.log(`Processing ${assetsToProcess.length} new assets (${assetsToProcess[0]}-${assetsToProcess[assetsToProcess.length - 1]}) for page ${currentPage}`);
      
      // Process the needed assets in parallel for better performance
      const processingPromises = assetsToProcess.map(async (i) => {
        const asset = rawData.assets[i];
        if (asset && typeof asset === 'string') {
          // If asset is just a URL string, convert to object and process
          rawData.assets[i] = await this.FetchService.processAsset({ medium: asset });
        } else if (asset && typeof asset === 'object' && !asset.medium?.width) {
          // If asset is an object but not yet processed, process it
          rawData.assets[i] = await this.FetchService.processAsset(asset);
        }
      });
      
      await Promise.all(processingPromises);
      
      // Save the updated data back to cache with processed assets
      await CacheService.set(this.cacheKey, rawData);
      console.log(`Saved ${assetsToProcess.length} processed assets to cache`);
      
      return rawData;
    } catch (error) {
      console.error("Error processing assets on demand:", error);
      return await this.getRawData(); // Fallback to unprocessed data
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

