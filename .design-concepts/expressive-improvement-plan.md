# Expressive website improvement plan

Status: proposal for `expressive-redesign`. This document defines the next design and implementation pass; it does not authorize a deployment.

## Product promise

- **On the web:** find and play a game immediately, with no installation.
- **In the Android app:** create, play, and share a game with Skyloop.
- Present these as connected experiences. Every app promotion should explain the additional capability and leave the current web task usable.

## What the current review found

1. The hero, animated logo, and Skyloop introduction establish a memorable expressive identity. The library, AI gallery, and supporting content do not yet carry that identity consistently.
2. Bright blue is used for buttons, selected chips, links, icons, badges, headings, and outlines. Its frequency weakens the hierarchy even though the hue fits the mascot and logo.
3. The three named Featured AI Games cards all lead to `/bio/`, whose visible games have different names. A card should lead to the game it advertises.
4. Mobile visitors see an almost full-screen hero before any playable game. The primary hero action jumps several sections down the homepage.
5. Mobile library copy invites search, but the search field sits inside the collapsed menu. The long horizontal category list is hard to scan.
6. Several card titles are tiny or truncated. The pixel font is effective as a signature detail, but it reduces readability when used for game names and dense labels.
7. The Android game page currently shows an app modal three seconds after load. Its display check reads `sessionStorage.app_promo_dismissed`, while the later inline dismiss handler writes `localStorage.appPromoDismissed`, allowing repeat prompts.
8. Some copy mixes web and app capabilities, and the editorial/AI descriptions make broad claims where a short, game-specific explanation would be more useful.

## Design system direction

| Role | Proposed treatment |
| --- | --- |
| Canvas and surfaces | Keep black canvas and existing charcoal surfaces (`#121212`, `#191C24`, `#222630`), but use them deliberately to distinguish content levels. |
| Primary actions | Trial a calmer blue fill around `#3475A8` with white text; verify contrast and visual weight in rendered designs. Use one filled primary action per section. |
| Bright accent | Reserve Skyloop blue `#6BB6FF` for the mascot, selected highlights, focus, and small moments of emphasis. Avoid using it as the default fill of every control. |
| Selected filters | Use a dark blue tonal fill (`#16283E`) with a blue border/text, rather than a large bright-blue pill. |
| Secondary actions | Use neutral raised surfaces with a clear border. Links can use a quieter pale blue. |
| Red | Keep logo red in the animated mark and a few tiny branded details. Avoid broad red gradients. |
| Type | Keep bold Roboto headings and readable body copy. Use Press Start 2P for brief eyebrows or badges; use a normal face at 14–16 px for game names and allow two lines. |
| Shapes | Retain expressive asymmetry on the hero, Skyloop stage, and key promotions. Use a smaller, consistent card-radius family for grids so every surface does not compete for attention. |
| Motion | Keep the one-time logo animation and visible-only Skyloop idle motion. Use restrained 180–220 ms transitions for controls and cards, and honor reduced motion. |

Treat these color values as a design starting point. Check rendered contrast, hover states, and screenshots before locking tokens. The initial candidate `#3475A8` with white text is above 4.5:1 contrast; any lighter hover state needs its own check.

## Page and journey changes

### Homepage

1. Shorten the mobile hero enough that the first playable content is visible or clearly peeks into the first screen. Keep the visual art, but reduce its share of the vertical space.
2. Change the primary `Explore games` action to lead directly to `/library/`, or move a true play-now row directly after the hero. The button should never land beneath the sticky navigation.
3. Put a curated `Play now` strip early. Each card should open its own game. Avoid shuffling the most prominent editorial examples between reloads.
4. Keep Featured AI Games immediately before the Skyloop introduction. Map each named AI card to its matching preview/game, or relabel the cards as examples that clearly lead to the gallery. Show readable names and an explicit play/preview affordance.
5. Keep Skyloop's animated asset and direct app creation CTA. The section should describe the app-only capability in one short sentence, with `See AI games` as the web-side secondary action.
6. Simplify the lower page: retain useful genre discovery and a compact library preview; merge repeated generic AI/web explanations into a short `Play here / Create in the app` explanation. Keep editorial content only when it contains real, specific reasons to recommend a game.

### Library

1. Put search in the page header on mobile as well as desktop. A search icon in the global header may complement it, but the library's search must be visible without opening the menu.
2. Show a short set of broad, popular categories first, with an `All categories` control exposing the full taxonomy. Preserve existing `?cat=` and `?q=` links.
3. Give cards two-line titles, a readable genre label, predictable image fallback, and consistent spacing. Keep the current two-column mobile grid if card text remains legible.
4. Keep a stable default ordering for the first results. Random discovery can live in a named `Surprise me` or related row rather than reshuffling the main list on every load.
5. Maintain visible search/filter state and a useful empty state with a clear way to reset filters.

### AI gallery (`/bio/`)

1. Bring the gallery into the shared navigation, type, spacing, and card system while retaining its animated logo.
2. Make each homepage AI card resolve to the corresponding gallery item or direct playable route; the title and destination must agree.
3. State plainly that visitors can preview examples on the web and create their own with Skyloop in the Android app.
4. Use one clear app CTA and avoid repeating the same Play Store ask inside every preview.

### Game detail and embedded play

1. Keep the game frame and controls dominant. Replace the timed Android modal with a small in-flow app suggestion below the game or after the user exits play; never cover active gameplay.
2. Hide empty ratings or counts when data is unavailable instead of showing placeholders such as `--`.
3. Keep similar-game cards readable and directly linked. The game shell can share the calmer tokens while third-party game content remains untouched.

### Supporting pages

Apply shared navigation, button, type, spacing, and footer rules to About, Blog, Contact, Privacy, and Terms. Avoid introducing a high-priority app banner on legal or contact pages; the footer link is enough there.

## Android app promotion rules

- **Android home/library/AI gallery:** show a compact, dismissible app callout with Skyloop or the app icon, a benefit-led line such as `Build your own game with Skyloop`, and a `Get the Android app` action. Use at most one such callout in a viewport and do not stack it with the cookie UI.
- **Android game pages:** no timed overlay. Show the app message after or outside play.
- **Other platforms:** keep a quieter `Available on Android` link in Skyloop and the footer. A desktop QR code is optional only if it does not crowd the section.
- **Behavior:** clicking the CTA opens the existing Google Play listing. Never redirect solely because the device is Android. Use device detection only to vary presentation; the web content remains available.
- **Frequency:** one shared dismissal state across pages; once dismissed, suppress the callout for a defined cooldown (propose 14 days) and avoid a second prompt in the same session. Eliminate the conflicting dismissal handlers.
- **Copy:** promote verified app features. Do not promise faster loading, exclusivity, or capabilities unless the Flutter app actually provides them.
- **Measurement:** if an analytics system is already in place, compare CTA impressions, clicks, dismissals, game starts, and search use by placement and platform. Do not add tracking solely for this redesign without a privacy review.

Google Search recommends small banners over promotional interstitials: <https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials>. Android documents the current Play listing URL pattern: <https://developer.android.com/distribute/marketing-tools/linking-to-google-play>.

## Technical boundaries

- Preserve `/gameView/?id=...&isPortrait=...`, its Firebase lookup, iframe, loader, fullscreen, wake lock, and links used by the Flutter app. Do not inject the app promotion into this route.
- Preserve `/game/?id=...`, `/game/<id>/`, `/library/?q=...`, `/library/?cat=...`, and `/bio/` destinations.
- Use shared tokens/components for normal website pages, but isolate changes from the embedded gameplay route.
- The repository has many generated game pages. Update their source template (`scripts/game-page-template.html`) when needed, and avoid a full regeneration just to adjust presentation. Verify the template and a representative generated page.
- Keep semantic links/buttons, keyboard access, visible focus, reduced-motion behavior, and accessible names. Target WCAG 2.2 AA contrast and pointer-size requirements; aim for comfortable mobile touch targets beyond the minimum. Reference: <https://www.w3.org/TR/WCAG22/>.

## Delivery sequence

1. **Baseline and design review:** record desktop/mobile screenshots and route behavior. Produce a small token sheet plus 390 px and 1440 px mockups for home, library, and AI gallery, showing the calmer button treatment and app callout.
2. **Discovery and content:** implement homepage order, direct game destinations, visible library search, concise categories, readable cards, and accurate web/app copy.
3. **App conversion:** implement one shared platform-aware callout, fix the dismissal state, remove the timed game modal, and verify the Play link on Android.
4. **System consistency:** extend shared type, surface, shape, navigation, and footer rules to the AI gallery and supporting pages. Preserve the animated logo and Skyloop motion.
5. **Validation and polish:** test responsive layouts, interactions, accessibility, loading/error states, and route compatibility. Fix concrete findings before considering the redesign complete.

## Acceptance checks

- On a 390 px Android viewport, a visitor can see or reach a playable game promptly, search the library without opening the menu, and choose to open the Play Store without losing access to the web content.
- Every Featured AI Games card has a title that matches its destination and a clear action.
- Filled blue controls have an obvious hierarchy; selected filters and secondary actions use quieter treatments. Text contrast and focus states pass checks in normal, hover, active, and disabled states.
- Dismissing the app callout works consistently across the site and it never overlays gameplay, cookie choices, or the fullscreen control.
- At 360, 390, 768, and 1440 px widths, cards do not clip essential names, navigation remains usable, and content does not overflow horizontally.
- Keyboard navigation, reduced motion, and game image fallbacks work.
- `/gameView/?id=...&isPortrait=...` still loads the game frame, and both query and path-based game URLs retain their behavior. The generated game template and one generated page remain consistent.
- The site remains usable if the Play Store cannot open; a normal HTTPS listing link is always available.

No source redesign or deployment is included in this planning step.
