/**
 * firestoreService.js
 * Handles all data fetching from Firebase Firestore for the Home Screen.
 */

// We use getters to ensure firebase is initialized before accessing its services
const firestoreService = {
    get db() {
        return firebase.firestore();
    },
    get rtdb() {
        return firebase.database();
    },

    // 1. Fetch AI Games (Logic from /bio)
    fetchAIGames: async function(limit = 10) {
        try {
            const querySnapshot = await this.db.collection('ai_games')
                .where('isPublished', '==', true)
                .where('publishStatus', '==', 'complete')
                .where('bio_shared', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            const games = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                games.push({
                    id: doc.id,
                    title: data.title,
                    category: data.category || 'AI Game',
                    imageUrl: (data.screenshotUrls && data.screenshotUrls.length > 0) ? data.screenshotUrls[0] : '/images/cover.png',
                    description: data.description,
                    isAI: true
                });
            });
            return games;
        } catch (error) {
            console.error("Error fetching AI games:", error);
            return [];
        }
    },

    // 2. Fetch Discover Cards
    fetchDiscoverCards: async function() {
        try {
            const querySnapshot = await this.db.collection('discover-cards')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();
            
            const cards = [];
            querySnapshot.forEach(doc => {
                cards.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return cards;
        } catch (error) {
            console.error("Error fetching discover cards:", error);
            return [];
        }
    },

    // 3. Fetch Games by Multiple Categories (Optimized)
    fetchGamesByCategories: async function(categories, limitTotal = 15) {
        try {
            let allGameIds = [];
            
            for (const categoryId of categories) {
                const doc = await this.db.collection('categories').doc(categoryId.toLowerCase()).get();
                if (doc.exists) {
                    const games = doc.data().games || [];
                    allGameIds = allGameIds.concat(games);
                }
            }

            const uniqueIds = [...new Set(allGameIds)];
            if (uniqueIds.length === 0) return [];

            // Return up to limitTotal games from the pool
            return await this.fetchGamesByIds(uniqueIds.slice(0, limitTotal));
        } catch (error) {
            console.error("Error fetching games by categories:", error);
            return [];
        }
    },

    // 3.1 Fetch Games by IDs (Batch)
    fetchGamesByIds: async function(ids) {
        if (!ids || ids.length === 0) return [];
        try {
            const chunks = [];
            for (let i = 0; i < ids.length; i += 30) {
                chunks.push(ids.slice(i, i + 30));
            }

            const allGames = [];
            for (const chunk of chunks) {
                const snapshot = await this.db.collection('games')
                    .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
                    .get();
                
                snapshot.forEach(doc => {
                    allGames.push({ id: doc.id, ...doc.data() });
                });
            }
            
            return allGames;
        } catch (error) {
            console.error("Error batch fetching games:", error);
            return [];
        }
    },

    // 4. Fetch Paginated Games (Main Grid)
    fetchGamesPaginated: async function(category = 'all', lastVisible = null, limit = 24) {
        try {
            let query;
            if (category === 'all') {
                // Use documentId for stable pagination without requiring composite indexes
                query = this.db.collection('games')
                    .orderBy(firebase.firestore.FieldPath.documentId());
            } else {
                const catDoc = await this.db.collection('categories').doc(category.toLowerCase()).get();
                if (!catDoc.exists) return { games: [], lastVisible: null };
                
                const gameIds = catDoc.data().games || [];
                const startIndex = lastVisible ? lastVisible : 0;
                const batchIds = gameIds.slice(startIndex, startIndex + limit);
                
                if (batchIds.length === 0) return { games: [], lastVisible: null };
                
                const games = await this.fetchGamesByIds(batchIds);
                
                return {
                    games,
                    lastVisible: startIndex + limit < gameIds.length ? startIndex + limit : null
                };
            }

            if (lastVisible) {
                query = query.startAfter(lastVisible);
            }
            
            const snapshot = await query.limit(limit).get();
            const games = [];
            snapshot.forEach(doc => {
                games.push({ id: doc.id, ...doc.data() });
            });

            return {
                games,
                lastVisible: snapshot.docs[snapshot.docs.length - 1] || null
            };
        } catch (error) {
            console.error("Error fetching paginated games:", error);
            return { games: [], lastVisible: null };
        }
    },

    // 4.1 NEW: Fetch Games with Randomization and 24h Cache
    fetchGamesWithCache: async function(category = 'all', batchSize = 120) {
        const CACHE_KEY = `game_cache_${category}`;
        const PAGINATION_KEY = `game_pagination_${category}`;
        const EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
        
        // 1. Check Cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                const now = Date.now();
                if (now - data.timestamp < EXPIRATION && data.items && data.items.length > 0) {
                    console.log(`[Cache] Using cached selection for ${category}`);
                    return data.items;
                }
            } catch (e) { console.warn("Cache parsing failed", e); }
        }

        // 2. Cache expired or missing: Fetch new batch
        console.log(`[Cache] Fetching fresh batch for ${category}...`);
        
        let lastVisibleSerial = null;
        try {
            lastVisibleSerial = JSON.parse(localStorage.getItem(PAGINATION_KEY));
        } catch (e) {}

        let resultGames = [];
        let nextVisibleState = null;

        if (category === 'all') {
            let query = this.db.collection('games')
                .orderBy(firebase.firestore.FieldPath.documentId());

            if (lastVisibleSerial && lastVisibleSerial.id) {
                try {
                    // Fetch the document to use as a pivot snapshot (stable, no extra index needed)
                    const pivotDoc = await this.db.collection('games').doc(lastVisibleSerial.id).get();
                    if (pivotDoc.exists) {
                        query = query.startAfter(pivotDoc);
                    }
                } catch (e) { console.warn("[Cache] Pivot fetch failed", e); }
            }

            let snapshot = await query.limit(batchSize).get();
            
            // Handle Wrap-around if we hit the end
            if (snapshot.empty && lastVisibleSerial) {
                console.log("[Cache] End reached. Wrapping around to start.");
                snapshot = await this.db.collection('games')
                    .orderBy(firebase.firestore.FieldPath.documentId())
                    .limit(batchSize).get();
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                resultGames.push({ id: doc.id, ...data });
            });

            if (snapshot.docs.length > 0) {
                const lastDoc = snapshot.docs[snapshot.docs.length - 1];
                nextVisibleState = { 
                    id: lastDoc.id 
                };
            }
        } else {
            // Category specific (indexed pagination)
            const catDoc = await this.db.collection('categories').doc(category.toLowerCase()).get();
            if (!catDoc.exists) return [];
            
            const gameIds = catDoc.data().games || [];
            const startIndex = lastVisibleSerial || 0;
            let batchIds = gameIds.slice(startIndex, startIndex + batchSize);
            
            // Wrap around
            if (batchIds.length === 0 && startIndex > 0) {
                batchIds = gameIds.slice(0, batchSize);
                nextVisibleState = batchIds.length;
            } else {
                nextVisibleState = (startIndex + batchIds.length) % gameIds.length;
            }
            
            if (batchIds.length > 0) {
                resultGames = await this.fetchGamesByIds(batchIds);
            }
        }

        // 3. Update Storage
        if (resultGames.length > 0) {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                items: resultGames,
                timestamp: Date.now()
            }));
            localStorage.setItem(PAGINATION_KEY, JSON.stringify(nextVisibleState));
        }

        return resultGames;
    },

    // Shuffle Utility (Fisher-Yates)
    shuffleArray: function(array) {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    },

    // 9. Skeleton Generators
    getSkeletonGrid: function(count, colClass = "col-6 col-md-4 col-lg-2") {
        let html = '';
        const skeleton = `
            <div class="${colClass} p-2">
                <div class="skeleton-card-wrapper">
                    <div class="skeleton skeleton-img"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-badge"></div>
                </div>
            </div>
        `;
        for (let i = 0; i < count; i++) {
            html += skeleton;
        }
        return html;
    },

    getSkeletonRow: function(count) {
        let html = '';
        const skeleton = `
            <div class="skeleton-h-card mr-3">
                <div class="skeleton skeleton-img" style="aspect-ratio: 16/10; margin-bottom: 12px;"></div>
                <div class="skeleton skeleton-title" style="width: 60%; height: 10px;"></div>
            </div>
        `;
        for (let i = 0; i < count; i++) {
            html += skeleton;
        }
        return html;
    },

    // 5. Fetch Categories List (with 72h caching)
    fetchCategories: async function() {
        const CACHE_KEY = 'categories_cache';
        const EXPIRATION = 72 * 60 * 60 * 1000; // 72 hours (3 Days)
        
        try {
            // 1. Check LocalStorage Cache
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < EXPIRATION && data.items && data.items.length > 0) {
                    console.log("[Cache] Using cached categories");
                    return data.items;
                }
            }

            // 2. Cache miss or expired: Fetch from Firestore
            console.log("[Cache] Fetching fresh categories list...");
            const snapshot = await this.db.collection('categories').limit(500).get();
            
            // Start with "all" as a guaranteed first element
            const categories = ["all"];
            snapshot.forEach(doc => {
                categories.push(doc.id);
            });

            // 3. Save to Cache
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                items: categories,
                timestamp: Date.now()
            }));

            return categories;
        } catch (error) {
            console.error("Error fetching categories:", error);
            // Fallback to minimal list in case of failure
            return ["all"];
        }
    },

    // 6. Search Games
    searchGames: async function(query, limit = 12) {
        try {
            const searchTerm = query.toLowerCase().trim();
            if (!searchTerm) return [];
            
            const snapshot = await this.db.collection('games')
                .where('searchKeys', 'array-contains', searchTerm)
                .limit(limit)
                .get();
            
            const games = [];
            snapshot.forEach(doc => {
                games.push({ id: doc.id, ...doc.data() });
            });
            return games;
        } catch (error) {
            console.error("Error searching games:", error);
            return [];
        }
    },

    // 7. NEW: Fetch Single Game by ID
    fetchGameById: async function(id) {
        try {
            const doc = await this.db.collection('games').doc(id).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching game by ID:", error);
            return null;
        }
    },

    // 8. NEW: Fetch Similar Games
    fetchSimilarGames: async function(currentGameId, keys = [], limit = 6) {
        try {
            if (!keys || keys.length === 0) return [];
            
            // Take up to 10 keys for 'array-contains-any'
            const searchKeys = keys.slice(0, 10);
            
            const querySnapshot = await this.db.collection('games')
                .where('searchKeys', 'array-contains-any', searchKeys)
                .limit(limit + 1) // Fetch one extra to filter out current game
                .get();
            
            const games = [];
            querySnapshot.forEach(doc => {
                if (doc.id !== currentGameId) {
                    games.push({ id: doc.id, ...doc.data() });
                }
            });
            
            return games.slice(0, limit);
        } catch (error) {
            console.error("Error fetching similar games:", error);
            // Fallback: Fetch by category if available?
            return [];
        }
    }
};
