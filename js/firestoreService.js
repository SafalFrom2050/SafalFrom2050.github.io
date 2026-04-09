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

            const uniqueIds = [...new Set(allGameIds)].slice(0, 30);
            if (uniqueIds.length === 0) return [];

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
                query = this.db.collection('games').orderBy('quality_score', 'desc');
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

    // 5. Fetch Categories List
    fetchCategories: async function() {
        try {
            const snapshot = await this.db.collection('categories').limit(20).get();
            const categories = [];
            snapshot.forEach(doc => {
                categories.push(doc.id);
            });
            return categories;
        } catch (error) {
            console.error("Error fetching categories:", error);
            return [];
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
