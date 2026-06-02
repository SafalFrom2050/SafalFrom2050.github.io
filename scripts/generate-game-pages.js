#!/usr/bin/env node
/**
 * generate-game-pages.js
 * 
 * Pre-renders static HTML for each game in the Firestore 'games' collection.
 * Generates SEO-optimized pages + sitemaps for GitHub Pages deployment.
 * 
 * Usage:
 *   npm run build          # Incremental (count check, skip if no new games)
 *   npm run build:full     # Force full re-fetch from Firestore
 */

const { initializeApp } = require('firebase/app');
const {
    getFirestore, collection, getDocs, query,
    orderBy, limit, startAfter, getCountFromServer
} = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// ── Firebase Config (same public config as the website) ──────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyCa21G1mEhrJKmoPLRZ8hbJikyI4lGdY5Y",
    authDomain: "dif-instantgames.firebaseapp.com",
    databaseURL: "https://dif-instantgames.firebaseio.com/",
    projectId: "dif-instantgames",
    storageBucket: "dif-instantgames.appspot.com",
    appId: "1:555879374010:web:405a0d17f2b1b20e85b683"
};

// ── Paths ────────────────────────────────────────────────────────────────────
const SCRIPTS_DIR = __dirname;
const ROOT_DIR = path.join(SCRIPTS_DIR, '..');
const GAME_DIR = path.join(ROOT_DIR, 'game');
const CACHE_PATH = path.join(SCRIPTS_DIR, 'games-cache.json');
const BUILD_META_PATH = path.join(SCRIPTS_DIR, 'build-meta.json');
const TEMPLATE_PATH = path.join(SCRIPTS_DIR, 'game-page-template.html');

const SITE_URL = 'https://gamesp.xyz';
const MAX_URLS_PER_SITEMAP = 5000;
const BATCH_SIZE = 500;

// ── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripHtml(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>?/gm, '');
}

function truncate(str, len) {
    if (!str) return '';
    const clean = stripHtml(str).trim();
    return clean.length <= len ? clean : clean.substring(0, len - 3) + '...';
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function log(msg) {
    console.log(`[build] ${msg}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const forceFullFetch = process.argv.includes('--full');

    // 1. Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    log('Firebase initialized.');

    // 2. Load existing cache
    let cache = { games: {}, count: 0, lastBuild: 0 };
    if (fs.existsSync(CACHE_PATH)) {
        try {
            cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
            log(`Loaded cache: ${Object.keys(cache.games).length} games, last build: ${new Date(cache.lastBuild).toISOString()}`);
        } catch (e) {
            log('Cache file corrupted. Starting fresh.');
            cache = { games: {}, count: 0, lastBuild: 0 };
        }
    } else {
        log('No cache found. Will do a full fetch.');
    }

    // 3. Determine if we need to fetch from Firestore
    let needsFetch = forceFullFetch || Object.keys(cache.games).length === 0;

    if (!needsFetch) {
        try {
            log('Checking game count on server...');
            const countSnap = await getCountFromServer(collection(db, 'games'));
            const serverCount = countSnap.data().count;
            if (serverCount !== cache.count) {
                log(`Game count changed: ${cache.count} → ${serverCount}. Will fetch new games.`);
                needsFetch = true;
            } else {
                log(`No new games detected (count: ${serverCount}). Skipping Firestore fetch.`);
            }
        } catch (e) {
            log(`Count check failed: ${e.message}. Will do a full fetch to be safe.`);
            needsFetch = true;
        }
    }

    if (needsFetch) {
        await fetchAllGames(db, cache);
    }

    // 4. Load template
    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error(`Template not found at ${TEMPLATE_PATH}`);
        process.exit(1);
    }
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    log('Template loaded.');

    // 5. Generate HTML pages
    generatePages(cache.games, template);

    // 6. Generate sitemaps
    generateSitemaps(cache.games);

    // 7. Save cache and build metadata
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache), 'utf8');
    fs.writeFileSync(BUILD_META_PATH, JSON.stringify({
        lastBuild: Date.now(),
        lastBuildISO: new Date().toISOString(),
        gameCount: Object.keys(cache.games).length
    }, null, 2), 'utf8');

    log(`✅ Done! ${Object.keys(cache.games).length} game pages ready.`);
    process.exit(0);
}

// ── Firestore Fetch ──────────────────────────────────────────────────────────
async function fetchAllGames(db, cache) {
    const existingIds = new Set(Object.keys(cache.games));
    let lastDoc = null;
    let totalFetched = 0;
    let newGames = 0;

    log('Fetching games from Firestore...');

    while (true) {
        let q;
        if (lastDoc) {
            q = query(collection(db, 'games'), orderBy('__name__'), startAfter(lastDoc), limit(BATCH_SIZE));
        } else {
            q = query(collection(db, 'games'), orderBy('__name__'), limit(BATCH_SIZE));
        }

        const snapshot = await getDocs(q);
        if (snapshot.empty) break;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const game = {
                id: docSnap.id,
                name: data.name || data.title || 'Untitled Game',
                description: data.description || '',
                imageUrl: data.imageUrl || `${SITE_URL}/images/cover.png`,
                category: data.category || [],
                url: data.url || '',
                isAI: data.isAI || false,
                stats: data.stats || {},
                searchKeys: data.searchKeys || []
            };

            if (!existingIds.has(docSnap.id)) {
                newGames++;
            }
            cache.games[docSnap.id] = game;
            totalFetched++;
        }

        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        if (totalFetched % 1000 === 0 || snapshot.docs.length < BATCH_SIZE) {
            log(`  Fetched ${totalFetched} games so far (${newGames} new)...`);
        }

        if (snapshot.docs.length < BATCH_SIZE) break;
    }

    cache.count = Object.keys(cache.games).length;
    cache.lastBuild = Date.now();
    log(`Fetch complete: ${totalFetched} total docs read, ${newGames} new games added. Cache now has ${cache.count} games.`);
}

// ── Page Generation ──────────────────────────────────────────────────────────
function generatePages(games, template) {
    const gameEntries = Object.values(games);
    let generated = 0;
    let skipped = 0;

    log(`Generating ${gameEntries.length} game pages...`);

    for (const game of gameEntries) {
        const dir = path.join(GAME_DIR, game.id);
        const filePath = path.join(dir, 'index.html');

        // Create directory if needed
        fs.mkdirSync(dir, { recursive: true });

        // Build SEO values
        const gameName = game.name || 'Untitled Game';
        const category = Array.isArray(game.category) ? (game.category[0] || 'Game') : (game.category || 'Game');
        const titleTag = `Play ${gameName} Free Online | alt games portal`;
        const canonicalUrl = `${SITE_URL}/game/${game.id}/`;
        const imageUrl = game.imageUrl || `${SITE_URL}/images/cover.png`;

        const rawDescPlain = stripHtml(game.description || '');
        const metaDescription = rawDescPlain.length > 10
            ? truncate(rawDescPlain, 160)
            : `Play ${gameName} instantly without installing. A premium ${category} game on alt games portal. No downloads required.`;

        const fullDescription = rawDescPlain.length > 10
            ? rawDescPlain
            : `Experience ${gameName}, a thrilling ${category} game on alt games portal. Play high-quality titles with no installations required. Whether you are looking for a quick session or deep strategic gameplay, ${gameName} offers an engaging experience designed for players of all skill levels.`;

        // Build JSON-LD schema
        const schema = buildSchema(game, canonicalUrl, metaDescription, imageUrl, category);

        // Build pre-render data for client-side JS
        const prerenderData = {
            id: game.id,
            name: game.name,
            url: game.url,
            imageUrl: imageUrl,
            category: game.category,
            description: game.description,
            isAI: game.isAI,
            stats: game.stats,
            searchKeys: game.searchKeys
        };

        // Replace all placeholders in template
        const html = template
            .replace(/%%TITLE_TAG%%/g, escapeHtml(titleTag))
            .replace(/%%META_DESCRIPTION%%/g, escapeHtml(metaDescription))
            .replace(/%%CANONICAL_URL%%/g, canonicalUrl)
            .replace(/%%GAME_TITLE%%/g, escapeHtml(gameName))
            .replace(/%%GAME_IMAGE%%/g, escapeHtml(imageUrl))
            .replace(/%%GAME_ID%%/g, game.id)
            .replace(/%%OG_TITLE%%/g, escapeHtml(titleTag))
            .replace(/%%OG_DESCRIPTION%%/g, escapeHtml(metaDescription))
            .replace(/%%OG_IMAGE%%/g, escapeHtml(imageUrl))
            .replace(/%%OG_URL%%/g, canonicalUrl)
            .replace(/%%TW_TITLE%%/g, escapeHtml(titleTag))
            .replace(/%%TW_DESCRIPTION%%/g, escapeHtml(metaDescription))
            .replace(/%%TW_IMAGE%%/g, escapeHtml(imageUrl))
            .replace(/%%SCHEMA_JSON%%/g, JSON.stringify(schema))
            .replace(/%%PRERENDER_JSON%%/g, JSON.stringify(prerenderData))
            .replace(/%%GAME_CATEGORY%%/g, escapeHtml(category))
            .replace(/%%GAME_CATEGORY_UPPER%%/g, escapeHtml(category.toUpperCase()))
            .replace(/%%AI_TITLE_CLASS%%/g, game.isAI ? ' ai-retro-text' : '')
            .replace(/%%NOSCRIPT_DESCRIPTION%%/g, escapeHtml(truncate(fullDescription, 300)));

        fs.writeFileSync(filePath, html, 'utf8');
        generated++;

        if (generated % 2000 === 0) {
            log(`  Generated ${generated}/${gameEntries.length} pages...`);
        }
    }

    log(`Page generation complete: ${generated} pages written.`);
}

function buildSchema(game, url, description, image, category) {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "VideoGame",
                "name": game.name,
                "description": description,
                "url": url,
                "image": image,
                "genre": category,
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
                    "url": `${SITE_URL}/`
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                    { "@type": "ListItem", "position": 2, "name": "Game Library", "item": `${SITE_URL}/library/` },
                    { "@type": "ListItem", "position": 3, "name": game.name, "item": url }
                ]
            }
        ]
    };

    const stats = game.stats || {};
    if (stats.averageRating !== undefined && stats.favoriteCount > 0) {
        schema["@graph"][0].aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": stats.averageRating.toString(),
            "ratingCount": stats.favoriteCount.toString(),
            "bestRating": "5"
        };
    }

    return schema;
}

// ── Sitemap Generation ───────────────────────────────────────────────────────
function generateSitemaps(games) {
    const today = todayISO();
    const gameEntries = Object.values(games);

    log('Generating sitemaps...');

    // 1. Generate sitemap-static.xml (de-duplicated)
    const staticUrls = [
        { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
        { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.7' },
        { loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.5' },
        { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: '0.4' },
        { loc: `${SITE_URL}/terms`, changefreq: 'monthly', priority: '0.4' },
        { loc: `${SITE_URL}/library/`, changefreq: 'daily', priority: '0.9' },
        { loc: `${SITE_URL}/bio`, changefreq: 'weekly', priority: '0.8' },
        { loc: `${SITE_URL}/blog/`, changefreq: 'weekly', priority: '0.7' },
    ];

    // Add blog posts (scan the blog directory for .html files)
    const blogDir = path.join(ROOT_DIR, 'blog');
    if (fs.existsSync(blogDir)) {
        const blogFiles = fs.readdirSync(blogDir)
            .filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'template.html');

        for (const file of blogFiles) {
            staticUrls.push({
                loc: `${SITE_URL}/blog/${file}`,
                changefreq: 'monthly',
                priority: '0.7'
            });
        }
    }

    writeUrlsetSitemap(path.join(ROOT_DIR, 'sitemap-static.xml'), staticUrls, today);
    log(`  sitemap-static.xml: ${staticUrls.length} URLs`);

    // 2. Generate sitemap-games-*.xml (split into chunks of MAX_URLS_PER_SITEMAP)
    const gameChunks = [];
    for (let i = 0; i < gameEntries.length; i += MAX_URLS_PER_SITEMAP) {
        gameChunks.push(gameEntries.slice(i, i + MAX_URLS_PER_SITEMAP));
    }

    const sitemapFiles = [
        { loc: `${SITE_URL}/sitemap-static.xml`, lastmod: today }
    ];

    for (let i = 0; i < gameChunks.length; i++) {
        const filename = `sitemap-games-${i + 1}.xml`;
        const urls = gameChunks[i].map(game => ({
            loc: `${SITE_URL}/game/${game.id}/`,
            changefreq: 'monthly',
            priority: '0.6'
        }));

        writeUrlsetSitemap(path.join(ROOT_DIR, filename), urls, today);
        sitemapFiles.push({ loc: `${SITE_URL}/${filename}`, lastmod: today });
        log(`  ${filename}: ${urls.length} URLs`);
    }

    // Clean up old game sitemap files that are no longer needed
    const existingFiles = fs.readdirSync(ROOT_DIR).filter(f => /^sitemap-games-\d+\.xml$/.test(f));
    for (const file of existingFiles) {
        const num = parseInt(file.match(/\d+/)[0]);
        if (num > gameChunks.length) {
            fs.unlinkSync(path.join(ROOT_DIR, file));
            log(`  Removed stale ${file}`);
        }
    }

    // 3. Generate sitemap.xml (sitemap index)
    writeSitemapIndex(path.join(ROOT_DIR, 'sitemap.xml'), sitemapFiles);
    log(`  sitemap.xml: ${sitemapFiles.length} child sitemaps`);

    log('Sitemap generation complete.');
}

function writeUrlsetSitemap(filePath, urls, lastmod) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const url of urls) {
        xml += '  <url>\n';
        xml += `    <loc>${url.loc}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
        xml += `    <priority>${url.priority}</priority>\n`;
        xml += '  </url>\n';
    }

    xml += '</urlset>\n';
    fs.writeFileSync(filePath, xml, 'utf8');
}

function writeSitemapIndex(filePath, sitemaps) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const sm of sitemaps) {
        xml += '  <sitemap>\n';
        xml += `    <loc>${sm.loc}</loc>\n`;
        xml += `    <lastmod>${sm.lastmod}</lastmod>\n`;
        xml += '  </sitemap>\n';
    }

    xml += '</sitemapindex>\n';
    fs.writeFileSync(filePath, xml, 'utf8');
}

// ── Run ──────────────────────────────────────────────────────────────────────
main().catch(err => {
    console.error('[build] Fatal error:', err);
    process.exit(1);
});
