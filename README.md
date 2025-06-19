Ontwerp en maak een data driven online concept voor een opdrachtgever

De instructies voor deze opdracht staan in: [docs/INSTRUCTIONS.md](https://github.com/fdnd-task/proof-of-concept/blob/main/docs/INSTRUCTIONS.md)

# [The Embassy of the Free Mind](https://proof-of-concept-rzbj.onrender.com/catalogus)

## Inhoudsopgave

  * [Beschrijving](#beschrijving)
  * [Gebruik](#gebruik)
  * [Kenmerken](#kenmerken)
  * [Installatie](#installatie)
  * [Bronnen](#bronnen)
  * [Licentie](#licentie)

## Beschrijving
<!-- Bij Beschrijving staat kort beschreven wat voor project het is en wat je hebt gemaakt -->
<!-- Voeg een mooie poster visual toe 📸 -->
<!-- Voeg een link toe naar Github Pages 🌐-->
### De laatste 3 weken heb ik gewerkt aan het [design](https://www.figma.com/design/oTH2XAtxUaF9jsK5YROkqu/IO-Digital-%7C-FDND?node-id=0-1&p=f&t=XohyUGe7dXCbr3aI-0) en de [website](https://proof-of-concept-rzbj.onrender.com/catalogus) voor The Embassy of the Free Mind
Een museum waar zeer oude boeken bewaard houden; Deze worden ook langzamerhand gedigitalizeerd zodat deze oude werken nooit verloren gaan.
![image](https://github.com/user-attachments/assets/1d4eb905-2a3f-405e-b99d-0a423de4b956)

Op de site kun je alle boeken bekijken er zelfs doorheen bladeren.

## Gebruik
<!-- Bij Gebruik staat de user story, hoe het werkt en wat je er mee kan. -->
Als gebruiker kun je in het catalogus een selectie aan boeken bekijken; zo is er paginatie, filtering & search om makkelijk boeken terug te vinden.

De boeken op het catalogus hebben elk ook een detail pagina; waarop meer informatie staat over elk boek, gebruikers een bericht kunnen achterlaten, er door het boek gebladert kan worden en ook andere boeken kunnen bekijken.

## Kenmerken
<!-- Bij Kenmerken staat welke technieken zijn gebruikt en hoe. Wat is de HTML structuur? Wat zijn de belangrijkste dingen in CSS? Wat is er met JS gedaan en hoe? Misschien heb je iets met NodeJS gedaan, of heb je een framwork of library gebruikt? -->
Voor dit project is er gebruik gemaakt van; 
### LiquidJS (templating HTML)
### NodeJS & Express voor de server
### CSS voor de styling
### Sharp package voor server-side image tweaks.
### [Custom API van IO](https://efm-student-case-proxy-api.vercel.app/overview)

<details><summary>Animaties</summary>

Beide animaties maken gebruik van view transitions

Filter / Search

https://github.com/user-attachments/assets/64c7c712-e200-4518-b46e-6d5c451bcf1d

```js
const update = async () => {
    const nextDoc = await fetchOverview(url);
    replaceMain(nextDoc);
    initInfiniteScroll();
    init();
    history.pushState(null, "", url);

    document
      .querySelector(".items-list")
      ?.scrollIntoView({ behavior: "instant" });
  };

  if (document.startViewTransition) {
    document.startViewTransition(update);
  } else {
    update();
  }
```
Voor de filtering doen we alleen een js viewTransition; zo heb ik een update functie en die call ik alleen met startViewTransition als het supported is.
Ook doe ik een history.pushState zodat de filters correct in de URL komen te staan. Als de gebruiker de back/forward button gebruikt dan komen ze uit op precies de gefilterde pagina die ze verwachten!

Comment

https://github.com/user-attachments/assets/b665ad26-888f-477f-b575-c055c93d976a

Voor de css doen we het volgende
```css
@supports (view-transition-name: auto) {
  @view-transition {
    navigation: auto;
  }

  #comment {
    padding-bottom: 0;
  }

  #comment li[data-message-id] {
    view-transition-name: var(--vt-name);
    animation-duration: 0.5s;
  }

  #comment form {
    view-transition-name: comment-form;
    background-color: var(--blue);
    padding-bottom: 1.5rem;
  }

  main nav {
    view-transition-name: main-navigation;
    background-color: var(--blue);
  }

  aside.book {
    view-transition-name: book-image;
  }
}
```
Allereerst check we of view transitions supported zijn en doen we de opt-in voor view transitions; gevolgd door een padding change.

Hierna zetten we de comments, form en de nav allemaal in de top-layer door ze names te geven; zonder de form en nav zou de tekst uit de comment box overflowen tijdens de animatie.

```js
const performDOMUpdate = () => {
        const serverList = doc.querySelector("#comment ul");
        const localList = document.querySelector("#comment ul");

        if (serverList && localList) {
          const serverItems = Array.from(
            serverList.querySelectorAll("li[data-message-id]"),
          );
          for (let i = serverItems.length - 1; i >= 0; i--) {
            const li = serverItems[i];
            const id = li.dataset.messageId;
            if (!localList.querySelector(`li[data-message-id="${id}"]`)) {
              li.classList.add("card");
              li.style.setProperty("--vt-name", `msg-${id}`);
              localList.insertAdjacentHTML("afterbegin", li.outerHTML);
              if (emptyMessage) emptyMessage.remove();
            }
          }
        }

        const newForm = doc.querySelector("#message-form");
        if (newForm && newForm.outerHTML !== form.outerHTML) {
          form.replaceWith(newForm);
          messageForm = newForm;
          messageForm.addEventListener("submit", handleSubmit);
        }
      };
if (document.startViewTransition) {
        document.startViewTransition(() => performDOMUpdate());
      } else {
        performDOMUpdate();
      }
```
Hier heb ik een functie aangemaakt en in het geval dat view transitions supported zijn; gebruiken we die; anders updaten we de DOM normaal.

</details>

## Installatie / Scripts
<!-- Bij Instalatie staat hoe een andere developer aan jouw repo kan werken -->
#### `npm i` of `npm install`
Hiermee installeer je de benodigde packages zoals express en andere dergelijke packages.

#### `npm serve`
Hiermee start je het project lokaal op.
Open vervolgens [http://localhost:2345](http://localhost:2345) om het project te zien in de browser.

Om edits te zien moet je de pagina refreshen omdat het geen hot-reload bevat.

#### `npm start`
Hiermee start je het project op en run je de Nodemon package, deze helpt met het verversen van je server wanneer je verandering maakt.
Open vervolgens [http://localhost:2345](http://localhost:2345).

> [!TIP]
> `console.log`'s in de `server.js` worden in de editor console weergeven, niet de browser.
## Bronnen
[The Embassy of the Free Mind](https://embassyofthefreemind.com/nl/)

## Licentie

This project is licensed under the terms of the [MIT license](./LICENSE).
