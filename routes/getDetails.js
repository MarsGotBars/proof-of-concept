import { Router } from 'express';
import { createDetailService } from "../services/detailService.js";

const router = Router();

router.get("/catalogus/:id", async function (request, response) {
  const { id } = request.params;
  const detailService = createDetailService(id)
  const item = await detailService.getRawData(id);
  
  response.render("details", { item });
});

export default router;