import FetchService from "./fetchService.js";
import CacheService from "./CacheService.js";
import DataHandlerService from "./dataHandlerService.js";
import { addLabelFields } from "../utils/createLabelFields.js";

/**
 * Service voor het ophalen, cachen en verwerken van overzichtsgegevens.
 */
class OverviewService {
  constructor() {
    /**
     * FetchService-instantie voor API-aanroepen.
     * @type {FetchService}
     */
    this.FetchService = new FetchService();

    /**
     * Bestandsnaam voor caching.
     * @type {string}
     */
    this.cacheKey = "overview";

    /**
     * Verlooptijd van de cache in milliseconden (1 uur).
     * @type {number}
     */
    this.cacheExpiry = 60 * 60 * 1000;
  }

  /**
   * Normalizes author input to a consistent string format.
   * 
   * @param {string|Array} authorInput - The original author string or array
   * @returns {string} Single author string, multiple authors separated by '; '
   */
  normalizeAuthors(authorInput) {
    if (!authorInput) {
      return "anonymous";
    }

    // Behandel array invoer - voeg samen met komma en spatie
    if (Array.isArray(authorInput)) {
      return authorInput.join(', ');
    }

    // Behandel niet-string invoer
    if (typeof authorInput !== 'string') {
      return "anonymous";
    }

    // Voor string invoer, verwijder haakjes indien aanwezig en geef terug
    let cleaned = authorInput.trim();
    
    // Verwijder omliggende haakjes als ze bestaan
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    
    return cleaned;
  }

  /**
   * Haalt ruwe data op van de API of uit de cache.
   * 
   * Verandert de oude metadata-indeling (array) naar objectvorm.
   * 
   * @param {Object} [options={}] Verwerkingsopties.
   * @returns {Promise<Object[]>} Een lijst met getransformeerde items.
   * @throws {Error} Als het ophalen of transformeren mislukt.
   */
  async getRawData({ processImages = true } = {}) {
    try {
      if (await CacheService.isValid(this.cacheKey, this.cacheExpiry)) {
        return await CacheService.get(this.cacheKey);
      }

      let rawData = await this.FetchService.get("/overview");

      if (!Array.isArray(rawData)) {
        console.error("API response is geen array:", rawData);
        throw new Error("Ongeldig API-responsformaat");
      }
      
      if (processImages) {
        // Process all images simultaneously – this is heavy but only needed for overview pages
        console.log(`Processing ${rawData.length} items with images...`);
        rawData = await Promise.all(rawData.map(async (item) => {
          if (item && item.asset) {
            item.asset = await this.FetchService.processAsset(item.asset);
          }
          return item;
        }));
        console.log("Image processing completed.");
      } else {
        console.log("Skipping image processing for fast ID lookup");
      }

      const transformedData = rawData.map((item, index) => {
        if (!item) {
          console.warn(`Item op index ${index} is null/undefined`);
          return null;
        }

        if (!item.metadata) {
          console.warn(`Item op index ${index} mist metadata:`, item);
          return { ...item, metadata: {} };
        }

        if (!Array.isArray(item.metadata)) {
          console.warn(`Metadata op index ${index} is geen array:`, item.metadata);
          return addLabelFields(item);
        }

        const metaObj = {};
        item.metadata.forEach((meta, metaIndex) => {
          if (!meta || typeof meta !== 'object') {
            console.warn(`Ongeldige metadata bij item ${index}, meta ${metaIndex}:`, meta);
            return;
          }

          if (!meta.field) {
            console.warn(`Metadata mist 'field' bij item ${index}, meta ${metaIndex}:`, meta);
            return;
          }

          metaObj[meta.field] =
            Array.isArray(meta.value) && meta.value.length === 1
              ? meta.value[0]
              : meta.value;
        });

        const transformedItem = { ...item, metadata: metaObj };
        
        // Pas auteur veld aan voor consistentie
        if (transformedItem.metadata.auteur) {
          transformedItem.metadata.auteur = this.normalizeAuthors(transformedItem.metadata.auteur);
        }
        
        return addLabelFields(transformedItem);
      }).filter(item => item !== null);

      // Alleen cachen wanneer de assets volledig verwerkt zijn. Zo houden we de cache
      // bruikbaar voor routes die de afbeeldingsdimensies daadwerkelijk nodig hebben.
      if (processImages) {
        await CacheService.set(this.cacheKey, transformedData);
      }
      return transformedData;
    } catch (error) {
      console.error("Ophalen van ruwe data mislukt:", error);
      throw error;
    }
  }

  /**
   * Haalt verwerkte data op op basis van opties (zoals zoeken of filteren).
   * 
   * @param {Object} [options={}] Verwerkingsopties.
   * @returns {Promise<Object[]>} Lijst met verwerkte items.
   */
  async getProcessedData(options = {}) {
    try {
      const rawData = await this.getRawData();
      return DataHandlerService.process(rawData, options);
    } catch (error) {
      console.error("Ophalen van verwerkte data mislukt:", error);
      return [];
    }
  }

  /**
   * Haalt een item op via zijn unieke ID.
   * 
   * @param {string} id Het ID van het item.
   * @returns {Promise<Object|null>} Het gevonden item of `null` als niet gevonden.
   */
  async getItemById(id) {
    try {
      const rawData = await this.getRawData();
      return DataHandlerService.findById(rawData, id);
    } catch (error) {
      console.error("Ophalen van item op ID mislukt:", error);
      return null;
    }
  }

  /**
   * Vernieuwt de cache handmatig en haalt nieuwe data op.
   * 
   * @returns {Promise<Object[]>} De opnieuw opgehaalde data.
   */
  async refreshCache() {
    console.log("Cache geforceerd vernieuwen...");
    await CacheService.delete(this.cacheKey);
    return await this.getRawData();
  }

  /**
   * Zoekt binnen de gegevens op basis van een zoekterm.
   * 
   * @param {string} searchTerm De zoekterm.
   * @param {Object} [options={}] Extra filteropties.
   * @returns {Promise<Object[]>} Lijst met zoekresultaten.
   */
  async search(searchTerm, options = {}) {
    return await this.getProcessedData({
      ...options,
      search: searchTerm,
    });
  }

  /**
   * Filtert de gegevens op een specifieke categorie.
   * 
   * @param {string} category De categorie om op te filteren.
   * @param {Object} [options={}] Extra filteropties.
   * @returns {Promise<Object[]>} Gefilterde resultaten.
   */
  async getByCategory(category, options = {}) {
    return await this.getProcessedData({
      ...options,
      category: category,
    });
  }
}

export default new OverviewService();
