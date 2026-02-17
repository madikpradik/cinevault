class MovieRow {
    constructor(title, fetchFunction, params = {}) {
        this.title = title;
        this.fetchFunction = fetchFunction;
        this.params = params;
        this.page = 1;
        this.loading = false;
        this.hasMore = true;
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'movie-row';
        
        container.innerHTML = `
            <div class="container">
                <div class="row-header">
                    <h2 class="row-title">${this.title}</h2>
                    <div class="row-controls">
                        <button class="row-btn prev-btn"><i class="fas fa-chevron-left"></i></button>
                        <button class="row-btn next-btn"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="row-container">
                    <div class="row-content" id="row-${Date.now()}">
                    </div>
                </div>
            </div>
        `;

        const rowContent = container.querySelector('.row-content');
        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');

        await this.loadMore(rowContent);

        prevBtn.addEventListener('click', () => {
            rowContent.scrollBy({ left: -800, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            rowContent.scrollBy({ left: 800, behavior: 'smooth' });
        });

        rowContent.addEventListener('scroll', () => {
            if (rowContent.scrollLeft + rowContent.clientWidth >= rowContent.scrollWidth - 100) {
                this.loadMore(rowContent);
            }
        });

        return container;
    }

    async loadMore(container) {
        if (this.loading || !this.hasMore) return;
        
        this.loading = true;
        
        for (let i = 0; i < 6; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'movie-card skeleton';
            skeleton.style.width = '200px';
            skeleton.style.height = '300px';
            container.appendChild(skeleton);
        }

        try {
            const data = await this.fetchFunction({ page: this.page, ...this.params });
            
            container.querySelectorAll('.skeleton').forEach(s => s.remove());
            
            if (data.results && data.results.length > 0) {
                data.results.forEach(movie => {
                    const card = new MovieCard(movie, this.params.type || 'movie');
                    container.appendChild(card.render());
                });
                this.page++;
                this.hasMore = data.page < data.total_pages;
            } else {
                this.hasMore = false;
            }
        } catch (error) {
            container.querySelectorAll('.skeleton').forEach(s => s.remove());
        } finally {
            this.loading = false;
        }
    }
}
