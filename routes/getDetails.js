import { Router } from 'express';
const router = Router();

router.get("/catalogus/:id", async function (request, response) {
  const { id } = request.params;
  response.render("details", { id });
});

export default router;