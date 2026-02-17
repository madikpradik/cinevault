class AuthService {
    constructor() {
        this.usersKey = 'cinevault_users';
        this.currentUserKey = 'cinevault_current_user';
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
    }

    loadUsers() {
        const users = localStorage.getItem(this.usersKey);
        return users ? JSON.parse(users) : [];
    }

    saveUsers() {
        localStorage.setItem(this.usersKey, JSON.stringify(this.users));
    }

    loadCurrentUser() {
        const user = localStorage.getItem(this.currentUserKey);
        return user ? JSON.parse(user) : null;
    }

    saveCurrentUser(user) {
        if (user) {
            localStorage.setItem(this.currentUserKey, JSON.stringify(user));
        } else {
            localStorage.removeItem(this.currentUserKey);
        }
        this.currentUser = user;
        this.updateProfileUI();
    }

    register(name, email, password) {
        if (this.users.some(u => u.email === email)) {
            return { success: false, message: 'Пользователь с таким email уже существует' };
        }

        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: btoa(password),
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b4a&color=fff&size=128`,
            createdAt: new Date().toISOString(),
            favorites: [],
            watchlist: []
        };

        this.users.push(newUser);
        this.saveUsers();
        this.saveCurrentUser(newUser);
        
        return { success: true, message: 'Регистрация успешна' };
    }

    login(email, password) {
        const user = this.users.find(u => u.email === email && u.password === btoa(password));
        
        if (user) {
            this.saveCurrentUser(user);
            return { success: true, message: 'Вход выполнен успешно' };
        }
        
        return { success: false, message: 'Неверный email или пароль' };
    }

    logout() {
        this.saveCurrentUser(null);
        showToast('Вы вышли из аккаунта', 'info');
        location.reload();
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateProfileUI() {
        const profileSection = document.getElementById('profileSection');
        
        if (this.isAuthenticated()) {
            profileSection.innerHTML = `
                <div class="profile-menu">
                    <img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" class="profile-avatar" id="profileAvatar">
                    <div class="profile-dropdown">
                        <div class="profile-info">
                            <strong>${this.currentUser.name}</strong>
                            <small>${this.currentUser.email}</small>
                        </div>
                        <div class="profile-divider"></div>
                        <div class="profile-item" onclick="showUserStats()">
                            <i class="fas fa-chart-bar"></i> Статистика
                        </div>
                        <div class="profile-divider"></div>
                        <div class="profile-item" onclick="auth.logout()">
                            <i class="fas fa-sign-out-alt"></i> Выйти
                        </div>
                    </div>
                </div>
            `;
        } else {
            profileSection.innerHTML = `
                <button class="btn-login" onclick="showAuthModal()">
                    <i class="fas fa-sign-in-alt"></i> Войти
                </button>
            `;
        }
    }

    syncUserData() {
        if (this.isAuthenticated()) {
            const userFavorites = this.currentUser.favorites || [];
            const userWatchlist = this.currentUser.watchlist || [];
            
            const currentFavorites = storage.getFavorites();
            const currentWatchlist = storage.getWatchlist();
            
            if (userFavorites.length > 0 && currentFavorites.length === 0) {
                userFavorites.forEach(fav => storage.addFavorite(fav, false));
            }
            
            if (userWatchlist.length > 0 && currentWatchlist.length === 0) {
                userWatchlist.forEach(item => storage.addToWatchlist(item, false));
            }
        }
    }
}

const auth = new AuthService();

function showAuthModal() {
    const modal = document.getElementById('authModal');
    const authContent = document.getElementById('authContent');
    
    authContent.innerHTML = `
        <div class="auth-tabs">
            <button class="auth-tab active" onclick="showLoginForm()">Вход</button>
            <button class="auth-tab" onclick="showRegisterForm()">Регистрация</button>
        </div>
        <div id="authFormContainer">
            ${renderLoginForm()}
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function renderLoginForm() {
    return `
        <form class="auth-form" onsubmit="handleLogin(event)">
            <h2 class="auth-title">Добро пожаловать!</h2>
            <p class="auth-subtitle">Войдите в свой аккаунт</p>
            
            <div class="form-group">
                <label for="loginEmail">Email</label>
                <input type="email" id="loginEmail" class="form-input" placeholder="your@email.com" required>
            </div>
            
            <div class="form-group">
                <label for="loginPassword">Пароль</label>
                <input type="password" id="loginPassword" class="form-input" placeholder="" required>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                <i class="fas fa-sign-in-alt"></i> Войти
            </button>
            
            <p class="auth-switch">
                Нет аккаунта? 
                <a onclick="showRegisterForm(); return false;">Зарегистрироваться</a>
            </p>
        </form>
    `;
}

function renderRegisterForm() {
    return `
        <form class="auth-form" onsubmit="handleRegister(event)">
            <h2 class="auth-title">Создать аккаунт</h2>
            <p class="auth-subtitle">Присоединяйтесь к CineVault</p>
            
            <div class="form-group">
                <label for="registerName">Имя</label>
                <input type="text" id="registerName" class="form-input" placeholder="Иван Иванов" required>
            </div>
            
            <div class="form-group">
                <label for="registerEmail">Email</label>
                <input type="email" id="registerEmail" class="form-input" placeholder="your@email.com" required>
            </div>
            
            <div class="form-group">
                <label for="registerPassword">Пароль</label>
                <input type="password" id="registerPassword" class="form-input" placeholder="" minlength="6" required>
            </div>
            
            <div class="form-group">
                <label for="registerConfirm">Подтверждение пароля</label>
                <input type="password" id="registerConfirm" class="form-input" placeholder="" minlength="6" required>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                <i class="fas fa-user-plus"></i> Зарегистрироваться
            </button>
            
            <p class="auth-switch">
                Уже есть аккаунт? 
                <a onclick="showLoginForm(); return false;">Войти</a>
            </p>
        </form>
    `;
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const result = auth.login(email, password);
    
    if (result.success) {
        closeAuthModal();
        showToast(result.message, 'success');
        location.reload();
    } else {
        showToast(result.message, 'error');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    
    if (password !== confirm) {
        showToast('Пароли не совпадают', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Пароль должен быть не менее 6 символов', 'error');
        return;
    }
    
    const result = auth.register(name, email, password);
    
    if (result.success) {
        closeAuthModal();
        showToast(result.message, 'success');
        location.reload();
    } else {
        showToast(result.message, 'error');
    }
}

function showLoginForm() {
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector('.auth-tab:first-child').classList.add('active');
    document.getElementById('authFormContainer').innerHTML = renderLoginForm();
}

function showRegisterForm() {
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector('.auth-tab:last-child').classList.add('active');
    document.getElementById('authFormContainer').innerHTML = renderRegisterForm();
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function showUserStats() {
    if (!auth.isAuthenticated()) {
        showToast('Войдите, чтобы видеть статистику', 'warning');
        showAuthModal();
        return;
    }
    
    const user = auth.getCurrentUser();
    const favorites = storage.getFavorites();
    const watchlist = storage.getWatchlist();
    const history = storage.getHistory();
    const ratings = storage.getRatings();
    
    const userRatings = Object.values(ratings).length;
    let avgRating = 0;
    if (userRatings > 0) {
        const sum = Object.values(ratings).reduce((acc, r) => acc + r.rating, 0);
        avgRating = (sum / userRatings).toFixed(1);
    }
    
    const modal = document.getElementById('authModal');
    const authContent = document.getElementById('authContent');
    
    authContent.innerHTML = `
        <div class="profile-settings">
            <h2 class="auth-title">Ваша статистика</h2>
            
            <div class="profile-avatar-large">
                <img src="${user.avatar}" alt="${user.name}">
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-heart" style="color: #ff6b4a;"></i>
                    <div class="stat-value">${favorites.length}</div>
                    <div class="stat-label">В избранном</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-bookmark" style="color: #ffb347;"></i>
                    <div class="stat-value">${watchlist.length}</div>
                    <div class="stat-label">В списке</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-history" style="color: #4caf50;"></i>
                    <div class="stat-value">${history.length}</div>
                    <div class="stat-label">Просмотрено</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-star" style="color: #ffd700;"></i>
                    <div class="stat-value">${userRatings}</div>
                    <div class="stat-label">Оценок</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-chart-line" style="color: #9c27b0;"></i>
                    <div class="stat-value">${avgRating}</div>
                    <div class="stat-label">Средняя оценка</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-calendar" style="color: #2196f3;"></i>
                    <div class="stat-value">${new Date(user.createdAt).toLocaleDateString()}</div>
                    <div class="stat-label">С нами</div>
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="closeAuthModal()" style="width: 100%;">
                <i class="fas fa-times"></i> Закрыть
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}
