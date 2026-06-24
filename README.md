# DotCanvas Future PWA

A touch-first DOT graph and diagram editor packaged as an installable Progressive Web App. It runs as a Render Static Site and requires no backend.

## Deploy

Upload every file and folder in this directory to the root of a GitHub repository. In Render, create a Static Site with an empty build command and `.` as the publish directory. The included `render.yaml` can also be used as a Blueprint.

## Install on iPhone

1. Open the deployed URL in Safari.
2. Tap Share.
3. Choose **Add to Home Screen**.
4. Launch DotCanvas from its Home Screen icon.

The app launches in standalone mode and caches its shell for offline use. Cytoscape is cached from jsDelivr during the first online installation, so open the app online once before relying on offline mode.

## Updating

Push changes to GitHub and let Render redeploy. Change `CACHE_VERSION` in `service-worker.js` whenever cached files change. Installed clients will show an update prompt when the new service worker is ready.

## Local data

Projects are autosaved in browser localStorage. Export DOT or JSON backups regularly because deleting the PWA or clearing Safari website data can remove local projects.


## Mobile layout update

This build fixes duplicated iPhone safe-area spacing, aligns the header and canvas, makes the workspace use `100dvh`, compacts the left toolbar, anchors the HUD, and keeps small graphs at a readable minimum zoom.


## Click-fix release

This build fixes a JavaScript syntax error in the structure reflow function that prevented the application script from loading, which made every UI button appear unresponsive. The service-worker cache version has also been increased so installed copies receive the corrected script.
