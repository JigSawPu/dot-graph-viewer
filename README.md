# DotGlass

A polished, mobile-first Graphviz DOT viewer. Files are rendered locally in the browser with Viz.js/WebAssembly.

## Deploy from iPhone using GitHub + Render

1. Create a new GitHub repository.
2. Upload all files from this folder to the repository root.
3. In Render, choose **New → Static Site** and connect the repository.
4. Use these settings:
   - Branch: `main`
   - Build command: leave blank
   - Publish directory: `.`
5. Create the static site.

Render will redeploy automatically after future GitHub commits.

## Features

- Open `.dot` and `.gv` files
- Local/private browser rendering
- DOT source editor
- Six Graphviz layout engines
- Smooth pan, pinch, wheel zoom, fit and fullscreen
- SVG export
- Responsive glass interface and light/dark modes

## Notes

The app imports Viz.js from `esm.sh`, so visitors need an internet connection on first load. No graph file is sent to this site or to Render.
