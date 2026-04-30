const fs = require('fs');
const path = require('path');

const STATIC_SITEMAP_PATH = path.join(__dirname, '../sitemap-static.xml');
const BLOG_LIST_PATH = path.join(__dirname, '../blog/list.json');
const DOMAIN = 'https://gamesp.xyz';

function updateSitemap() {
    console.log("🛠️  Updating Blog Links in Static Sitemap...");

    if (!fs.existsSync(STATIC_SITEMAP_PATH)) {
        console.error("❌ sitemap-static.xml not found! Run generate_sitemap.js first.");
        return;
    }

    if (!fs.existsSync(BLOG_LIST_PATH)) {
        console.error("❌ blog/list.json not found! Run build-blog.js first.");
        return;
    }

    let sitemapContent = fs.readFileSync(STATIC_SITEMAP_PATH, 'utf-8');

    // 1. Remove all existing blog entries (URLs containing /blog/)
    const blogUrlRegex = /  <url>\s*<loc>https:\/\/gamesp\.xyz\/blog\/[\s\S]*?<\/url>\s*/g;
    sitemapContent = sitemapContent.replace(blogUrlRegex, '');

    // 2. Prepare new blog entries from list.json
    const blogs = JSON.parse(fs.readFileSync(BLOG_LIST_PATH, 'utf-8'));
    
    let newBlogXml = '';
    for (const blog of blogs) {
        const lastmod = blog.date || new Date().toISOString().split('T')[0];
        newBlogXml += `  <url>\n    <loc>${DOMAIN}${blog.url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    // 3. Inject new entries before the closing </urlset>
    if (sitemapContent.includes('</urlset>')) {
        sitemapContent = sitemapContent.replace('</urlset>', newBlogXml + '</urlset>');
    } else {
        console.error("❌ Invalid sitemap-static.xml format! Missing </urlset>.");
        return;
    }

    fs.writeFileSync(STATIC_SITEMAP_PATH, sitemapContent);
    console.log(`✅ Successfully updated sitemap-static.xml with ${blogs.length} blog posts.`);
}

updateSitemap();
