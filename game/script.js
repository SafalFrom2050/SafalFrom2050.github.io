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
    document.getElementById("gameView").innerHTML = iframeContent;

    if (game.description) {
        document.getElementById("description").innerHTML = game.description;
    }

    if (game.category) {
        const cat = Array.isArray(game.category) ? game.category[0] : game.category;
        document.getElementById("categoryBadge").innerHTML = `<span class="badge badge-primary rounded-pill px-3 py-2">${cat.toUpperCase()}</span>`;
    }

    if (game.quality_score) {
        document.getElementById("qualityScore").innerHTML = game.quality_score;
    }

    if (game.isAI) {
        const aiStatus = document.getElementById("aiStatus");
        aiStatus.innerHTML = "Yes";
        aiStatus.classList.add("text-primary");
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

// Global scope initialization
window.addEventListener('load', loadGamePage);
