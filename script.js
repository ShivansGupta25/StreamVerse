class MovieExplorer {
    constructor() {
        this.API_KEY = "bee82d8ebed4a5cc44c9ed148ffc4b0e";
        this.BASE_URL = "https://api.themoviedb.org/3";
        this.IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
        this.FALLBACK_IMAGE =
            'data:image/svg+xml,' +
            encodeURIComponent(
                '<svg width="280" height="420" viewBox="0 0 280 420" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<rect width="280" height="420" rx="12" fill="#1a1a2e"/>' +
                '<circle cx="140" cy="180" r="40" stroke="#444" stroke-width="2" fill="none"/>' +
                '<path d="M130 168 l25 12 -25 12 z" fill="#444"/>' +
                '<text x="140" y="260" fill="#555" text-anchor="middle" font-size="14" font-family="Inter, sans-serif">No Image Available</text>' +
                '</svg>'
            );

        this.isSearching = false;
        this.currentFilters = {
            genre: '',
            year: '',
            sort: ''
        };

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadGenres();
        this.setupYearFilter();
        await this.loadTrendingMovies();
        await this.loadRandomMovies();
    }

    setupEventListeners() {
        const searchInput = document.getElementById("searchInput");
        const genreFilter = document.getElementById("genreFilter");
        const yearFilter = document.getElementById("yearFilter");
        const sortFilter = document.getElementById("sortFilter");
        const clearBtn = document.getElementById("clearBtn");
        const trendingPrev = document.getElementById("trendingPrev");
        const trendingNext = document.getElementById("trendingNext");

        let searchTimeout;
        searchInput.addEventListener("input", (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 500);
        });

        genreFilter.addEventListener("change", () => this.handleFilterChange());
        yearFilter.addEventListener("change", () => this.handleFilterChange());
        sortFilter.addEventListener("change", () => this.handleFilterChange());
        clearBtn.addEventListener("click", () => this.clearAllFilters());
        trendingPrev.addEventListener("click", () => this.scrollCarousel('prev'));
        trendingNext.addEventListener("click", () => this.scrollCarousel('next'));
    }

    ////////////////////////////////////// Genre Loader ///////////////////////////////////
    async loadGenres() {
        try {
            const response = await fetch(
                `${this.BASE_URL}/genre/movie/list?api_key=${this.API_KEY}`
            );
            const data = await response.json();
            this.genres = data.genres.reduce((acc, genre) => {
                acc[genre.id] = genre.name;
                return acc;
            }, {});

            const genreSelect = document.getElementById("genreFilter");
            data.genres.forEach(genre => {
                const option = document.createElement("option");
                option.value = genre.id;
                option.textContent = genre.name;
                genreSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading genres:", error);
        }
    }

    ////////////////////////////////////// Year Filter Setup ///////////////////////////////////
    setupYearFilter() {
        const yearSelect = document.getElementById("yearFilter");
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 1970; year--) {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }

    ////////////////////////////////////// Trending Movies /////////////////////////////////// 
    async loadTrendingMovies() {
        try {
            const response = await fetch(
                `${this.BASE_URL}/trending/movie/week?api_key=${this.API_KEY}`
            );
            const data = await response.json();

            const trendingMovies = data.results.slice(0, 10);
            this.displayTrendingMovies(trendingMovies);
        } catch (error) {
            console.error("Error loading trending movies:", error);
            document.getElementById("trendingCarousel").innerHTML =
                '<div class="error">Failed to load trending movies. Please try again later.</div>';
        }
    }

    displayTrendingMovies(movies) {
        const carousel = document.getElementById("trendingCarousel");
        carousel.innerHTML = movies
            .map((movie, index) => this.createTrendingCard(movie, index + 1))
            .join("");
    }

    createTrendingCard(movie, rank) {
        const posterPath = movie.poster_path
            ? `${this.IMAGE_BASE_URL}${movie.poster_path}`
            : this.FALLBACK_IMAGE;
        const rating = movie.vote_average
            ? movie.vote_average.toFixed(1)
            : "N/A";
        const year = movie.release_date
            ? new Date(movie.release_date).getFullYear()
            : "TBA";
        const genres = movie.genre_ids
            ? movie.genre_ids
                .slice(0, 2)
                .map(id => this.genres[id])
                .filter(Boolean)
                .join(", ")
            : "N/A";

        return `
        <div class="trending-card">
            <img src="${posterPath}" alt="${movie.title}" class="trending-poster"
                loading="lazy"
                onerror="this.src='${this.FALLBACK_IMAGE}'">
            <div class="trending-rank">#${rank}</div>
            <div class="trending-overlay">
                <div class="trending-title">${movie.title}</div>
                <div class="trending-details">
                    <span class="trending-year">${year}</span>
                    <span class="trending-rating">⭐ ${rating}</span>
                </div>
                <div class="trending-genres">${genres}</div>
            </div>
        </div>`;
    }

    ////////////////////////////////////// Discover Random Movies ///////////////////////////////////
    async loadRandomMovies() {
        try {
            const randomPage = Math.floor(Math.random() * 10) + 1;
            let url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${randomPage}`;
            if (this.currentFilters.sort) {
                url += `&sort_by=${this.currentFilters.sort}`;
            }
            if (this.currentFilters.genre) {
                url += `&with_genres=${this.currentFilters.genre}`;
            }
            const response = await fetch(url);
            const data = await response.json();

            this.displayMovies(data.results, "moviesGrid");
        } catch (error) {
            console.error("Error loading random movies:", error);
            document.getElementById("moviesGrid").innerHTML =
                '<div class="error">Failed to load movies. Please try again later.</div>';
        }
    }

    ////////////////////////////////////// Movie Grid Display ///////////////////////////////////
    displayMovies(movies, containerId) {
        const container = document.getElementById(containerId);
        if (!movies || movies.length === 0) {
            container.innerHTML =
                '<div class="no-results"><span class="no-results-icon">🎞️</span><p>No movies found matching your criteria.</p></div>';
            return;
        }
        container.innerHTML = movies.map(movie => this.createMovieCard(movie)).join("");
    }

    createMovieCard(movie) {
        const posterPath = movie.poster_path
            ? `${this.IMAGE_BASE_URL}${movie.poster_path}`
            : this.FALLBACK_IMAGE;
        const rating = movie.vote_average
            ? movie.vote_average.toFixed(1)
            : "N/A";
        const year = movie.release_date
            ? new Date(movie.release_date).getFullYear()
            : "TBA";
        const description = movie.overview
            ? movie.overview.length > 120
                ? movie.overview.substring(0, 120) + "…"
                : movie.overview
            : "No description available.";
        const genres = movie.genre_ids
            ? movie.genre_ids
                .slice(0, 2)
                .map(id => this.genres[id])
                .filter(Boolean)
                .join(", ")
            : "N/A";

        const ratingClass =
            rating >= 7 ? "rating-high" : rating >= 5 ? "rating-mid" : "rating-low";

        return `
        <div class="movie-card">
            <div class="movie-poster-wrap">
                <img src="${posterPath}" alt="${movie.title}" class="movie-poster"
                    loading="lazy"
                    onerror="this.src='${this.FALLBACK_IMAGE}'">
                <div class="movie-rating-badge ${ratingClass}">⭐ ${rating}</div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span class="movie-year">${year}</span>
                    <span class="movie-genres">${genres}</span>
                </div>
                <p class="movie-description">${description}</p>
            </div>
        </div>`;
    }

    ////////////////////////////////////// Search ///////////////////////////////////
    async handleSearch(query) {
        const trimmedQuery = query.trim();
        const clearBtn = document.getElementById("clearBtn");
        const sectionTitle = document.getElementById("randomSectionTitle");
        const trendingSection = document.getElementById("trendingSection");

        if (trimmedQuery === "") {
            this.isSearching = false;
            clearBtn.classList.remove("show");
            sectionTitle.textContent = "🎬 Discover Movies";
            trendingSection.style.display = "block";
            await this.loadRandomMovies();
            return;
        }

        this.isSearching = true;
        clearBtn.classList.add("show");
        sectionTitle.textContent = `🔍 Search Results for "${trimmedQuery}"`;
        trendingSection.style.display = "none";

        try {
            document.getElementById("moviesGrid").innerHTML =
                '<div class="loading"><div class="spinner"></div>Searching movies...</div>';

            let url = `${this.BASE_URL}/search/movie?api_key=${this.API_KEY}&query=${encodeURIComponent(trimmedQuery)}&page=1`;
            if (this.currentFilters.year) {
                url += `&primary_release_year=${this.currentFilters.year}`;
            }
            const response = await fetch(url);
            const data = await response.json();

            let results = data.results;

            if (this.currentFilters.genre) {
                results = results.filter(
                    movie =>
                        movie.genre_ids &&
                        movie.genre_ids.includes(parseInt(this.currentFilters.genre))
                );
            }
            if (this.currentFilters.sort) {
                results = this.sortMovies(results, this.currentFilters.sort);
            }

            this.displayMovies(results, "moviesGrid");
        } catch (error) {
            console.error("Error searching movies:", error);
            document.getElementById("moviesGrid").innerHTML =
                '<div class="error">Failed to load search results. Please try again.</div>';
        }
    }

    // ///////////////////////////////////Sorting  ///////////////////////////////////
    sortMovies(movies, sortBy) {
        const sorted = [...movies];
        switch (sortBy) {
            case "popularity.desc":
                return sorted.sort((a, b) => b.popularity - a.popularity);
            case "popularity.asc":
                return sorted.sort((a, b) => a.popularity - b.popularity);
            case "release_date.desc":
                return sorted.sort(
                    (a, b) => new Date(b.release_date) - new Date(a.release_date)
                );
            case "release_date.asc":
                return sorted.sort(
                    (a, b) => new Date(a.release_date) - new Date(b.release_date)
                );
            case "vote_average.desc":
                return sorted.sort((a, b) => b.vote_average - a.vote_average);
            case "vote_average.asc":
                return sorted.sort((a, b) => a.vote_average - b.vote_average);
            default:
                return sorted;
        }
    }

    ////////////////////////////////////// Filters ///////////////////////////////////
    async handleFilterChange() {
        const genreFilter = document.getElementById("genreFilter");
        const searchInput = document.getElementById("searchInput");
        const yearFilter = document.getElementById("yearFilter");
        const sortFilter = document.getElementById("sortFilter");
        const clearBtn = document.getElementById("clearBtn");
        const trendingSection = document.getElementById("trendingSection");

        this.currentFilters.genre = genreFilter.value;
        this.currentFilters.year = yearFilter.value;
        this.currentFilters.sort = sortFilter.value;

        if (this.currentFilters.genre || this.currentFilters.year || this.currentFilters.sort) {
            clearBtn.classList.add("show");
        } else {
            clearBtn.classList.remove("show");
        }

        if (searchInput.value.trim()) {
            trendingSection.style.display = "none";
            await this.handleSearch(searchInput.value.trim());
        } else {
            if (this.currentFilters.genre || this.currentFilters.year || this.currentFilters.sort) {
                trendingSection.style.display = "none";
                document.getElementById("randomSectionTitle").textContent =
                    "🎬 Filtered Movies";
            } else {
                trendingSection.style.display = "block";
                document.getElementById("randomSectionTitle").textContent =
                    "🎬 Discover Movies";
            }
            await this.loadFilteredMovies();
        }
    }

    async loadFilteredMovies() {
        try {
            document.getElementById("moviesGrid").innerHTML =
                '<div class="loading"><div class="spinner"></div>Loading movies...</div>';

            let url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=1`;
            if (this.currentFilters.sort) {
                url += `&sort_by=${this.currentFilters.sort}`;
            }
            if (this.currentFilters.genre) {
                url += `&with_genres=${this.currentFilters.genre}`;
            }
            if (this.currentFilters.year) {
                url += `&primary_release_year=${this.currentFilters.year}`;
            }
            const response = await fetch(url);
            const data = await response.json();

            this.displayMovies(data.results, "moviesGrid");
        } catch (error) {
            console.error("Error loading filtered movies:", error);
            document.getElementById("moviesGrid").innerHTML =
                '<div class="error">Failed to load movies. Please try again.</div>';
        }
    }

    ////////////////////////////////////// Clear Filters ///////////////////////////////////
    clearAllFilters() {
        const trendingSection = document.getElementById("trendingSection");
        document.getElementById("searchInput").value = "";
        document.getElementById("genreFilter").value = "";
        document.getElementById("yearFilter").value = "";
        document.getElementById("sortFilter").value = "";
        this.currentFilters = { genre: '', year: '', sort: '' };
        document.getElementById("clearBtn").classList.remove("show");
        trendingSection.style.display = "block";
        document.getElementById("randomSectionTitle").textContent =
            "🎬 Discover Movies";
        this.isSearching = false;
        this.loadRandomMovies();
    }

    ////////////////////////////////////// Carousel Scroll ///////////////////////////////////
    scrollCarousel(direction) {
        const carousel = document.getElementById("trendingCarousel");
        const scrollAmount = 320;
        if (direction === 'prev') {
            carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }
}

// ////////////////////////////////////// Initialize ///////////////////////////////////
document.addEventListener("DOMContentLoaded", () => {
    new MovieExplorer();
});