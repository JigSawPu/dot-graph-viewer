# DotCanvas Studio v7

A mobile-first Progressive Web App for opening DOT files and editing graphs, mind maps, and structured diagrams directly in the browser.

## What this version adds

- A light, paper-like mind-map interface inspired by modern native mobile diagram apps
- Smooth pastel branch colors and rounded content cards
- Focus mode for isolating a selected topic and its descendants
- Status tags displayed beside nodes
- Custom tags with editable names and colors
- Node icon picker
- Node notes and subtitles
- Node image attachments stored inside JSON project backups
- A floating style panel with palettes, node colors, branch colors, connection styles, and line width
- Search across titles, subtitles, notes, icons, and tags
- A compact floating bottom toolbar
- Project sharing through the iOS share sheet when supported
- DOT, JSON, PNG, and JPG export
- Ten structure families: mind map, flowchart, fishbone, timeline, matrix, Gantt, organization chart, tree, concept map, and bubble map
- Local autosave, undo/redo, light/dark themes, and PWA installation

## Static site or web service?

This package remains a Render **Static Site**. All current editing features run on the device and do not require a server.

A backend would only be required for features such as:

- user accounts
- cloud synchronization between devices
- shared editable links
- live multi-user collaboration
- server-managed version history
- team workspaces and permissions

The UI includes a Share action, but in this static build it shares or downloads an editable JSON project file. It is not real-time collaboration.

## Deploy to Render

1. Upload every file in this folder to the root of the GitHub repository.
2. In Render, create or keep a **Static Site**.
3. Leave the build command empty.
4. Set the publish directory to `.`.
5. Deploy the `main` branch.

After deployment, remove the older Home Screen installation once, open the new Render URL in Safari, verify version 7, then use **Share → Add to Home Screen**.

## Important offline note

Cytoscape.js is cached after the app has been opened online. Open the deployed app online at least once before relying on offline mode.

## Local data

Projects are stored in browser local storage. Image attachments can use substantial storage, so export JSON backups regularly. Clearing Safari website data or deleting the installed web app may remove local projects.
