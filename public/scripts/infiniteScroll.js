// Wrap the entire existing logic in a function so it can be re-run
export function initInfiniteScroll() {
  const pagination = document.querySelector(".pagination");
  const mainElement = document.querySelector("main");

  if (!mainElement) {
    console.warn("Main element not found");
    return;
  }

  // Create sentinel element for infinite scroll detection
  const sentinel = document.createElement('div');
  sentinel.id = 'sentinel';
  mainElement.appendChild(sentinel);

  // Track loading state and pagination
  let isLoading = false;
  let currentPage = 1; // Always start from page 1 for infinite scroll
  let lastLoadedPage = currentPage;
  
  // Get items per page by counting items in the first UL
  const getItemsPerPage = () => {
    const firstUl = document.querySelector('main > ul');
    return firstUl ? firstUl.children.length : 12;
  };
  
  // Get total pages from pagination data
  const getTotalPages = () => {
    if (!pagination) return 1;
    const paginationData = pagination.dataset.totalPages;
    return paginationData ? parseInt(paginationData) : 1;
  };

  let totalPages = getTotalPages();
  let itemsPerPage = getItemsPerPage();

  // Cleanup function to handle both observer and sentinel
  const cleanup = () => {
    observer.disconnect();
    sentinel.remove();
    pagination?.remove();
  };

  // Load next page of content
  const loadMoreContent = async () => {
    if (isLoading) return;
    
    try {
      isLoading = true;
      
      const url = new URL(window.location.href);
      const params = url.searchParams;
      
      currentPage++;
      lastLoadedPage = currentPage;
      params.set('page', currentPage.toString());
      
      const response = await fetch(`${url.pathname}?${params.toString()}`, {
        headers: {
          'Accept': 'text/html'
        }
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const newItems = doc.querySelectorAll('main > ul');
      
      if (newItems.length === 0) return;

      sentinel.remove();
      
      const existingUl = document.querySelector('main > ul');
      if (existingUl && newItems[0]) {
        const liElements = newItems[0].querySelectorAll('li');
        liElements.forEach(li => {
          existingUl.appendChild(li.cloneNode(true));
        });
      }
      
      if (pagination) {
        const newPagination = doc.querySelector('.pagination');
        if (newPagination) {
          pagination.innerHTML = newPagination.innerHTML;
          totalPages = parseInt(newPagination.dataset.totalPages) || totalPages;
        }
      }

      // Check if we've reached the end after successfully loading content
      if (currentPage >= totalPages) {
        cleanup();
      } else {
        mainElement.appendChild(sentinel);
        observer.observe(sentinel);
      }
      
    } catch (error) {
      console.error("Error loading more content:", error);
    } finally {
      isLoading = false;
    }
  };

  // Set up intersection observer for infinite scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMoreContent();
        }
      });
    },
    {
      rootMargin: '0px 0px 200px 0px',
      threshold: 0
    }
  );

  // Initial setup
  if (currentPage >= totalPages) {
    cleanup();
  } else {
    observer.observe(sentinel);
    pagination?.remove();
  }
}

// Initialise on first load
initInfiniteScroll();
