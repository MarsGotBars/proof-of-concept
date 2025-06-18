class MessageService {
  constructor() {
    this.baseUrl = "https://fdnd.directus.app/";
  }
  // post message to https://fdnd.directus.app/items/messages
  async postMessage(message, detailId) {
    try {
      const response = await fetch(`${this.baseUrl}items/messages`, {
        method: "POST",
        body: JSON.stringify(
            {
                text: message,
                from: "Marcin-IO",
                for: detailId
            }
        ),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    } catch (error) {
      console.error("Error posting message:", error);
      throw error;
    }
  }

  async getMessages(detailId, limit = -1) {
    try {
      // Haal de nieuwste berichten op (gesorteerd op id aflopend) en beperk tot 'limit'
      const url = `${this.baseUrl}items/messages?filter[from][_eq]=Marcin-IO&filter[for][_eq]=${detailId}&sort=-id&limit=${limit}`;
      const response = await fetch(url);
      const { data: reacties } = await response.json();
      return reacties;
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }
}

export default MessageService;