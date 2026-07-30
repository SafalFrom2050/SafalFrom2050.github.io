$(document).ready(function () {
    if ($("#cookieConsent").length === 0) {
        $("body").append(`
            <div id="cookieConsent" role="dialog" aria-modal="false" aria-label="Privacy choices">
                <div class="cookie-content">
                    <p>We use optional analytics technologies only with your permission. You can accept or reject them, change your choice later, and learn more in our <a href="/privacy">Privacy Policy</a>.</p>
                    <div class="cookie-buttons">
                        <button id="rejectAllCookies" class="cookie-btn secondary" type="button">Reject Non-Essential</button>
                        <button id="acceptAllCookies" class="cookie-btn primary" type="button">Accept All</button>
                    </div>
                </div>
                <button class="cookie-close" id="closeCookieConsent" type="button" aria-label="Close privacy choices">&times;</button>
            </div>
            <button id="cookiePreferences" type="button" aria-label="Open privacy choices">Privacy choices</button>
        `);
    }

    function updateGoogleConsent(value) {
        if (typeof gtag !== 'function') return;

        var permission = value === 'all' ? 'granted' : 'denied';
        gtag('consent', 'update', {
            'analytics_storage': permission,
            'ad_storage': permission,
            'ad_user_data': permission,
            'ad_personalization': permission
        });
    }

    function saveConsent(value) {
        localStorage.setItem('cookieConsent', value);
        updateGoogleConsent(value);
        $("#cookieConsent").fadeOut(200);
        $("#cookiePreferences").fadeIn(200);
    }

    var consent = localStorage.getItem('cookieConsent');
    if (!consent) {
        setTimeout(function () {
            $("#cookieConsent").fadeIn(200);
        }, 500);
    } else {
        updateGoogleConsent(consent);
        $("#cookiePreferences").show();
    }

    $("#acceptAllCookies").click(function () {
        saveConsent('all');
        if (typeof window.loadGoogleAnalytics === 'function') {
            window.loadGoogleAnalytics();
        }
    });

    $("#rejectAllCookies").click(function () {
        saveConsent('essential');
    });

    $("#closeCookieConsent").click(function () {
        $("#cookieConsent").fadeOut(200);
        $("#cookiePreferences").fadeIn(200);
    });

    $("#cookiePreferences").click(function () {
        $("#cookiePreferences").hide();
        $("#cookieConsent").fadeIn(200);
    });
});
