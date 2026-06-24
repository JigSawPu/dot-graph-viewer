# DotCanvas

A touch-first, static DOT graph and mind-map editor built with Cytoscape.js.

## Features

- Infinite pan/zoom canvas
- Touch-draggable nodes
- Create, connect, edit, duplicate, lock, and delete nodes
- Mind-map, hierarchy, radial, organic, circle, and grid reflow
- DOT and JSON import
- DOT, JSON, PNG, and JPG export
- Undo/redo and automatic browser storage
- No backend and no file uploads to a server

## Deploy to Render from GitHub

1. Upload every file in this folder to the root of a GitHub repository.
2. In Render, create a **Static Site** and connect the repository.
3. Leave the build command blank.
4. Set the publish directory to `.`.
5. Deploy.

`render.yaml` is included if you prefer Render Blueprint deployment.

## Notes

DOT import supports common node declarations, labels, colors, shapes, and directed or undirected edges. Very advanced DOT constructs such as HTML labels, nested clusters, ports, and macros may be simplified during import.

Cytoscape.js is loaded from jsDelivr, so the app needs internet access on first load. Your graph data stays in the browser.
