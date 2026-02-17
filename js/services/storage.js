class StorageService {
    constructor() {
        this.favoritesKey = 'cinevault_favorites';
        this.watchlistKey = 'cinevault_watchlist';
        this.historyKey = 'cinevault_history';
        this.ratingsKey = 'cinevault_ratings';
        this.commentsKey = 'cinevault_comments';
        this.maxHistory = 50;
    }

    // ИЗБРАННОЕ
    getFavorites() {
        const favorites = localStorage.getItem(this.favoritesKey);
        return favorites ? JSON.parse(favorites) : [];
    }

    addFavorite(item, saveToUser = true) {
        const favorites = this.getFavorites();
        if (!favorites.some(fav => fav.id === item.id && fav.type === item.type)) {
            favorites.push({
                ...item,
                addedAt: Date.now()
            });
            localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
            this.emitChange('favorites', favorites);
            
            if (saveToUser && auth.isAuthenticated()) {
                const user = auth.getCurrentUser();
                user.favorites = favorites;
                auth.saveCurrentUser(user);
                auth.saveUsers();
            }
            return true;
        }
        return false;
    }

    removeFavorite(id, type) {
        const favorites = this.getFavorites();
        const filtered = favorites.filter(item => !(item.id === id && item.type === type));
        localStorage.setItem(this.favoritesKey, JSON.stringify(filtered));
        this.emitChange('favorites', filtered);
        
        if (auth.isAuthenticated()) {
            const user = auth.getCurrentUser();
            user.favorites = filtered;
            auth.saveCurrentUser(user);
            auth.saveUsers();
        }
    }

    isFavorite(id, type) {
        const favorites = this.getFavorites();
        return favorites.some(item => item.id === id && item.type === type);
    }

    // СМОТРЕТЬ ПОЗЖЕ
    getWatchlist() {
        const watchlist = localStorage.getItem(this.watchlistKey);
        return watchlist ? JSON.parse(watchlist) : [];
    }

    addToWatchlist(item, saveToUser = true) {
        const watchlist = this.getWatchlist();
        if (!watchlist.some(w => w.id === item.id && w.type === item.type)) {
            watchlist.push({
                ...item,
                addedAt: Date.now()
            });
            localStorage.setItem(this.watchlistKey, JSON.stringify(watchlist));
            this.emitChange('watchlist', watchlist);
            
            if (saveToUser && auth.isAuthenticated()) {
                const user = auth.getCurrentUser();
                user.watchlist = watchlist;
                auth.saveCurrentUser(user);
                auth.saveUsers();
            }
            return true;
        }
        return false;
    }

    removeFromWatchlist(id, type) {
        const watchlist = this.getWatchlist();
        const filtered = watchlist.filter(item => !(item.id === id && item.type === type));
        localStorage.setItem(this.watchlistKey, JSON.stringify(filtered));
        this.emitChange('watchlist', filtered);
        
        if (auth.isAuthenticated()) {
            const user = auth.getCurrentUser();
            user.watchlist = filtered;
            auth.saveCurrentUser(user);
            auth.saveUsers();
        }
    }

    isInWatchlist(id, type) {
        const watchlist = this.getWatchlist();
        return watchlist.some(item => item.id === id && item.type === type);
    }

    // ИСТОРИЯ
    getHistory() {
        const history = localStorage.getItem(this.historyKey);
        return history ? JSON.parse(history) : [];
    }

    addToHistory(item) {
        const history = this.getHistory();
        const filtered = history.filter(h => !(h.id === item.id && h.type === item.type));
        filtered.unshift({ ...item, viewedAt: Date.now() });
        const trimmed = filtered.slice(0, this.maxHistory);
        localStorage.setItem(this.historyKey, JSON.stringify(trimmed));
        this.emitChange('history', trimmed);
    }

    clearHistory() {
        localStorage.removeItem(this.historyKey);
        this.emitChange('history', []);
    }

    // РЕЙТИНГИ
    getRatings() {
        const ratings = localStorage.getItem(this.ratingsKey);
        return ratings ? JSON.parse(ratings) : {};
    }

    rateMovie(id, type, rating) {
        const ratings = this.getRatings();
        const key = `${type}_${id}`;
        ratings[key] = { rating, timestamp: Date.now() };
        localStorage.setItem(this.ratingsKey, JSON.stringify(ratings));
        this.emitChange('ratings', ratings);
        showToast(`Вы оценили на ${rating} `, 'success');
        return true;
    }

    getUserRating(id, type) {
        const ratings = this.getRatings();
        const key = `${type}_${id}`;
        return ratings[key]?.rating || 0;
    }

    removeRating(id, type) {
        const ratings = this.getRatings();
        const key = `${type}_${id}`;
        delete ratings[key];
        localStorage.setItem(this.ratingsKey, JSON.stringify(ratings));
        this.emitChange('ratings', ratings);
        showToast('Оценка удалена', 'info');
    }

    // КОММЕНТАРИИ
    getComments(id, type) {
        const allComments = localStorage.getItem(this.commentsKey);
        const comments = allComments ? JSON.parse(allComments) : {};
        const key = `${type}_${id}`;
        return comments[key] || [];
    }

    addComment(id, type, text) {
        if (!auth.isAuthenticated()) {
            showToast('Войдите, чтобы оставлять комментарии', 'warning');
            showAuthModal();
            return false;
        }
        
        const allComments = localStorage.getItem(this.commentsKey);
        const comments = allComments ? JSON.parse(allComments) : {};
        const key = `${type}_${id}`;
        
        if (!comments[key]) comments[key] = [];
        
        const newComment = {
            id: Date.now().toString(),
            userId: auth.getCurrentUser().id,
            userName: auth.getCurrentUser().name,
            userAvatar: auth.getCurrentUser().avatar,
            text,
            timestamp: Date.now(),
            likes: 0,
            likedBy: []
        };
        
        comments[key].push(newComment);
        localStorage.setItem(this.commentsKey, JSON.stringify(comments));
        this.emitChange('comments', comments[key]);
        showToast('Комментарий добавлен', 'success');
        return true;
    }

    likeComment(id, type, commentId) {
        if (!auth.isAuthenticated()) {
            showToast('Войдите, чтобы ставить лайки', 'warning');
            showAuthModal();
            return false;
        }
        
        const allComments = localStorage.getItem(this.commentsKey);
        const comments = allComments ? JSON.parse(allComments) : {};
        const key = `${type}_${id}`;
        
        if (comments[key]) {
            const comment = comments[key].find(c => c.id === commentId);
            if (comment) {
                const userId = auth.getCurrentUser().id;
                if (comment.likedBy && comment.likedBy.includes(userId)) {
                    comment.likedBy = comment.likedBy.filter(id => id !== userId);
                    comment.likes = (comment.likes || 1) - 1;
                    showToast('Лайк убран', 'info');
                } else {
                    if (!comment.likedBy) comment.likedBy = [];
                    comment.likedBy.push(userId);
                    comment.likes = (comment.likes || 0) + 1;
                    showToast('Лайк поставлен', 'success');
                }
                localStorage.setItem(this.commentsKey, JSON.stringify(comments));
                this.emitChange('comments', comments[key]);
                return true;
            }
        }
        return false;
    }

    deleteComment(id, type, commentId) {
        const allComments = localStorage.getItem(this.commentsKey);
        const comments = allComments ? JSON.parse(allComments) : {};
        const key = `${type}_${id}`;
        
        if (comments[key]) {
            const comment = comments[key].find(c => c.id === commentId);
            if (comment && comment.userId === auth.getCurrentUser()?.id) {
                comments[key] = comments[key].filter(c => c.id !== commentId);
                localStorage.setItem(this.commentsKey, JSON.stringify(comments));
                this.emitChange('comments', comments[key]);
                showToast('Комментарий удален', 'info');
                return true;
            }
        }
        return false;
    }

    // НАБЛЮДАТЕЛИ
    observers = new Map();

    subscribe(key, callback) {
        if (!this.observers.has(key)) {
            this.observers.set(key, []);
        }
        this.observers.get(key).push(callback);
    }

    unsubscribe(key, callback) {
        if (this.observers.has(key)) {
            const callbacks = this.observers.get(key).filter(cb => cb !== callback);
            this.observers.set(key, callbacks);
        }
    }

    emitChange(key, data) {
        if (this.observers.has(key)) {
            this.observers.get(key).forEach(callback => callback(data));
        }
    }
}

const storage = new StorageService();
