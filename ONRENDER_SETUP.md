# Render deployment setup

This project is a **Render Static Site**.

## Important fix in this build

The previous package lock contained dependency URLs for an internal build registry that Render cannot access. This build uses the public npm registry, pins Node.js 22.23.0 with npm 10.9.4, and disables Render's automatic dependency installation so dependencies are installed exactly once by the build command.

## Existing Render site

1. Upload all files in this project to the repository root, including hidden files `.node-version` and `.npmrc`.
2. Open the Static Site in Render.
3. Open **Environment** and set:
   - `NODE_VERSION` = `22.23.0`
   - `SKIP_INSTALL_DEPS` = `true`
4. Open **Settings** and set:
   - Build Command: `npm ci --registry=https://registry.npmjs.org --no-audit --no-fund && npm run build`
   - Publish Directory: `dist`
   - Root Directory: leave blank
5. Make sure the connected branch is the branch containing these files.
6. Use **Manual Deploy → Clear build cache & deploy**.

## Blueprint setup

The included `render.yaml` already supplies the correct build command, publish directory, Node version, and `SKIP_INSTALL_DEPS=true`. If the site was created manually rather than from a Blueprint, dashboard settings can override or differ from this file, so verify the settings above.

## Expected beginning of the corrected log

The build should show Node.js 22.23.0. It should not perform Render's separate automatic `Installing dependencies with npm...` phase. Instead, it should proceed to the configured build command, run `npm ci`, then `npm run build`, and publish `dist`.
