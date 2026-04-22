const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../blog/posts');
const TEMPLATE_PATH = path.join(__dirname, '../blog/template.html');
const OUTPUT_DIR = path.join(__dirname, '../blog');
const LIST_JSON_PATH = path.join(__dirname, '../blog/list.json');

// Simple Markdown to HTML parser
function parseMarkdown(md) {
    return md
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2">')
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
        .replace(/\n/gim, '<br>');
}

// Simple YAML Frontmatter parser
function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return { data: {}, content };

    const data = {};
    const lines = match[1].split('\n');
    lines.forEach(line => {
        const [key, ...value] = line.split(':');
        if (key && value) {
            data[key.trim()] = value.join(':').trim().replace(/^["']|["']$/g, '');
        }
    });

    return {
        data,
        content: content.replace(match[0], '').trim()
    };
}

function build() {
    console.log("🚀 Starting Blog Build...");

    if (!fs.existsSync(POSTS_DIR)) {
        console.error("Posts directory not found!");
        return;
    }

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
    const blogList = [];

    files.forEach(file => {
        const filePath = path.join(POSTS_DIR, file);
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = parseFrontmatter(rawContent);
        
        const slug = file.replace('.md', '');
        const htmlContent = parseMarkdown(content);
        
        // Inject data into template
        let output = template;
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            output = output.replace(regex, data[key]);
        });
        
        // Handle conditional block for featured game
        if (data.featuredGameId) {
            output = output.replace(/{{#if featuredGameId}}([\s\S]*?){{\/if}}/g, '$1');
        } else {
            output = output.replace(/{{#if featuredGameId}}([\s\S]*?){{\/if}}/g, '');
        }

        output = output.replace('{{content}}', htmlContent);
        output = output.replace('{{description}}', data.review || data.title);
        output = output.replace('{{snippet}}', data.review ? data.review.substring(0, 160) : '');

        const outputFileName = `${slug}.html`;
        fs.writeFileSync(path.join(OUTPUT_DIR, outputFileName), output);
        
        console.log(`✅ Generated: ${outputFileName}`);

        blogList.push({
            id: slug,
            ...data,
            url: `/blog/${outputFileName}`
        });
    });

    // Sort by date descending
    blogList.sort((a, b) => new Date(b.date) - new Date(a.date));

    fs.writeFileSync(LIST_JSON_PATH, JSON.stringify(blogList, null, 2));
    console.log(`\n🎉 Blog build complete! ${blogList.length} posts processed.`);

    // Automatically update sitemap
    try {
        console.log("\n📡 Triggering Sitemap Update...");
        require('./update-blog-sitemap.js');
    } catch (e) {
        console.error("Failed to update sitemap:", e);
    }
}

build();
