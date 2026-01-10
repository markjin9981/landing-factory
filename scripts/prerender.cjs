const fs = require('fs');
const path = require('path');

// Configuration
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzzlSQqgxbVjo1zlBG11OyQmAUJUX6rF4-EDslma5lzc_56kIeHycbIFJjcuFKvZ0v4/exec";
const DIST_DIR = path.join(__dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');
const NOT_FOUND_PATH = path.join(DIST_DIR, '404.html');

// Helper to fetch data
async function fetchConfigs() {
    try {
        console.log("🌐 Fetching landing pages from Google Sheets...");
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?type=configs`);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const data = await response.json();

        if (Array.isArray(data)) {
            // Convert array to object keyed by ID
            const configMap = {};
            data.forEach(c => configMap[c.id] = c);
            console.log(`✅ Successfully fetched ${data.length} configs from remote.`);
            return configMap;
        }
        return {};
    } catch (e) {
        console.error("⚠️ CRITICAL: Failed to fetch from Google Sheets:", e.message);
        // Important: If we cannot fetch remote configs, we shouldn't just silently deploy nothing.
        // We should probably fail the build or at least warn very loudly.
        // However, if the user has NO internet or API is down, maybe they want to deploy local only?
        // Let's at least log it very clearly.
        console.warn("   Falling back to local data/landingConfigs.json only.");

        // [MODIFIED] Throw error if in CI environment to prevent deploying empty site
        if (process.env.CI) {
            console.error("❌ Blocking deployment because remote configs could not be fetched.");
            process.exit(1);
        }

        return {};
    }
}

async function prerender() {
    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error("❌ dist/index.html not found. Run 'npm run build' first.");
        process.exit(1);
    }

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

    // 1. Create 404.html for SPA fallback
    fs.writeFileSync(NOT_FOUND_PATH, template);
    console.log("✅ Created dist/404.html for SPA fallback");

    // 1.1 Create .nojekyll to bypass Jekyll processing (Fixes file ignore issues)
    fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '');
    console.log("✅ Created dist/.nojekyll");

    // 2. Load Local Configs (Manual Overrides)
    let localConfigs = {};
    try {
        localConfigs = require('../data/landingConfigs.json');
    } catch (e) { /* ignore */ }

    // 3. Load Remote Configs
    const remoteConfigs = await fetchConfigs();

    // Merge: Local overrides Remote
    const combinedConfigs = { ...remoteConfigs, ...localConfigs };
    const configIds = Object.keys(combinedConfigs);

    if (configIds.length === 0) {
        console.log("⚠️ No landing configs found anywhere. Skipping individual pre-rendering.");
        return;
    }

    console.log(`🚀 Pre-rendering ${configIds.length} landing pages...`);

    let successCount = 0;
    for (const id of configIds) {
        try {
            const config = combinedConfigs[id];

            // Prepare metadata
            const pageTitle = config.title || config.hero?.headline || "Landing Page";
            const ogTitle = config.ogTitle || pageTitle;
            const desc = config.ogDescription || config.hero?.subHeadline || "";
            const image = config.ogImage || "";
            const favicon = config.favicon || "";

            // Inject Metadata
            let html = template;

            // Allow for <title> replacement even if it has attributes
            html = html.replace(/<title[^>]*>.*?<\/title>/, `<title>${pageTitle}</title>`);

            // [FIX] Remove existing OG/Twitter tags to prevent duplicates (Kakao Issue)
            html = html.replace(/<meta property="og:.*?>/g, '');
            html = html.replace(/<meta name="twitter:.*?>/g, '');
            html = html.replace(/<meta name="description".*?>/g, '');

            // Inject Meta Tags before </head>
            const metaTags = `
    <!-- Pre-rendered SEO Tags -->
    <meta name="description" content="${desc.replace(/"/g, '&quot;')}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;')}">
    <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">
    ${image ? `<meta property="og:image" content="${image}">` : ''}
    <meta name="twitter:title" content="${ogTitle.replace(/"/g, '&quot;')}">
    <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}">
    ${image ? `<meta name="twitter:image" content="${image}">` : ''}

    <!-- Search Engine Verification -->
    ${config.naverVerification || ''}
    ${config.googleVerification || ''}

    <!-- Dynamic Favicon -->
    ${favicon ? `<link rel="icon" href="${favicon}" />` : ''}
            `;

            html = html.replace('</head>', `${metaTags}</head>`);

            // Create directory
            const dir = path.join(DIST_DIR, id);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write index.html
            fs.writeFileSync(path.join(dir, 'index.html'), html);
            successCount++;
        } catch (err) {
            console.error(`❌ Error rendering page ${id}:`, err);
        }
    }

    console.log(`🎉 Pre-rendering complete! Generated ${successCount} pages.`);
}

prerender();
