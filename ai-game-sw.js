/**
 * ai-game-sw.js
 * Service Worker to proxy AI Game requests from a virtual path to Firebase Storage.
 * Includes persistent caching to minimize Firebase Storage read costs.
 */

const CACHE_NAME = 'ai-game-assets-v1';
const G_REGISTRY = new Map();

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
                        return new Response(`Error loading ${fileName}`, { status: 502 });
                    }
                } else {
                    console.warn(`[SW] No manifest entry for: ${projectId} -> ${fileName}`);
                    return new Response(`File ${fileName} not in manifest`, { status: 404 });
                }
            })
        );
    }
});
