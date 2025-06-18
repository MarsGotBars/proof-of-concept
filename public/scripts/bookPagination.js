const bookContainer = document.querySelector("aside");

if (bookContainer) {
  // Gebruik event delegation op de aside
  bookContainer.addEventListener("click", (e) => {
    // Zoek de link die werd geklikt, als er een is
    const link = e.target.closest(".img-nav a");

    // Als de target niet een link is, doe niks
    if (!link) {
      return;
    }

    // Een link werd geklikt, dus voorkom de standaard navigatie
    e.preventDefault();
    const href = link.getAttribute("href");

    const updateContent = async () => {
      try {
        const response = await fetch(href, {
          headers: { Accept: "text/html" },
        });

        // In geval van errors willen we de default navigatie gebruiken (in de catch())
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const text = await response.text();
        const doc = new DOMParser().parseFromString(text, "text/html");

        // Zoek de nieuwe en oude <picture> elementen
        const newPicture = doc.querySelector("aside picture");
        const oldPicture = bookContainer.querySelector("picture");

        // Vervang het oude picture element met de nieuwe
        if (newPicture && oldPicture) {
          oldPicture.replaceWith(newPicture);
        }

        // Update de hele nav
        const newNav = doc.querySelector(".img-nav");
        const oldNav = bookContainer.querySelector(".img-nav");
        if (newNav && oldNav) {
          oldNav.replaceWith(newNav);
        }

        // Update de browser url
        history.pushState(null, "", href);
      } catch (error) {
        console.error("Failed to fetch book page:", error);
        // Als de fetch faalt, navigeer direct als fallback
        window.location.href = href;
      }
    };

    // View transition support
    if (document.startViewTransition) {
      document.startViewTransition(() => updateContent());
    } else {
      updateContent();
    }
  });
}

// Manier om de pagina te laden wanneer de gebruiker back/forward navigeert met de default browser functie
window.addEventListener("popstate", () => {
  window.location.reload();
});
