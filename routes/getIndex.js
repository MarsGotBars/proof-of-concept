import { Router } from 'express';
const router = Router();

/**
 * Route voor de homepage (index pagina).
 * Toont de startpagina van de applicatie.
 * 
 * @async
 * @function
 * @param {Object} request - Express request object
 * @param {Object} response - Express response object
 * @returns {Promise<void>} Rendert de index template
 */
export default router.get("/", async function (request, response) {
  // Geef hier aan welke pagina getoond moet worden op de / (home) route, en wat er naar de pagina gestuurd wordt
  response.render("index", {});
});

