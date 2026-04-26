const fs = require('fs');
const path = require('path');

const SITEMAP_PATH = path.join(__dirname, '../sitemap.xml');
const BLOG_LIST_PATH = path.join(__dirname, '../blog/list.json');
const DOMAIN = 'https://gamesp.xyz';

function updateSitemap() {
    console.log("🛠️  Updating Blog Links in Sitemap...");

    if (!fs.existsSync(SITEMAP_PATH)) {
        console.error("❌ sitemap.xml not found! Run generate_sitemap.js first.");
        return;
    }

    if (!fs.existsSync(BLOG_LIST_PATH)) {
        console.error("❌ blog/list.json not found! Run build-blog.js first.");
        return;
    }

    let sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf-8');

    // 1. Remove all existing blog entries
    // This regex looks for <url> blocks containing /blog/
    const blogUrlRegex = /<url>\s*<loc>https:\/\/gamesp\.xyz\/blog\/[\s\S]*?<\/url>\s*/g;
    sitemapContent = sitemapContent.replace(blogUrlRegex, '');

    // 2. Prepare new blog entries
    const blogs = JSON.parse(fs.readFileSync(BLOG_LIST_PATH, 'utf-8'));
    const currentDate = new Date().toISOString().split('T')[0];
    
    let newBlogXml = '';
    for (const blog of blogs) {
        newBlogXml += `  <url>\n    <loc>${DOMAIN}${blog.url}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    // 3. Inject new entries before the closing </urlset>
    if (sitemapContent.includes('</urlset>')) {
        sitemapContent = sitemapContent.replace('</urlset>', newBlogXml + '</urlset>');
    } else {
        sitemapContent += newBlogXml + '</urlset>';
    }

    fs.writeFileSync(SITEMAP_PATH, sitemapContent);
    console.log(`✅ Successfully updated sitemap.xml with ${blogs.length} blog posts (Firestore skipped).`);
}

updateSitemap();
