document.addEventListener("DOMContentLoaded", () => {
  const MAX_SUGGESTIONS = 6;
  const searchInput = document.querySelector(".drive-search-input");
  const searchDropdown = document.querySelector(".search-suggestions-dropdown");
  const suggestionsList = document.querySelector(".suggestion-list");

  if (!searchInput || !searchDropdown || !suggestionsList) return;

  let debounce;
  let lastQuery = "";
  let cachedResults = [];

  searchInput.addEventListener("input", () => {
    clearTimeout(debounce);

    const query = searchInput.value.trim();
    if (query === lastQuery) return;
    lastQuery = query;

    if (!query) {
      hideSearchDropdown();
      return;
    }

    debounce = setTimeout(() => {
      fetchSearchResults(query);
    }, 600);
  });

  function showSearchDropdown() {
    searchDropdown.classList.remove("hidden");
  }

  function hideSearchDropdown() {
    searchDropdown.classList.add("hidden");
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".header-search-bar")) {
      hideSearchDropdown();
    }
  });

  searchInput.addEventListener("focus", () => {
    closeAllMenus();
    if (lastQuery) {
      fetchSearchResults(lastQuery);
    }
    showSearchDropdown();
  });
  function closeAllMenus() {
    document
      .querySelectorAll(".dropdown-menu, .context-menu, .option-bar")
      .forEach((el) => el.classList.add("hidden"));
  }
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllMenus();
      hideSearchDropdown();
    }
    if (e.key === "Enter") {
      runFullSearch(searchInput.value.trim());
    }
  });

  document
    .querySelector(".header-search-btn")
    ?.addEventListener("click", () => {
      runFullSearch(searchInput.value.trim());
    });

  function fetchSearchResults(query) {
    const items = document.querySelectorAll(".file-container-item");
    const matches = [];
    const lowerQuery = query.toLowerCase();

    items.forEach((item) => {
      const name =
        item
          .querySelector(".file-item-container-title.file-name")
          ?.textContent.toLowerCase()
          .trim() || "";
      const owner =
        item
          .querySelector(".file-item-container-owner-title.file-owner")
          ?.textContent.toLowerCase()
          .trim() || "";
      const date =
        item
          .querySelector(".file-item-container-date-modified-text")
          ?.textContent.toLowerCase()
          .trim() || "";
      const size =
        item
          .querySelector(".file-item-container-size-text")
          ?.textContent.toLowerCase()
          .trim() || "";

      if (
        name.includes(query) ||
        owner.includes(query) ||
        date.includes(query) ||
        size.includes(query)
      ) {
        matches.push({
          name: name,
          element: item,
        });
      }
    });

    cachedResults = matches;
    renderSearchSuggestions(matches, query);
  }

  function renderSearchSuggestions(files, query) {
    suggestionsList.innerHTML = "";
    if (!files.length) {
      suggestionsList.innerHTML =
        "<div class='suggestion-empty'>No matching files found</div>";
      showSearchDropdown();
      return;
    }
    const slicedFiles = files.slice(0, MAX_SUGGESTIONS);
    slicedFiles.forEach((file) => {
      // const el = window.renderFileItem(file);
      // suggestionsList.appendChild(el);
      const li = document.createElement("li");
      li.className = "suggestion-item";
      li.innerHTML = getHighlightHtml(file.name, query);
      li.onclick = () => {
        searchInput.value = file.name;
        runFullSearch(file.name);
      };
      suggestionsList.appendChild(li);
    });

    if (files.length > 0) {
      const more = document.createElement("div");
      more.className = "suggestion-show-all";
      more.textContent = "Show all results";
      more.onclick = () => {
        runFullSearch(query);
      };
      suggestionsList.appendChild(more);
    }
    showSearchDropdown();
  }

  async function runFullSearch(query) {
    if (!query) return;
    hideSearchDropdown();
    showLoader(true);
    try {
      const res = await fetch(
        `/drive/api/search?q=${encodeURIComponent(query)}`,
        {
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error("Failed to search");
      const data = await res.json();
      renderSearchResults(data);
    } catch (err) {
      console.error("Error searching:", err);
    } finally {
      showLoader(false);
    }
  }

  function getHighlightHtml(text, query) {
    if (!query) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escapedQuery})`, "gi");
    return text.replace(re, "<mark>$1</mark>");
  }

  function showLoader(show) {
    const loader = document.getElementById("searchLoader");
    if (loader) loader.classList.toggle("hidden", !show);
  }

  function renderSearchResults(files) {
    const container = document.querySelector(".file-container");
    const list = document.querySelector(".file-container-list");
    const empty = document.querySelector(".empty-container-state");

    if (!list) return;
    list.innerHTML = "";

    if (!files || !files.length) {
      if (container) container.classList.add("none");
      if (empty) {
        empty.classList.remove("none");
        const img = empty.querySelector(".empty-container-img");
        if (img)
          img.src =
            "https://ssl.gstatic.com/docs/doclist/images/empty_state_no_search_results_v6.svg";
        const header = empty.querySelector(".empty-container-msg-header");
        if (header)
          header.textContent = "None of your files matched this search";
        const msg = empty.querySelector(".empty-container-msg");
        if (msg)
          msg.textContent =
            "Try another search, or use search options to find a file by type, owner and more";
      }
      return;
    }

    if (empty) empty.classList.add("none");
    if (container) container.classList.remove("none");

    files.forEach((file) => {
      if (window.renderFileItem) {
        const el = window.renderFileItem(file);
        list.appendChild(el);
      }
    });
  }
});
