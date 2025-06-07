/**
 * Maakt een nieuwe FetchService aan voor het uitvoeren van API-aanvragen.
 *
 * @param {string} [baseUrl="https://efm-student-case-proxy-api.vercel.app/"] - De basis-URL voor alle API-aanvragen. 
 * De baseUrl is set omdat ik in 90% van de gevallen, naar de overview wil posten / getten 
 */
class FetchService {
  constructor(baseUrl = "https://efm-student-case-proxy-api.vercel.app/") {
    this.baseUrl = baseUrl;
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
      
      return await response.json();
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
