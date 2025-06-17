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
    
    console.log('Filtering with:', filters);



    // Alleen zoeken als er een niet-lege zoekterm is
    if (filters.search && filters.search.trim() !== "") {
      const searchTerm = filters.search.toLowerCase();

      filtered = filtered.filter((item) => {
        const valuesToSearch = [
          item.title,
          item.description,
          ...Object.values(item.metadata ?? {}),
        ];

        return valuesToSearch.some((val) =>
          Array.isArray(val)
            ? val.some((v) => v.toLowerCase().includes(searchTerm))
            : typeof val === "string" && val.toLowerCase().includes(searchTerm),
        );
      });
    }

    const fieldFilters = { ...filters };
    delete fieldFilters.search;

    // Elk filter wordt apart toegepast (OR condition tussen filters)
    Object.entries(fieldFilters).forEach(([field, value]) => {
      // Sla lege waarden over
      if (value == null || value === "" || value === "all") return;

      // Converteer waarde naar array als het nog niet al een array is
      const filterValues = Array.isArray(value) ? value : [value];
      
      console.log(`Applying filter for ${field}:`, filterValues);

      // Voor elk veld, willen we match ANY van de filterwaarden (OR condition)
      filtered = filtered.filter((item) => {
        const fieldValue = this.getFieldValue(item, field);

        if (fieldValue == null) return false;

        // Converteer veldwaarde naar string voor vergelijking
        const itemValue = String(fieldValue);

        // Speciale behandeling voor auteur veld - controleer of auteur string overeenkomt met filterwaarden
        if (field === 'auteur') {
          const authorString = this.getFieldValue(item, 'auteur');
          console.log(`  Item author: "${authorString}"`);
          
          if (authorString && typeof authorString === 'string') {
            // Splits de auteur string terug naar individuele auteurs en check voor overeenkomsten
            const authors = authorString.split('; ').map(a => a.trim());
            console.log(`  Split authors:`, authors);
            
            const matches = filterValues.some(filterValue => 
              authors.some(author => {
                const match = String(author).trim() === String(filterValue).trim();
                console.log(`    "${author}" === "${filterValue}" ? ${match}`);
                return match;
              })
            );
            console.log(`  Final match result: ${matches}`);
            return matches;
          }
          // Terugval naar originele logica als er geen auteur data is
        }

        // Controleer of ANY van de filterwaarden overeenkomt (OR condition)
        return filterValues.some((filterValue) => {
          const normalizedFilterValue = String(filterValue).trim();
          const normalizedItemValue = itemValue.trim();

          // Voor jaar veld, speciale gevallen afhandelen
          if (field === "jaar") {
            // Verwijder haakjes en rare gevallen voor vergelijking
            const cleanFilterValue = normalizedFilterValue.replace(
              /[\[\]ca\.\s]/g,
              "",
            );
            const cleanItemValue = normalizedItemValue.replace(
              /[\[\]ca\.\s]/g,
              "",
            );

            // Als beide waarden exact hetzelfde zijn, match ze
            if (cleanFilterValue === cleanItemValue) {
              return true;
            }

            // Als één van beide een bereik is, vergelijk alleen de startjaren
            if (
              cleanFilterValue.includes("-") ||
              cleanItemValue.includes("-")
            ) {
              const [filterStartYear] = cleanFilterValue.split("-");
              const [itemStartYear] = cleanItemValue.split("-");
              // Alleen matchen als beide waarden een bereik zijn
              return (
                cleanFilterValue.includes("-") &&
                cleanItemValue.includes("-") &&
                filterStartYear === itemStartYear
              );
            }

            // Voor andere gevallen, exacte overeenkomst
            return false;
          }

          // Voor andere velden, gebruiken we exacte overeenkomst
          return normalizedFilterValue === normalizedItemValue;
        });
      });
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
  sort(data, key, direction = "asc") {
    const dir = direction === "asc" ? 1 : -1;

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
   * @param {number} [limit=12] - Aantal items per pagina
   * @returns {Object} Paginatie resultaat met data en metadata
   * @returns {Array<Object>} return.data - Gepagineerde items
   * @returns {number} return.total - Totaal aantal items
   * @returns {number} return.page - Huidige pagina
   * @returns {number} return.limit - Items per pagina
   * @returns {number} return.totalPages - Totaal aantal pagina's
   */
  paginate(data, page = 1, limit = 12) {
    if (!data || !Array.isArray(data)) {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: parseInt(limit),
        totalPages: 0,
      };
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      data: data.slice(startIndex, endIndex),
      total: data.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(data.length / limit),
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
   * @param {number} [options.limit=12] - Items per pagina
   * @returns {Object} Verwerkte en gepagineerde data
   */
  process(data, options = {}) {
    const {
      search,
      sortBy,
      sortOrder = "asc",
      page = 1,
      limit = 12,
      ...filters
    } = options;

    let processed = this.filter(data, { search, ...filters });

    // Bereken aggregaties met huidige filters voor sortering
    const aggregations = this.getAggregations(
      data,
      ["jaar", "plaats_van_uitgave", "auteur"],
      filters,
    );

    if (sortBy) {
      processed = this.sort(processed, sortBy, sortOrder);
    }

    const paginated = this.paginate(processed, page, limit);

    return {
      ...paginated,
      aggregations,
    };
  }

  /**
   * Berekent het aantal items voor specifieke velden.
   *
   * @param {Array<Object>} data - De data om te groeperen
   * @param {Array<string>} fields - De velden om te groeperen
   * @param {Object} currentFilters - Huidige filtercriteria
   * @returns {Object} Object met aantallen voor elk veld
   */
  getAggregations(data, fields, currentFilters = {}) {
    const aggregations = {};

    // Util om jaarnummer uit jaarvelden te halen
    const getYearNumber = (yearStr) => {
      // Verwijder haakjes en rare gevallen
      const cleanYear = yearStr.replace(/[\[\]ca\.\s]/g, "");

      const yearMatch = cleanYear.match(/\d{4}/);
      return yearMatch ? parseInt(yearMatch[0]) : 0;
    };

    // Hulpfunctie om filterwaarden te normaliseren
    const normalizeFilterValues = (values, fieldName) => {
      if (!values) return [];
      // Verwerk zowel arrays als strings
      const valueArray = Array.isArray(values) ? values : [values];
      
      // For author field, don't split on commas since author names contain commas
      if (fieldName === 'auteur') {
        return valueArray.map((v) => {
          if (typeof v !== "string") return v;
          return decodeURIComponent(v.trim());
        });
      }
      
      // For other fields, split comma-separated strings
      return valueArray.flatMap((v) => {
        if (typeof v !== "string") return v;
        return v.split(",").map((s) => decodeURIComponent(s.trim()));
      });
    };

    fields.forEach((field) => {
      const counts = {};
      data.forEach((item) => {
        // Special handling for author field - split on semicolons to count individual authors
        if (field === 'auteur') {
          const authorString = this.getFieldValue(item, 'auteur');
          if (authorString && typeof authorString === 'string') {
            // Split on semicolons to get individual authors and count each one
            const authors = authorString.split(';').map(a => a.trim()).filter(a => a !== '');
            authors.forEach(author => {
              counts[author] = (counts[author] || 0) + 1;
            });
          }
        } else {
          const value = this.getFieldValue(item, field);
          if (value != null) {
            // Sla de exacte waarde op zoals deze is
            counts[value] = (counts[value] || 0) + 1;
          }
        }
      });

      // Converteer naar array van [waarde, aantal] en sorteer
      const entries = Object.entries(counts);

      // Haal filterwaarden voor dit veld op en normaliseer ze
      const filterValues = normalizeFilterValues(currentFilters[field], field);

      // Debug logging for auteur field
      if (field === 'auteur') {
        console.log('Current auteur filters:', currentFilters[field]);
        console.log('Normalized filter values:', filterValues);
        console.log('Available authors before sorting:', entries.map(([name, count]) => `${name} (${count})`));
      }

      entries.sort(([aValue, aCount], [bValue, bCount]) => {
        // Speciale afhandeling voor jaar veld
        if (field === "jaar") {
          const aIsFiltered = filterValues.includes(aValue);
          const bIsFiltered = filterValues.includes(bValue);

          // Als één gefilterd is en de andere niet, komt de gefilterde eerst
          if (aIsFiltered !== bIsFiltered) {
            return aIsFiltered ? -1 : 1;
          }

          // Als beide gefilterd zijn, behoud hun relatieve volgorde uit filterValues
          if (aIsFiltered && bIsFiltered) {
            return filterValues.indexOf(aValue) - filterValues.indexOf(bValue);
          }

          // Als geen van beide gefilterd is, sorteer op jaarnummer
          const aYear = getYearNumber(aValue);
          const bYear = getYearNumber(bValue);

          // Als beide geldige jaren hebben, sorteer numeriek
          if (aYear && bYear) {
            return aYear - bYear;
          }

          // Als slechts één een geldig jaar heeft, komt deze eerst
          if (aYear && !bYear) return -1;
          if (!aYear && bYear) return 1;

          return aValue.localeCompare(bValue);
        }

        // Voor andere velden, sorteer alleen op basis van filterstatus
        const aIsFiltered = filterValues.includes(aValue);
        const bIsFiltered = filterValues.includes(bValue);

        if (aIsFiltered !== bIsFiltered) {
          return aIsFiltered ? -1 : 1;
        }

        // Als beide gefilterd zijn of beide niet gefilterd zijn, sorteer alfabetisch
        return aValue.localeCompare(bValue);
      });

      // Sla de gesorteerde array direct op in plaats van terug te converteren naar een object
      aggregations[field] = entries;
    });

    return aggregations;
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
    return data.find((item) => item[field] == value);
  }

  /**
   * Vindt een enkel item op basis van zijn ID.
   *
   * @param {Array<Object>} data - Array van objecten om te doorzoeken
   * @param {*} id - ID van het item
   * @returns {Object|null} Gevonden item of null als niet gevonden
   */
  findById(data, id) {
    return this.findBy(data, "id", id);
  }
}

export default new DataHandlerService();
