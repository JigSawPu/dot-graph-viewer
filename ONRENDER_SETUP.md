# Render configuration

## Recommended: Static Site

DotCanvas does not require a server for its current features.

### Dashboard setup

1. Upload this entire project to the root of a GitHub repository.
2. In Render, select **New → Static Site**.
3. Connect the GitHub repository.
4. Use these values:

- Branch: `main`
- Root Directory: leave blank
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Auto-Deploy: enabled

5. Create the site.

The `.node-version` file pins Node.js to `24.14.1`.

## Blueprint setup

The included `render.yaml` defines the same Static Site automatically.

1. In Render, select **New → Blueprint**.
2. Connect the repository.
3. Select the `render.yaml` file.
4. Review and apply the Blueprint.

## First PWA deployment

Because the earlier DotCanvas build used a different service worker:

1. Remove the old DotCanvas icon from the iPhone Home Screen.
2. Open the new Render URL in Safari.
3. Confirm that the React version loads.
4. Tap **Share → Add to Home Screen**.

Future releases can update through the PWA update notice.

## When to use a Render Web Service

Keep this as a Static Site until you need server-backed features. Add a Web Service later for:

- authentication
- cloud document storage
- device synchronization
- public or private share links
- permissions and comments
- live collaboration
- server-managed revision history
