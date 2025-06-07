import fs from "fs/promises";
import path from "path";

/**
 * Creates an instance of CacheService.
 *
 * @constructor
 * @param {string} [cacheDir="./cache"] ./cache is de default folder
 */
class CacheService {
  constructor(cacheDir = "./cache") {
    this.cacheDir = cacheDir;
    this.defaultExpiry = 60 * 60 * 1000;
    this.ensureCacheDir();
  }

  /**
   * Check of de folder bestaat, anders maken we een nieuwe aan
   */
  async ensureCacheDir() {
    try {
      await fs.access(this.cacheDir);
    } catch {
      await fs.mkdir(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Genereert het volledige bestandspad voor een cache-item op basis van de key.
   *
   * @param {string} key - De unieke sleutel voor het cache-item.
   * @returns {string} Het pad naar het JSON-cachebestand binnen de cache directory.
   */
  getCacheFilePath(key) {
    return path.join(this.cacheDir, `${key}.json`);
  }

  /**
 * Controleert of het cache-item geldig is op basis van de geldigheidsduur.
 *
 * @async
 * @param {string} key - De sleutel van het cache-item.
 * @param {number} [expiry=this.defaultExpiry] - De maximale geldigheidstijd in milliseconden.
 * @returns {Promise<boolean>} `true` als het cache-item nog geldig is, anders `false`.
 */
async isValid(key, expiry = this.defaultExpiry) {
  try {
    const filePath = this.getCacheFilePath(key);
    const stats = await fs.stat(filePath);
    const now = Date.now();
    const fileAge = now - stats.mtime.getTime();
    return fileAge < expiry;
  } catch {
    // Als het bestand niet bestaat
    return false;
  }
}

/**
 * Haalt de data van een cache-item op.
 *
 * @async
 * @param {string} key - De sleutel van het cache-item.
 * @returns {Promise<unknown|null>} De gecachte data, of `null` als niet gevonden.
 */
async get(key) {
  try {
    const filePath = this.getCacheFilePath(key);
    const data = await fs.readFile(filePath, "utf8");
    console.log(`Cache hit: ${key}`);
    return JSON.parse(data);
  } catch (error) {
    console.log(`Cache miss: ${key}`);
    return null;
  }
}

/**
 * Slaat data op in de cache, maakt het bestand aan of overschrijft het.
 *
 * @async
 * @param {string} key - De sleutel van het cache-item.
 * @param {*} data - De data om op te slaan.
 * @returns {Promise<void>}
 */
async set(key, data) {
  try {
    await this.ensureCacheDir();
    const filePath = this.getCacheFilePath(key);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Cache updated: ${key}`);
  } catch (error) {
    console.error(`Cache write failed: ${key}`, error.message);
  }
}


// Verwijderen heb ik voor de zekerheid wel aangemaakt, maar de kans is vrij groot dat ik dit niet nodig zal hebben.
/**
 * Verwijdert een cache-item.
 * 
 * @async
 * @param {string} key - De sleutel van het cache-item.
 * @returns {Promise<void>}
 */
async delete(key) {
  try {
    const filePath = this.getCacheFilePath(key);
    await fs.unlink(filePath);
    console.log(`Cache deleted: ${key}`);
  } catch (error) {
    console.log(`Cache delete failed: ${key}`, error.message);
  }
}

/**
 * Leegt de volledige cache directory door alle JSON-bestanden te verwijderen.
 *
 * @async
 */
async clear() {
  try {
    const files = await fs.readdir(this.cacheDir);
    const deletePromises = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => fs.unlink(path.join(this.cacheDir, file)));

    await Promise.all(deletePromises);
    console.log("Cache cleared");
  } catch (error) {
    console.error("Cache clear failed:", error.message);
  }
}

}

export default new CacheService();
