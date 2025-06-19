import { initInfiniteScroll } from '/scripts/infiniteScroll.js';

function formToQueryString(form) {
  return new URLSearchParams(new FormData(form)).toString();
}

async function fetchOverview(url) {
  const res  = await fetch(url, { headers: { Accept: 'text/html' } });
  if (!res.ok) throw new Error(res.statusText);
  const html = await res.text();
  return new DOMParser().parseFromString(html, 'text/html');
}

function replaceMain(nextDoc) {
  const currentMain = document.querySelector('main');
  const newMain     = nextDoc.querySelector('main');
  if (!currentMain || !newMain) throw new Error('main element not found');
  currentMain.replaceWith(newMain);
}

async function applyFilters(form) {
  const query = formToQueryString(form);
  const url = `/catalogus?${query}`;

  const update = async () => {
    const nextDoc = await fetchOverview(url);
    replaceMain(nextDoc);
    initInfiniteScroll();
    init();
    history.pushState(null, '', url);
    // scroll to top of the new results
    document.querySelector('.items-list')?.scrollIntoView({ behavior: 'instant' });
  };

  if (document.startViewTransition) {
    document.startViewTransition(update);
  } else {
    update();
  }
}

function init() {
  const form = document.querySelector('form[action="/catalogus"]');
  if (!form) return;

  // submit buttons
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilters(form);
  });

  // instant reaction when ticking check-boxes
  form.addEventListener('change', (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
      applyFilters(form);
    }
  });

  // handle browser back / forward
  window.addEventListener('popstate', async () => {
    const nextDoc = await fetchOverview(location.pathname + location.search);
    replaceMain(nextDoc);
    initInfiniteScroll();
    init();
  });
}

document.addEventListener('DOMContentLoaded', init);