// ─── Config ────────────────────────────────────────────────
const API_KEY = "bee82d8ebed4a5cc44c9ed148ffc4b0e";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";
const NO_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg width="280" height="420" viewBox="0 0 280 420" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="280" height="420" rx="12" fill="#1a1a2e"/>' +
        '<circle cx="140" cy="180" r="40" stroke="#444" stroke-width="2" fill="none"/>' +
        '<path d="M130 168 l25 12 -25 12 z" fill="#444"/>' +
        '<text x="140" y="260" fill="#555" text-anchor="middle" font-size="14" font-family="Inter, sans-serif">No Image Available</text>' +
        '</svg>'
    );

// ─── DOM Elements ──────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const searchInput = $("searchInput");
const genreFilter = $("genreFilter");
const yearFilter = $("yearFilter");
const sortFilter = $("sortFilter");
const clearBtn = $("clearBtn");
const moviesGrid = $("moviesGrid");
const trendingEl = $("trendingCarousel");
const trendingSection = $("trendingSection");
const sectionTitle = $("randomSectionTitle");

// ─── State ─────────────────────────────────────────────────
let genres = {};
let filters = { genre: "", year: "", sort: "" };
let searchTimeout;

// ─── Helpers ───────────────────────────────────────────────
const api = (path) => fetch(`${BASE}${path}&api_key=${API_KEY}`).then(r => r.json());

function getRating(vote) { return vote ? vote.toFixed(1) : "N/A"; }
function getYear(date) { return date ? new Date(date).getFullYear() : "TBA"; }
function getGenres(ids) {
    return ids ? ids.slice(0, 2).map(id => genres[id]).filter(Boolean).join(", ") : "N/A";
}
function ratingClass(r) { return r >= 7 ? "rating-high" : r >= 5 ? "rating-mid" : "rating-low"; }

// ─── Card Templates ────────────────────────────────────────
function trendingCard(movie, rank) {
    const poster = movie.poster_path ? `${IMG}${movie.poster_path}` : NO_IMG;
    return `
    <div class="trending-card">
        <img src="${poster}" alt="${movie.title}" class="trending-poster" loading="lazy" onerror="this.src='${NO_IMG}'">
        <div class="trending-rank">#${rank}</div>
        <div class="trending-overlay">
            <div class="trending-title">${movie.title}</div>
            <div class="trending-details">
                <span class="trending-year">${getYear(movie.release_date)}</span>
                <span class="trending-rating">⭐ ${getRating(movie.vote_average)}</span>
            </div>
            <div class="trending-genres">${getGenres(movie.genre_ids)}</div>
        </div>
    </div>`;
}

function movieCard(movie) {
    const poster = movie.poster_path ? `${IMG}${movie.poster_path}` : NO_IMG;
    const rating = getRating(movie.vote_average);
    const desc = movie.overview
        ? (movie.overview.length > 120 ? movie.overview.substring(0, 120) + "…" : movie.overview)
        : "No description available.";

    return `
    <div class="movie-card">
        <div class="movie-poster-wrap">
            <img src="${poster}" alt="${movie.title}" class="movie-poster" loading="lazy" onerror="this.src='${NO_IMG}'">
            <div class="movie-rating-badge ${ratingClass(movie.vote_average)}">⭐ ${rating}</div>
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-meta">
                <span class="movie-year">${getYear(movie.release_date)}</span>
                <span class="movie-genres">${getGenres(movie.genre_ids)}</span>
            </div>
            <p class="movie-description">${desc}</p>
        </div>
    </div>`;
}

// ─── Display ───────────────────────────────────────────────
function showMovies(movies) {
    if (!movies || movies.length === 0) {
        moviesGrid.innerHTML = '<div class="no-results"><span class="no-results-icon">🎞️</span><p>No movies found matching your criteria.</p></div>';
        return;
    }
    moviesGrid.innerHTML = movies.map(m => movieCard(m)).join("");
}

function showLoading(msg = "Loading movies...") {
    moviesGrid.innerHTML = `<div class="loading"><div class="spinner"></div>${msg}</div>`;
}

function showError(msg = "Failed to load movies. Please try again.") {
    moviesGrid.innerHTML = `<div class="error">${msg}</div>`;
}

// ─── Data Fetching ─────────────────────────────────────────
async function loadGenres() {
    try {
        const data = await api("/genre/movie/list?");
        genres = {};
        data.genres.forEach(g => {
            genres[g.id] = g.name;
            const opt = document.createElement("option");
            opt.value = g.id;
            opt.textContent = g.name;
            genreFilter.appendChild(opt);
        });
    } catch (e) { console.error("Error loading genres:", e); }
}

function setupYearFilter() {
    const year = new Date().getFullYear();
    for (let y = year; y >= 1970; y--) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        yearFilter.appendChild(opt);
    }
}

async function loadTrending() {
    try {
        const data = await api("/trending/movie/week?");
        trendingEl.innerHTML = data.results.slice(0, 10).map((m, i) => trendingCard(m, i + 1)).join("");
    } catch (e) {
        console.error("Error loading trending:", e);
        trendingEl.innerHTML = '<div class="error">Failed to load trending movies.</div>';
    }
}

async function loadMovies() {
    try {
        let url = `/discover/movie?page=${Math.floor(Math.random() * 10) + 1}`;
        if (filters.sort) url += `&sort_by=${filters.sort}`;
        if (filters.genre) url += `&with_genres=${filters.genre}`;
        if (filters.year) url += `&primary_release_year=${filters.year}`;
        const data = await api(url);
        showMovies(data.results);
    } catch (e) {
        console.error("Error loading movies:", e);
        showError();
    }
}

function sortMovies(movies, sortBy) {
    const sorted = [...movies];
    const sorters = {
        "popularity.desc": (a, b) => b.popularity - a.popularity,
        "popularity.asc": (a, b) => a.popularity - b.popularity,
        "release_date.desc": (a, b) => new Date(b.release_date) - new Date(a.release_date),
        "release_date.asc": (a, b) => new Date(a.release_date) - new Date(b.release_date),
        "vote_average.desc": (a, b) => b.vote_average - a.vote_average,
        "vote_average.asc": (a, b) => a.vote_average - b.vote_average,
    };
    return sorters[sortBy] ? sorted.sort(sorters[sortBy]) : sorted;
}

// ─── Search ────────────────────────────────────────────────
async function handleSearch(query) {
    const q = query.trim();
    if (!q) {
        clearBtn.classList.remove("show");
        sectionTitle.textContent = "🎬 Discover Movies";
        trendingSection.style.display = "block";
        await loadMovies();
        return;
    }

    clearBtn.classList.add("show");
    sectionTitle.textContent = `🔍 Search Results for "${q}"`;
    trendingSection.style.display = "none";
    showLoading("Searching movies...");

    try {
        let url = `/search/movie?query=${encodeURIComponent(q)}&page=1`;
        if (filters.year) url += `&primary_release_year=${filters.year}`;
        const data = await api(url);

        let results = data.results;
        if (filters.genre) {
            results = results.filter(m => m.genre_ids && m.genre_ids.includes(parseInt(filters.genre)));
        }
        if (filters.sort) {
            results = sortMovies(results, filters.sort);
        }
        showMovies(results);
    } catch (e) {
        console.error("Error searching:", e);
        showError("Failed to load search results.");
    }
}

// ─── Filter Change ─────────────────────────────────────────
async function handleFilterChange() {
    filters.genre = genreFilter.value;
    filters.year = yearFilter.value;
    filters.sort = sortFilter.value;

    const hasFilters = filters.genre || filters.year || filters.sort;
    clearBtn.classList.toggle("show", hasFilters);

    if (searchInput.value.trim()) {
        trendingSection.style.display = "none";
        await handleSearch(searchInput.value);
    } else {
        trendingSection.style.display = hasFilters ? "none" : "block";
        sectionTitle.textContent = hasFilters ? "🎬 Filtered Movies" : "🎬 Discover Movies";
        showLoading();
        await loadMovies();
    }
}

function clearAll() {
    searchInput.value = "";
    genreFilter.value = "";
    yearFilter.value = "";
    sortFilter.value = "";
    filters = { genre: "", year: "", sort: "" };
    clearBtn.classList.remove("show");
    trendingSection.style.display = "block";
    sectionTitle.textContent = "🎬 Discover Movies";
    loadMovies();
}

// ─── Carousel ──────────────────────────────────────────────
function scrollCarousel(dir) {
    trendingEl.scrollBy({ left: dir === "prev" ? -320 : 320, behavior: "smooth" });
}

// ─── Theme Toggle ──────────────────────────────────────────
const themeToggle = $("themeToggle");
const saved = localStorage.getItem("streamverse-theme");
if (saved === "light") document.documentElement.setAttribute("data-theme", "light");

themeToggle.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("streamverse-theme", "dark");
    } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("streamverse-theme", "light");
    }
});

// ─── Event Listeners ───────────────────────────────────────
searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => handleSearch(e.target.value), 500);
});
genreFilter.addEventListener("change", handleFilterChange);
yearFilter.addEventListener("change", handleFilterChange);
sortFilter.addEventListener("change", handleFilterChange);
clearBtn.addEventListener("click", clearAll);
$("trendingPrev").addEventListener("click", () => scrollCarousel("prev"));
$("trendingNext").addEventListener("click", () => scrollCarousel("next"));

// ─── Init ──────────────────────────────────────────────────
(async function init() {
    await loadGenres();
    setupYearFilter();
    await loadTrending();
    await loadMovies();
})();