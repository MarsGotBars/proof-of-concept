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
      ...filters
    } = request.query;

    const result = await overviewService.getProcessedData({
      search,
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit),
      ...filters
    });
    console.log(result.data[0].metadata.status);
    
    response.render("overview", {
      items: result.data,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        total: result.total,
        limit: result.limit
      },
      filters: request.query
    });

  } catch (error) {
    console.error('Overview route error:', error);
    response.status(500).render("error", { 
      message: "Er is een fout opgetreden bij het laden van de catalogus" 
    });
  }
});

// Optional: Add a refresh endpoint for manual cache refresh
router.post("/catalogus/refresh", async function (request, response) {
  try {
    await overviewService.refreshCache();
    response.redirect("/catalogus");
  } catch (error) {
    console.error('Cache refresh error:', error);
    response.status(500).json({ error: "Cache refresh failed" });
  }
});

export default router;