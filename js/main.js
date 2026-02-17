let currentPage = 'home';

async function initApp() {
    initCursor();
    updateFavoritesCount();
    updateWatchlistCount();
    auth.syncUserData();
    await loadHomePage();
    setupNavigation();
    setupSearch();
    setupModals();
}

async function loadHomePage() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loader"></div>';
    
    try {
        const popularRow = new MovieRow('Популярное сейчас', 
            (params) => movieAPI.getPopularMovies(params.page));
        const nowPlayingRow = new MovieRow('Сейчас в кино', 
            (params) => movieAPI.getNowPlaying(params.page));
        const topRatedRow = new MovieRow('С высоким рейтингом', 
            (params) => movieAPI.getTopRated(params.page));
        const tvShowsRow = new MovieRow('Популярные сериалы', 
            (params) => movieAPI.getPopularTVShows(params.page), { type: 'tv' });
        
        const popularEl = await popularRow.render();
        const nowPlayingEl = await nowPlayingRow.render();
        const topRatedEl = await topRatedRow.render();
        const tvShowsEl = await tvShowsRow.render();
        
        app.innerHTML = `
            <div class="movie-rows">
                ${popularEl.outerHTML}
                ${nowPlayingEl.outerHTML}
                ${topRatedEl.outerHTML}
                ${tvShowsEl.outerHTML}
            </div>
        `;
    } catch (error) {
        app.innerHTML = '<div class="error">Ошибка загрузки данных</div>';
    }
}

async function loadMoviesPage() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loader"></div>';
    
    try {
        const trendingRow = new MovieRow('В тренде сегодня', 
            (params) => movieAPI.getTrending('movie', 'day'));
        const upcomingRow = new MovieRow('Скоро в кино', 
            (params) => movieAPI.getUpcoming());
        const nowPlayingRow = new MovieRow('Сейчас в прокате', 
            (params) => movieAPI.getNowPlaying(params.page));
        const popularRow = new MovieRow('Популярные фильмы', 
            (params) => movieAPI.getPopularMovies(params.page));
        const topRatedRow = new MovieRow('Лучшие фильмы', 
            (params) => movieAPI.getTopRated(params.page));
        
        const trendingEl = await trendingRow.render();
        const upcomingEl = await upcomingRow.render();
        const nowPlayingEl = await nowPlayingRow.render();
        const popularEl = await popularRow.render();
        const topRatedEl = await topRatedRow.render();
        
        app.innerHTML = `
            <div class="movie-rows">
                ${trendingEl.outerHTML}
                ${upcomingEl.outerHTML}
                ${nowPlayingEl.outerHTML}
                ${popularEl.outerHTML}
                ${topRatedEl.outerHTML}
            </div>
        `;
    } catch (error) {
        app.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

async function loadTVPage() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loader"></div>';
    
    try {
        const trendingRow = new MovieRow('Сериалы в тренде', 
            (params) => movieAPI.getTrending('tv', 'day'), { type: 'tv' });
        const airingTodayRow = new MovieRow('Сейчас в эфире', 
            (params) => movieAPI.getAiringToday(), { type: 'tv' });
        const popularRow = new MovieRow('Популярные сериалы', 
            (params) => movieAPI.getPopularTVShows(params.page), { type: 'tv' });
        const topRatedRow = new MovieRow('Лучшие сериалы', 
            (params) => movieAPI.fetch('/tv/top_rated', params), { type: 'tv' });
        
        const trendingEl = await trendingRow.render();
        const airingTodayEl = await airingTodayRow.render();
        const popularEl = await popularRow.render();
        const topRatedEl = await topRatedRow.render();
        
        app.innerHTML = `
            <div class="movie-rows">
                ${trendingEl.outerHTML}
                ${airingTodayEl.outerHTML}
                ${popularEl.outerHTML}
                ${topRatedEl.outerHTML}
            </div>
        `;
    } catch (error) {
        app.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

function loadFavoritesPage() {
    const app = document.getElementById('app');
    const favorites = storage.getFavorites();
    
    if (favorites.length === 0) {
        app.innerHTML = `
            <div class="container page-container">
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h2>В избранном пока пусто</h2>
                    <p>Добавляйте фильмы, чтобы они появились здесь</p>
                    <button class="btn btn-primary" onclick="loadHomePage()">
                        <i class="fas fa-film"></i> Перейти к фильмам
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    app.innerHTML = `
        <div class="container page-container">
            <h1 class="page-title">Избранное</h1>
            <div class="movies-grid">
                ${favorites.map(item => {
                    const card = new MovieCard(item, item.type);
                    return card.render().outerHTML;
                }).join('')}
            </div>
        </div>
    `;
}

function loadWatchlistPage() {
    const app = document.getElementById('app');
    const watchlist = storage.getWatchlist();
    
    if (watchlist.length === 0) {
        app.innerHTML = `
            <div class="container page-container">
                <div class="empty-state">
                    <i class="fas fa-bookmark"></i>
                    <h2>Список пуст</h2>
                    <p>Добавляйте фильмы, чтобы не забыть их посмотреть</p>
                    <button class="btn btn-primary" onclick="loadHomePage()">
                        <i class="fas fa-film"></i> Перейти к фильмам
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    app.innerHTML = `
        <div class="container page-container">
            <h1 class="page-title">Смотреть позже</h1>
            <div class="movies-grid">
                ${watchlist.map(item => {
                    const card = new MovieCard(item, item.type);
                    return card.render().outerHTML;
                }).join('')}
            </div>
        </div>
    `;
}

function loadHistoryPage() {
    const app = document.getElementById('app');
    const history = storage.getHistory();
    
    if (history.length === 0) {
        app.innerHTML = `
            <div class="container page-container">
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h2>История просмотров пуста</h2>
                    <p>Начните смотреть фильмы, чтобы они появились здесь</p>
                    <button class="btn btn-primary" onclick="loadHomePage()">
                        <i class="fas fa-film"></i> Перейти к фильмам
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    app.innerHTML = `
        <div class="container page-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
                <h1 class="page-title">История просмотров</h1>
                <button class="btn btn-secondary" onclick="storage.clearHistory(); loadHistoryPage();">
                    <i class="fas fa-trash"></i> Очистить
                </button>
            </div>
            <div class="movies-grid">
                ${history.map(item => {
                    const card = new MovieCard(item, item.type);
                    return card.render().outerHTML;
                }).join('')}
            </div>
        </div>
    `;
}

function setupNavigation() {
    document.querySelectorAll('.navbar__menu a').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            document.querySelectorAll('.navbar__menu a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const page = link.dataset.page;
            currentPage = page;
            
            switch(page) {
                case 'home': await loadHomePage(); break;
                case 'movies': await loadMoviesPage(); break;
                case 'tv': await loadTVPage(); break;
                case 'favorites': loadFavoritesPage(); break;
                case 'watchlist': loadWatchlistPage(); break;
                case 'history': loadHistoryPage(); break;
                default: await loadHomePage();
            }
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('globalSearch');
    const suggestions = document.getElementById('searchSuggestions');
    
    const debouncedSearch = debounce(async (query) => {
        if (query.length < 2) {
            suggestions.classList.remove('active');
            return;
        }
        
        try {
            const results = await movieAPI.search(query);
            if (results.results && results.results.length > 0) {
                suggestions.innerHTML = results.results.slice(0, 5).map(item => {
                    const title = item.title || item.name;
                    const year = (item.release_date || item.first_air_date || '').split('-')[0];
                    const poster = movieAPI.getPosterUrl(item.poster_path, 'w92');
                    const mediaType = item.media_type === 'tv' ? 'Сериал' : 'Фильм';
                    return `
                        <div class="search-suggestion-item" data-id="${item.id}" data-type="${item.media_type}">
                            <img src="${poster}" alt="${title}">
                            <div>
                                <div>${title}</div>
                                <small style="color: var(--text-secondary);">${year}  ${mediaType}</small>
                            </div>
                        </div>
                    `;
                }).join('');
                suggestions.classList.add('active');
                
                suggestions.querySelectorAll('.search-suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        openMovieModal(item.dataset.id, item.dataset.type || 'movie');
                        suggestions.classList.remove('active');
                        searchInput.value = '';
                    });
                });
            } else {
                suggestions.classList.remove('active');
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);
    
    searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
    
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.remove('active');
        }
    });
}

function setupModals() {
    const movieModal = document.getElementById('movieModal');
    const authModal = document.getElementById('authModal');
    const ratingModal = document.getElementById('ratingModal');
    const commentsModal = document.getElementById('commentsModal');
    
    movieModal.querySelector('.modal__close').addEventListener('click', closeModal);
    movieModal.querySelector('.modal__overlay').addEventListener('click', closeModal);
    
    authModal.querySelector('.modal__close').addEventListener('click', closeAuthModal);
    authModal.querySelector('.modal__overlay').addEventListener('click', closeAuthModal);
    
    ratingModal.querySelector('.modal__close').addEventListener('click', closeRatingModal);
    ratingModal.querySelector('.modal__overlay').addEventListener('click', closeRatingModal);
    
    commentsModal.querySelector('.modal__close').addEventListener('click', closeCommentsModal);
    commentsModal.querySelector('.modal__overlay').addEventListener('click', closeCommentsModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeAuthModal();
            closeRatingModal();
            closeCommentsModal();
        }
    });
}

document.addEventListener('DOMContentLoaded', initApp);
