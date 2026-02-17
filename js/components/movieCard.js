class MovieCard {
    constructor(movie, type = 'movie') {
        this.movie = movie;
        this.type = type;
    }

    render() {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.id = this.movie.id;
        card.dataset.type = this.type;

        const poster = movieAPI.getPosterUrl(this.movie.poster_path, 'w342');
        const title = this.movie.title || this.movie.name;
        const year = (this.movie.release_date || this.movie.first_air_date || '').split('-')[0] || 'N/A';
        const rating = (this.movie.vote_average || 0).toFixed(1);
        const isFavorite = storage.isFavorite(this.movie.id, this.type);
        const isInWatchlist = storage.isInWatchlist(this.movie.id, this.type);
        const userRating = storage.getUserRating(this.movie.id, this.type);

        card.innerHTML = `
            <img src="${poster}" alt="${title}" class="movie-card__poster" loading="lazy">
            <div class="movie-card__overlay">
                <h4 class="movie-card__title">${title}</h4>
                <div class="movie-card__year">${year}</div>
                <div class="movie-card__rating">
                    <i class="fas fa-star"></i>
                    <span>${rating}</span>
                </div>
                ${userRating > 0 ? `
                    <div class="movie-card__user-rating" title="Ваша оценка">
                        <i class="fas fa-star" style="color: #ffd700;"></i>
                        <span>${userRating}</span>
                    </div>
                ` : ''}
                <div class="movie-card__actions">
                    <button class="movie-card__btn favorite-btn ${isFavorite ? 'active' : ''}" title="В избранное">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="movie-card__btn watchlist-btn ${isInWatchlist ? 'active' : ''}" title="Смотреть позже">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    <button class="movie-card__btn rating-btn" title="Оценить">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="movie-card__btn info-btn" title="Подробнее">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        `;

        this.attachEvents(card);
        return card;
    }

    attachEvents(card) {
        const favoriteBtn = card.querySelector('.favorite-btn');
        const watchlistBtn = card.querySelector('.watchlist-btn');
        const ratingBtn = card.querySelector('.rating-btn');
        const infoBtn = card.querySelector('.info-btn');
        
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(card);
        });

        watchlistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleWatchlist(card);
        });

        ratingBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showRatingModal();
        });

        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDetails();
        });

        card.addEventListener('click', () => {
            this.showDetails();
        });
    }

    toggleFavorite(card) {
        const btn = card.querySelector('.favorite-btn');
        const isActive = btn.classList.contains('active');
        
        if (isActive) {
            storage.removeFavorite(this.movie.id, this.type);
            btn.classList.remove('active');
            showToast('Удалено из избранного', 'info');
        } else {
            if (!auth.isAuthenticated()) {
                showToast('Войдите, чтобы добавлять в избранное', 'warning');
                showAuthModal();
                return;
            }
            storage.addFavorite({
                id: this.movie.id,
                title: this.movie.title || this.movie.name,
                poster_path: this.movie.poster_path,
                type: this.type
            });
            btn.classList.add('active');
            showToast('Добавлено в избранное', 'success');
        }
        updateFavoritesCount();
    }

    toggleWatchlist(card) {
        const btn = card.querySelector('.watchlist-btn');
        const isActive = btn.classList.contains('active');
        
        if (isActive) {
            storage.removeFromWatchlist(this.movie.id, this.type);
            btn.classList.remove('active');
            showToast('Удалено из списка "Смотреть позже"', 'info');
        } else {
            if (!auth.isAuthenticated()) {
                showToast('Войдите, чтобы добавлять в список', 'warning');
                showAuthModal();
                return;
            }
            storage.addToWatchlist({
                id: this.movie.id,
                title: this.movie.title || this.movie.name,
                poster_path: this.movie.poster_path,
                type: this.type
            });
            btn.classList.add('active');
            showToast('Добавлено в список "Смотреть позже"', 'success');
        }
        updateWatchlistCount();
    }

    showRatingModal() {
        if (!auth.isAuthenticated()) {
            showToast('Войдите, чтобы оценивать фильмы', 'warning');
            showAuthModal();
            return;
        }

        const modal = document.getElementById('ratingModal');
        const content = document.getElementById('ratingContent');
        const title = this.movie.title || this.movie.name;
        const currentRating = storage.getUserRating(this.movie.id, this.type);
        
        content.innerHTML = `
            <div class="rating-modal">
                <h2>Оцените фильм</h2>
                <p class="rating-movie-title">${title}</p>
                
                <div class="rating-stars">
                    ${[1,2,3,4,5,6,7,8,9,10].map(num => `
                        <div class="rating-star ${currentRating >= num ? 'active' : ''}" data-rating="${num}">
                            <i class="fas fa-star"></i>
                            <span class="rating-value">${num}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="rating-actions">
                    ${currentRating > 0 ? `
                        <button class="btn btn-secondary" id="removeRatingBtn">
                            <i class="fas fa-trash"></i> Удалить оценку
                        </button>
                    ` : ''}
                    <button class="btn btn-primary" id="closeRatingBtn">
                        Закрыть
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            document.querySelectorAll('.rating-star').forEach(star => {
                star.addEventListener('click', (e) => {
                    const rating = e.currentTarget.dataset.rating;
                    storage.rateMovie(this.movie.id, this.type, parseInt(rating));
                    closeRatingModal();
                    const oldCard = document.querySelector(`.movie-card[data-id="${this.movie.id}"]`);
                    if (oldCard) {
                        const newCard = this.render();
                        oldCard.parentNode.replaceChild(newCard, oldCard);
                    }
                });
            });
            
            const removeBtn = document.getElementById('removeRatingBtn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    storage.removeRating(this.movie.id, this.type);
                    closeRatingModal();
                    const oldCard = document.querySelector(`.movie-card[data-id="${this.movie.id}"]`);
                    if (oldCard) {
                        const newCard = this.render();
                        oldCard.parentNode.replaceChild(newCard, oldCard);
                    }
                });
            }
            
            document.getElementById('closeRatingBtn').addEventListener('click', closeRatingModal);
        }, 100);
    }

    showDetails() {
        storage.addToHistory({
            id: this.movie.id,
            title: this.movie.title || this.movie.name,
            poster_path: this.movie.poster_path,
            type: this.type
        });
        openMovieModal(this.movie.id, this.type);
    }
}
