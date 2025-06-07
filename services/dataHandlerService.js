/**
 * Verwerkt kaartgegevens met filtering, sortering, paginatie en zoekfunctionaliteit.
 */
class DataHandlerService {
  /**
   * Haalt de waarde van een specifiek veld op uit een item.
   * Controleert eerst de top-level velden en daarna de metadata.
   * 
   * @param {Object} item - Het item waaruit de waarde moet worden opgehaald
   * @param {string} key - De sleutel van het veld
   * @returns {*} De waarde van het veld of null als niet gevonden
   */
  getFieldValue(item, key) {
    if (item[key]) return item[key];
    return item.metadata?.[key] ?? null;
  }

  /**
   * Filtert data op basis van zoekcriteria en specifieke veldfilters.
   * Ondersteunt zowel algemene tekstzoekacties als exacte veldovereenkomsten.
   * 
   * @param {Array<Object>} data - De te filteren dataset
   * @param {Object} filters - Object met zoek- en filtercriteria
   * @param {string} [filters.search] - Algemene zoekterm
   * @returns {Array<Object>} Gefilterde dataset
   */
  filter(data, filters = {}) {
    if (!Array.isArray(data)) return [];

    let filtered = [...data];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();

      filtered = filtered.filter(item => {
        const valuesToSearch = [
          item.title,
          item.description,
          ...Object.values(item.metadata ?? {})
        ];

        return valuesToSearch.some(val =>
          Array.isArray(val)
            ? val.some(v => v.toLowerCase().includes(searchTerm))
            : typeof val === 'string' && val.toLowerCase().includes(searchTerm)
        );
      });
    }

    const fieldFilters = { ...filters };
    delete fieldFilters.search;

    Object.entries(fieldFilters).forEach(([field, value]) => {
      if (value != null && value !== '') {
        filtered = filtered.filter(item => {
          const fieldValue = this.getFieldValue(item, field);
          
          if (fieldValue == null) return false;
          
          const itemValue = String(fieldValue).toLowerCase();
          const filterValue = String(value).toLowerCase();
          
          return itemValue === filterValue;
        });
      }
    });

    return filtered;
  }

  /**
   * Sorteert data op een opgegeven veld en volgorde.
   * 
   * @param {Array<Object>} data - Array van objecten om te sorteren
   * @param {string} key - Veldnaam voor sortering
   * @param {'asc'|'desc'} [direction='asc'] - Sorteervolgorde ('asc' voor oplopend, 'desc' voor aflopend)
   * @returns {Array<Object>} Gesorteerde dataset
   */
  sort(data, key, direction = 'asc') {
    const dir = direction === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
      const aValue = this.getFieldValue(a, key);
      const bValue = this.getFieldValue(b, key);

      if (aValue == null) return 1 * dir;
      if (bValue == null) return -1 * dir;

      return aValue > bValue ? 1 * dir : aValue < bValue ? -1 * dir : 0;
    });
  }

  /**
   * Pagineert data op basis van pagina-nummer en limiet.
   * 
   * @param {Array<Object>} data - Array van objecten om te pagineren
   * @param {number} [page=1] - Huidige pagina nummer
   * @param {number} [limit=10] - Aantal items per pagina
   * @returns {Object} Paginatie resultaat met data en metadata
   * @returns {Array<Object>} return.data - Gepagineerde items
   * @returns {number} return.total - Totaal aantal items
   * @returns {number} return.page - Huidige pagina
   * @returns {number} return.limit - Items per pagina
   * @returns {number} return.totalPages - Totaal aantal pagina's
   */
  paginate(data, page = 1, limit = 10) {
    if (!data || !Array.isArray(data)) {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: parseInt(limit),
        totalPages: 0
      };
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      data: data.slice(startIndex, endIndex),
      total: data.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(data.length / limit)
    };
  }

  /**
   * Verwerkt data met filteren, sorteren en pagineren op basis van opties.
   * 
   * @param {Array<Object>} data - Array van objecten om te verwerken
   * @param {Object} [options={}] - Verwerkingsopties
   * @param {string} [options.search] - Zoekterm voor algemene filtering
   * @param {string} [options.sortBy] - Veldnaam voor sortering
   * @param {'asc'|'desc'} [options.sortOrder='asc'] - Sorteervolgorde
   * @param {number} [options.page=1] - Pagina nummer
   * @param {number} [options.limit=10] - Items per pagina
   * @returns {Object} Verwerkte en gepagineerde data
   */
  process(data, options = {}) {
    const {
      search,
      sortBy,
      sortOrder = 'asc',
      page = 1,
      limit = 10,
      ...filters
    } = options;

    let processed = this.filter(data, { search, ...filters });

    if (sortBy) {
      processed = this.sort(processed, sortBy, sortOrder);
    }

    return this.paginate(processed, page, limit);
  }

  /**
   * Vindt een enkel item op basis van een veld en waarde.
   * 
   * @param {Array<Object>} data - Array van objecten om te doorzoeken
   * @param {string} field - Veldnaam om te zoeken
   * @param {*} value - Waarde waarnaar gezocht wordt
   * @returns {Object|null} Gevonden item of null als niet gevonden
   */
  findBy(data, field, value) {
    if (!data || !Array.isArray(data)) return null;
    return data.find(item => item[field] == value);
  }

  /**
   * Vindt een enkel item op basis van zijn ID.
   * 
   * @param {Array<Object>} data - Array van objecten om te doorzoeken
   * @param {*} id - ID van het item
   * @returns {Object|null} Gevonden item of null als niet gevonden
   */
  findById(data, id) {
    return this.findBy(data, 'id', id);
  }
}

export default new DataHandlerService();
