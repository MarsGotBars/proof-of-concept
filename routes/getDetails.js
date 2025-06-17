import { Router } from 'express';
import { createDetailService } from "../services/detailService.js";

const router = Router();

/**
 * Route voor het weergeven van een individuele catalogus item detailpagina.
 * Haalt de details op van een specifiek item op basis van het ID en
 * vindt de vorige en volgende items voor navigatie.
 * 
 * @async
 * @function
 * @param {Object} request - Express request object
 * @param {Object} request.params - URL parameters
 * @param {string} request.params.id - Het unieke ID van het catalogus item
 * @param {Object} response - Express response object
 * @returns {Promise<void>} Rendert de details template met item data en navigatie
 */
router.get("/catalogus/:id", async function (request, response) {
  try {
    const { id } = request.params;
    const page = parseInt(request.query.page || "0", 10);
    
    // Haal detail data op van specifiek item via detail service
    const detailService = createDetailService(id);
    const item = await detailService.getDataWithProcessedAssets(page, 2);
    
    // Image pagination
    const assets = item.assets || [];
    const total_pages = assets.length;
    const current_page = total_pages > 0 ? Math.max(0, Math.min(page, total_pages - 1)) : 0;

    let prev_page = null;
    let next_page = null;
    if (total_pages > 1) {
        prev_page = current_page > 0 ? current_page - 1 : total_pages - 1;
        next_page = current_page < total_pages - 1 ? current_page + 1 : 0;
    }
    
    // Haal alle items op uit cache (efficiënt omdat het gecached is) - alleen voor navigatie
    const overviewService = (await import('../services/overviewService.js')).default;
    const allItems = await overviewService.getRawData();
    
    // Vind de huidige index op basis van ID
    const currentIndex = allItems.findIndex(i => i.id === id);
    
    if (currentIndex === -1) {
      return response.status(404).send("Item niet gevonden");
    }
    
    // Bepaal vorige en volgende items op basis van index (met loop around)
    const previousItem = currentIndex > 0 ? allItems[currentIndex - 1] : allItems[allItems.length - 1];
    const nextItem = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : allItems[0];
    
    response.render("details", { 
      item,
      current_page,
      navigation: {
        prev_item: previousItem ? previousItem.id : null,
        next_item: nextItem ? nextItem.id : null,
        current_item: currentIndex + 1,
        total_items: allItems.length,
        current_page: current_page,
        id: id,
        prev_page,
        next_page
      }
    });
    
  } catch (error) {
    console.error('Fout in detail route:', error);
    response.status(500).send("Er is een fout opgetreden bij het laden van het item");
  }
});

export default router;