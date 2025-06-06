import { Router } from 'express';
const router = Router();
// Index route
export default router.get("/", async function (request, response) {

  // Geef hier aan welke pagina getoond moet worden op de / (home) route, en wat er naar de pagina gestuurd wordt
  response.render("index", {});
});

