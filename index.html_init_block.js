            // --- Hybrid Caching Logic ---
            const CACHE_KEY_AI = 'home_ai_games_cache';
            const CACHE_KEY_DISCOVER = 'home_discovery_cache';
            
            async function getCachedData(key, fetchFunc, masterTimestamp) {
                const cached = localStorage.getItem(key);
                if (cached) {
                    try {
                        const data = JSON.parse(cached);
                        if (data.rtdbTimestamp >= masterTimestamp && data.items && data.items.length > 0) {
                            console.log(`Loading ${key} from cache...`);
                            return data.items;
                        }
                    } catch (e) { console.warn("Cache parse failed", e); }
                }
                
                console.log(`Fetching ${key} from live Firestore...`);
                const items = await fetchFunc();
                const payload = {
                    rtdbTimestamp: masterTimestamp,
                    localTimestamp: Date.now(),
                    items: items
                };
                localStorage.setItem(key, JSON.stringify(payload));
                return items;
            }

            // Always check RTDB for master timestamp
            const masterSnapshot = await firebase.database().ref('/Game Collection/bio_update_timestamp').once('value');
            const masterTimestamp = masterSnapshot.val() || 0;

            // Load Categories (Always live or simple cache)
            const categories = await firestoreService.fetchCategories();
            const tab = document.getElementById('categoriesTab');
            categories.forEach(cat => {
                const chip = document.createElement('div');
                chip.className = 'category-chip';
                chip.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                chip.onclick = () => loadMainLibrary(cat, chip);
                tab.appendChild(chip);
            });

            // Load AI Games (Cached)
            const aiGames = await getCachedData(CACHE_KEY_AI, () => firestoreService.fetchAIGames(10), masterTimestamp);
            renderHorizontalRow('aiGamesRow', aiGames);

            // Load Discover Cards (Cached)
            const discoverCards = await getCachedData(CACHE_KEY_DISCOVER, () => firestoreService.fetchDiscoverCards(), masterTimestamp);
            
            const discoveryContainer = document.getElementById('discoveryRows');
            for (const card of discoverCards) {
                const section = document.createElement('section');
                section.className = 'mb-5 animate-in';
                section.innerHTML = `
                    <div class="mb-3">
                        <h3 class="mb-0">${card.title}</h3>
                        <p class="text-muted small">${card.subtitle}</p>
                    </div>
                    <div class="horizontal-scroll" id="card-${card.id}">
                        <div class="loader-small"></div>
                    </div>
                `;
                discoveryContainer.appendChild(section);
                
                // Fetch games for this card (Cached per card or just fetch)
                const cardCacheKey = `cache_card_${card.id}`;
                const games = await getCachedData(cardCacheKey, () => firestoreService.fetchGamesByCategories(card.categories, 18), masterTimestamp);
                renderHorizontalRow(`card-${card.id}`, games);
            }

            // Initial Load of Main Library
            loadMainLibrary('all');
        }
