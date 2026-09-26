document.addEventListener('DOMContentLoaded', () => {
    const avatar = document.querySelector('.skyloop-avatar');
    if (!avatar) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sequence = [1, 1, 2, 3, 4, 5, 6, 7, 7, 6, 5, 4, 3, 2];
    const frames = sequence.map(number => `images/skyloop/idle/${number}.webp`);
    let timer = null;
    let step = 2;
    let visible = false;
    let preloaded = false;

    const stop = () => {
        if (timer) window.clearInterval(timer);
        timer = null;
    };
    const sync = () => {
        stop();
        if (!visible || document.hidden || motion.matches) {
            avatar.src = 'images/skyloop/idle/3.webp';
            return;
        }
        if (!preloaded) {
            [...new Set(frames)].forEach(src => { const image = new Image(); image.src = src; });
            preloaded = true;
        }
        timer = window.setInterval(() => {
            step = (step + 1) % sequence.length;
            avatar.src = frames[step];
        }, 195);
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting;
            sync();
        }, { rootMargin: '120px' });
        observer.observe(avatar);
    } else {
        visible = true;
        sync();
    }
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
});
