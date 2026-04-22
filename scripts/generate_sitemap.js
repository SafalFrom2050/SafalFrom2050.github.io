const https = require('https');
const fs = require('fs');

const PROJECT_ID = 'dif-instantgames';
const DOMAIN = 'https://gamesp.xyz';

// List of static pages
const staticPages = [
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/library/',
    '/bio',
    '/blog/'
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
                // Return just the ID (last part of name)
                const parts = doc.name.split('/');
                return parts[parts.length - 1];
            }));
        }
        
        nextPageToken = data.nextPageToken;
        console.log(`Fetched ${allGames.length} games so far...`);
        
    } while (nextPageToken);

    return allGames;
}

async function generateSitemap() {
    try {
        const gameIds = await fetchAllGames();
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Add static pages
        for (const page of staticPages) {
            xml += `  <url>\n    <loc>${DOMAIN}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${page === '/' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
        }

        // Add game pages
        const currentDate = new Date().toISOString().split('T')[0];
        // Ensure unique game IDs
        const uniqueIds = [...new Set(gameIds)];
        for (const id of uniqueIds) {
            xml += `  <url>\n    <loc>${DOMAIN}/game/?id=${id}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        }

        // Add blog posts
        if (fs.existsSync('blog/list.json')) {
            const blogs = JSON.parse(fs.readFileSync('blog/list.json', 'utf-8'));
            for (const blog of blogs) {
                xml += `  <url>\n    <loc>${DOMAIN}${blog.url}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
            }
        }

        xml += `</urlset>`;

        fs.writeFileSync('sitemap.xml', xml);
        console.log(`Successfully generated sitemap.xml with ${staticPages.length + uniqueIds.length} URLs.`);
        
    } catch (err) {
        console.error("Error generating sitemap:", err);
    }
}

generateSitemap();
