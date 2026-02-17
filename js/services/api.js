const CONFIG = {
    TMDB_API_KEY: '6f38760393103996db38e0ac9f45a2fd',
    TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p/',
    TMDB_BASE: 'https://api.themoviedb.org/3',
    YOUTUBE_BASE: 'https://www.youtube.com/embed/'
};

class MovieAPI {
    constructor() {
        this.cache = new Map();
        this.cacheTime = 5 * 60 * 1000;
    }

    async fetch(endpoint, params = {}) {
        const queryParams = new URLSearchParams({
            api_key: CONFIG.TMDB_API_KEY,
            language: 'ru-RU',
            ...params
        });

        const url = `${CONFIG.TMDB_BASE}${endpoint}?${queryParams}`;
        
        if (this.cache.has(url)) {
            const cached = this.cache.get(url);
            if (Date.now() - cached.timestamp < this.cacheTime) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ошибка загрузки');
            const data = await response.json();
            
            this.cache.set(url, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async getPopularMovies(page = 1) {
        return this.fetch('/movie/popular', { page });
    }

    async getPopularTVShows(page = 1) {
        return this.fetch('/tv/popular', { page });
    }

    async getNowPlaying(page = 1) {
        return this.fetch('/movie/now_playing', { page });
    }

    async getTopRated(page = 1) {
        return this.fetch('/movie/top_rated', { page });
    }

    async search(query, type = 'multi', page = 1) {
        return this.fetch('/search/' + type, { query, page });
    }

    async getMovieDetails(id) {
        return this.fetch(`/movie/${id}`, {
            append_to_response: 'videos,credits,similar,recommendations'
        });
    }

    async getTVDetails(id) {
        return this.fetch(`/tv/${id}`, {
            append_to_response: 'videos,credits,similar,recommendations'
        });
    }

    async getGenres(type = 'movie') {
        return this.fetch(`/genre/${type}/list`);
    }

    async discoverMovies(filters = {}) {
        return this.fetch('/discover/movie', filters);
    }

    async getTrending(type = 'all', time = 'day') {
        return this.fetch(`/trending/${type}/${time}`);
    }

    async getUpcoming() {
        return this.fetch('/movie/upcoming');
    }

    async getAiringToday() {
        return this.fetch('/tv/airing_today');
    }

    getVideos(videos) {
        if (!videos || !videos.results) return [];
        return videos.results
            .filter(video => video.site === 'YouTube' && video.type === 'Trailer')
            .map(video => ({
                ...video,
                url: CONFIG.YOUTUBE_BASE + video.key
            }));
    }

    getPosterUrl(path, size = 'w500') {
        if (!path) return 'https://via.placeholder.com/500x750?text=No+Poster';
        return `${CONFIG.TMDB_IMAGE_BASE}${size}${path}`;
    }

    getBackdropUrl(path, size = 'original') {
        if (!path) return 'https://via.placeholder.com/1920x1080?text=No+Backdrop';
        return `${CONFIG.TMDB_IMAGE_BASE}${size}${path}`;
    }
}

const movieAPI = new MovieAPI();
