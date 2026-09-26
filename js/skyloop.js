document.addEventListener('DOMContentLoaded', () => {
    const heroPlay = document.querySelector('.hero-play-fab');
    const isAndroid = navigator.userAgentData?.platform?.toLowerCase() === 'android'
        || /Android/i.test(navigator.userAgent);
    if (heroPlay && isAndroid) {
        heroPlay.href = heroPlay.dataset.androidHref;
        heroPlay.setAttribute('aria-label', 'Get alt games portal on Google Play');
        heroPlay.querySelector('.hero-play-caption').textContent = 'Get the app';
    }

    const avatar = document.querySelector('.skyloop-avatar');
    const dock = document.getElementById('skyloopDockFab');
    const sheet = document.getElementById('skyloopDockSheet');
    if (!avatar || !dock || !sheet) return;

    const dockImage = dock.querySelector('img');
    const sheetImage = sheet.querySelector('.skyloop-dock-sheet-content > img');
    const animatedImages = [avatar, dockImage, sheetImage];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sequence = [1, 1, 2, 3, 4, 5, 6, 7, 7, 6, 5, 4, 3, 2];
    const frames = sequence.map(number => `images/skyloop/idle/${number}.webp`);
    let timer = null;
    let step = 2;
    let avatarVisible = false;
    let docked = false;
    let preloaded = false;
    let flight = null;
    let flightImage = null;
    let scrollQueued = false;
    let lastScrollY = window.scrollY;

    function syncFrames() {
        if (timer) window.clearInterval(timer);
        timer = null;
        if (document.hidden || motion.matches || !(avatarVisible || docked || sheet.open)) {
            animatedImages.forEach(image => { image.src = 'images/skyloop/idle/3.webp'; });
            return;
        }
        if (!preloaded) {
            [...new Set(frames)].forEach(src => { const image = new Image(); image.src = src; });
            preloaded = true;
        }
        timer = window.setInterval(() => {
            step = (step + 1) % sequence.length;
            animatedImages.forEach(image => { image.src = frames[step]; });
        }, 195);
    }

    function cancelFlight() {
        if (flight) flight.cancel();
        if (flightImage) flightImage.remove();
        flight = null;
        flightImage = null;
    }

    function fly(from, to, imageSource, done) {
        cancelFlight();
        if (motion.matches || !Element.prototype.animate) {
            done();
            return;
        }
        const startTop = from.bottom <= 0 ? -from.height * .72 : from.top;
        const endTop = to.top >= window.innerHeight ? window.innerHeight - to.height * .28 : to.top;
        const ghost = document.createElement('img');
        ghost.className = 'skyloop-flight';
        ghost.src = imageSource;
        ghost.alt = '';
        ghost.style.left = from.left + 'px';
        ghost.style.top = startTop + 'px';
        ghost.style.width = from.width + 'px';
        ghost.style.height = from.height + 'px';
        document.body.appendChild(ghost);
        flightImage = ghost;
        const dx = to.left + to.width / 2 - from.left - from.width / 2;
        const dy = endTop + to.height / 2 - startTop - from.height / 2;
        const scale = to.width / from.width;
        flight = ghost.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1 }
        ], { duration: 620, easing: 'cubic-bezier(.2, 0, 0, 1)', fill: 'forwards' });
        flight.onfinish = () => {
            ghost.remove();
            flight = null;
            flightImage = null;
            done();
        };
    }

    function setDock(next, animate = true) {
        if (next === docked) return;
        if (!animate) {
            cancelFlight();
            avatar.classList.remove('is-migrating');
            dock.classList.remove('is-arriving');
        }
        const imageSource = avatar.currentSrc || avatar.src;
        if (next) {
            docked = true;
            dock.hidden = false;
            syncFrames();
            if (!animate) return;
            const from = avatar.getBoundingClientRect();
            const to = dockImage.getBoundingClientRect();
            avatar.classList.add('is-migrating');
            dock.classList.add('is-arriving');
            fly(from, to, imageSource, () => {
                avatar.classList.remove('is-migrating');
                dock.classList.remove('is-arriving');
            });
        } else {
            docked = false;
            syncFrames();
            if (sheet.open) sheet.close();
            if (!animate) {
                dock.hidden = true;
                return;
            }
            const from = dockImage.getBoundingClientRect();
            const to = avatar.getBoundingClientRect();
            avatar.classList.add('is-migrating');
            dock.classList.add('is-arriving');
            fly(from, to, imageSource, () => {
                dock.hidden = true;
                avatar.classList.remove('is-migrating');
                dock.classList.remove('is-arriving');
            });
        }
    }

    function checkDock(animate = true) {
        const avatarBottom = avatar.getBoundingClientRect().bottom;
        const threshold = docked ? 230 : 165;
        const jumped = Math.abs(window.scrollY - lastScrollY) > window.innerHeight * 1.25;
        lastScrollY = window.scrollY;
        setDock(avatarBottom < threshold, animate && !jumped);
    }
    function scheduleDockCheck() {
        if (scrollQueued) return;
        scrollQueued = true;
        window.requestAnimationFrame(() => {
            scrollQueued = false;
            checkDock();
        });
    }
    window.addEventListener('scroll', scheduleDockCheck, { passive: true });
    window.addEventListener('resize', scheduleDockCheck);
    window.addEventListener('pageshow', () => checkDock(false));
    checkDock(false);

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            avatarVisible = entries[0].isIntersecting;
            syncFrames();
        }, { rootMargin: '120px' });
        observer.observe(avatar);
    } else {
        avatarVisible = true;
        syncFrames();
    }
    if (motion.addEventListener) motion.addEventListener('change', syncFrames);
    else motion.addListener(syncFrames);
    document.addEventListener('visibilitychange', syncFrames);

    dock.addEventListener('click', event => {
        if (typeof sheet.showModal !== 'function') return;
        event.preventDefault();
        sheet.showModal();
        dock.setAttribute('aria-expanded', 'true');
        syncFrames();
    });
    sheet.querySelector('.skyloop-dock-close').addEventListener('click', () => sheet.close());
    sheet.addEventListener('click', event => {
        if (event.target === sheet) sheet.close();
    });
    sheet.addEventListener('close', () => {
        dock.setAttribute('aria-expanded', 'false');
        syncFrames();
        if (docked) dock.focus();
    });
});
