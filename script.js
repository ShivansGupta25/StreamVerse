class MovieExploarer{
    constructor(){
        this.API_KEY=bee82d8ebed4a5cc44c9ed148ffc4b0e
        this.BASE_URL="https://api.themoviedb.org/3"
        this.IMAGE_BASE_URL="https://iamge.tmdb.org/t/p/w500"
       this.FALLBACK_IMAGE='data:image/ svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwliBoZWInaHQ9IjMwMCIgdmlld0JveD0iMCAwIDI4MCAzMDAiIGZpbGw9|m5vbmUi|HhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0|HdpZHRoPSIyODAiIGhlaWdodDOiMzAwliBmaWxsPS|jMzMzli8+Cjx0ZXh0IHg9|jE0MC|geT0iMTUwliBmaWxsPSljNjY2liB0Zxh0LWFuY2hvcj0ibWIkZGxlIiBkeT0iLjNIbSI+Tm8gSW1hZ2U8L3RIeHQ+Cjwvc3ZnPg==';
        this.isSearching=false
        this.currentFilters = {
        genre:'',
        year:'',
        sort:''
        }

        this.init()

    }

    async init(){
        await this.loadTrendingMovie()
    }

    setupEventListeners(){
        const searchInput=document.getElementById("searchInput")
        const genreFliter=document.getElementById("genreFliter")
        const yearFliter=document.getElementById("yearFliter")
        const sortFliter=document.getElementById("sortFliter")
        const clearBtn=document.getElementById("clearBtn")
        const trendingPrev=document.getElementById("trendingPrev")
        const trendingNext=document.getElementById("trendingNext")

        let searchTimeout;
        searchInput.addEventListener("input",(e)=>{
            clearTimeout(searchTimeout);
            searchTimeout=setTimeout(()=>{
                this.handleSearch(e.target.value)
            },500)
        })

        genreFliter.addEventListener("change",()=>this.handleFilterChange())
        yearFliter.addEventListener("change",()=>this.handleFilterChange())
        sortFliter.addEventListener("change",()=>this.handleFilterChange())
        clearBtn.addEventListener("change",()=>this.clearAllFilters())
        trendingPrev.addEventListener("change",()=>this.scrollCarousel('prev'))
        trendingNext.addEventListener("change",()=>this.scrollCarousel('next'))

    }

    async loadTrendingMovie(){
        try{
            const response = await fetch(`${this.BASE_URL}/trending/movie/week?
            api_key=${this.API_KEY}`)
            const data = await response.json()
            console.log(data)

            const trendingMovies = data.results.slice(0,10)
            this.displayTredingMovies(trendingMovies)

        }catch(error){
            console.error("Error loading trending movies:",error)
            document.getElementById("trendingCarousel").innerHTML = '<div class="error">Failed to load trending movies</div>'

        }
    }


    displayTredingMovies(movies){
        const carousel = document.getElementById("trendingCarousel")
        carousel.innerHTML=movies.map((movies,index)=> this.createTrendingCard(movies,index+1)).join("")

    }


    createTrendingCard(movie,rank){
        const posterPath=movie.poster_path ? `${this.IMAGE_BASE_URL}${movie.poster_path}` : this.FALLBACK_IMAGE

        const rating= movie.vote_average ? movie.vote_average.toFixed(1): "N/A"

        const year = movie.release_date ? new Date(movie.release_date).getFullYear():"To Be Announced"

        const genres = movie.genre_ids ? movie.genres_ids.slice(0,2).mmap(id=>this.genres[id].filter(Boolean).join(',')):"N/A"

        return ` //////////////////////////////////////////////////////// INNER HTML
        <div class="trending-card">
        <img src="${posterPath}" alt="${movie.title}" class="movie-poster"
            loading="lazy"
            onerror="this.src='${this.FALLBACK_IMAGE}'">

        <div class="trending-rank">${rank}</div>

        <div class="trending-overlay">
            <div class="trending-title">${movie.title}</div>

            <div class="trending-details">
            <span class="trending-year">${year}</span>
            <span class="trending-rating">⭐ ${rating}</span>
            </div>

            <div class="trending-genres">${genres}</div>
        </div>
        </div>
    `;
    }

    async handleSearch(query){
        const trimedQuery = query.trim()
        const clearBtn=document.getElementById("clearBtn")
        const sectionTitle=document.getElementById("randomSectionTitle")
        const trendingSection = document.getElementById("trendingSection")

        if(trimedQuery===""){
            this.
        }

    }



}


document.addEventListener("DOMContentLoaded",()=>{
    const app = new MovieExploarer()
})