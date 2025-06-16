import ImageService from './imageService.js';

/**
 * Maakt een nieuwe FetchService aan voor het uitvoeren van API-aanvragen.
 *
 * @param {string} [baseUrl="https://efm-student-case-proxy-api.vercel.app/"] - De basis-URL voor alle API-aanvragen. 
 * De baseUrl is set omdat ik in 90% van de gevallen, naar de overview wil posten / getten 
 */
class FetchService {
  constructor(baseUrl = "https://efm-student-case-proxy-api.vercel.app/") {
    this.baseUrl = baseUrl;
    this.imageService = new ImageService();
  }
  
  /**
   * Haalt de afbeeldingsgegevens op en verwerkt deze met de juiste afmetingen
   * 
   * @async
   * @param {string} imageUrl - De URL van de afbeelding
   * @returns {Promise<{width: number, height: number}>} De afmetingen van de afbeelding
   */
  async getImageDimensions(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const metadata = await this.imageService.getImageMetadata(buffer);
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size
      };
    } catch (error) {
      console.error(`Fout bij ophalen afbeeldingsafmetingen voor ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Verwerkt de asset-gegevens door afmetingen toe te voegen
   * 
   * @async
   * @param {Object} asset - Het asset-object met afbeeldings-URLs
   * @returns {Promise<Object>} Asset-object met toegevoegde afmetingen
   */
  async processAsset(asset) {
    if (!asset) return null;

    const dimensionsPromises = Object.entries(asset).map(async ([size, url]) => {
      if (!url || typeof url !== 'string') return [size, { url }];
      
      const dimensions = await this.getImageDimensions(url);
      return [size, {
        url,
        ...dimensions
      }];
    });

    const processedEntries = await Promise.all(dimensionsPromises);
    return Object.fromEntries(processedEntries);
  }

  /**
   * Voert een GET-verzoek uit naar het opgegeven endpoint.
   *
   * @async
   * @param {string} endpoint - Het API-endpoint (relatief aan de basis-URL).
   * @returns {Promise<any>} De JSON-geparste response data.
   * @throws Werpt een fout als de HTTP-respons niet succesvol is.
   */
  async get(endpoint) {
    try {
      console.log(`Fetching: ${this.baseUrl}${endpoint}`);
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP-fout! status: ${response.status}`);
      }
      
      const data = await response.json();

      // Verwerk afbeeldingsgegevens als het een array van items is
      if (Array.isArray(data)) {
        return Promise.all(data.map(async (item) => {
          if (item.asset) {
            item.asset = await this.processAsset(item.asset);
          }
          return item;
        }));
      }
      
      // Verwerk afbeeldingsgegevens als het een enkel item is
      if (data.asset) {
        data.asset = await this.processAsset(data.asset);
      }
      
      return data;
    } catch (error) {
      console.error(`API fetch mislukt voor ${endpoint}:`, error.message);
      throw error;
    }
  }

  /**
   * Voert een POST-verzoek uit naar het opgegeven endpoint met JSON-data.
   *
   * @async
   * @param {string} endpoint - Het API-endpoint (relatief aan de basis-URL).
   * @param {any} data - De data die in de body van het POST-verzoek meegestuurd wordt.
   * @returns {Promise<any>} De JSON-geparste response data.
   * @throws Werpt een fout als de HTTP-respons niet succesvol is.
   */
  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP-fout! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API POST mislukt voor ${endpoint}:`, error.message);
      throw error;
    }
  }
}

export default FetchService;
