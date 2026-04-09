$(document).ready(function() {
    // Inject HTML if not present (ensures compliance on all pages)
    if ($("#cookieConsent").length === 0) {
        $("body").append(`
            <div id="cookieConsent">
                <div class="cookie-content">
                    <p>We use cookies to improve your experience and analyze traffic. By clicking "Accept All", you consent to our use of cookies in accordance with our <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms</a>.</p>
                    <div class="cookie-buttons">
                        <button id="rejectAllCookies" class="cookie-btn secondary">Reject Non-Essential</button>
                        <button id="acceptAllCookies" class="cookie-btn primary">Accept All</button>
                    </div>
                </div>
                <div class="cookie-close" id="closeCookieConsent">×</div>
            </div>
        `);
    }

    const consent = localStorage.getItem('cookieConsent');
    
    // Check if consent has already been given
    if (!consent) {
        setTimeout(function() {
            $("#cookieConsent").fadeIn(500);
        }, 3000);
    }

    $("#acceptAllCookies").click(function() {
        localStorage.setItem('cookieConsent', 'all');
        $("#cookieConsent").fadeOut(300);
        // Note: In a real production app, you would initialize analytical/tracking tags here.
        if (typeof gtag === 'function') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted'
            });
        }
    });

    $("#rejectAllCookies").click(function() {
        localStorage.setItem('cookieConsent', 'essential');
        $("#cookieConsent").fadeOut(300);
        // Ensure non-essential tags remain denied
        if (typeof gtag === 'function') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied'
            });
        }
    });

    $("#closeCookieConsent, .cookie-close").click(function() {
        $("#cookieConsent").fadeOut(300);
    });
});

