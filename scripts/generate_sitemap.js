const https = require('https');
const fs = require('fs');

const PROJECT_ID = 'dif-instantgames';
const DOMAIN = 'https://gamesp.xyz';
const GAMES_PER_SITEMAP = 5000;

// List of static pages with their priorities
const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/contact', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.4', changefreq: 'monthly' },
    { path: '/terms', priority: '0.4', changefreq: 'monthly' },
    { path: '/library/', priority: '0.9', changefreq: 'daily' },
    { path: '/bio', priority: '0.8', changefreq: 'weekly' },
    { path: '/blog/', priority: '0.8', changefreq: 'weekly' }
];

async function fetchAllGames() {
    let allGames = [];
    let nextPageToken = null;
    
    console.log("Fetching games from Firestore...");
    
    do {
        let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/games?pageSize=300`;
        if (nextPageToken) {
            url += `&pageToken=${encodeURIComponent(nextPageToken)}`;
        }

        const data = await new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve(JSON.parse(body)));
            }).on('error', reject);
        });

        if (data.documents) {
            allGames = allGames.concat(data.documents.map(doc => {
                const parts = doc.name.split('/');
                return parts[parts.length - 1];
            }));
        }
        
        nextPageToken = data.nextPageToken;
        console.log(`Fetched ${allGames.length} games so far...`);
        
    } while (nextPageToken);

    return allGames;
}

function buildUrlEntry(loc, options = {}) {
    let entry = `  <url>\n    <loc>${loc}</loc>\n`;
    if (options.lastmod) entry += `    <lastmod>${options.lastmod}</lastmod>\n`;
    if (options.changefreq) entry += `    <changefreq>${options.changefreq}</changefreq>\n`;
    if (options.priority) entry += `    <priority>${options.priority}</priority>\n`;
    entry += `  </url>\n`;
    return entry;
}

function buildSitemap(entries) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}</urlset>`;
}

function buildSitemapIndex(sitemapFiles, currentDate) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const file of sitemapFiles) {
        xml += `  <sitemap>\n    <loc>${DOMAIN}/${file}</loc>\n    <lastmod>${currentDate}</lastmod>\n  </sitemap>\n`;
    }
    xml += `</sitemapindex>`;
    return xml;
}

async function generateSitemap() {
    try {
        const gameIds = await fetchAllGames();
        const uniqueIds = [...new Set(gameIds)];
        const currentDate = new Date().toISOString().split('T')[0];
        const sitemapFiles = [];

        // 1. Build sitemap-static.xml (static pages + blog posts)
        let staticEntries = '';
        for (const page of staticPages) {
            staticEntries += buildUrlEntry(`${DOMAIN}${page.path}`, {
                lastmod: currentDate,
                changefreq: page.changefreq,
                priority: page.priority
            });
        }

        // Add blog posts
        if (fs.existsSync('blog/list.json')) {
            const blogs = JSON.parse(fs.readFileSync('blog/list.json', 'utf-8'));
            for (const blog of blogs) {
                staticEntries += buildUrlEntry(`${DOMAIN}${blog.url}`, {
                    lastmod: blog.date || currentDate,
                    changefreq: 'monthly',
                    priority: '0.7'
                });
            }
        }

        fs.writeFileSync('sitemap-static.xml', buildSitemap(staticEntries));
        sitemapFiles.push('sitemap-static.xml');
        console.log(`Generated sitemap-static.xml (${staticPages.length} static pages + blog posts)`);

        // 2. Build chunked game sitemaps
        const totalChunks = Math.ceil(uniqueIds.length / GAMES_PER_SITEMAP);
        for (let i = 0; i < totalChunks; i++) {
            const chunk = uniqueIds.slice(i * GAMES_PER_SITEMAP, (i + 1) * GAMES_PER_SITEMAP);
            let gameEntries = '';
            for (const id of chunk) {
                gameEntries += buildUrlEntry(`${DOMAIN}/game/?id=${id}`, {
                    lastmod: currentDate,
                    changefreq: 'monthly',
                    priority: '0.6'
                });
            }
            const filename = `sitemap-games-${i + 1}.xml`;
            fs.writeFileSync(filename, buildSitemap(gameEntries));
            sitemapFiles.push(filename);
            console.log(`Generated ${filename} (${chunk.length} games)`);
        }

        // 3. Build sitemap index
        const indexXml = buildSitemapIndex(sitemapFiles, currentDate);
        fs.writeFileSync('sitemap.xml', indexXml);

        const totalUrls = staticPages.length + uniqueIds.length;
        console.log(`\nSuccessfully generated sitemap index with ${sitemapFiles.length} child sitemaps (${totalUrls} total URLs).`);
        
    } catch (err) {
        console.error("Error generating sitemap:", err);
    }
}

generateSitemap();
