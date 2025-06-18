import { Router } from 'express';
import MessageService from '../services/messageService.js';

const router = Router();

/**
 * Route voor het posten van een bericht dat gekoppeld is aan een detailpagina.
 * De route verwacht een POST-verzoek met in de body het veld `message`.
 * Het detail-item ID wordt uit de URL gehaald.
 *
 * Voorbeeld-aanroep (fetch in browser):
 *   fetch('/catalogus/123/messages', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ message: 'Hallo wereld' })
 *   })
 */
router.post('/catalogus/:id/messages', async function (request, response) {
  try {
    const { id } = request.params;
    const { message, page: bodyPage } = request.body;
    const queryPage = request.query.page;
    const page = bodyPage ?? queryPage;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return response.status(400).json({ error: 'Bericht mag niet leeg zijn.' });
    }

    const service = new MessageService();
    await service.postMessage(message.trim(), id);

    // Wanneer de client JSON verwacht (bijv. via fetch), stuur JSON terug.
    // Voor reguliere form posts redirecten we terug naar de detailpagina
    if (request.accepts(["json", "html"]) === "json") {
      return response.status(201).json({ success: true, page });
    }

    const pageParam = page !== undefined ? `?page=${page}` : "";
    return response.redirect(`/catalogus/${id}${pageParam}#comment`);
  } catch (error) {
    console.error('Fout bij posten van bericht:', error);
    return response
      .status(500)
      .json({ error: 'Er is een fout opgetreden bij het posten van het bericht.' });
  }
});

export default router; 