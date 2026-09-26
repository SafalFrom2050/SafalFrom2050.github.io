/* A single, in-flow Android app invitation shared by discovery and game pages. */
(function () {
    const STORE_URL = 'https://play.google.com/store/apps/details?id=dif.instantgames';
    const DISMISSED_AT = 'appPromoDismissedAt';
    const SESSION_DISMISSED = 'appPromoDismissedThisSession';
    const COOLDOWN = 14 * 24 * 60 * 60 * 1000;

    function readStorage(storage, key) {
        try { return storage.getItem(key); } catch (_) { return null; }
    }

    function writeStorage(storage, key, value) {
        try { storage.setItem(key, value); } catch (_) { /* The current page still dismisses. */ }
    }

    function showInvitation() {
        if (!/Android/i.test(navigator.userAgent)) return;
        document.documentElement.classList.add('platform-android');
        const appLabel = document.querySelector('[data-app-label]');
        if (appLabel) appLabel.textContent = 'Get the Android app';
        if (readStorage(sessionStorage, SESSION_DISMISSED)) return;
        const dismissedAt = Number(readStorage(localStorage, DISMISSED_AT));
        if (dismissedAt && Date.now() - dismissedAt < COOLDOWN) return;
        // Keep the invitation out of view while privacy choices are open.
        if (!readStorage(localStorage, 'cookieConsent')) return;

        const slot = document.querySelector('[data-app-promo]');
        if (!slot || slot.dataset.rendered) return;
        slot.dataset.rendered = 'true';
        slot.hidden = false;
        slot.innerHTML = `
            <img src="/images/skyloop/idle/3.webp" alt="" width="82" height="82" loading="lazy">
            <div class="app-callout-copy">
                <span class="app-callout-kicker">THE APP EXPERIENCE</span>
                <strong>Build your own game with Skyloop</strong>
                <p>Explore games here, then create, play, and share yours in the Android app.</p>
            </div>
            <a class="app-callout-link" href="${STORE_URL}" target="_blank" rel="noopener noreferrer">Get the Android app <span aria-hidden="true">↗</span></a>
            <button class="app-callout-dismiss" type="button" aria-label="Dismiss app invitation">×</button>`;
        slot.querySelector('.app-callout-dismiss').addEventListener('click', function () {
            writeStorage(localStorage, DISMISSED_AT, String(Date.now()));
            writeStorage(sessionStorage, SESSION_DISMISSED, '1');
            slot.hidden = true;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showInvitation);
    } else {
        showInvitation();
    }
    document.addEventListener('app:consent-settled', showInvitation);
})();
