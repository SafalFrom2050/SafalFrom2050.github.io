/**
 * game/script.js
 * Handles game loading, metadata rendering, and recommendations.
 */

// Generated game pages share this script, so the page chrome stays current
// without rewriting thousands of pre-rendered game URLs.
(function prepareGameChrome() {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/game/expressive.css?v=2';
    document.head.appendChild(stylesheet);

    const footerStyles = document.createElement('link');
    footerStyles.id = 'expressive-footer-styles';
    footerStyles.rel = 'stylesheet';
    footerStyles.href = '/css/expressive-footer.css?v=2';
    document.head.appendChild(footerStyles);
    const footerScript = document.createElement('script');
    footerScript.src = '/js/footer.js?v=1';
    document.body.appendChild(footerScript);

    const footerMessage = document.querySelector('footer p.mb-4.opacity-7');
    if (footerMessage) footerMessage.textContent = 'Play instantly on the web. Create with Skyloop on Android.';

    const nav = document.querySelector('#navbarMain .navbar-nav');
    if (!nav) return;
    nav.querySelectorAll('.nav-link .material-icons').forEach(icon => icon.remove());
    const about = nav.querySelector('a[href="/about"]');
    if (!about) return;
    [['AI games', '/bio/'], ['Blog', '/blog/']].forEach(([label, href]) => {
        if (nav.querySelector(`a[href="${href}"]`)) return;
        const link = document.createElement('a');
        link.className = 'nav-link';
        link.href = href;
        link.textContent = label;
        nav.insertBefore(link, about);
    });
})();

/**
 * Extract game ID from path (/game/XXXX/) or query param (?id=XXXX)
 */
function getGameId() {
    // Try path-based URL first: /game/XXXX/
    var pathMatch = window.location.pathname.match(/\/game\/([^\/]+)/);
    if (pathMatch && pathMatch[1] !== 'index.html') return pathMatch[1];
    // Fallback to query param
    return new URLSearchParams(window.location.search).get('id');
}

async function loadGamePage() {
    const gameId = getGameId();
    if (!gameId) {
        document.getElementById("title").innerHTML = "Game Not Found";
        return;
    }

    // 1. Check for pre-rendered data (baked in by build script)
    let game = null;
    var prerenderedEl = document.getElementById('prerendered-data');
    if (prerenderedEl) {
        try {
            game = JSON.parse(prerenderedEl.textContent);
        } catch (e) {
            console.warn('Failed to parse pre-rendered data:', e);
        }
    }

    // 2. Fallback: Fetch from Firestore if no pre-rendered data
    if (!game) {
        game = await firestoreService.fetchGameById(gameId);
    }

    if (!game) {
        document.getElementById("title").innerHTML = "Oops! This game is currently unavailable.";
        return;
    }

    // 3. Render UI
    renderGameDetails(game);

    // 4. Fetch & Render Similar Games
    const categories = Array.isArray(game.category) ? game.category : [game.category].filter(Boolean);
    const similarGames = await firestoreService.fetchSimilarGames(gameId, game.searchKeys || [], 8, categories);
    renderSimilarGames(similarGames, categories[0]);
}

function renderGameDetails(game) {
    document.title = `Play ${game.name || game.title} Free Online | alt games portal`;
    document.getElementById("title").textContent = game.name || game.title;
    const title = document.getElementById('title');
    const context = document.createElement('div');
    context.className = 'game-context';
    const libraryLink = document.createElement('a');
    libraryLink.href = '/library/';
    libraryLink.textContent = 'Library';
    const categoryLabel = document.createElement('span');
    categoryLabel.textContent = ' / ' + (Array.isArray(game.category) ? game.category[0] : game.category || 'Game');
    context.append(libraryLink, categoryLabel);
    title.before(context);
    
    const iframe = document.createElement('iframe');
    iframe.src = game.url;
    iframe.scrolling = 'no';
    iframe.allowFullscreen = true;
    iframe.title = game.name || game.title || 'Game';
    document.getElementById("iframeContainer").replaceChildren(iframe);
    
    // Show the fullscreen button once the game is loaded
    const fsBtn = document.getElementById("fullscreenBtn");
    if (fsBtn) fsBtn.classList.add('visible');

    if (game.description && game.description.trim() !== "") {
        document.getElementById("description").textContent = game.description;
    } else {
        // High-value fallback for AdSense:
        const cat = game.category ? (Array.isArray(game.category) ? game.category[0] : game.category) : "Instant Game";
        const fallback = `Experience ${game.name || game.title}, a ${cat} game on alt games portal. Play instantly in your browser with no installation required.`;
        document.getElementById("description").textContent = fallback;
    }

    if (game.category) {
        const cat = Array.isArray(game.category) ? game.category[0] : game.category;
        const badge = document.createElement('span');
        badge.className = 'badge badge-primary rounded-pill px-3 py-2';
        badge.textContent = String(cat).toUpperCase();
        document.getElementById("categoryBadge").replaceChildren(badge);
    }

    // 3. Stats Rendering
    const stats = game.stats || {};
    
    // Ratings
    if (Number(stats.averageRating) > 0) {
        document.getElementById("ratingValue").textContent = Number(stats.averageRating).toFixed(1) + " ★";
    } else {
        document.getElementById("ratingValue").parentElement.hidden = true;
    }

    // Favorites
    if (Number(stats.favoriteCount) > 0) {
        document.getElementById("favCount").textContent = String(stats.favoriteCount);
    } else {
        document.getElementById("favCount").parentElement.hidden = true;
    }

    // AI Retro Text (Apply only if isAI is true, without adding/showing the AI Status field)
    if (game.isAI) {
        document.getElementById("title").classList.add("ai-retro-text");
    }

    // 4. Update SEO and Schema
    const currentUrl = window.location.href.split('?')[0] + "?id=" + game.id;
    const rawDesc = game.description && game.description.length > 10 ? game.description : `Play ${game.name || game.title} instantly without installing. A premium ${game.category ? game.category[0] : 'instant'} game featured on alt games portal. No downloads required.`;
    const gameDesc = rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 160);
    const gameImage = game.imageUrl || "https://gamesp.xyz/images/cover.png";
    const gameTitleText = `Play ${game.name || game.title} Free Online | alt games portal`;

    const seoDesc = document.getElementById("seo-description");
    if (seoDesc) seoDesc.content = gameDesc;
    
    const seoCan = document.getElementById("seo-canonical");
    if (seoCan) seoCan.href = currentUrl;
    
    const ogTitle = document.getElementById("og-title");
    if (ogTitle) ogTitle.content = gameTitleText;
    
    const ogDesc = document.getElementById("og-description");
    if (ogDesc) ogDesc.content = gameDesc;
    
    const ogImg = document.getElementById("og-image");
    if (ogImg) ogImg.content = gameImage;
    
    const ogUrl = document.getElementById("og-url");
    if (ogUrl) ogUrl.content = currentUrl;
    
    // Update Twitter Card meta tags
    const twTitle = document.getElementById("tw-title");
    if (twTitle) twTitle.content = gameTitleText;
    const twDesc = document.getElementById("tw-description");
    if (twDesc) twDesc.content = gameDesc;
    const twImg = document.getElementById("tw-image");
    if (twImg) twImg.content = gameImage;

    // Inject Schema.org VideoGame + BreadcrumbList data
    const schemaBlock = document.getElementById("schema-block");
    if (schemaBlock) {
        const gameCat = game.category ? (Array.isArray(game.category) ? game.category[0] : game.category) : "Browser Game";
        const schema = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "VideoGame",
                    "name": game.name || game.title,
                    "description": gameDesc,
                    "url": currentUrl,
                    "image": gameImage,
                    "genre": gameCat,
                    "playMode": "SinglePlayer",
                    "applicationCategory": "Game",
                    "operatingSystem": "Web Browser",
                    "gamePlatform": "Web Browser",
                    "inLanguage": "en",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "USD",
                        "availability": "https://schema.org/InStock"
                    },
                    "author": {
                        "@type": "Organization",
                        "name": "alt games portal",
                        "url": "https://gamesp.xyz/"
                    }
                },
                {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": "https://gamesp.xyz/"
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Game Library",
                            "item": "https://gamesp.xyz/library/"
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": game.name || game.title,
                            "item": currentUrl
                        }
                    ]
                }
            ]
        };
        
        if (stats && stats.averageRating !== undefined && stats.favoriteCount > 0) {
            schema["@graph"][0].aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": stats.averageRating.toString(),
                "ratingCount": stats.favoriteCount.toString(),
                "bestRating": "5"
            };
        }
        schemaBlock.textContent = JSON.stringify(schema);
    }
}

function renderSimilarGames(games, category) {
    const sidebar = document.getElementById("similarSidebar");
    const mobileGrid = document.getElementById("similarMobile");
    if (category) {
        const label = `More ${String(category).toLowerCase()} games`;
        const desktopHeading = document.querySelector('.recommendation-sidebar h5');
        const mobileHeading = mobileGrid.parentElement.querySelector('h3');
        if (desktopHeading) desktopHeading.textContent = label;
        if (mobileHeading) mobileHeading.textContent = label;
        const browse = document.querySelector('.recommendation-sidebar > a');
        if (browse) browse.href = '/library/?cat=' + encodeURIComponent(String(category).toLowerCase());
    }
    
    if (games.length === 0) {
        sidebar.innerHTML = '<p class="text-muted small">No similar games found.</p>';
        mobileGrid.innerHTML = '<p class="text-muted col-12">No similar games found.</p>';
        return;
    }

    sidebar.innerHTML = '';
    mobileGrid.innerHTML = '';

    games.forEach(game => {
        const gameUrl = `/game/${encodeURIComponent(game.id)}/`;
        const name = game.name || game.title || 'Game';
        const categoryName = Array.isArray(game.category) ? game.category[0] : game.category;
        const makeImage = () => {
            const image = document.createElement('img');
            image.src = game.imageUrl || '/images/cover.png';
            image.alt = '';
            image.onerror = () => { image.onerror = null; image.src = '/images/cover.png'; };
            return image;
        };

        const sidebarLink = document.createElement('a');
        sidebarLink.className = 'sidebar-item';
        sidebarLink.href = gameUrl;
        const sidebarText = document.createElement('div');
        const sidebarTitle = document.createElement('h6');
        sidebarTitle.className = 'mb-1';
        sidebarTitle.textContent = name;
        const badge = document.createElement('span');
        badge.className = 'badge badge-dark small';
        badge.style.cssText = 'font-size: 9px; opacity: 0.7;';
        badge.textContent = categoryName || 'Game';
        sidebarText.append(sidebarTitle, badge);
        sidebarLink.append(makeImage(), sidebarText);
        sidebar.appendChild(sidebarLink);

        const mobileCol = document.createElement('div');
        mobileCol.className = 'col-6 p-2';
        const mobileLink = document.createElement('a');
        mobileLink.className = 'game-card';
        mobileLink.href = gameUrl;
        const mobileTitle = document.createElement('h6');
        mobileTitle.textContent = name;
        mobileLink.append(makeImage(), mobileTitle);
        mobileCol.appendChild(mobileLink);
        mobileGrid.appendChild(mobileCol);
    });
}

// Fullscreen API implementation
function toggleFullscreen() {
    const elem = document.getElementById("gameView");
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }
}

// Update fullscreen button icon based on state
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function handleFullscreenChange() {
    const fsBtn = document.getElementById("fullscreenBtn");
    const icon = fsBtn.querySelector('i');
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        icon.innerText = 'fullscreen_exit';
    } else {
        icon.innerText = 'fullscreen';
    }
}

// Global scope initialization
window.addEventListener('load', () => {
    loadGamePage();
    setupGameAppInvitation();
});

function setupGameAppInvitation() {
    // Older generated game pages still contain the former modal markup.
    document.getElementById('appPromoModal')?.remove();
    const details = document.querySelector('.game-detail-container');
    if (!details) return;
    const slot = document.createElement('aside');
    slot.className = 'app-callout mb-4';
    slot.setAttribute('data-app-promo', '');
    slot.setAttribute('aria-label', 'Android app invitation');
    slot.hidden = true;
    details.insertAdjacentElement('afterend', slot);
    const script = document.createElement('script');
    script.src = '/js/app-promo.js';
    document.body.appendChild(script);
}
