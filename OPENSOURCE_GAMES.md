# Open Source HTML5 Mobile-Friendly Games

This is a working database for adding open-source browser games to a monetized app. It favors projects with permissive or commercial-use-friendly licenses, playable hosted builds, public source, and controls that can work on touch devices.

Important: this is not legal advice. Most OSI-style open-source licenses allow commercial use, including GPL/MPL/AGPL, but they can impose source-distribution, attribution, same-license, or file-level sharing duties. For the lowest-friction monetized app integration, prefer MIT, Apache-2.0, BSD, ISC, Unlicense, or CC0 code/assets. Avoid `NC` / non-commercial asset licenses for monetized use unless you replace those assets or get written permission.

## Quick License Guide

| License family | Commercial use? | Practical note for this app |
| --- | --- | --- |
| MIT / BSD / ISC / Apache-2.0 / Unlicense / CC0 | Yes | Best fit. Preserve notices; Apache also has patent/NOTICE handling. |
| MPL-2.0 | Yes | Good fit, but modified MPL files generally stay MPL. Keep notices and source for modified files. |
| GPL / AGPL | Yes | Selling/ads are allowed, but distributing modified builds triggers strong source-sharing obligations; AGPL also covers network use. |
| CC-BY / CC-BY-SA assets | Yes | Attribution required; SA may require derivative assets to use same license. |
| CC-BY-NC / custom non-commercial | No for monetized use | Do not ship as-is in an ad-supported or paid app. Replace assets/code or seek permission. |

## Best-Fit Shortlist

| Game | Genre | Hosted link | Source | License | Credits to preserve | Mobile fit | Monetization notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PROXX | Puzzle / Minesweeper-like | https://proxx.app | https://github.com/GoogleChromeLabs/proxx | Apache-2.0 | GoogleChromeLabs / Chrome team contributors | Excellent: repo says built for every device with a browser, including feature phones | Strong candidate. Keep Apache license/NOTICE handling. |
| 2048 | Sliding puzzle | https://play2048.co / https://gabrielecirulli.github.io/2048/ | https://github.com/gabrielecirulli/2048 | MIT | Gabriele Cirulli | Excellent: simple swipe/touch interaction | Strong candidate. Preserve MIT notice; consider custom skin/branding to avoid looking like a commodity clone. |
| Sandspiel | Creative falling-sand simulation | https://sandspiel.club | https://github.com/maxbittker/sandspiel | MIT | Max Bittker; fluid simulation credit noted in README | Good: canvas/WebGL painting maps naturally to touch, but test performance on low-end devices | Strong candidate if your app can handle heavier WebGL/WASM payloads. |
| Tower Building Game | One-tap arcade stacking | https://iamkun.github.io/tower_game | https://github.com/iamkun/tower_game | MIT | iamkun | Excellent: one-tap gameplay; README calls out mobile devices | Strong candidate. Retheme assets if you want a more branded experience. |
| Alien Invasion | Arcade shooter sample | http://cykod.github.io/AlienInvasion/ | https://github.com/cykod/AlienInvasion | Dual GPL-2.0 / MIT | cykod; Mobile HTML5 Game Development sample | Excellent: built as a mobile HTML5 demo | Choose the MIT license path and preserve its notice. |
| Wave-Rider | One-button rhythm runner | https://cutefame.itch.io/wave-rider | https://github.com/TheRealFame/Wave-Rider | MIT code; CC0 assets per itch page | Cute Fame / TheRealFame | Excellent: one-button Space/Touch controls | Good candidate, but prototype quality; verify repo license files before production. |
| CaveScroller | Arcade dodger | https://gtrxac.itch.io/cavescroller | https://github.com/gtrxAC/cavescroller | MIT code per itch page | gtrxAC; IBM PC BIOS font credit from itch page | Good: itch page says mobile works with touch mode | Good candidate after checking font license and mobile fit. |
| CasterGrounds | Action platformer | https://yourguyphil.itch.io/castergrounds | https://github.com/yourguyphil/CasterGrounds | MIT code per itch page | Yourguyphil | Good but experimental: touch controls exist, optimized for Pixel 4XL | Promising, but marked alpha/in development; QA heavily before shipping. |
| Gridland | Match-3 survival RPG | https://gridland.doublespeakgames.com | https://github.com/doublespeakgames/gridland | MPL-2.0 | doublespeak games; Michael Townsend; Vince Nitro and other presskit credits | Good: web game with official mobile ports | Commercial-friendly. Review MPL obligations and preserve credits. |
| A Dark Room | Minimalist text adventure / incremental RPG | https://adarkroom.doublespeakgames.com | https://github.com/doublespeakgames/adarkroom | MPL-2.0 | doublespeak games; Michael Townsend; Amir Rajan and media/branding credits where relevant | Good: text UI, official mobile history | Commercial-friendly. Preserve MPL notices; avoid implying official affiliation. |
| Gasteroids | Asteroids-like arcade shooter | https://nalquas.itch.io/gasteroids | https://github.com/nalquas/gasteroids | MIT | Nalquas | Excellent: itch lists Touchscreen and Smartphone inputs, plus Android build | Good candidate. Check bundled art/audio before final packaging. |
| Gravitonion Collector | Asteroids-like survival shooter | https://maiconspas.itch.io/gravitonion-collector | https://github.com/maiconpintoabreu/gravitonion-collector | MIT | Maicon Santana; Single Cell Studio art credit | Good: itch lists Touchscreen; UI controls available | Good candidate, but in development; verify asset license for art before monetized release. |
| asdf | Simon-style memory game | https://timpietrusky.github.io/asdf | https://github.com/TimPietrusky/asdf | MIT | Tim Pietrusky | Good: simple color-button interaction should map cleanly to touch | Strong lightweight candidate. Avoid using "Simon" branding in-app. |
| Banania | Puzzle / remake | https://mental-reverb.com/creations/banania/banania.html | https://github.com/BenjaminRi/Banania | MIT | PyGuy2 / BenjaminRi | Potential: puzzle controls should be testable on touch | Good candidate after mobile QA and asset review. |
| Gift Grabber | Puzzle | https://ceva24.github.io/gift-grabber | https://github.com/ceva24/gift-grabber | Apache-2.0 | Chris Evans / ceva24 | Potential: lightweight puzzle UI, but verify touch behavior | Good Apache-licensed candidate. Preserve license/NOTICE handling. |
| Minesweeper.Zone | Minesweeper puzzle | https://minesweeper.zone | https://github.com/reed-jones/minesweeper_js | MIT | Reed Jones | Good: grid puzzle is inherently touch-friendly, but flag/tap UX needs testing | Strong candidate. Keep notices and consider simplifying mobile flag controls. |
| Pipe Puzzle | Pipe-connecting puzzle | https://rainey.tech/game/pipe-puzzle | https://github.com/tassaron/pipe-puzzle | MIT | tassaron / rainey.tech; PixiJS | Good: tap/click puzzle interaction | Strong candidate. Retheme if you want a fresher look. |
| Jezzball | Arcade territory puzzle | https://rainey.tech/game/jezzball | https://github.com/tassaron/jezzball | MIT | tassaron / rainey.tech | Good: click/tap territory puzzle, but verify drag/timing UX on phones | Good lightweight candidate; avoid Microsoft/JezzBall naming in your app UI. |
| Rapid Dominance | Phaser strategy / territory game | https://wenta.github.io/rapid-dominance | https://github.com/wenta/rapid-dominance | Apache-2.0 | wenta; PhaserJS | Potential: Phaser canvas game, but test viewport and touch controls | Good candidate if mobile controls feel natural. |
| Rot Magus | Roguelike / RPG remake | https://gamejolt.com/games/rm/41491 | https://github.com/kosinaz/Rot-Magus | Apache-2.0 and CC0 per OSGL | Kosina Zoltan; Cong; Phaser; rot.js | Potential: turn-based play can work on mobile; verify UI scale | Good candidate if the asset licensing is confirmed in repo. |
| The House | Point-and-click adventure | https://the-house.arturkot.pl | https://github.com/arturkot/the-house-game | MIT | Artur Kot | Good: point-and-click maps to tap | Strong candidate for a short narrative/adventure slot; verify image/audio rights. |
| OpenEtG | Card battler | https://etg.dek.im | https://github.com/serprex/openEtG | MIT | serprex; elysiumplain; Philip Dube; Trevor Sayre; Wesley M. Botello-Smith | Potential: card UI can work on mobile, but test small-screen readability | Good candidate if you want a deeper session game. |
| Delaford | Browser RPG | https://play.delaford.com/?useGuestAccount | https://github.com/delaford/game | MIT | Delaford contributors: agitperson, Ben Sumser, Dan Jasnowski, erezvish, Steve Richter | Mixed: online RPG UI needs small-screen QA | Commercial-friendly MIT, but server/backend operations need review. |
| ArchaicQuest II | Text/dungeon multiplayer RPG | https://play.archaicquest.com | https://github.com/ArchaicQuest/ArchaicQuest-II | MIT | Liam Kenneth / Naughty Mole Games | Good: web text UI is plausible on mobile | Commercial-friendly MIT; evaluate hosting and account-flow fit. |
| Duck Hunt JS | Pointer arcade | https://duckhuntjs.com | https://github.com/MattSurabian/DuckHunt-JS | MIT | Matthew Surabian | Good: pointer/tap target gameplay | Code is permissive, but Nintendo-inspired name/gameplay suggests rebrand/retheme before monetization. |
| Enduro tribute | Racing | https://rafaelcastrocouto.github.io/enduro | https://github.com/rafaelcastrocouto/enduro | MIT | Rafael Castro Couto / racascou | Mixed: racing controls must be checked on mobile | Commercial-friendly code; retheme away from the original Enduro reference. |
| Fluid Table Tennis | Local arcade sports | https://anirudhjoshi.github.io/fluid_table_tennis | https://github.com/anirudhjoshi/fluid_table_tennis | MIT | anirudhjoshi | Potential: paddle games can map to drag/touch | Good candidate for local casual play after mobile input QA. |
| Tower Defense | 3D tower defense | https://casmo.itch.io/threejs-tower-defense | https://github.com/Casmo/tower-defense | MIT | Mathieu / Casmo; Three.js | Mixed: 3D canvas and placement UI require mobile testing | Good candidate if performance and touch placement are acceptable. |
| TOSIOS | Multiplayer online shooter | https://tosios.online | https://github.com/halftheopposite/TOSIOS | MIT | Aymeric Chauvin / halftheopposite | Mixed: action shooter and multiplayer server complexity | Commercial-friendly code; only ship if controls, moderation, and server costs fit your app. |
| skifree.js | Arcade sports remake | https://basicallydan.github.io/skifree.js | https://github.com/basicallydan/skifree.js | MIT | Anders Evenrud; Daniel Hough | Mixed: likely keyboard-first; mobile control layer may be needed | Use if you can add/verify touch controls and retheme SkiFree references. |
| Pacman HTML5 | Arcade maze remake | https://passer-by.com/pacman | https://github.com/mumuy/pacman | MIT | mumuy / passer-by.com | Mixed: likely needs directional controls on mobile | Permissive code, but Pac-Man-inspired IP/trademark risk means rebrand/retheme before monetization. |
| CrappyBird | Tap-to-fly arcade | https://varunpant.com/resources/CrappyBird/index.html | https://github.com/varunpant/CrappyBird | MIT | Varun Pant | Excellent: tap/click style | Same caution as other Flappy-style clones: retheme heavily and avoid confusing branding. |

## Review Before Shipping

These may still be usable in a monetized product, but I would review license scope, assets, performance, or clone/IP risk before integrating them.

| Game | Genre | Hosted link | Source | License | Credits to preserve | Mobile fit | Risk / action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Catch The Cat | Hex-grid puzzle | https://ganlvtech.github.io/phaser-catch-the-cat/ | https://github.com/ganlvtech/phaser-catch-the-cat | MIT | Ganlv; README also credits original idea/image from gamedesign.jp / Chat Noir | Excellent: click/tap grid | Good code license, but verify the cat image/original-game asset rights or replace art. |
| Clumsy Bird | Tap-to-fly arcade | https://ellisonleao.github.io/clumsy-bird/ | https://github.com/ellisonleao/clumsy-bird | MIT | Ellison Leao and contributors; melonJS | Excellent: tap/click | License is permissive, but it is a Flappy Bird-inspired clone. Retheme heavily and avoid confusing branding. |
| HexGL | Futuristic racing | https://hexgl.bkcore.com | https://github.com/BKcore/HexGL | MIT | Thibaut Despoulain / BKcore; three.js; Nobiax texture; Charnel model | Mixed: high-end WebGL; official controls are desktop-leaning | High-quality showcase, but test mobile controls/performance; preserve asset credits. |
| Phaser Quest | Multiplayer RPG | https://phaserquest.herokuapp.com | https://github.com/dynetisgames/phaserquest | MIT code per project page | Jerome Renaux / Dynetis Games; BrowserQuest assets; Cartrell music; Phaser/Input/Easystar credits | Mixed: likely touch-capable but multiplayer/server complexity | Hosted link may be stale. Review BrowserQuest asset licenses and server cost/compliance. |
| Hextris | Fast puzzle arcade | https://hextris.io / https://hextris.github.io/hextris | https://github.com/Hextris/hextris | GPL-3.0-or-later | Logan Engstrom, Garrett Finucane, Noah Moroze, Michael Yang | Excellent: mobile-friendly puzzle | Commercial use is allowed, but GPL obligations apply; also Tetris-inspired branding/gameplay risk. |
| BrowserQuest | Multiplayer RPG | Historical: https://browserquest.mozilla.org | https://github.com/mozilla/BrowserQuest | MPL-2.0 code; CC-BY-SA 3.0 content | Mozilla; Little Workshop; Franck Lecollinet; Guillaume Lecollinet | Historically supported Mobile Safari and Firefox for Android | Deprecated and multiplayer/server-heavy. Commercial use is possible, but CC-BY-SA attribution/share-alike and server operations need review. |

## Avoid As-Is For Monetized App

| Game | Why avoid as-is | Links |
| --- | --- | --- |
| Armor Alley | OSGL lists code/license as CC-BY-NC-3.0 and assets include non-commercial terms. `NC` is not compatible with ads/paid app monetization. | https://armor-alley.net / https://github.com/scottschiller/ArmorAlley |
| Onslaught! Arena open-source release | GPL code, but the upstream README says game assets can be redistributed for free and cannot be resold without permission. That is not safe for monetized distribution as-is. | https://github.com/lostdecade/onslaught_arena / https://linuxgameconsortium.com/onslaught-arena-now-open-source-code/ |
| Shapelike | Itch page lists MIT code but CC-BY-NC-4.0 assets, so the shipped art is not monetization-safe without replacement/permission. | https://sandramoen.itch.io/shapelike |
| Any unlicensed GitHub game | Public source is not permission. No license means no clear reuse rights. | Verify each repo has an explicit LICENSE file and asset credits. |

## Integration Checklist

1. Save the repo URL, exact commit SHA, hosted demo URL, license file URL, and asset-credit source for every game you import.
2. Keep a `THIRD_PARTY_NOTICES.md` or equivalent in your app with copyright, license, and credit lines.
3. Check code and assets separately. A repo can have MIT code and non-commercial music/art.
4. Retheme clones of active commercial games before monetization, even when the implementation license is permissive.
5. Verify touch controls, viewport scaling, audio unlock behavior, orientation handling, and offline/cache behavior on real iOS Safari and Android Chrome.
6. If you modify MPL/GPL/AGPL projects, document your source-offer obligations before release.
7. Prefer embedding games as isolated routes/iframes or packaged static bundles so license notices and upstream provenance stay clear.

## Source Trail

- GitHub Web Games collection: https://github.com/collections/web-games
- Open Source Games List playable browser games: https://trilarion.github.io/opensourcegames/games/web.html
- 2048 license/repo: https://github.com/gabrielecirulli/2048
- PROXX repo: https://github.com/GoogleChromeLabs/proxx
- Sandspiel repo: https://github.com/maxbittker/sandspiel
- Tower Building Game repo: https://github.com/iamkun/tower_game
- Alien Invasion repo: https://github.com/cykod/AlienInvasion
- Catch The Cat repo: https://github.com/ganlvtech/phaser-catch-the-cat
- HexGL repo and site: https://github.com/BKcore/HexGL / https://hexgl.bkcore.com
- Phaser Quest project page: https://www.dynetisgames.com/2017/03/18/phaser-quest/
- A Dark Room repo and presskit: https://github.com/doublespeakgames/adarkroom / https://press.doublespeakgames.com/adr/
- Gridland repo and presskit: https://github.com/doublespeakgames/gridland / https://press.doublespeakgames.com/gridland/
- Hextris repo: https://github.com/Hextris/hextris
- CaveScroller itch page: https://gtrxac.itch.io/cavescroller
- CasterGrounds itch page: https://yourguyphil.itch.io/castergrounds
- Wave-Rider itch and Game Off source listing: https://cutefame.itch.io/wave-rider / https://itch.io/jam/game-off-2025/rate/4068189
- Gasteroids itch page: https://nalquas.itch.io/gasteroids
- Gravitonion Collector itch page: https://maiconspas.itch.io/gravitonion-collector
- Additional OSGL-verified rows added from the playable browser list: asdf, Banania, Gift Grabber, Minesweeper.Zone, Pipe Puzzle, Jezzball, Rapid Dominance, Rot Magus, The House, OpenEtG, Delaford, ArchaicQuest II, Duck Hunt JS, Enduro tribute, Fluid Table Tennis, Tower Defense, TOSIOS, skifree.js, Pacman HTML5, and CrappyBird.
