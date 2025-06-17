import { Router } from 'express';
import { createDetailService } from "../services/detailService.js";

const router = Router();

/**
 * Route voor het weergeven van een individuele catalogus item detailpagina.
 * Haalt de details op van een specifiek item op basis van het ID.
 * 
 * @async
 * @function
 * @param {Object} request - Express request object
 * @param {Object} request.params - URL parameters
 * @param {string} request.params.id - Het unieke ID van het catalogus item
 * @param {Object} response - Express response object
 * @returns {Promise<void>} Rendert de details template met item data
 */
router.get("/catalogus/:id", async function (request, response) {
  const { id } = request.params;
  const detailService = createDetailService(id)
  const item = await detailService.getRawData(id);
  
  response.render("details", { item });
});

export default router;