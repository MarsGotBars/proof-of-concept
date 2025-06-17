// routes/getOverview.js
import { Router } from 'express';
import overviewService from '../services/overviewService.js';

const router = Router();

/**
 * Route voor het ophalen en weergeven van de catalogus overzichtspagina.
 * Ondersteunt zoeken, filteren, sorteren en paginatie.
 * 
 * @async
 * @function
 * @param {Object} request - Express request object
 * @param {Object} request.query - Query parameters
 * @param {string} [request.query.search] - Zoekterm voor algemene zoekfunctionaliteit
 * @param {string} [request.query.sortBy] - Veld waarop gesorteerd moet worden
 * @param {string} [request.query.sortOrder] - Sorteervolgorde ('asc' of 'desc')
 * @param {number} [request.query.page=1] - Pagina nummer voor paginatie
 * @param {number} [request.query.limit=12] - Aantal items per pagina
 * @param {string|string[]} [request.query.auteur] - Filter op auteur(s)
 * @param {string|string[]} [request.query.jaar] - Filter op jaar/jaren
 * @param {string|string[]} [request.query.plaats_van_uitgave] - Filter op plaats van uitgave
 * @param {Object} response - Express response object
 * @returns {Promise<void>} Rendert de overview template of redirect
 */
router.get("/catalogus", async function (request, response) {
  try {
    const {
      search,
      sortBy,
      sortOrder,
      page = 1,
      limit = 12,
      ...rawFilters
    } = request.query;

    // Als er een lege zoekterm is, verwijder deze uit de URL
    if (search === '') {
      const queryParams = new URLSearchParams(request.query);
      queryParams.delete('search');
      const queryString = queryParams.toString();
      return response.redirect(`/catalogus${queryString ? `?${queryString}` : ''}`);
    }

    // Loop door onze gegroepeerde filters en verwerk meerdere waarden
    const filters = {};
    Object.entries(rawFilters).forEach(([key, value]) => {
      if (key === 'jaar' || key === 'plaats_van_uitgave' || key === 'auteur') {
        // Verwerk zowel arrays als strings
        const values = Array.isArray(value) ? value : [value];
        
        if (key === 'auteur') {
          // Behandel zowel puntkomma als komma-gescheiden auteurs
          filters[key] = values
            .flatMap(v => {
              const decoded = decodeURIComponent(v.trim());
              // Splits eerst op puntkomma's (juiste auteur scheiding, in geval van meerdere auteurs)
              let authors = decoded.split(';');
              
              // Behandel daarna komma-gescheiden waarden van de labels
              // Splits op komma's die NIET gevolgd worden door een spatie (auteur scheiding)
              // Behoud komma's die WEL gevolgd worden door een spatie (binnen auteur namen)
              authors = authors.flatMap(author => 
                author.split(/,(?!\s)/).map(a => a.trim())
              );
              
              return authors;
            })
            .filter(v => v !== ''); // Verwijder lege waarden
        } else {
          // Voor jaar en plaats_van_uitgave, splits wel op komma's
          filters[key] = values
            .flatMap(v => v.split(','))
            .map(v => decodeURIComponent(v.trim()))
            .filter(v => v !== ''); // Verwijder lege waarden
        }
      } else {
        filters[key] = value;
      }
    });

    // Alleen zoekterm toevoegen als deze niet leeg is
    const searchTerm = search?.trim();
    const result = await overviewService.getProcessedData({
      ...(searchTerm && { search: searchTerm }), // Alleen zoekterm toevoegen als deze bestaat en niet leeg is
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit),
      ...filters
    });
    
    // Geef de verwerkte filters door aan de template, behoud de originele structuur voor andere velden
    const templateFilters = {
      ...request.query,
      ...(searchTerm ? { search: searchTerm } : { search: undefined }),
      // Gebruik verwerkte filters voor complexe filter types
      ...filters
    };
    
    // Maak een querystring zonder de page parameter voor paginering
    const queryParams = new URLSearchParams();
    // Voeg alle query parameters toe behalve 'page' (om altijd te resetten naar pagina 1)
    Object.entries(request.query).forEach(([key, value]) => {
      if (key !== 'page' && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const currentQueryString = queryParams.toString();
    
    response.render("overview", {
      items: result.data,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        total: result.total,
        limit: result.limit,
        currentQueryString: currentQueryString || ''
      },
      filters: templateFilters,
      base_url: '/catalogus',
      aggregations: result.aggregations,
      totalAggregations: result.totalAggregations,
    });

  } catch (error) {
    console.error('Fout in overview route:', error);
    response.status(500).render("error", { 
      message: "Er is een fout opgetreden bij het laden van de catalogus" 
    });
  }
});

/**
 * Route voor het handmatig vernieuwen van de cache.
 * Verwijdert de bestaande cache en haalt nieuwe data op.
 * 
 * @async
 * @function
 * @param {Object} request - Express request object
 * @param {Object} response - Express response object
 * @returns {Promise<void>} Redirect naar catalogus of error pagina
 */
router.post("/catalogus/refresh", async function (request, response) {
  try {
    await overviewService.refreshCache();
    response.redirect("/catalogus");
  } catch (error) {
    console.error('Fout bij cache vernieuwing:', error);
    response.status(500).render("error", { 
      message: "Er is een fout opgetreden bij het vernieuwen van de cache" 
    });
  }
});

export default router;