# Shared AI games

`/ai-games/index.html` handles the Android app's existing
`/ai-games?gameId=<public-id>` links. GitHub Pages redirects the directory URL
to `/ai-games/`, preserving the query. No app URL change or server rewrite is
required. Publish this directory with the existing GitHub Pages deployment.

The page reads one public `ai_games` document and only displays complete,
published games. It performs no authenticated requests or engagement writes.
The public Firebase configuration is the same one used by `/bio/`.

`artifact.mjs` validates and downloads bounded published manifests (32 files,
500 KiB per file, 2 MiB total). Legacy `htmlContent` games are supported.
Old `preview.png` / `preview_vN.png` thumbnail caches are skipped, matching the
Android player. Binary game assets remain byte-preserving data URLs.

`memory-player.mjs` packages files into an opaque sandboxed iframe. Relative
scripts, CSS, module imports, and fetch/XHR requests resolve against the
validated in-memory files. Acorn 8.18.0 is vendored with its MIT license to
rewrite JavaScript imports using syntax locations. No service worker or remote
player origin is needed. Closing the player destroys its frame and resources.

Game preferences use temporary in-frame storage and are discarded when the
game closes. Camera, microphone, and other privileged native features are not
enabled. Games requiring those features should be played in the Android app.
This browser player does not emulate Android bridge APIs.

## Checks

Run the artifact checks with Node.js:

```sh
node --test ai-games/artifact.test.mjs
```

For the browser regression suite, make the `playwright` package available to
Node (or set `PLAYWRIGHT_MODULE` to its absolute module path), and run:

```sh
node ai-games/browser.test.cjs
```

Use `CHROME_PATH` for an existing Chrome executable if Playwright's browser
is not installed. Tests start an ephemeral local server and use public-data
fixtures; they do not write to Firebase. They cover redirect/query retention,
reloads, scripts and dynamic imports, styles, relative JSON reads, sandbox and
storage isolation, closing the player, mobile overflow, legacy games, and errors.

The production Storage CORS policy permits `https://gamesp.xyz`; local origins
may be denied. Test real assets with a production-origin browser route override
that serves local page files, or on the deployed site. Do not broaden the
bucket's CORS policy merely to make localhost work.

The source fix must still be published before the public 404 is resolved.
