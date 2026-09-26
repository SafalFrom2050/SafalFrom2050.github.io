/**
 * logo.js
 * Standardized Logo Component Logic for alt games portal.
 * Handles the orchestrated Sprite -> Typewriter transition.
 */

const LogoComponent = {
    init: function() {
        const navbarBrands = document.querySelectorAll('.navbar-brand');
        
        navbarBrands.forEach(brand => {
            const sprite = brand.querySelector('.sprite-logo');
            const altSpan = brand.querySelector('.brand-alt');
            const gamesSpan = brand.querySelector('.brand-games');
            
            if (altSpan && gamesSpan) {
                if (sprite) {
                    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                        brand.classList.add('logo-swapped');
                        return;
                    }

                    // Let the mark finish its reveal, then type the wordmark beside it.
                    sprite.addEventListener('animationend', (e) => {
                        if (e.animationName === 'sprite-play') {
                            this.startSequence(brand, altSpan, gamesSpan);
                        }
                    }, { once: true });
                } else {
                    // Fallback or Footer: Just show/type immediately
                    altSpan.style.opacity = '1';
                    altSpan.style.display = 'inline-block';
                    gamesSpan.style.opacity = '1';
                    gamesSpan.style.display = 'inline-block';
                    // We don't animate the footer to keep it clean
                }
            }
        });
    },

    startSequence: function(brand, altSpan, gamesSpan) {
        brand.classList.add('logo-swapped');
        brand.classList.add('typing-cursor');
        
        // Short delay for the swap transition
        setTimeout(() => {
            this.typeWriter(altSpan, 'alt', 100, () => {
                setTimeout(() => {
                    this.typeWriter(gamesSpan, 'games portal', 50, () => {
                        brand.classList.remove('typing-cursor');
                    });
                }, 100);
            });
        }, 200);
    },

    typeWriter: function(element, text, speed, callback) {
        let i = 0;
        element.textContent = '';
        element.style.display = 'inline-block';
        element.style.opacity = '1';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else if (callback) {
                callback();
            }
        }
        type();
    }
};

document.addEventListener('DOMContentLoaded', () => LogoComponent.init());
