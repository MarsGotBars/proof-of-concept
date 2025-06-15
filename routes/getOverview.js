// routes/getOverview.js
import { Router } from 'express';
import overviewService from '../services/overviewService.js';

const router = Router();

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
      return response.redirect(`/catalogus?${queryParams.toString()}`);
    }

    // Loop door onze gegroepeerde filters en verwerk meerdere waarden
    const filters = {};
    Object.entries(rawFilters).forEach(([key, value]) => {
      if (key === 'jaar' || key === 'plaats_van_uitgave' || key === 'auteur') {
        // Verwerk zowel arrays als strings en splits komma-gescheiden waarden
        const values = Array.isArray(value) ? value : [value];
        // Splits elke waarde op komma en maak het resultaat plat
        filters[key] = values
          .flatMap(v => v.split(','))
          .map(v => decodeURIComponent(v.trim()))
          .filter(v => v !== ''); // Verwijder lege waarden
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
    
    // Alleen niet-lege zoekterm toevoegen aan filters voor de template
    const templateFilters = {
      ...request.query,
      ...(searchTerm ? { search: searchTerm } : { search: undefined })
    };
    
    // Maak een querystring zonder de page parameter voor paginering
    const queryParams = new URLSearchParams();
    console.log('Request query:', request.query);
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

// Handigheidje om handmatig de cache te vernieuwen
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