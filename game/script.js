/**
 * game/script.js
 * Handles game loading, metadata rendering, and recommendations.
 */

function getUrlParam(parameter, defaultvalue) {
    var urlparameter = defaultvalue;
    var url = window.location.href;
    if (url.indexOf(parameter) > -1) {
        var vars = {};
        url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
            vars[key] = value;
        });
        urlparameter = vars[parameter];
        return urlparameter;
    }
    return defaultvalue;
}

async function loadGamePage() {
    const gameId = getUrlParam("id", null);
    if (!gameId) {
        document.getElementById("title").innerHTML = "Game not found";
        return;
    }

    // 1. Fetch Game Details
    const game = await firestoreService.fetchGameById(gameId);
    if (!game) {
        document.getElementById("title").innerHTML = "Game not found in Firestore";
        return;
    }

    // 2. Render UI
    renderGameDetails(game);

    // 3. Fetch & Render Similar Games
    const similarGames = await firestoreService.fetchSimilarGames(gameId, game.searchKeys || [], 8);
    renderSimilarGames(similarGames);
}

function renderGameDetails(game) {
    document.title = (game.name || game.title) + " | alt games portal";
    document.getElementById("title").innerHTML = game.name || game.title;
    
    const iframeContent = `<iframe src="${game.url}" scrolling="no" allowfullscreen></iframe>`;
    document.getElementById("iframeContainer").innerHTML = iframeContent;
    
    // Show the fullscreen button once the game is loaded
    const fsBtn = document.getElementById("fullscreenBtn");
    if (fsBtn) fsBtn.classList.add('visible');

    if (game.description) {
        document.getElementById("description").innerHTML = game.description;
    }

    if (game.category) {
        const cat = Array.isArray(game.category) ? game.category[0] : game.category;
        document.getElementById("categoryBadge").innerHTML = `<span class="badge badge-primary rounded-pill px-3 py-2">${cat.toUpperCase()}</span>`;
    }

    // 3. Stats Rendering
    const stats = game.stats || {};
    
    // Ratings
    if (stats.averageRating !== undefined) {
        document.getElementById("ratingValue").innerHTML = Number(stats.averageRating).toFixed(1) + " ★";
    }

    // Favorites
    if (stats.favoriteCount !== undefined) {
        document.getElementById("favCount").innerHTML = stats.favoriteCount;
    }

    // AI Retro Text (Apply only if isAI is true, without adding/showing the AI Status field)
    if (game.isAI) {
        document.getElementById("title").classList.add("ai-retro-text");
    }

}

function renderSimilarGames(games) {
    const sidebar = document.getElementById("similarSidebar");
    const mobileGrid = document.getElementById("similarMobile");
    
    if (games.length === 0) {
        sidebar.innerHTML = '<p class="text-muted small">No similar games found.</p>';
        mobileGrid.innerHTML = '<p class="text-muted col-12">No similar games found.</p>';
        return;
    }

    sidebar.innerHTML = '';
    mobileGrid.innerHTML = '';

    games.forEach(game => {
        // Desktop Sidebar Item
        const sidebarHtml = `
            <div class="sidebar-item" onclick="window.open('/game/?id=${game.id}', '_self')">
                <img src="${game.imageUrl}" onerror="this.src='/images/cover.png'">
                <div>
                    <h6 class="mb-1">${game.name || game.title}</h6>
                    <span class="badge badge-dark small" style="font-size: 9px; opacity: 0.7;">${game.category && game.category[0] || 'Game'}</span>
                </div>
            </div>
        `;
        sidebar.innerHTML += sidebarHtml;

        // Mobile Grid Item (Using home screen card style)
        const mobileHtml = `
            <div class="col-6 p-2">
                <div class="game-card" onclick="window.open('/game/?id=${game.id}', '_self')">
                    <img src="${game.imageUrl}" onerror="this.src='/images/cover.png'">
                    <h6 style="font-size: 11px;">${game.name || game.title}</h6>
                </div>
            </div>
        `;
        mobileGrid.innerHTML += mobileHtml;
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
window.addEventListener('load', loadGamePage);
