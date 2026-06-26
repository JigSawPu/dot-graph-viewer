# DotCanvas — React + TypeScript + Vite

DotCanvas is a responsive, touch-first DOT graph, mind-map, and diagram editor. This release replaces the previous large vanilla JavaScript UI with a component-based React architecture, strict TypeScript types, a Vite build, and a reusable responsive design system.

## Included features

- Infinite Cytoscape.js canvas with pan, pinch zoom, selection, and draggable nodes
- Add node, add child, connect nodes, delete, duplicate, lock position, fit, zoom, undo, and redo
- DOT and editable JSON import
- DOT, JSON, transparent PNG, and JPG export
- Ten diagram structures:
  - Traditional mind map
  - Flowchart
  - Fishbone diagram
  - Timeline
  - Matrix
  - Gantt chart
  - Organizational chart
  - Tree diagram
  - Concept map
  - Bubble map
- Node title, subtitle, notes, shape, width, icon, tag, colors, and branch styling
- Smooth, angular, straight, and elbow connections
- Light and dark themes
- Local autosave
- Installable PWA with offline app-shell caching
- Responsive compact, tablet, and desktop layouts
- iPhone safe-area and Visual Viewport handling

## Architecture

```text
src/
├── components/
│   ├── BottomDock.tsx
│   ├── ExportDialog.tsx
│   ├── GraphCanvas.tsx
│   ├── InspectorPanel.tsx
│   ├── MorePanel.tsx
│   ├── PwaStatus.tsx
│   ├── StructureDialog.tsx
│   └── TopBar.tsx
├── hooks/
│   ├── useDocumentHistory.ts
│   └── useVisualViewport.ts
├── lib/
│   ├── constants.ts
│   ├── document.ts
│   ├── dot.ts
│   ├── layouts.ts
│   ├── storage.ts
│   └── templates.ts
├── styles/
│   ├── base.css
│   ├── components.css
│   ├── layout.css
│   ├── responsive.css
│   └── tokens.css
├── App.tsx
├── main.tsx
└── types.ts
```

The design system is centralized in `src/styles/tokens.css`. Components use shared spacing, control sizes, radii, colors, safe-area variables, shadows, and responsive modes instead of independent device-specific offsets.

## Local development

Requirements:

- Node.js 24.x
- npm

Commands:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

Production validation:

```bash
npm run check
npm run build
npm run preview
```

The production output is generated in `dist/`.

# Deploying to Render

This project should be deployed as a **Render Static Site**, not a Web Service. Graph editing, DOT parsing, export, PWA caching, and local persistence all run in the browser.

A Render Web Service is only needed later for accounts, cloud synchronization, shared editable URLs, team permissions, databases, or real-time collaboration.

## Option A — Manual Render configuration

1. Create a GitHub repository.
2. Upload every file and folder from this project to the repository root.
3. Commit `package-lock.json` along with the source files.
4. In Render, choose **New → Static Site**.
5. Connect the GitHub repository.
6. Configure:

| Setting | Value |
|---|---|
| Branch | `main` |
| Root directory | leave blank |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Auto deploy | enabled |

7. Create the Static Site.
8. Wait for the build to complete.
9. Open the supplied `onrender.com` URL in Safari.

The included `.node-version` pins Node.js to `24.14.1` so local and Render builds use a consistent runtime.

## Option B — Render Blueprint

A complete `render.yaml` is included. In Render:

1. Choose **New → Blueprint**.
2. Connect the GitHub repository.
3. Select the repository containing `render.yaml`.
4. Review the proposed `dotcanvas-react` Static Site.
5. Apply the Blueprint.

The Blueprint configures:

```yaml
buildCommand: npm ci && npm run build
staticPublishPath: ./dist
```

It also adds:

- `Cache-Control: no-cache` for the generated service worker and manifest
- basic security response headers
- an SPA rewrite to `/index.html`

## Updating the installed iPhone PWA

After pushing a change to GitHub:

1. Render automatically rebuilds and deploys the site.
2. Reopen the installed app.
3. The PWA update message appears when the new service worker is ready.
4. Tap **Update**.

For the first React/Vite deployment, remove the older vanilla DotCanvas icon from the Home Screen once, open the new Render URL in Safari, and add it to the Home Screen again. This prevents the previous hand-written service worker from controlling the new Vite build.

## Install on iPhone

1. Open the deployed Render URL in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. Tap **Add**.
5. Launch DotCanvas from its Home Screen icon.

## Data and privacy

Documents are stored in browser local storage and graph files are processed on the device. A backend is not included. Export JSON backups regularly because removing the PWA or clearing Safari website data can delete locally stored documents.

## When to introduce a backend

Keep this Static Site while the product remains local-first. Add a separate Render Web Service when the following become requirements:

- user accounts and authentication
- document sync across devices
- cloud file storage
- public or private share links
- comments and permissions
- live collaborative editing
- server-side version history


## Render install-error fix

This release pins Node.js 22.23.0/npm 10.9.4, replaces internal registry URLs in `package-lock.json` with public npm registry URLs, and sets `SKIP_INSTALL_DEPS=true` so Render does not run a second automatic dependency installation. See `ONRENDER_SETUP.md` for the exact dashboard settings and use **Clear build cache & deploy** after uploading this release.


## UX fixes in this build

- Choosing a structure now rearranges the current graph by default instead of replacing it.
- The structure dialog only replaces the graph when the replacement switch is enabled.
- Reflow preserves the current canvas pan and zoom unless a fresh template is created.
- Cytoscape's gray active-touch indicator and selection box are disabled.
- The PWA bottom dock uses a standalone-specific safe-area offset so it sits closer to the Home indicator while remaining correctly aligned in Safari.


## Structure layout correction

Selecting a structure now calculates and commits new positions for every existing node directly into the React document state. Node content and connections remain intact, the current viewport is preserved, and the graph visibly changes to the selected layout. Template replacement remains optional.
