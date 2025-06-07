/**
 * Verwerkt kaartgegevens met filtering, sortering, paginatie en zoekfunctionaliteit.
 */
class DataHandlerService {
  getFieldValue(item, key) {
  // First check top-level fields
  if (item[key]) return item[key];

  // Then check metadata fields
  return item.metadata?.[key] ?? null;
}

filter(data, filters = {}) {
  if (!Array.isArray(data)) return [];

  let filtered = [...data];

  // General text search (existing functionality)
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

  // Field-specific filtering (NEW functionality)
  const fieldFilters = { ...filters };
  delete fieldFilters.search; // Remove search from field filters

  Object.entries(fieldFilters).forEach(([field, value]) => {
    if (value != null && value !== '') {
      filtered = filtered.filter(item => {
        const fieldValue = this.getFieldValue(item, field);
        
        // Handle exact match for field filtering
        if (fieldValue == null) return false;
        
        // Convert both to string for comparison
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
   * Mogelijkheid om op vele verschillende waarden te sorteren
   * 
   * @param {Array<Object>} data - Array van objecten om te sorteren.
   * @param {string} sortBy - Naam van het veld waarop gesorteerd wordt.
   * @param {'asc'|'desc'} [sortOrder='asc'] - Sorteervolgorde: oplopend ('asc') of aflopend ('desc').
   * @returns {Array<Object>} Gesorteerde data.
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
   * @param {Array<Object>} data - Array van objecten om te pagineren.
   * @param {number} [page=1] - Huidige pagina nummer.
   * @param {number} [limit=10] - Aantal items per pagina.
   * @returns {Object} Object met gepagineerde data en metadata.
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
   * @param {Array<Object>} data - Array van objecten om te verwerken.
   * @param {Object} [options={}] - Opties voor zoeken, sorteren, pagineren en filters.
   * @param {string} [options.search] - Zoekterm voor algemene filtering.
   * @param {string} [options.sortBy] - Veldnaam voor sortering.
   * @param {'asc'|'desc'} [options.sortOrder='asc'] - Sorteervolgorde.
   * @param {number} [options.page=1] - Pagina nummer.
   * @param {number} [options.limit=10] - Items per pagina.
   * @returns {Object} Gepagineerde en gefilterde data.
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
   * @param {Array<Object>} data - Array van objecten om te doorzoeken.
   * @param {string} field - Veldnaam om te zoeken.
   * @param {*} value - Waarde waarnaar gezocht wordt.
   * @returns {Object|null} Gevonden item of null als niet gevonden.
   */
  findBy(data, field, value) {
    if (!data || !Array.isArray(data)) return null;
    return data.find(item => item[field] == value);
  }

  /**
   * Vindt een enkel item op basis van zijn ID.
   * 
   * @param {Array<Object>} data - Array van objecten om te doorzoeken.
   * @param {*} id - ID van het item.
   * @returns {Object|null} Gevonden item of null als niet gevonden.
   */
  findById(data, id) {
    return this.findBy(data, 'id', id);
  }
}

export default new DataHandlerService();
