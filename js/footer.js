/** A shared footer for the home, library, AI gallery, and generated game pages. */
(function () {
    function renderFooter() {
        const oldFooter = document.querySelector('footer');
        if (!oldFooter || oldFooter.classList.contains('site-footer')) return;
        if (oldFooter.classList.contains('gallery-footer')) document.body.classList.add('gallery-page');

        if (/Android/i.test(navigator.userAgent)) {
            document.documentElement.classList.add('platform-android');
        }

        if (!document.getElementById('expressive-footer-styles')) {
            const styles = document.createElement('link');
            styles.id = 'expressive-footer-styles';
            styles.rel = 'stylesheet';
            styles.href = '/css/expressive-footer.css?v=1';
            document.head.appendChild(styles);
        }

        const footer = document.createElement('footer');
        footer.className = 'site-footer';
        footer.setAttribute('aria-label', 'Site footer');
        footer.innerHTML = `
            <div class="site-footer-inner">
                <div class="footer-invite">
                    <div class="footer-invite-copy">
                        <span class="footer-kicker"><span aria-hidden="true"></span> KEEP PLAYING</span>
                        <h2>There's more to play.</h2>
                        <p>Find a new favorite, or make the one you wish existed.</p>
                    </div>
                    <div class="footer-invite-actions">
                        <a class="footer-action footer-action-library" href="/library/">
                            <span>Browse the library</span><span class="footer-action-icon" aria-hidden="true">→</span>
                        </a>
                        <a class="footer-action footer-action-app" href="https://play.google.com/store/apps/details?id=dif.instantgames" target="_blank" rel="noopener noreferrer">
                            <span>Get the Android app</span><span class="footer-action-icon" aria-hidden="true">↗</span>
                        </a>
                    </div>
                </div>

                <div class="footer-main">
                    <div class="footer-identity">
                        <a class="footer-brand" href="/" aria-label="alt games portal home">
                            <span class="sprite-logo footer-sprite" aria-hidden="true"></span>
                            <span class="footer-wordmark"><span class="brand-alt">alt</span><span class="brand-games">games portal</span></span>
                        </a>
                        <p>Play here. Create with Skyloop on Android.</p>
                    </div>
                    <nav class="footer-nav" aria-label="Explore">
                        <span class="footer-nav-heading">Explore</span>
                        <a href="/library/">Game library</a>
                        <a href="/bio/">AI games</a>
                        <a href="/blog/">Blog</a>
                    </nav>
                    <nav class="footer-nav" aria-label="More information">
                        <span class="footer-nav-heading">More</span>
                        <a href="/about/">About</a>
                        <a href="/contact/">Contact</a>
                        <a href="/privacy/">Privacy</a>
                        <a href="/terms/">Terms</a>
                    </nav>
                </div>

                <div class="footer-bottom">© ${new Date().getFullYear()} alt games portal. All rights reserved.</div>
            </div>`;

        oldFooter.replaceWith(footer);

        const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
        footer.querySelectorAll('.footer-nav a').forEach(link => {
            const targetPath = new URL(link.href).pathname.replace(/\/+$/, '') || '/';
            if (currentPath === targetPath || (targetPath === '/blog' && currentPath.startsWith('/blog/'))) {
                link.setAttribute('aria-current', 'page');
            }
        });

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    footer.classList.add('is-visible');
                    observer.disconnect();
                }
            }, { threshold: 0.12 });
            observer.observe(footer);
        } else {
            footer.classList.add('is-visible');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderFooter, { once: true });
    } else {
        renderFooter();
    }
})();
