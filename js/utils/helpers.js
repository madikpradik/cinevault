function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

function formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}мин`;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return `
        ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
        ${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
        ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
    `;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateFavoritesCount() {
    const count = storage.getFavorites().length;
    const badge = document.getElementById('favoritesCount');
    if (badge) badge.textContent = count;
}

function updateWatchlistCount() {
    const count = storage.getWatchlist().length;
    const badge = document.getElementById('watchlistCount');
    if (badge) badge.textContent = count;
}

function initCursor() {
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    if (!cursor || !follower) return;
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        follower.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
    
    document.querySelectorAll('a, button, .movie-card').forEach(el => {
        el.addEventListener('mouseenter', () => {
            follower.style.transform += ' scale(1.5)';
            follower.style.opacity = '0.5';
        });
        el.addEventListener('mouseleave', () => {
            follower.style.transform = follower.style.transform.replace(' scale(1.5)', '');
            follower.style.opacity = '1';
        });
    });
}

async function openMovieModal(id, type = 'movie') {
    const modal = document.getElementById('movieModal');
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = '<div class="loader"></div>';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    try {
        const details = type === 'movie' 
            ? await movieAPI.getMovieDetails(id)
            : await movieAPI.getTVDetails(id);
        modalContent.innerHTML = renderMovieDetail(details, type);
    } catch (error) {
        modalContent.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

function closeModal() {
    const modal = document.getElementById('movieModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function closeCommentsModal() {
    const modal = document.getElementById('commentsModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function renderMovieDetail(movie, type) {
    const title = movie.title || movie.name;
    const year = (movie.release_date || movie.first_air_date || '').split('-')[0];
    const genres = movie.genres || [];
    const videos = movieAPI.getVideos(movie.videos);
    const trailer = videos[0];
    const similar = movie.similar?.results || movie.recommendations?.results || [];
    const userRating = storage.getUserRating(movie.id, type);
    
    return `
        <div class="movie-detail">
            <div class="movie-detail__header">
                <div class="movie-detail__poster">
                    <img src="${movieAPI.getPosterUrl(movie.poster_path, 'w500')}" alt="${title}">
                </div>
                <div class="movie-detail__info">
                    <h1 class="movie-detail__title">${title} <span style="color: var(--text-secondary)">(${year})</span></h1>
                    
                    <div class="movie-detail__meta">
                        <span><i class="far fa-calendar"></i> ${formatDate(movie.release_date || movie.first_air_date)}</span>
                        <span><i class="far fa-clock"></i> ${formatRuntime(movie.runtime)}</span>
                        <span><i class="fas fa-globe"></i> ${movie.original_language?.toUpperCase()}</span>
                    </div>
                    
                    <div class="movie-detail__rating">
                        <div class="movie-detail__stars">
                            ${generateStars(movie.vote_average / 2)}
                        </div>
                        <span>${movie.vote_average?.toFixed(1)}/10 (${movie.vote_count} оценок)</span>
                    </div>
                    
                    ${userRating > 0 ? `
                        <div class="movie-detail__user-rating">
                            <i class="fas fa-star" style="color: #ffd700;"></i>
                            <span>Ваша оценка: <strong>${userRating}/10</strong></span>
                        </div>
                    ` : ''}
                    
                    <div class="movie-detail__genres">
                        ${genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('')}
                    </div>
                    
                    <p class="movie-detail__overview">${movie.overview || 'Описание отсутствует'}</p>
                    
                    <div class="movie-detail__actions">
                        ${trailer ? `
                            <button class="btn btn-primary" onclick="window.open('${trailer.url}', '_blank')">
                                <i class="fas fa-play"></i> Смотреть трейлер
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="showCommentsModal('${movie.id}', '${type}')">
                            <i class="fas fa-comment"></i> Комментарии
                        </button>
                    </div>
                </div>
            </div>
            
            ${similar.length > 0 ? `
                <div class="similar-movies">
                    <h3>Похожие фильмы</h3>
                    <div class="row-content" style="display: flex; gap: 20px; overflow-x: auto; padding: 20px 0;">
                        ${similar.slice(0, 10).map(m => {
                            const card = new MovieCard(m, type);
                            return card.render().outerHTML;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

async function showCommentsModal(id, type) {
    const modal = document.getElementById('commentsModal');
    const content = document.getElementById('commentsContent');
    const movie = await movieAPI.getMovieDetails(id);
    const title = movie.title || movie.name;
    const comments = storage.getComments(id, type);
    
    content.innerHTML = `
        <div class="comments-modal">
            <h2>Комментарии</h2>
            <p class="comments-movie-title">${title}</p>
            
            ${auth.isAuthenticated() ? `
                <div class="comment-form">
                    <textarea id="commentText" placeholder="Напишите комментарий..." rows="3"></textarea>
                    <button class="btn btn-primary" onclick="addComment('${id}', '${type}')">
                        <i class="fas fa-paper-plane"></i> Отправить
                    </button>
                </div>
            ` : `
                <div class="comment-login-prompt">
                    <p>Чтобы оставлять комментарии, <a onclick="showAuthModal(); return false;">войдите</a></p>
                </div>
            `}
            
            <div class="comments-list">
                ${comments.length === 0 ? `
                    <p class="no-comments">Пока нет комментариев. Будьте первым!</p>
                ` : comments.sort((a,b) => b.timestamp - a.timestamp).map(comment => `
                    <div class="comment" id="comment-${comment.id}">
                        <div class="comment-avatar">
                            <img src="${comment.userAvatar}" alt="${comment.userName}">
                        </div>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-author">${comment.userName}</span>
                                <span class="comment-date">${new Date(comment.timestamp).toLocaleString()}</span>
                            </div>
                            <div class="comment-text">${comment.text}</div>
                            <div class="comment-actions">
                                <button class="comment-action like-btn" onclick="likeComment('${id}', '${type}', '${comment.id}')">
                                    <i class="fas fa-heart"></i>
                                    <span>${comment.likes || 0}</span>
                                </button>
                                ${auth.isAuthenticated() && auth.getCurrentUser().id === comment.userId ? `
                                    <button class="comment-action delete-btn" onclick="deleteComment('${id}', '${type}', '${comment.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function addComment(id, type) {
    const text = document.getElementById('commentText').value.trim();
    if (text) {
        storage.addComment(id, type, text);
        showCommentsModal(id, type);
    }
}

function likeComment(id, type, commentId) {
    storage.likeComment(id, type, commentId);
    showCommentsModal(id, type);
}

function deleteComment(id, type, commentId) {
    storage.deleteComment(id, type, commentId);
    showCommentsModal(id, type);
}
