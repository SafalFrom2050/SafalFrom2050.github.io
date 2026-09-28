/**
 * ai-game-sw.js
 * Service Worker to proxy AI Game requests from a virtual path to Firebase Storage.
 * Includes persistent caching to minimize Firebase Storage read costs.
 */

const CACHE_NAME = 'ai-game-assets-v1';
const G_REGISTRY = new Map();

function unavailableResponse(fileName, status) {
    if (fileName !== 'index.html') {
        return new Response('Game asset unavailable', { status });
    }

    return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Game unavailable</title><style>
body{box-sizing:border-box;min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;background:#090a0e;color:#e0e0e0;font:16px/1.5 system-ui,sans-serif;text-align:center}
main{max-width:360px;padding:28px;border:1px solid #343a46;border-radius:28px;background:#191c24}
h1{margin:0 0 10px;color:#fff;font-size:23px;line-height:1.2}p{margin:0 0 22px;color:#c4c8d0}
button{min-height:48px;padding:10px 24px;border:1px solid #3475a8;border-radius:20px;background:#3475a8;color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer}
button:hover{background:#2d6795}button:focus-visible{outline:3px solid #6bb6ff;outline-offset:3px}
</style></head><body><main><h1>Game could not load</h1><p>We couldn't fetch this game's files. Try again, or close this preview to choose another game.</p><button type="button" onclick="location.reload()">Try again</button></main></body></html>`, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
    });
}

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Listen for manifests from the main page
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'REGISTER_GAME') {
        const { projectId, manifest } = event.data;
        console.log(`[SW] Registering game: ${projectId}`, manifest);
        G_REGISTRY.set(projectId, manifest);
    }
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Check if the request is for our virtual game runtime path
    const runtimeMatch = url.pathname.match(/^\/ai-game-runtime\/([^\/]+)\/(.+)$/);
    
    if (runtimeMatch) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                // 1. Try to find in cache first
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                // 2. If not in cache, get from registry and fetch
                const [_, projectId, fileName] = runtimeMatch;
                const manifest = G_REGISTRY.get(projectId);
                
                if (manifest && manifest[fileName]) {
                    const realUrl = manifest[fileName];
                    
                    try {
                        const response = await fetch(realUrl, { mode: 'cors', credentials: 'omit' });
                        if (!response.ok) throw new Error(`Asset request returned ${response.status}`);
                        const body = await response.blob();
                        const newResponse = new Response(body, {
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers
                        });

                        // 3. Save to cache before returning
                        cache.put(event.request, newResponse.clone());
                        return newResponse;
                    } catch (err) {
                        console.error(`[SW] Failed to fetch proxy URL for ${fileName}:`, err);
                        return unavailableResponse(fileName, 502);
                    }
                } else {
                    console.warn(`[SW] No manifest entry for: ${projectId} -> ${fileName}`);
                    return unavailableResponse(fileName, 404);
                }
            })
        );
    }
});
