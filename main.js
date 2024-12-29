// Sample book data (you can replace this with your actual data)  
const books = [
    {
        id: 1,
        title: "The Woman Who Read Too Much",
        author: "Bahiyyih Nakhjavani",
        cover: "/pexels-lukas-rodriguez-1845331-20272497.jpg",
        pages: 288,
        rating: 4.5,
        reads: "3.5M",
        likes: "45.6K",
        episodes: 18,
        description: "A gripping tale of a woman's quest for knowledge in 19th-century Persia.",
        category: "fiction",
        pdfUrl: "/THE_SEALED_NECTAR_ English.pdf"
    },

    {
        id: 2,
        title: "The Woman Who Read Too Much",
        author: "Bahiyyih Nakhjavani",
        cover: "/b6936cf1-4d91-49ce-ad48-0b384eeee408.jpg",
        pages: 288,
        rating: 4.5,
        reads: "3.5M",
        likes: "45.6K",
        episodes: 18,
        description: "A gripping tale of a woman's quest for knowledge in 19th-century Persia.",
        category: "fiction",
        pdfUrl: "/THE_SEALED_NECTAR_ English.pdf"
    },
    {
        id: 3,
        title: "The Woman Who Read Too Much",
        author: "Bahiyyih Nakhjavani",
        cover: "/background-login.jpg",
        pages: 288,
        rating: 4.5,
        reads: "3.5M",
        likes: "45.6K",
        episodes: 18,
        description: "A gripping tale of a woman's quest for knowledge in 19th-century Persia.",
        category: "fiction",
        pdfUrl: "/THE_SEALED_NECTAR_ English.pdf"
    },
    {
        id: 4,
        title: "The Woman Who Read Too Much",
        author: "Bahiyyih Nakhjavani",
        cover: "/iitg2.JPG",
        pages: 288,
        rating: 4.5,
        reads: "3.5M",
        likes: "45.6K",
        episodes: 18,
        description: "A gripping tale of a woman's quest for knowledge in 19th-century Persia.",
        category: "fiction",
        pdfUrl: "/THE_SEALED_NECTAR_ English.pdf"
    },
    {
        id: 5,
        title: "The Woman Who Read Too Much",
        author: "Bahiyyih Nakhjavani",
        cover: "/pexels-lukas-rodriguez-1845331-20272497.jpg",
        pages: 288,
        rating: 4.5,
        reads: "3.5M",
        likes: "45.6K",
        episodes: 18,
        description: "A gripping tale of a woman's quest for knowledge in 19th-century Persia.",
        category: "fiction",
        pdfUrl: "/THE_SEALED_NECTAR_ English.pdf"
    }
];

// DOM Elements
let mainPage, bookDetailsPage, pdfReaderPage, bookGrid, tabButtons, themeToggle, searchInput, backToTop, bookmarksTab;

// PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

// State
let currentPage = 1;
let currentZoom = 1;
let pdfDoc = null;
let pageRendering = false;
let pageNumPending = null;
let scale = 1;
let thumbnailsVisible = false;
let nightMode = false;
let touchStartX = null;
let touchEndX = null;

// Initialize the app
function initializeApp() {
    // Initialize DOM elements
    mainPage = document.getElementById('main-page');
    bookDetailsPage = document.getElementById('book-details-page');
    pdfReaderPage = document.getElementById('pdf-reader-page');
    bookGrid = document.querySelector('.book-grid');
    tabButtons = document.querySelectorAll('.tab-btn');
    themeToggle = document.querySelector('.theme-toggle');
    searchInput = document.querySelector('.search-input');
    backToTop = document.getElementById('backToTop');
    bookmarksTab = document.querySelector('.tab-btn[data-tab="bookmarks"]');

    if (bookGrid) {
        renderBooks(books);
    }
    setupEventListeners();
    checkTheme();
    updateBookmarksCount();
    initializeContinueReading();
}

// Render books
function renderBooks(booksToRender) {
    if (!bookGrid) return;
    bookGrid.innerHTML = '';
    booksToRender.forEach(book => {
        const bookCard = createBookCard(book);
        bookGrid.appendChild(bookCard);
    });
}

// Create book card
function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card fade-in';
    card.innerHTML = `
        <img src="${book.cover}" alt="${book.title}" class="book-cover">
        <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">by ${book.author}</p>
        </div>
        <button class="bookmark-btn" data-id="${book.id}">
            <i class="far fa-bookmark"></i>
        </button>
        ${getProgressBar(book.id)}
    `;

    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('bookmark-btn')) {
            viewBookDetails(book.id);
        }
    });

    const bookmarkBtn = card.querySelector('.bookmark-btn');
    bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBookmark(book.id);
    });

    return card;
}

// Setup event listeners
function setupEventListeners() {
    if (tabButtons) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterBooks(button.dataset.tab);
            });
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    window.addEventListener('scroll', toggleBackToTop);

    if (backToTop) {
        backToTop.addEventListener('click', scrollToTop);
    }

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', goBack);
    });

    // PDF Reader touch events for page navigation
    const pdfViewer = document.getElementById('pdf-viewer');
    if (pdfViewer) {
        pdfViewer.addEventListener('touchstart', handleTouchStart, false);
        pdfViewer.addEventListener('touchmove', handleTouchMove, false);
        pdfViewer.addEventListener('touchend', handleTouchEnd, false);
    }

    // PDF Settings toggle
    const settingsToggle = document.getElementById('settings-toggle');
    const closeSettings = document.querySelector('.close-settings');
    if (settingsToggle && closeSettings) {
        settingsToggle.addEventListener('click', togglePdfSettings);
        closeSettings.addEventListener('click', togglePdfSettings);
    }

    // Night mode toggle
    const nightModeToggle = document.getElementById('night-mode-toggle');
    if (nightModeToggle) {
        nightModeToggle.addEventListener('change', toggleNightMode);
    }

    // Zoom controls
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomSelect = document.getElementById('zoom-select');
    if (zoomIn && zoomOut && zoomSelect) {
        zoomIn.addEventListener('click', () => changeZoom(0.25));
        zoomOut.addEventListener('click', () => changeZoom(-0.25));
        zoomSelect.addEventListener('change', handleZoomChange);
    }

    // Page navigation
    const prevPage = document.getElementById('prev');
    const nextPage = document.getElementById('next');
    const currentPageInput = document.getElementById('current-page');
    const pageSlider = document.getElementById('page-slider');
    if (prevPage && nextPage && currentPageInput && pageSlider) {
        prevPage.addEventListener('click', () => changePage(-1));
        nextPage.addEventListener('click', () => changePage(1));
        currentPageInput.addEventListener('change', handlePageInputChange);
        pageSlider.addEventListener('input', handlePageSliderChange);
    }
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredBooks = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm)
    );
    renderBooks(filteredBooks);
}

// Filter books by category
function filterBooks(category) {
    if (category === 'all') {
        renderBooks(books);
    } else if (category === 'bookmarks') {
        const bookmarkedBooks = getBookmarkedBooks();
        renderBooks(bookmarkedBooks);
    } else {
        const filteredBooks = books.filter(book => book.category === category);
        renderBooks(filteredBooks);
    }
}

// Theme toggle functionality
function toggleTheme() {
    document.body.setAttribute('data-theme', document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    localStorage.setItem('theme', document.body.getAttribute('data-theme'));
    updateThemeIcon();
}

// Check and set theme
function checkTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

// Update theme icon
function updateThemeIcon() {
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        icon.className = document.body.getAttribute('data-theme') === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Utility function for debouncing
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

// Back to top functionality
function toggleBackToTop() {
    if (backToTop) {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// View book details
function viewBookDetails(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book || !bookDetailsPage) return;

    bookDetailsPage.style.backgroundImage = `url(${book.cover})`;
    bookDetailsPage.style.backgroundSize = 'cover';
    bookDetailsPage.style.backgroundPosition = 'center';

    const bookDetailsContent = `
        <div class="book-cover-section">
            <img src="${book.cover}" alt="${book.title}" class="book-cover-large">
            <div class="book-title-section">
                <h2>${book.title}</h2>
                <p>by ${book.author}</p>
            </div>
        </div>
        
        <div class="book-metadata">
            <div class="metadata-item">
                <div class="metadata-value">${book.reads}</div>
                <div class="metadata-label">Reads</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-value">${book.likes}</div>
                <div class="metadata-label">Likes</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-value">${book.episodes}</div>
                <div class="metadata-label">Episodes</div>
            </div>
        </div>

        <div class="book-description">
            <h3>About ${book.title}</h3>
            <p class="description-text">${book.description}</p>
        </div>

        <div class="book-actions">
            <button class="action-btn preview-btn">Preview</button>
            <button class="action-btn read-btn" onclick="openPdfReader(${book.id})">
                Read Book
            </button>
        </div>
    `;

    const bookDetailsElement = bookDetailsPage.querySelector('.book-details-content');
    if (bookDetailsElement) {
        bookDetailsElement.innerHTML = bookDetailsContent;
    }

    if (mainPage) mainPage.style.display = 'none';
    bookDetailsPage.style.display = 'block';

    updateBookmarkButton(book.id);
}

// Open PDF reader
function openPdfReader(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book || !pdfReaderPage) return;

    const bookTitleElement = pdfReaderPage.querySelector('.book-title');
    if (bookTitleElement) {
        bookTitleElement.textContent = book.title;
    }

    if (bookDetailsPage) bookDetailsPage.style.display = 'none';
    pdfReaderPage.style.display = 'block';

    initializePdfReader(book.pdfUrl);
}

// Initialize PDF reader
function initializePdfReader(pdfUrl) {
    pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
        pdfDoc = pdf;
        const pageCount = document.getElementById('page-count');
        const pageSlider = document.getElementById('page-slider');
        if (pageCount) pageCount.textContent = pdf.numPages;
        if (pageSlider) pageSlider.max = pdf.numPages;
        
        generateThumbnails(pdf);
        renderPage(currentPage);
        updateProgress();
    });
}

// Render PDF page
function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: scale * 2 }); // Increase scale for higher quality
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        const renderTask = page.render(renderContext);

        renderTask.promise.then(function() {
            pageRendering = false;
            
            const pdfViewer = document.getElementById('pdf-viewer');
            if (pdfViewer) {
                pdfViewer.innerHTML = '';
                pdfViewer.appendChild(canvas);

                // Apply CSS to scale down the high-resolution canvas
                canvas.style.width = `${viewport.width / 2}px`;
                canvas.style.height = `${viewport.height / 2}px`;
            }

            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }

            const currentPageInput = document.getElementById('current-page');
            const pageSlider = document.getElementById('page-slider');
            if (currentPageInput) currentPageInput.value = num;
            if (pageSlider) pageSlider.value = num;
            updateProgress();
            highlightThumbnail(num);
        });
    });
}

// Generate thumbnails
function generateThumbnails(pdf) {
    const thumbnailsContent = document.querySelector('.thumbnails-content');
    if (!thumbnailsContent) return;

    thumbnailsContent.innerHTML = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        pdf.getPage(i).then(function(page) {
            const viewport = page.getViewport({ scale: 0.2 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            page.render(renderContext).promise.then(function() {
                canvas.className = 'thumbnail';
                canvas.dataset.pageNum = i;
                canvas.addEventListener('click', () => {
                    queueRenderPage(i);
                });
                thumbnailsContent.appendChild(canvas);
            });
        });
    }
}

// Highlight current thumbnail
function highlightThumbnail(num) {
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
        if (parseInt(thumb.dataset.pageNum) === num) {
            thumb.classList.add('active');
            thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

// Update progress
function updateProgress() {
    if (!pdfDoc) return;
    const progress = (currentPage / pdfDoc.numPages) * 100;
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${Math.round(progress)}% Complete`;
}

// Queue rendering of a page
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Toggle bookmark
function toggleBookmark(bookId) {
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    const index = bookmarks.indexOf(bookId);

    if (index === -1) {
        bookmarks.push(bookId);
    } else {
        bookmarks.splice(index, 1);
    }

    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    updateBookmarksCount();
    updateBookmarkButton(bookId);
}

// Check if a book is bookmarked
function isBookmarked(bookId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    return bookmarks.includes(bookId);
}

// Update bookmarks count
function updateBookmarksCount() {
    if (!bookmarksTab) return;
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    bookmarksTab.textContent = `Bookmarks (${bookmarks.length})`;
}

// Update bookmark button
function updateBookmarkButton(bookId) {
    const bookmarkBtn = document.querySelector(`.bookmark-btn[data-id="${bookId}"]`);
    if (bookmarkBtn) {
        const icon = bookmarkBtn.querySelector('i');
        icon.className = isBookmarked(bookId) ? 'fas fa-bookmark' : 'far fa-bookmark';
    }
}

// Get bookmarked books
function getBookmarkedBooks() {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    return books.filter(book => bookmarks.includes(book.id));
}

// Save last read page
function saveLastReadPage(bookId, pageNum) {
    let readingProgress = JSON.parse(localStorage.getItem('readingProgress')) || {};
    readingProgress[bookId] = pageNum;
    localStorage.setItem('readingProgress', JSON.stringify(readingProgress));
}

// Get last read page
function getLastReadPage(bookId) {
    const readingProgress = JSON.parse(localStorage.getItem('readingProgress')) || {};
    return readingProgress[bookId] || 1;
}

// Get progress bar
function getProgressBar(bookId) {
    const readingProgress = JSON.parse(localStorage.getItem('readingProgress')) || {};
    const lastReadPage = readingProgress[bookId] || 0;
    const book = books.find(b => b.id === bookId);
    const progress = book ? (lastReadPage / book.pages) * 100 : 0;
    return `<div class="progress-bar" style="width: ${progress}%"></div>`;
}

// Go back function
function goBack() {
    if (bookDetailsPage) bookDetailsPage.style.display = 'none';
    if (pdfReaderPage) pdfReaderPage.style.display = 'none';
    if (mainPage) mainPage.style.display = 'block';
}

// Handle touch start
function handleTouchStart(evt) {
    touchStartX = evt.touches[0].clientX;
}

// Handle touch move
function handleTouchMove(evt) {
    if (!touchStartX) {
        return;
    }

    touchEndX = evt.touches[0].clientX;
    const diffX = touchStartX - touchEndX;

    // Prevent default behavior (page scroll) if swiping horizontally
    if (Math.abs(diffX) > 5) {
        evt.preventDefault();
    }
}

// Handle touch end
function handleTouchEnd() {
    if (!touchStartX || !touchEndX) {
        return;
    }

    const diffX = touchStartX - touchEndX;

    if (diffX > 50) {
        // Swipe left, go to next page
        if (currentPage < pdfDoc.numPages) {
            currentPage++;
            queueRenderPage(currentPage);
        }
    } else if (diffX < -50) {
        // Swipe right, go to previous page
        if (currentPage > 1) {
            currentPage--;
            queueRenderPage(currentPage);
        }
    }

    // Reset values
    touchStartX = null;
    touchEndX = null;
}

// Change page
function changePage(delta) {
    if (pdfDoc && currentPage + delta >= 1 && currentPage + delta <= pdfDoc.numPages) {
        currentPage += delta;
        queueRenderPage(currentPage);
    }
}

// Handle page input change
function handlePageInputChange(e) {
    const num = parseInt(e.target.value);
    if (pdfDoc && num >= 1 && num <= pdfDoc.numPages) {
        currentPage = num;
        queueRenderPage(currentPage);
    }
}

// Handle page slider change
function handlePageSliderChange(e) {
    currentPage = parseInt(e.target.value);
    queueRenderPage(currentPage);
}

// Change zoom
function changeZoom(delta) {
    scale += delta;
    if (scale < 0.25) scale = 0.25;
    if (scale > 3) scale = 3;
    renderPage(currentPage);
}

// Handle zoom change
function handleZoomChange(e) {
    const value = e.target.value;
    if (value === 'auto') {
        const canvas = document.querySelector('#pdf-viewer canvas');
        const viewer = document.getElementById('pdf-viewer');
        if (canvas && viewer) {
            scale = viewer.clientWidth / canvas.width;
        }
    } else {
        scale = parseFloat(value);
    }
    renderPage(currentPage);
}

// Toggle night mode
function toggleNightMode() {
    nightMode = !nightMode;
    const pdfViewer = document.getElementById('pdf-viewer');
    if (pdfViewer) {
        pdfViewer.classList.toggle('night-mode', nightMode);
    }
    const icon = document.querySelector('#night-mode-toggle i');
    if (icon) {
        icon.className = nightMode ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Toggle PDF settings
function togglePdfSettings() {
    const settingsPanel = document.querySelector('.pdf-settings-panel');
    if (settingsPanel) {
        settingsPanel.classList.toggle('open');
    }
}

// Initialize Continue Reading section
function initializeContinueReading() {
    const readingList = document.querySelector('.reading-list');
    const continueReadingBooks = getReadingProgress();
    
    if (readingList && continueReadingBooks.length > 0) {
        readingList.innerHTML = '';
        continueReadingBooks.forEach(progress => {
            const book = books.find(b => b.id === progress.bookId);
            if (book) {
                const readingItem = createReadingItem(book, progress.page, book.pages);
                readingList.appendChild(readingItem);
            }
        });
    }
}

// Create reading item for Continue Reading section
function createReadingItem(book, currentPage, totalPages) {
    const progress = (currentPage / totalPages) * 100;
    const item = document.createElement('div');
    item.className = 'reading-item';
    item.innerHTML = `
        <img src="${book.cover}" alt="${book.title}" class="book-cover">
        <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-progress">${Math.round(progress)}% completed</p>
        </div>
        <div class="reading-progress" style="width: ${progress}%"></div>
    `;
    
    item.addEventListener('click', () => viewBookDetails(book.id));
    return item;
}

// Get reading progress
function getReadingProgress() {
    return JSON.parse(localStorage.getItem('readingProgress')) || [];
}

// Save reading progress
function saveReadingProgress(bookId, currentPage, totalPages) {
    let progress = getReadingProgress();
    const existingProgress = progress.find(p => p.bookId === bookId);
    
    if (existingProgress) {
        existingProgress.page = currentPage;
        existingProgress.lastRead = Date.now();
    } else {
        progress.push({
            bookId,
            page: currentPage,
            totalPages,
            lastRead: Date.now()
        });
    }
    
    progress.sort((a, b) => b.lastRead - a.lastRead);
    localStorage.setItem('readingProgress', JSON.stringify(progress));
    initializeContinueReading();
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);