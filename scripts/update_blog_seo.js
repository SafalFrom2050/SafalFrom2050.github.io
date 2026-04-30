/**
 * Batch-update all existing blog HTML files with SEO enhancements:
 * - Add canonical URL
 * - Add og:type=article, og:url, og:site_name
 * - Add Twitter Card meta tags
 * - Fix relative og:image URLs to absolute
 * - Add BlogPosting + BreadcrumbList JSON-LD schema
 */
const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://gamesp.xyz';
const blogDir = path.join(__dirname, '..', 'blog');
const listFile = path.join(blogDir, 'list.json');

const blogs = JSON.parse(fs.readFileSync(listFile, 'utf-8'));

let updatedCount = 0;

for (const blog of blogs) {
    const filePath = path.join(__dirname, '..', blog.url.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
        console.log(`SKIP: ${blog.url} (file not found)`);
        continue;
    }

    let html = fs.readFileSync(filePath, 'utf-8');
    const canonicalUrl = `${DOMAIN}${blog.url}`;
    const absoluteImage = blog.imageUrl.startsWith('http') ? blog.imageUrl : `${DOMAIN}${blog.imageUrl}`;
    const snippet = blog.review || blog.title;

    // Skip if already has twitter:card (already processed)
    if (html.includes('twitter:card')) {
        console.log(`SKIP: ${blog.url} (already has Twitter Cards)`);
        continue;
    }

    // 1. Fix relative og:image to absolute
    html = html.replace(
        /<meta property="og:image" content="([^"]*)">/,
        `<meta property="og:image" content="${absoluteImage}">`
    );

    // 2. Add canonical, og:type, og:url, og:site_name, Twitter Cards, and JSON-LD after the description meta
    const descriptionTag = html.match(/<meta name="description" content="[^"]*">/);
    if (descriptionTag) {
        const insertAfter = descriptionTag[0];
        const seoBlock = `${insertAfter}
    <link rel="canonical" href="${canonicalUrl}">
    
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="alt games portal">`;

        html = html.replace(insertAfter, seoBlock);
    }

    // 3. Add og:url after og:description if not present
    if (!html.includes('og:url')) {
        const ogDescMatch = html.match(/<meta property="og:description" content="[^"]*">/);
        if (ogDescMatch) {
            html = html.replace(
                ogDescMatch[0],
                `${ogDescMatch[0]}\n    <meta property="og:url" content="${canonicalUrl}">`
            );
        }
    }

    // 4. Add Twitter Cards before apple-touch-icon
    const appleTouchLine = `<link rel="apple-touch-icon"`;
    if (html.includes(appleTouchLine) && !html.includes('twitter:card')) {
        html = html.replace(
            appleTouchLine,
            `<meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${blog.title}">
    <meta name="twitter:description" content="${snippet.substring(0, 150)}">
    <meta name="twitter:image" content="${absoluteImage}">
    
    ${appleTouchLine}`
        );
    }

    // 5. Add BlogPosting + BreadcrumbList JSON-LD before Google Fonts comment
    if (!html.includes('BlogPosting')) {
        const fontComment = '<!-- Google Fonts -->';
        const jsonLd = `<!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          "headline": "${blog.title.replace(/"/g, '\\"')}",
          "description": "${snippet.replace(/"/g, '\\"').substring(0, 200)}",
          "image": "${absoluteImage}",
          "datePublished": "${blog.date}",
          "author": { "@type": "Organization", "name": "alt games portal", "url": "https://gamesp.xyz/" },
          "publisher": {
            "@type": "Organization",
            "name": "alt games portal",
            "url": "https://gamesp.xyz/",
            "logo": { "@type": "ImageObject", "url": "https://gamesp.xyz/images/cover.png" }
          },
          "mainEntityOfPage": "${canonicalUrl}"
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gamesp.xyz/" },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://gamesp.xyz/blog/" },
            { "@type": "ListItem", "position": 3, "name": "${blog.title.replace(/"/g, '\\"')}", "item": "${canonicalUrl}" }
          ]
        }
      ]
    }
    </script>
    
    ${fontComment}`;

        html = html.replace(fontComment, jsonLd);
    }

    fs.writeFileSync(filePath, html, 'utf-8');
    updatedCount++;
    console.log(`UPDATED: ${blog.url}`);
}

console.log(`\nDone! Updated ${updatedCount} blog posts.`);
