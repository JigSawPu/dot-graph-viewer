'use strict';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const uid = (prefix = 'n') => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const PROJECT_KEY = 'dotcanvas-studio-project-v7';
const OLD_PROJECT_KEY = 'dotcanvas-future-project';
const THEME_KEY = 'dotcanvas-theme';

const BRANCH_PALETTES = [
  { name: 'Lavender', branch: '#9b82f6', light: '#fbf9ff', dark: '#1d1933' },
  { name: 'Rose', branch: '#ef8fba', light: '#fff8fb', dark: '#301a29' },
  { name: 'Apricot', branch: '#f3a85e', light: '#fffaf4', dark: '#312215' },
  { name: 'Sky', branch: '#72a7ef', light: '#f7fbff', dark: '#17283d' },
  { name: 'Mint', branch: '#63cbb7', light: '#f4fffc', dark: '#15302b' },
  { name: 'Sun', branch: '#e8be52', light: '#fffdf4', dark: '#302913' },
  { name: 'Coral', branch: '#f27c72', light: '#fff8f7', dark: '#331b1a' },
  { name: 'Indigo', branch: '#6979e8', light: '#f8f9ff', dark: '#1a203b' },
  { name: 'Teal', branch: '#41b8c8', light: '#f3fdff', dark: '#123039' },
  { name: 'Plum', branch: '#b070d4', light: '#fdf8ff', dark: '#291832' }
];

const DEFAULT_TAGS = [
  { id: 'confirmed', name: 'Confirmed', color: '#79c87d', builtin: true },
  { id: 'progress', name: 'In progress', color: '#6d91ed', builtin: true },
  { id: 'research', name: 'Research', color: '#e8b83f', builtin: true },
  { id: 'todo', name: 'To do', color: '#ed789f', builtin: true },
  { id: 'estimate', name: 'Estimate', color: '#f29657', builtin: true },
  { id: 'paid', name: 'Paid', color: '#5fc5a0', builtin: true },
  { id: 'track', name: 'On track', color: '#49bdc5', builtin: true }
];

const ICONS = ['', '◇', '♡', '✦', '✓', '★', '⚑', '⌂', '☁', '☀', '⚙', '✎', '▦', '⌁', '☕', '✈', '♧', '♬', '⚡', '☑', '⚐', '◎', '♙', '▣'];

const STRUCTURES = {
  mindmap: { name: 'Traditional Mind Map', short: 'Mind map', desc: 'A central topic with flowing branches.' },
  flowchart: { name: 'Logic Chart & Flowchart', short: 'Flowchart', desc: 'Steps, decisions, and outcomes.' },
  fishbone: { name: 'Fishbone Diagram', short: 'Fishbone', desc: 'Cause-and-effect analysis.' },
  timeline: { name: 'Timeline', short: 'Timeline', desc: 'Events in chronological order.' },
  matrix: { name: 'Matrix Layout', short: 'Matrix', desc: 'Compare items by rows and columns.' },
  gantt: { name: 'Gantt Chart', short: 'Gantt', desc: 'Tasks arranged across project phases.' },
  orgchart: { name: 'Organizational Chart', short: 'Org chart', desc: 'People, teams, and reporting lines.' },
  tree: { name: 'Tree Diagram', short: 'Tree', desc: 'A top-down branching hierarchy.' },
  concept: { name: 'Concept Map', short: 'Concept map', desc: 'A network of related concepts.' },
  bubble: { name: 'Bubble Map', short: 'Bubble map', desc: 'A topic surrounded by associations.' }
};

const state = {
  tool: 'select',
  connectFrom: null,
  history: [],
  future: [],
  restoring: false,
  structure: 'mindmap',
  title: 'DotCanvas',
  tags: DEFAULT_TAGS.map(tag => ({ ...tag })),
  edgeStyle: 'bezier',
  edgeWidth: 3,
  focusRoot: null,
  snapshotTimer: null,
  overlayFrame: 0
};

let cy = null;

function currentTheme() {
  return document.documentElement.dataset.theme || 'light';
}

function setInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  document.documentElement.dataset.theme = stored === 'dark' ? 'dark' : 'light';
}
setInitialTheme();

function defaultNode(label = 'New topic') {
  const light = currentTheme() === 'light';
  return {
    id: uid(),
    label,
    subtitle: '',
    notes: '',
    icon: '',
    tag: '',
    shape: 'roundrectangle',
    size: 168,
    height: 72,
    fontSize: 13,
    fill: light ? '#fffefa' : '#14253a',
    textColor: light ? '#292a31' : '#edf6ff',
    border: light ? '#8b7cf6' : '#55b9ff',
    branchColor: light ? '#8b7cf6' : '#55b9ff',
    image: 'none',
    locked: false,
    displayLabel: label
  };
}

function rgba(hex, alpha = 0.18) {
  const value = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return `rgba(120,100,220,${alpha})`;
  const n = parseInt(value, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(element._timer);
  element._timer = setTimeout(() => element.classList.remove('show'), 1900);
}

function safeDialogOpen(dialog) {
  if (!dialog || dialog.open) return;
  try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
}

function safeDialogClose(dialog) {
  if (!dialog) return;
  try { dialog.close(); } catch { dialog.removeAttribute('open'); }
}

function applyTheme(theme, { announce = false } = {}) {
  const previous = currentTheme();
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  const light = next === 'light';
  $('#themeColorMeta').content = light ? '#f7f5f1' : '#06101d';
  $('#themeIcon').textContent = light ? '☾' : '☀';

  if (cy && previous !== next) {
    cy.batch(() => {
      cy.nodes().forEach(node => {
        const fill = node.data('fill');
        const text = node.data('textColor');
        if (previous === 'dark' && next === 'light' && ['#14253a', '#14263a', '#162438'].includes(fill)) node.data('fill', '#fffefa');
        if (previous === 'light' && next === 'dark' && ['#fffefa', '#ffffff', '#fbfaf7'].includes(fill)) node.data('fill', '#14253a');
        if (previous === 'dark' && next === 'light' && ['#edf6ff', '#eef7ff'].includes(text)) node.data('textColor', '#292a31');
        if (previous === 'light' && next === 'dark' && ['#292a31', '#183047'].includes(text)) node.data('textColor', '#edf6ff');
      });
    });
    refreshDerivedData();
    scheduleSnapshot();
  }
  if (announce) toast(light ? 'Light theme enabled' : 'Dark theme enabled');
}

function ensureCytoscape() {
  if (typeof window.cytoscape !== 'function') {
    $('#emptyState').hidden = false;
    $('#emptyState h1').textContent = 'Graph engine unavailable';
    $('#emptyState p').textContent = 'Open the app online once so the graph engine can be cached for offline use.';
    throw new Error('Cytoscape failed to load');
  }
}

ensureCytoscape();

cy = cytoscape({
  container: $('#cy'),
  elements: [],
  minZoom: 0.18,
  maxZoom: 4.5,
  wheelSensitivity: 0.18,
  boxSelectionEnabled: true,
  selectionType: 'single',
  autoungrabify: false,
  style: [
    {
      selector: 'node',
      style: {
        shape: 'data(shape)',
        width: 'data(size)',
        height: 'data(height)',
        'background-color': 'data(fill)',
        'background-image': 'data(image)',
        'background-fit': 'cover',
        'background-image-opacity': 0.24,
        'border-width': 2,
        'border-color': 'data(border)',
        'border-opacity': 0.92,
        label: 'data(displayLabel)',
        color: 'data(textColor)',
        'font-size': 'data(fontSize)',
        'font-weight': 650,
        'text-wrap': 'wrap',
        'text-max-width': '150px',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-background-color': 'data(fill)',
        'text-background-opacity': 0.58,
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle',
        padding: '12px',
        'shadow-blur': 18,
        'shadow-color': 'data(branchColor)',
        'shadow-opacity': 0.14,
        'shadow-offset-x': 0,
        'shadow-offset-y': 5,
        'overlay-opacity': 0
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 3.5,
        'shadow-blur': 30,
        'shadow-opacity': 0.38,
        'underlay-color': 'data(branchColor)',
        'underlay-opacity': 0.12,
        'underlay-padding': 8
      }
    },
    {
      selector: 'node.focus-root',
      style: {
        'border-width': 4,
        'shadow-blur': 34,
        'shadow-opacity': 0.46
      }
    },
    {
      selector: 'node.search-hit',
      style: {
        'border-width': 4,
        'underlay-color': '#ffd65a',
        'underlay-opacity': 0.28,
        'underlay-padding': 9
      }
    },
    {
      selector: 'node.connect-source',
      style: {
        'border-width': 4,
        'border-color': '#f3a85e',
        'shadow-color': '#f3a85e',
        'shadow-opacity': 0.55
      }
    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'bezier',
        width: 3,
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'data(arrow)',
        'arrow-scale': 0.72,
        opacity: 0.82,
        'line-cap': 'round',
        'underlay-color': 'data(color)',
        'underlay-opacity': 0.12,
        'underlay-padding': 4,
        'overlay-opacity': 0
      }
    },
    {
      selector: 'edge:selected',
      style: {
        width: 5,
        opacity: 1,
        'underlay-opacity': 0.25,
        'underlay-padding': 7
      }
    },
    { selector: '.focus-hidden', style: { display: 'none' } },
    { selector: '.search-muted', style: { opacity: 0.15 } }
  ],
  layout: { name: 'preset' }
});

function applyGraphStyle() {
  if (!cy) return;
  cy.style().selector('edge').style({
    'curve-style': state.edgeStyle,
    width: Number(state.edgeWidth) || 3
  }).update();
  $('#edgeStyleInput').value = state.edgeStyle;
  $('#edgeWidthInput').value = String(state.edgeWidth);
}

function tagById(id) {
  return state.tags.find(tag => tag.id === id) || null;
}

function sanitizeNodeData(data) {
  const base = defaultNode(data?.label || 'New topic');
  const merged = { ...base, ...(data || {}) };
  merged.size = Number(merged.size) || 168;
  merged.height = Number(merged.height) || (merged.image && merged.image !== 'none' ? 96 : 72);
  merged.fontSize = Number(merged.fontSize) || 13;
  merged.image = merged.image || 'none';
  merged.notes = merged.notes || '';
  merged.icon = merged.icon || '';
  merged.tag = merged.tag || '';
  merged.branchColor = merged.branchColor || merged.border || '#8b7cf6';
  merged.border = merged.border || merged.branchColor;
  return merged;
}

function refreshNodeLabel(node) {
  const icon = node.data('icon');
  const label = node.data('label') || node.id();
  const subtitle = node.data('subtitle');
  const parts = [];
  if (icon) parts.push(icon);
  parts.push(label);
  if (subtitle) parts.push(subtitle);
  node.data('displayLabel', parts.join('\n'));
}

function refreshDerivedData() {
  if (!cy) return;
  cy.batch(() => {
    cy.nodes().forEach(node => {
      const clean = sanitizeNodeData(node.data());
      Object.entries(clean).forEach(([key, value]) => node.data(key, value));
      refreshNodeLabel(node);
      clean.locked ? node.lock() : node.unlock();
    });
    cy.edges().forEach(edge => {
      const target = edge.target();
      const source = edge.source();
      edge.data('color', edge.data('color') || target.data('branchColor') || source.data('branchColor') || '#8b7cf6');
      edge.data('arrow', edge.data('arrow') || arrowForStructure());
    });
  });
  applyGraphStyle();
  queueOverlayRender();
}

function arrowForStructure() {
  return ['flowchart', 'timeline', 'gantt', 'concept'].includes(state.structure) ? 'triangle' : 'none';
}

function centerModelPosition() {
  return {
    x: (cy.width() / 2 - cy.pan().x) / cy.zoom(),
    y: (cy.height() / 2 - cy.pan().y) / cy.zoom()
  };
}

function getProjectObject() {
  const elements = [];
  cy.nodes().forEach(node => {
    const classes = node.classes().filter(name => !['focus-hidden', 'focus-root', 'search-hit', 'search-muted', 'connect-source'].includes(name));
    elements.push({ group: 'nodes', data: { ...node.data() }, position: { ...node.position() }, locked: node.locked(), classes });
  });
  cy.edges().forEach(edge => {
    const classes = edge.classes().filter(name => !['focus-hidden', 'search-muted'].includes(name));
    elements.push({ group: 'edges', data: { ...edge.data() }, classes });
  });
  return {
    version: 7,
    title: state.title,
    structure: state.structure,
    tags: state.tags,
    settings: { edgeStyle: state.edgeStyle, edgeWidth: state.edgeWidth },
    elements,
    pan: cy.pan(),
    zoom: cy.zoom()
  };
}

function projectString() {
  return JSON.stringify(getProjectObject());
}

function updateSaveStatus(text = 'Saved locally') {
  $('#saveStatus').textContent = text;
}

function snapshot({ immediate = false } = {}) {
  if (state.restoring) return;
  clearTimeout(state.snapshotTimer);
  const save = () => {
    const serialized = projectString();
    if (state.history.at(-1) !== serialized) state.history.push(serialized);
    if (state.history.length > 70) state.history.shift();
    state.future = [];
    try {
      localStorage.setItem(PROJECT_KEY, serialized);
      updateSaveStatus('Saved locally');
    } catch (error) {
      console.warn(error);
      updateSaveStatus('Export a backup');
      toast('Local storage is full — export a JSON backup');
    }
    updateEmptyState();
  };
  updateSaveStatus('Saving…');
  if (immediate) save(); else state.snapshotTimer = setTimeout(save, 220);
}

function scheduleSnapshot() {
  snapshot();
}

function restoreProject(raw, { keepHistory = false } = {}) {
  state.restoring = true;
  try {
    const project = typeof raw === 'string' ? JSON.parse(raw) : raw;
    cy.elements().remove();
    state.title = project.title || 'DotCanvas';
    state.structure = STRUCTURES[project.structure] ? project.structure : 'mindmap';
    state.tags = Array.isArray(project.tags) && project.tags.length ? project.tags.map(tag => ({ ...tag })) : DEFAULT_TAGS.map(tag => ({ ...tag }));
    state.edgeStyle = project.settings?.edgeStyle || 'bezier';
    state.edgeWidth = Number(project.settings?.edgeWidth) || 3;
    cy.add(project.elements || []);
    refreshDerivedData();
    cy.pan(project.pan || { x: cy.width() / 2, y: cy.height() / 2 });
    cy.zoom(Math.max(0.35, Number(project.zoom) || 1));
    $('#documentTitle').textContent = state.title;
    setStructureUI();
    renderTagList();
    renderPalette();
    exitFocus({ fit: false });
    updateEmptyState();
    updateNodePanel();
    if (!keepHistory) state.history = [projectString()];
  } finally {
    state.restoring = false;
    queueOverlayRender();
  }
}

function updateEmptyState() {
  $('#emptyState').hidden = cy.nodes().length > 0;
}

function selectedNode() {
  return cy.$('node:selected').first();
}

function selectedElement() {
  return cy.$(':selected').first();
}

function paletteFor(index) {
  return BRANCH_PALETTES[index % BRANCH_PALETTES.length];
}

function nextBranchPalette(parent) {
  if (!parent || !parent.length) return paletteFor(cy.nodes().length);
  const isRoot = parent.indegree() === 0;
  if (isRoot) return paletteFor(parent.outgoers('node').length);
  const branch = parent.data('branchColor');
  const match = BRANCH_PALETTES.find(item => item.branch.toLowerCase() === String(branch).toLowerCase());
  return match || { branch, light: '#fffefa', dark: '#162438' };
}

function addNode(position, label = 'New topic', parent = null, extra = {}) {
  const palette = nextBranchPalette(parent);
  const light = currentTheme() === 'light';
  const data = {
    ...defaultNode(label),
    fill: light ? palette.light : palette.dark,
    border: palette.branch,
    branchColor: palette.branch,
    ...extra,
    id: extra.id || uid()
  };
  cy.add({ group: 'nodes', data, position });
  const node = cy.$id(data.id);
  refreshNodeLabel(node);
  if (parent && parent.length) {
    cy.add({ group: 'edges', data: { id: uid('e'), source: parent.id(), target: data.id, color: data.branchColor, arrow: arrowForStructure() } });
  }
  cy.$(':selected').unselect();
  node.select();
  updateNodePanel();
  snapshot({ immediate: true });
  queueOverlayRender();
  return node;
}

function addChildToSelected() {
  const parent = selectedNode();
  if (!parent.length) return toast('Select a parent topic first');
  const position = { x: parent.position('x') + 220, y: parent.position('y') + 70 };
  const child = addNode(position, 'New child', parent);
  openPanel('nodePanel');
  setTimeout(() => $('#labelInput').select(), 60);
  return child;
}

function deleteSelection() {
  const selection = cy.$(':selected');
  if (!selection.length) return toast('Select a node or connection first');
  const removedFocus = state.focusRoot && selection.filter(`#${state.focusRoot}`).length;
  selection.remove();
  if (removedFocus) exitFocus({ fit: false });
  closePanels();
  snapshot({ immediate: true });
  updateEmptyState();
  queueOverlayRender();
}

function duplicateSelected() {
  const node = selectedNode();
  if (!node.length) return toast('Select a node first');
  const data = { ...node.data(), id: uid(), label: `${node.data('label')} copy` };
  const copy = cy.add({ group: 'nodes', data, position: { x: node.position('x') + 52, y: node.position('y') + 52 } });
  cy.$(':selected').unselect();
  copy.select();
  refreshNodeLabel(copy);
  updateNodePanel();
  snapshot({ immediate: true });
}

function queueOverlayRender() {
  if (state.overlayFrame) return;
  state.overlayFrame = requestAnimationFrame(() => {
    state.overlayFrame = 0;
    renderNodeOverlays();
  });
}

function renderNodeOverlays() {
  const layer = $('#badgeLayer');
  const fragment = document.createDocumentFragment();
  cy.nodes(':visible').forEach(node => {
    const box = node.renderedBoundingBox({ includeLabels: true, includeOverlays: false });
    const tag = tagById(node.data('tag'));
    if (tag) {
      const badge = document.createElement('span');
      badge.className = 'node-tag-badge';
      badge.textContent = tag.name;
      badge.style.left = `${Math.min(cy.width() - 125, box.x2 + 7)}px`;
      badge.style.top = `${Math.max(10, box.y1 + 6)}px`;
      badge.style.setProperty('--tag-color', tag.color);
      badge.style.setProperty('--tag-bg', rgba(tag.color, currentTheme() === 'light' ? 0.14 : 0.22));
      fragment.appendChild(badge);
    }
    if (node.data('notes')) {
      const note = document.createElement('span');
      note.className = 'node-note-badge';
      note.textContent = '✎';
      note.style.left = `${box.x2 - 7}px`;
      note.style.top = `${box.y2 - 7}px`;
      fragment.appendChild(note);
    }
  });
  layer.replaceChildren(fragment);
}

function setTool(tool) {
  state.tool = tool;
  if (state.connectFrom) {
    state.connectFrom.removeClass('connect-source');
    state.connectFrom = null;
  }
  $$('.dock-tool').forEach(button => button.classList.remove('active'));
  const button = $(`.dock-tool[data-${tool === 'select' ? 'tool' : 'action'}="${tool}"]`);
  if (button) button.classList.add('active');
  if (tool === 'connect') toast('Tap a source topic, then a destination');
}

function closePanels() {
  $$('.floating-panel').forEach(panel => { panel.hidden = true; });
  $$('.dock-tool').forEach(button => button.classList.remove('panel-active'));
  clearSearchHighlights();
}

function openPanel(id) {
  const nodeRequired = ['nodePanel', 'tagsPanel', 'stylePanel', 'mediaPanel'].includes(id);
  if (nodeRequired && !selectedNode().length) {
    toast('Select a node first');
    return false;
  }
  closePanels();
  const panel = $(`#${id}`);
  if (!panel) return false;
  panel.hidden = false;
  const trigger = $(`.dock-tool[data-panel="${id}"]`);
  trigger?.classList.add('panel-active');
  if (id === 'nodePanel') updateNodePanel();
  if (id === 'tagsPanel') renderTagList();
  if (id === 'stylePanel') updateStylePanel();
  if (id === 'mediaPanel') updateMediaPanel();
  if (id === 'searchPanel') setTimeout(() => $('#searchInput').focus(), 50);
  return true;
}

function updateNodePanel() {
  const node = selectedNode();
  if (!node.length) return;
  const data = sanitizeNodeData(node.data());
  $('#panelNodeTitle').textContent = data.label || 'Edit topic';
  $('#labelInput').value = data.label;
  $('#subtitleInput').value = data.subtitle;
  $('#notesInput').value = data.notes;
  $('#shapeInput').value = data.shape;
  $('#sizeInput').value = data.size;
  $('#lockInput').checked = node.locked();
  renderIconPicker();
}

function bindNodeInput(selector, key, eventName = 'input', transform = value => value) {
  $(selector).addEventListener(eventName, event => {
    const node = selectedNode();
    if (!node.length) return;
    node.data(key, transform(event.target.value));
    if (key === 'label' || key === 'subtitle' || key === 'icon') refreshNodeLabel(node);
    if (key === 'size') node.data('height', Math.max(62, Math.min(118, Number(event.target.value) * 0.43)));
    if (key === 'label') $('#panelNodeTitle').textContent = event.target.value || 'Edit topic';
    scheduleSnapshot();
    queueOverlayRender();
  });
}

bindNodeInput('#labelInput', 'label');
bindNodeInput('#subtitleInput', 'subtitle');
bindNodeInput('#notesInput', 'notes');
bindNodeInput('#shapeInput', 'shape', 'change');
bindNodeInput('#sizeInput', 'size', 'input', Number);

$('#lockInput').addEventListener('change', event => {
  const node = selectedNode();
  if (!node.length) return;
  node.data('locked', event.target.checked);
  event.target.checked ? node.lock() : node.unlock();
  snapshot();
});

function renderIconPicker() {
  const node = selectedNode();
  const selected = node.length ? node.data('icon') || '' : '';
  const fragment = document.createDocumentFragment();
  ICONS.forEach(icon => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `icon-option${selected === icon ? ' active' : ''}`;
    button.textContent = icon || '—';
    button.addEventListener('click', () => {
      const current = selectedNode();
      if (!current.length) return;
      current.data('icon', icon);
      refreshNodeLabel(current);
      renderIconPicker();
      snapshot();
    });
    fragment.appendChild(button);
  });
  $('#iconPicker').replaceChildren(fragment);
}

function renderTagList() {
  const node = selectedNode();
  const selected = node.length ? node.data('tag') || '' : '';
  const fragment = document.createDocumentFragment();
  state.tags.forEach(tag => {
    const row = document.createElement('div');
    row.className = 'tag-row';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tag-option${selected === tag.id ? ' active' : ''}`;
    button.style.setProperty('--tag-color', tag.color);
    button.innerHTML = `<i></i><b>${escapeHtml(tag.name)}</b>`;
    button.addEventListener('click', () => {
      const current = selectedNode();
      if (!current.length) return toast('Select a node first');
      current.data('tag', tag.id);
      renderTagList();
      snapshot();
      queueOverlayRender();
    });
    row.appendChild(button);
    if (!tag.builtin) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'tag-delete';
      remove.textContent = '×';
      remove.addEventListener('click', () => {
        cy.nodes().filter(n => n.data('tag') === tag.id).forEach(n => n.data('tag', ''));
        state.tags = state.tags.filter(item => item.id !== tag.id);
        renderTagList();
        snapshot();
        queueOverlayRender();
      });
      row.appendChild(remove);
    }
    fragment.appendChild(row);
  });
  $('#tagList').replaceChildren(fragment);
}

$('#addTagBtn').addEventListener('click', () => {
  const name = $('#newTagInput').value.trim();
  if (!name) return toast('Enter a tag name');
  const tag = { id: uid('tag'), name, color: $('#newTagColor').value, builtin: false };
  state.tags.push(tag);
  $('#newTagInput').value = '';
  renderTagList();
  const node = selectedNode();
  if (node.length) node.data('tag', tag.id);
  snapshot();
  queueOverlayRender();
});

$('#clearTagBtn').addEventListener('click', () => {
  const node = selectedNode();
  if (!node.length) return;
  node.data('tag', '');
  renderTagList();
  snapshot();
  queueOverlayRender();
});

function renderPalette() {
  const fragment = document.createDocumentFragment();
  BRANCH_PALETTES.forEach(palette => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'palette-swatch';
    button.title = palette.name;
    button.style.setProperty('--swatch', palette.branch);
    button.addEventListener('click', () => applyPaletteToSelected(palette));
    fragment.appendChild(button);
  });
  $('#paletteGrid').replaceChildren(fragment);
}

function descendantsOf(node) {
  return node.successors('node');
}

function applyPaletteToSelected(palette) {
  const node = selectedNode();
  if (!node.length) return toast('Select a node first');
  const nodes = $('#applyDescendantsInput').checked ? node.union(descendantsOf(node)) : node;
  const light = currentTheme() === 'light';
  cy.batch(() => {
    nodes.forEach(item => {
      item.data({ branchColor: palette.branch, border: palette.branch, fill: light ? palette.light : palette.dark });
    });
    cy.edges().forEach(edge => {
      if (nodes.contains(edge.target()) || nodes.contains(edge.source())) edge.data('color', palette.branch);
    });
  });
  updateStylePanel();
  snapshot();
  queueOverlayRender();
}

function updateStylePanel() {
  const node = selectedNode();
  if (!node.length) return;
  $('#fillInput').value = normalizeHex(node.data('fill'), currentTheme() === 'light' ? '#fffefa' : '#14253a');
  $('#textInput').value = normalizeHex(node.data('textColor'), currentTheme() === 'light' ? '#292a31' : '#edf6ff');
  $('#branchInput').value = normalizeHex(node.data('branchColor'), '#8b7cf6');
  $('#edgeStyleInput').value = state.edgeStyle;
  $('#edgeWidthInput').value = state.edgeWidth;
}

function normalizeHex(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value)) ? value : fallback;
}

function applyColorField(key, value) {
  const node = selectedNode();
  if (!node.length) return;
  if (key === 'branchColor') {
    const nodes = $('#applyDescendantsInput').checked ? node.union(descendantsOf(node)) : node;
    cy.batch(() => {
      nodes.forEach(item => item.data({ branchColor: value, border: value }));
      cy.edges().forEach(edge => {
        if (nodes.contains(edge.target()) || nodes.contains(edge.source())) edge.data('color', value);
      });
    });
  } else {
    node.data(key, value);
  }
  snapshot();
  queueOverlayRender();
}

$('#fillInput').addEventListener('input', event => applyColorField('fill', event.target.value));
$('#textInput').addEventListener('input', event => applyColorField('textColor', event.target.value));
$('#branchInput').addEventListener('input', event => applyColorField('branchColor', event.target.value));
$('#edgeStyleInput').addEventListener('change', event => { state.edgeStyle = event.target.value; applyGraphStyle(); snapshot(); });
$('#edgeWidthInput').addEventListener('input', event => { state.edgeWidth = Number(event.target.value); applyGraphStyle(); scheduleSnapshot(); });

$('#resetNodeStyleBtn').addEventListener('click', () => {
  const node = selectedNode();
  if (!node.length) return;
  const clean = defaultNode(node.data('label'));
  node.data({ fill: clean.fill, textColor: clean.textColor, border: clean.border, branchColor: clean.branchColor, shape: 'roundrectangle', size: 168, height: 72, fontSize: 13 });
  refreshNodeLabel(node);
  updateStylePanel();
  snapshot();
});

function updateMediaPanel() {
  const node = selectedNode();
  const preview = $('#mediaPreview');
  preview.replaceChildren();
  if (!node.length || !node.data('image') || node.data('image') === 'none') {
    const span = document.createElement('span');
    span.textContent = 'No image attached';
    preview.appendChild(span);
    return;
  }
  const image = document.createElement('img');
  image.src = node.data('image');
  image.alt = '';
  preview.appendChild(image);
}

async function compressImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
  const max = 900;
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

$('#imageInput').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  const node = selectedNode();
  if (!file || !node.length) return;
  try {
    const image = await compressImage(file);
    node.data({ image, height: 100 });
    updateMediaPanel();
    snapshot({ immediate: true });
    toast('Image attached');
  } catch (error) {
    console.error(error);
    toast('Could not process this image');
  } finally {
    event.target.value = '';
  }
});

$('#removeImageBtn').addEventListener('click', () => {
  const node = selectedNode();
  if (!node.length) return;
  node.data({ image: 'none', height: 72 });
  updateMediaPanel();
  snapshot();
});

function clearSearchHighlights() {
  cy?.elements().removeClass('search-hit search-muted');
}

function searchTextForNode(node) {
  const tag = tagById(node.data('tag'));
  return [node.data('label'), node.data('subtitle'), node.data('notes'), node.data('icon'), tag?.name].filter(Boolean).join(' ').toLowerCase();
}

function runSearch(query) {
  clearSearchHighlights();
  const results = $('#searchResults');
  results.replaceChildren();
  const text = query.trim().toLowerCase();
  if (!text) return;
  const matches = cy.nodes().filter(node => searchTextForNode(node).includes(text));
  cy.nodes().not(matches).addClass('search-muted');
  cy.edges().addClass('search-muted');
  matches.addClass('search-hit');
  matches.connectedEdges().removeClass('search-muted');
  const fragment = document.createDocumentFragment();
  matches.slice(0, 40).forEach(node => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result';
    const tag = tagById(node.data('tag'));
    button.innerHTML = `<span class="result-icon">${escapeHtml(node.data('icon') || '◇')}</span><span><b>${escapeHtml(node.data('label'))}</b><small>${escapeHtml(node.data('subtitle') || tag?.name || 'Topic')}</small></span>`;
    button.addEventListener('click', () => {
      cy.$(':selected').unselect();
      node.select();
      cy.animate({ center: { eles: node }, zoom: Math.max(cy.zoom(), 1), duration: 280 });
      updateNodePanel();
      queueOverlayRender();
    });
    fragment.appendChild(button);
  });
  results.appendChild(fragment);
  if (!matches.length) results.innerHTML = '<p class="panel-hint">No matching topics.</p>';
}

$('#searchInput').addEventListener('input', event => runSearch(event.target.value));

function focusOnNode(node) {
  if (!node?.length) return toast('Select a topic to focus on');
  exitFocus({ fit: false });
  const visible = node.union(node.successors());
  cy.elements().not(visible).addClass('focus-hidden');
  node.addClass('focus-root');
  state.focusRoot = node.id();
  $('#focusExitBtn').hidden = false;
  $('#focusExitBtn').textContent = `Refocus · ${node.data('label')}`;
  readableFit(visible, 300);
  queueOverlayRender();
  toast('Focus mode enabled');
}

function exitFocus({ fit = true } = {}) {
  if (!cy) return;
  cy.elements().removeClass('focus-hidden focus-root');
  state.focusRoot = null;
  $('#focusExitBtn').hidden = true;
  if (fit && cy.nodes().length) readableFit(cy.elements(), 250);
  queueOverlayRender();
}

function toggleFocus() {
  if (state.focusRoot) return exitFocus();
  focusOnNode(selectedNode());
}

function roots(nodes = cy.nodes()) {
  const rootNodes = nodes.filter(node => node.indegree() === 0);
  return rootNodes.length ? rootNodes : nodes.first();
}

function visibleNodes() {
  return cy.nodes(':visible');
}

function visibleElements() {
  return cy.elements(':visible');
}

function readableFit(elements = visibleElements(), duration = 350) {
  if (!elements?.length) return;
  cy.animate({
    fit: { eles: elements, padding: window.innerWidth < 700 ? 72 : 110 },
    duration,
    complete: () => {
      const count = elements.nodes ? elements.nodes().length : cy.nodes().length;
      if (count <= 14 && cy.zoom() < 0.58) cy.zoom({ level: 0.58, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
      queueOverlayRender();
    }
  });
}

function hierarchyLevels(nodes, root) {
  const levels = [[root]];
  const seen = new Set([root.id()]);
  let current = [root];
  while (current.length) {
    const next = [];
    current.forEach(node => {
      node.outgoers('node').filter(child => nodes.contains(child)).forEach(child => {
        if (!seen.has(child.id())) { seen.add(child.id()); next.push(child); }
      });
    });
    if (next.length) levels.push(next);
    current = next;
  }
  nodes.forEach(node => {
    if (!seen.has(node.id())) {
      if (!levels[1]) levels[1] = [];
      levels[1].push(node);
    }
  });
  return levels;
}

function applyPresetPositions(positions, duration = 420, fit = true) {
  const nodes = visibleNodes();
  const layout = nodes.layout({
    name: 'preset',
    positions: node => positions[node.id()] || node.position(),
    animate: duration > 0,
    animationDuration: duration,
    fit: false
  });
  cy.one('layoutstop', () => {
    if (fit) readableFit(visibleElements(), 260);
    snapshot();
  });
  layout.run();
}

function layoutMindmap() {
  const nodes = visibleNodes();
  if (!nodes.length) return;
  const root = roots(nodes).first();
  const direct = root.outgoers('node').filter(node => nodes.contains(node)).toArray();
  const branches = direct.length ? direct : nodes.filter(node => node.id() !== root.id()).toArray();
  const positions = { [root.id()]: { x: 0, y: 0 } };
  const sideLists = { right: [], left: [] };
  branches.forEach((branch, index) => sideLists[index % 2 === 0 ? 'right' : 'left'].push(branch));

  Object.entries(sideLists).forEach(([side, branchList]) => {
    const sign = side === 'right' ? 1 : -1;
    const branchGap = 180;
    branchList.forEach((branch, branchIndex) => {
      const baseY = (branchIndex - (branchList.length - 1) / 2) * branchGap;
      const queue = [{ node: branch, depth: 1 }];
      const depthCounts = new Map();
      const seen = new Set([root.id()]);
      while (queue.length) {
        const item = queue.shift();
        if (seen.has(item.node.id())) continue;
        seen.add(item.node.id());
        const count = depthCounts.get(item.depth) || 0;
        depthCounts.set(item.depth, count + 1);
        positions[item.node.id()] = { x: sign * item.depth * 225, y: baseY + (count - 0.5) * 92 };
        item.node.outgoers('node').filter(child => nodes.contains(child)).forEach(child => queue.push({ node: child, depth: item.depth + 1 }));
      }
    });
  });
  nodes.forEach((node, index) => { if (!positions[node.id()]) positions[node.id()] = { x: 230, y: (index + 1) * 100 }; });
  applyPresetPositions(positions);
}

function layoutTree(direction = 'down') {
  const nodes = visibleNodes();
  if (!nodes.length) return;
  const root = roots(nodes).first();
  const levels = hierarchyLevels(nodes, root);
  const positions = {};
  levels.forEach((level, depth) => {
    level.forEach((node, index) => {
      const offset = (index - (level.length - 1) / 2) * 210;
      positions[node.id()] = direction === 'right' ? { x: depth * 230, y: offset } : { x: offset, y: depth * 145 };
    });
  });
  applyPresetPositions(positions);
}

function layoutManual(type) {
  const nodes = visibleNodes().toArray();
  if (!nodes.length) return;
  const root = roots(visibleNodes()).first();
  const others = nodes.filter(node => node.id() !== root.id());
  const positions = {};
  if (type === 'timeline') {
    nodes.forEach((node, index) => positions[node.id()] = { x: index * 225, y: index % 2 ? 55 : -55 });
  } else if (type === 'matrix') {
    const columns = Math.max(2, Math.ceil(Math.sqrt(nodes.length)));
    nodes.forEach((node, index) => positions[node.id()] = { x: (index % columns) * 215, y: Math.floor(index / columns) * 125 });
  } else if (type === 'gantt') {
    nodes.forEach((node, index) => positions[node.id()] = { x: (index % 4) * 210 + Math.floor(index / 4) * 75, y: Math.floor(index / 4) * 105 });
  } else if (type === 'fishbone') {
    positions[root.id()] = { x: 430, y: 0 };
    others.forEach((node, index) => {
      const row = Math.floor(index / 2);
      positions[node.id()] = { x: 250 - row * 115, y: index % 2 === 0 ? -95 - (row % 2) * 50 : 95 + (row % 2) * 50 };
    });
  } else if (type === 'bubble') {
    positions[root.id()] = { x: 0, y: 0 };
    others.forEach((node, index) => {
      const angle = index / Math.max(1, others.length) * Math.PI * 2;
      const radius = 205 + (index % 3) * 25;
      positions[node.id()] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
  }
  applyPresetPositions(positions);
}

function runStructure(type = state.structure) {
  if (!STRUCTURES[type]) type = 'mindmap';
  state.structure = type;
  cy.edges().data('arrow', arrowForStructure());
  setStructureUI();
  if (type === 'mindmap') layoutMindmap();
  else if (['flowchart', 'orgchart', 'tree'].includes(type)) layoutTree(type === 'flowchart' ? 'right' : 'down');
  else if (['timeline', 'matrix', 'gantt', 'fishbone', 'bubble'].includes(type)) layoutManual(type);
  else if (type === 'concept') {
    const elements = visibleElements();
    const layout = elements.layout({ name: 'cose', animate: true, animationDuration: 520, fit: false, idealEdgeLength: 170, nodeRepulsion: 700000, gravity: 0.12, numIter: 800 });
    cy.one('layoutstop', () => { readableFit(elements, 250); snapshot(); });
    layout.run();
  }
  toast(`${STRUCTURES[type].name} applied`);
}

function makeTemplateNode(id, label, x, y, extra = {}) {
  const { palette = paletteFor(0), ...rest } = extra;
  const light = currentTheme() === 'light';
  return {
    group: 'nodes',
    data: {
      ...defaultNode(label),
      id,
      fill: light ? palette.light : palette.dark,
      border: palette.branch,
      branchColor: palette.branch,
      ...rest
    },
    position: { x, y }
  };
}

function makeTemplateEdge(source, target, color, arrow = arrowForStructure()) {
  return { group: 'edges', data: { id: uid('e'), source, target, color, arrow } };
}

function template(type) {
  const p = BRANCH_PALETTES;
  const N = (id, label, x, y, extra = {}) => makeTemplateNode(id, label, x, y, extra);
  const E = (a, b, color = p[0].branch) => makeTemplateEdge(a, b, color);
  if (type === 'mindmap') return [
    N('root', 'Central idea', 0, 0, { icon: '◇', size: 190, height: 104, palette: p[0] }),
    N('a', 'Research', 230, -150, { icon: '⌕', palette: p[0] }), N('b', 'Design', -230, -90, { icon: '✦', palette: p[1] }),
    N('c', 'Build', 230, 20, { icon: '⚙', palette: p[2] }), N('d', 'Launch', -230, 110, { icon: '⚑', palette: p[3] }),
    E('root', 'a', p[0].branch), E('root', 'b', p[1].branch), E('root', 'c', p[2].branch), E('root', 'd', p[3].branch)
  ];
  if (type === 'flowchart') return [N('s', 'Start', 0, 0, { shape: 'ellipse', palette: p[4] }), N('p', 'Process', 230, 0, { palette: p[3] }), N('q', 'Decision?', 460, 0, { shape: 'diamond', palette: p[2] }), N('y', 'Approved', 690, -90, { palette: p[4] }), N('n', 'Revise', 690, 90, { palette: p[1] }), E('s', 'p', p[4].branch), E('p', 'q', p[3].branch), E('q', 'y', p[4].branch), E('q', 'n', p[1].branch)];
  if (type === 'fishbone') return [N('effect', 'Observed effect', 430, 0, { palette: p[6] }), N('people', 'People', 200, -140, { palette: p[0] }), N('process', 'Process', 60, -80, { palette: p[3] }), N('tools', 'Tools', 200, 140, { palette: p[2] }), N('environment', 'Environment', 60, 80, { palette: p[4] }), E('people', 'effect', p[0].branch), E('process', 'effect', p[3].branch), E('tools', 'effect', p[2].branch), E('environment', 'effect', p[4].branch)];
  if (type === 'timeline') return [N('t1', 'Discovery', 0, -55, { tag: 'confirmed', palette: p[0] }), N('t2', 'Planning', 230, 55, { tag: 'progress', palette: p[3] }), N('t3', 'Build', 460, -55, { tag: 'todo', palette: p[2] }), N('t4', 'Launch', 690, 55, { palette: p[4] }), E('t1', 't2', p[0].branch), E('t2', 't3', p[3].branch), E('t3', 't4', p[2].branch)];
  if (type === 'matrix') return ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'].map((label, index) => N(label, label, (index % 3) * 215, Math.floor(index / 3) * 125, { palette: p[index] }));
  if (type === 'gantt') return [N('g1', 'Research · Week 1', 0, 0, { tag: 'confirmed', palette: p[0] }), N('g2', 'Design · Week 2', 230, 105, { tag: 'progress', palette: p[1] }), N('g3', 'Build · Weeks 3–4', 470, 210, { tag: 'todo', palette: p[2] }), N('g4', 'Launch · Week 5', 730, 315, { palette: p[4] }), E('g1', 'g2', p[0].branch), E('g2', 'g3', p[1].branch), E('g3', 'g4', p[2].branch)];
  if (type === 'orgchart') return [N('director', 'Director', 0, 0, { icon: '♙', palette: p[0] }), N('ops', 'Operations', -230, 155, { palette: p[4] }), N('product', 'Product', 0, 155, { palette: p[3] }), N('sales', 'Sales', 230, 155, { palette: p[2] }), E('director', 'ops', p[4].branch), E('director', 'product', p[3].branch), E('director', 'sales', p[2].branch)];
  if (type === 'tree') return [N('root', 'Root', 0, 0, { palette: p[0] }), N('l', 'Branch A', -180, 145, { palette: p[1] }), N('r', 'Branch B', 180, 145, { palette: p[3] }), N('l1', 'Leaf A1', -280, 290, { palette: p[1] }), N('l2', 'Leaf A2', -85, 290, { palette: p[1] }), N('r1', 'Leaf B1', 85, 290, { palette: p[3] }), N('r2', 'Leaf B2', 280, 290, { palette: p[3] }), E('root', 'l', p[1].branch), E('root', 'r', p[3].branch), E('l', 'l1', p[1].branch), E('l', 'l2', p[1].branch), E('r', 'r1', p[3].branch), E('r', 'r2', p[3].branch)];
  if (type === 'concept') return [N('core', 'Core concept', 0, 0, { icon: '◎', palette: p[0] }), N('idea', 'Related idea', 230, -140, { palette: p[1] }), N('evidence', 'Evidence', 250, 120, { palette: p[3] }), N('context', 'Context', -230, 115, { palette: p[4] }), N('outcome', 'Outcome', -230, -135, { palette: p[2] }), E('core', 'idea', p[1].branch), E('core', 'evidence', p[3].branch), E('core', 'context', p[4].branch), E('core', 'outcome', p[2].branch), E('idea', 'evidence', p[0].branch), E('context', 'outcome', p[0].branch)];
  if (type === 'bubble') return [N('core', 'Main topic', 0, 0, { shape: 'ellipse', size: 145, height: 145, palette: p[0] }), N('a', 'Idea A', 210, 0, { shape: 'ellipse', size: 110, height: 110, palette: p[1] }), N('b', 'Idea B', 0, 210, { shape: 'ellipse', size: 120, height: 120, palette: p[3] }), N('c', 'Idea C', -210, 0, { shape: 'ellipse', size: 105, height: 105, palette: p[4] }), N('d', 'Idea D', 0, -210, { shape: 'ellipse', size: 115, height: 115, palette: p[2] }), E('core', 'a', p[1].branch), E('core', 'b', p[3].branch), E('core', 'c', p[4].branch), E('core', 'd', p[2].branch)];
  return template('mindmap');
}

function showcaseTemplate() {
  const p = BRANCH_PALETTES;
  const N = (id, label, x, y, extra = {}) => makeTemplateNode(id, label, x, y, extra);
  const E = (a, b, color) => makeTemplateEdge(a, b, color, 'none');
  return [
    N('dream', 'Dream Project', -280, 0, { subtitle: 'Plan with clarity', icon: '♡', size: 210, height: 128, palette: p[0] }),
    N('plan', 'Planning', -30, -235, { icon: '▦', palette: p[0] }),
    N('goals', 'Goals', 220, -300, { tag: 'confirmed', palette: p[0] }), N('research', 'Research', 220, -210, { tag: 'progress', palette: p[0] }), N('scope', 'Scope', 220, -120, { tag: 'research', palette: p[0] }),
    N('design', 'Design', -20, -45, { icon: '✦', palette: p[1] }),
    N('visuals', 'Visual direction', 235, -75, { tag: 'confirmed', palette: p[1] }), N('prototype', 'Prototype', 235, 15, { tag: 'progress', palette: p[1] }), N('review', 'Review', 235, 105, { tag: 'todo', palette: p[1] }),
    N('budget', 'Resources', -5, 150, { icon: '▣', palette: p[2] }),
    N('people', 'People', 245, 135, { tag: 'track', palette: p[2] }), N('tools', 'Tools', 245, 225, { tag: 'estimate', palette: p[2] }), N('time', 'Timeline', 245, 315, { tag: 'progress', palette: p[2] }),
    N('launch', 'Launch', -70, 355, { icon: '⚑', palette: p[4] }),
    N('publish', 'Publish', 165, 360, { tag: 'todo', palette: p[4] }), N('measure', 'Measure', 165, 450, { tag: 'track', palette: p[4] }),
    E('dream', 'plan', p[0].branch), E('plan', 'goals', p[0].branch), E('plan', 'research', p[0].branch), E('plan', 'scope', p[0].branch),
    E('dream', 'design', p[1].branch), E('design', 'visuals', p[1].branch), E('design', 'prototype', p[1].branch), E('design', 'review', p[1].branch),
    E('dream', 'budget', p[2].branch), E('budget', 'people', p[2].branch), E('budget', 'tools', p[2].branch), E('budget', 'time', p[2].branch),
    E('dream', 'launch', p[4].branch), E('launch', 'publish', p[4].branch), E('launch', 'measure', p[4].branch)
  ];
}

function applyStructure(type) {
  if (!STRUCTURES[type]) return;
  if ($('#replaceWithTemplate').checked || !cy.nodes().length) {
    cy.elements().remove();
    state.structure = type;
    cy.add(template(type));
    refreshDerivedData();
  }
  safeDialogClose($('#structuresDialog'));
  closePanels();
  requestAnimationFrame(() => {
    cy.resize();
    runStructure(type);
    snapshot({ immediate: true });
    updateEmptyState();
  });
}

function setStructureUI() {
  const grid = $('#structureGrid');
  if (!grid) return;
  const fragment = document.createDocumentFragment();
  Object.entries(STRUCTURES).forEach(([key, item]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `structure-card${state.structure === key ? ' active' : ''}`;
    button.dataset.structure = key;
    button.innerHTML = `<span class="structure-preview"></span><span><b>${escapeHtml(item.name)}</b><span>${escapeHtml(item.desc)}</span></span>`;
    button.addEventListener('click', () => applyStructure(key));
    fragment.appendChild(button);
  });
  grid.replaceChildren(fragment);
}

function openStructures() {
  setStructureUI();
  safeDialogOpen($('#structuresDialog'));
}

function parseAttributes(raw = '') {
  const output = {};
  const regex = /(\w+)\s*=\s*("(?:\\.|[^"])*"|[^,\]\s]+)/g;
  let match;
  while ((match = regex.exec(raw))) output[match[1]] = match[2].replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"');
  return output;
}

function parseDot(dot) {
  const clean = dot.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/#.*$/gm, '');
  const nodes = new Map();
  const edges = [];
  const edgeRegex = /([A-Za-z_][\w.-]*|"[^"]+")\s*(->|--)\s*([A-Za-z_][\w.-]*|"[^"]+")\s*(?:\[([^\]]*)\])?/g;
  const normalize = value => value.replace(/^"|"$/g, '');
  let match;
  while ((match = edgeRegex.exec(clean))) {
    const source = normalize(match[1]);
    const target = normalize(match[3]);
    nodes.set(source, nodes.get(source) || {});
    nodes.set(target, nodes.get(target) || {});
    edges.push([source, target, match[2], parseAttributes(match[4])]);
  }
  const nodeRegex = /(?:^|[;{}\n])\s*([A-Za-z_][\w.-]*|"[^"]+")\s*\[([^\]]+)\]/g;
  while ((match = nodeRegex.exec(clean))) {
    const id = normalize(match[1]);
    if (['node', 'edge', 'graph'].includes(id)) continue;
    nodes.set(id, { ...(nodes.get(id) || {}), ...parseAttributes(match[2]) });
  }
  const elements = [];
  let index = 0;
  for (const [id, attrs] of nodes) {
    const palette = paletteFor(index++);
    const shapeMap = { box: 'rectangle', rect: 'rectangle', ellipse: 'ellipse', circle: 'ellipse', diamond: 'diamond', hexagon: 'hexagon' };
    elements.push({
      group: 'nodes',
      data: {
        ...defaultNode(attrs.label || id), id, label: attrs.label || id,
        subtitle: attrs.dotcanvas_subtitle || '', notes: attrs.dotcanvas_notes || '', icon: attrs.dotcanvas_icon || '', tag: attrs.dotcanvas_tag || '',
        shape: shapeMap[attrs.shape] || 'roundrectangle', fill: attrs.fillcolor || (currentTheme() === 'light' ? palette.light : palette.dark),
        border: attrs.color || palette.branch, branchColor: attrs.dotcanvas_branch || attrs.color || palette.branch,
        textColor: attrs.fontcolor || (currentTheme() === 'light' ? '#292a31' : '#edf6ff')
      }
    });
  }
  edges.forEach(([source, target, operator, attrs]) => {
    const targetNode = elements.find(element => element.group === 'nodes' && element.data.id === target);
    elements.push({ group: 'edges', classes: operator === '--' ? 'undirected' : '', data: { id: uid('e'), source, target, color: attrs.color || targetNode?.data.branchColor || '#8b7cf6', arrow: operator === '--' ? 'none' : arrowForStructure() } });
  });
  return elements;
}

async function importFile(file) {
  if (!file) return;
  const text = await file.text();
  try {
    if (text.trim().startsWith('{')) restoreProject(JSON.parse(text));
    else {
      const elements = parseDot(text);
      if (!elements.some(element => element.group === 'nodes')) throw new Error('No nodes found');
      cy.elements().remove();
      state.structure = 'mindmap';
      cy.add(elements);
      refreshDerivedData();
      runStructure('mindmap');
      snapshot({ immediate: true });
    }
    state.title = file.name.replace(/\.(dot|gv|json)$/i, '') || 'DotCanvas';
    $('#documentTitle').textContent = state.title;
    updateEmptyState();
    toast(`${file.name} opened`);
  } catch (error) {
    console.error(error);
    toast('Could not parse this file');
  }
}

function escapeDot(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function toDot() {
  const lines = ['digraph DotCanvas {', '  graph [overlap=false, splines=curved];', '  node [style=filled];'];
  cy.nodes().forEach(node => {
    const data = node.data();
    const position = node.position();
    const shape = { roundrectangle: 'box', rectangle: 'box', ellipse: 'ellipse', diamond: 'diamond', hexagon: 'hexagon' }[data.shape] || 'box';
    lines.push(`  "${escapeDot(node.id())}" [label="${escapeDot(data.label)}", shape=${shape}, fillcolor="${data.fill}", color="${data.border}", fontcolor="${data.textColor}", pos="${position.x.toFixed(1)},${(-position.y).toFixed(1)}!", dotcanvas_subtitle="${escapeDot(data.subtitle)}", dotcanvas_notes="${escapeDot(data.notes)}", dotcanvas_icon="${escapeDot(data.icon)}", dotcanvas_tag="${escapeDot(data.tag)}", dotcanvas_branch="${escapeDot(data.branchColor)}"];`);
  });
  cy.edges().forEach(edge => lines.push(`  "${escapeDot(edge.source().id())}" -> "${escapeDot(edge.target().id())}" [color="${edge.data('color')}"];`));
  lines.push('}');
  return lines.join('\n');
}

function download(blob, filename) {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => { URL.revokeObjectURL(anchor.href); anchor.remove(); }, 600);
}

async function shareProject() {
  const blob = new Blob([projectString()], { type: 'application/json' });
  const file = new File([blob], `${slugify(state.title)}.dotcanvas.json`, { type: 'application/json' });
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({ title: state.title, text: 'DotCanvas project', files: [file] });
      return;
    }
  } catch (error) {
    if (error?.name === 'AbortError') return;
    console.warn(error);
  }
  download(blob, file.name);
  toast('Project backup downloaded');
}

function slugify(value) {
  return String(value || 'dotcanvas').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dotcanvas';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

// Canvas interactions
cy.on('tap', event => {
  if (event.target === cy && state.tool === 'add') {
    addNode(event.position);
    setTool('select');
  }
});

cy.on('tap', 'node', event => {
  const node = event.target;
  const wasSelected = node.selected();
  cy.$(':selected').unselect();
  node.select();
  updateNodePanel();
  updateStylePanel();
  updateMediaPanel();
  renderTagList();

  if (state.tool === 'connect') {
    if (!state.connectFrom) {
      state.connectFrom = node;
      node.addClass('connect-source');
      toast('Now tap the destination topic');
    } else if (state.connectFrom.id() !== node.id()) {
      const color = node.data('branchColor') || state.connectFrom.data('branchColor');
      cy.add({ group: 'edges', data: { id: uid('e'), source: state.connectFrom.id(), target: node.id(), color, arrow: arrowForStructure() } });
      state.connectFrom.removeClass('connect-source');
      state.connectFrom = null;
      setTool('select');
      snapshot({ immediate: true });
      toast('Topics connected');
    }
    return;
  }

  if (wasSelected && state.tool === 'select') openPanel('nodePanel');
  queueOverlayRender();
});

cy.on('tap', 'edge', event => {
  cy.$(':selected').unselect();
  event.target.select();
  closePanels();
});

cy.on('dbltap', 'node', event => {
  cy.$(':selected').unselect();
  event.target.select();
  updateNodePanel();
  openPanel('nodePanel');
  setTimeout(() => $('#labelInput').select(), 60);
});

cy.on('dragfree', 'node', () => snapshot());
cy.on('pan zoom render position add remove data style', queueOverlayRender);
cy.on('zoom', () => $('#zoomText').textContent = `${Math.round(cy.zoom() * 100)}%`);

// Top controls
$('#backBtn').addEventListener('click', () => state.focusRoot ? exitFocus() : readableFit());
$('#focusBtn').addEventListener('click', toggleFocus);
$('#focusExitBtn').addEventListener('click', () => exitFocus());
$('#undoBtn').addEventListener('click', () => {
  if (state.history.length < 2) return toast('Nothing to undo');
  const current = state.history.pop();
  state.future.push(current);
  restoreProject(state.history.at(-1), { keepHistory: true });
  try { localStorage.setItem(PROJECT_KEY, state.history.at(-1)); } catch {}
});
$('#redoBtn').addEventListener('click', () => {
  const next = state.future.pop();
  if (!next) return toast('Nothing to redo');
  state.history.push(next);
  restoreProject(next, { keepHistory: true });
  try { localStorage.setItem(PROJECT_KEY, next); } catch {}
});
$('#shareBtn').addEventListener('click', shareProject);
$('#moreTopBtn').addEventListener('click', () => openPanel('morePanel'));
$('#documentTitleBtn').addEventListener('click', () => {
  const value = prompt('Document name', state.title);
  if (value?.trim()) {
    state.title = value.trim();
    $('#documentTitle').textContent = state.title;
    snapshot();
  }
});

// Dock controls
$('.dock-tool[data-tool="select"]').addEventListener('click', () => setTool('select'));
$('.dock-tool[data-action="node"]').addEventListener('click', () => {
  addNode(centerModelPosition());
  openPanel('nodePanel');
  setTimeout(() => $('#labelInput').select(), 60);
});
$('.dock-tool[data-action="child"]').addEventListener('click', addChildToSelected);
$('.dock-tool[data-action="connect"]').addEventListener('click', event => {
  if (state.tool === 'connect') setTool('select'); else {
    closePanels();
    setTool('connect');
    event.currentTarget.classList.add('active');
  }
});
$$('.dock-tool[data-panel]').forEach(button => button.addEventListener('click', () => {
  const panel = $(`#${button.dataset.panel}`);
  if (panel && !panel.hidden) closePanels(); else openPanel(button.dataset.panel);
}));
$$('.panel-close').forEach(button => button.addEventListener('click', () => {
  const dialog = button.closest('dialog');
  if (dialog) safeDialogClose(dialog); else closePanels();
}));

$('#openStyleFromTags').addEventListener('click', () => openPanel('stylePanel'));
$('#openTagsFromStyle').addEventListener('click', () => openPanel('tagsPanel'));
$('#duplicateBtn').addEventListener('click', duplicateSelected);
$('#deleteBtn').addEventListener('click', deleteSelection);
$('#addChildPanelBtn').addEventListener('click', addChildToSelected);
$('#startNodeBtn').addEventListener('click', () => {
  const node = addNode(centerModelPosition(), 'Central idea', null, { icon: '◇', size: 195, height: 104 });
  readableFit(node, 220);
  openPanel('nodePanel');
});
$('#emptyStructuresBtn').addEventListener('click', openStructures);
$('#fitFloatingBtn').addEventListener('click', () => readableFit());
$('#fitBtn').addEventListener('click', () => { closePanels(); readableFit(); });
$('#zoomInBtn').addEventListener('click', () => cy.zoom({ level: Math.min(cy.maxZoom(), cy.zoom() * 1.18), renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }));
$('#zoomOutBtn').addEventListener('click', () => cy.zoom({ level: Math.max(cy.minZoom(), cy.zoom() / 1.18), renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }));

$('#themeBtn').addEventListener('click', () => { applyTheme(currentTheme() === 'light' ? 'dark' : 'light', { announce: true }); closePanels(); });
$('#structuresBtn').addEventListener('click', openStructures);
$('#reflowBtn').addEventListener('click', () => { closePanels(); runStructure(); });
$('#exampleBtn').addEventListener('click', () => {
  cy.elements().remove();
  state.structure = 'mindmap';
  state.title = 'Dream Project';
  $('#documentTitle').textContent = state.title;
  cy.add(showcaseTemplate());
  refreshDerivedData();
  closePanels();
  readableFit(cy.elements(), 320);
  snapshot({ immediate: true });
  updateEmptyState();
});
$('#exportBtn').addEventListener('click', () => { closePanels(); safeDialogOpen($('#exportDialog')); });

$('#fileInput').addEventListener('change', async event => {
  await importFile(event.target.files?.[0]);
  event.target.value = '';
  closePanels();
});

['dragenter', 'dragover'].forEach(type => $('#canvasWrap').addEventListener(type, event => event.preventDefault()));
$('#canvasWrap').addEventListener('drop', async event => {
  event.preventDefault();
  await importFile(event.dataTransfer?.files?.[0]);
});

$$('[data-export]').forEach(button => button.addEventListener('click', () => {
  const type = button.dataset.export;
  const base = slugify(state.title);
  if (type === 'dot') download(new Blob([toDot()], { type: 'text/vnd.graphviz' }), `${base}.dot`);
  if (type === 'json') download(new Blob([projectString()], { type: 'application/json' }), `${base}.dotcanvas.json`);
  if (type === 'png' || type === 'jpg') {
    exitFocus({ fit: false });
    const uri = type === 'png'
      ? cy.png({ full: true, scale: 2.2, bg: 'transparent' })
      : cy.jpg({ full: true, scale: 2.2, bg: currentTheme() === 'light' ? '#f7f5f1' : '#06101d' });
    const anchor = document.createElement('a');
    anchor.href = uri;
    anchor.download = `${base}.${type}`;
    anchor.click();
  }
  safeDialogClose($('#exportDialog'));
}));

$('#structuresDialog').addEventListener('click', event => {
  if (event.target === $('#structuresDialog')) safeDialogClose($('#structuresDialog'));
});
$('#exportDialog').addEventListener('click', event => {
  if (event.target === $('#exportDialog')) safeDialogClose($('#exportDialog'));
});

// Keyboard shortcuts for desktop/iPad keyboards
window.addEventListener('keydown', event => {
  const activeTag = document.activeElement?.tagName;
  const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    event.shiftKey ? $('#redoBtn').click() : $('#undoBtn').click();
  }
  if (!editing && (event.key === 'Delete' || event.key === 'Backspace')) deleteSelection();
  if (!editing && event.key === 'Escape') { closePanels(); safeDialogClose($('#structuresDialog')); safeDialogClose($('#exportDialog')); setTool('select'); }
});

function syncAppViewport() {
  const viewport = window.visualViewport;
  const height = Math.round(viewport?.height || window.innerHeight);
  const top = Math.round(viewport?.offsetTop || 0);
  document.documentElement.style.setProperty('--app-height', `${height}px`);
  document.documentElement.style.setProperty('--app-top', `${top}px`);
  requestAnimationFrame(() => { cy.resize(); queueOverlayRender(); });
}

syncAppViewport();
window.addEventListener('resize', syncAppViewport, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(syncAppViewport, 140), { passive: true });
window.visualViewport?.addEventListener('resize', syncAppViewport, { passive: true });
window.visualViewport?.addEventListener('scroll', syncAppViewport, { passive: true });

function loadInitialProject() {
  applyTheme(currentTheme());
  renderPalette();
  renderIconPicker();
  setStructureUI();
  const saved = localStorage.getItem(PROJECT_KEY) || localStorage.getItem(OLD_PROJECT_KEY);
  if (saved) {
    try { restoreProject(saved); }
    catch (error) {
      console.error(error);
      localStorage.removeItem(PROJECT_KEY);
      updateEmptyState();
      state.history = [projectString()];
    }
  } else {
    updateEmptyState();
    state.history = [projectString()];
  }
  $('#documentTitle').textContent = state.title;
  $('#zoomText').textContent = `${Math.round(cy.zoom() * 100)}%`;
  queueOverlayRender();
}

loadInitialProject();

// Progressive Web App support
(function setupPWA() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  document.documentElement.classList.toggle('standalone', standalone);
  const installTip = $('#installTip');
  const updateNotice = $('#updateNotice');
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const dismissed = localStorage.getItem('dotcanvas-install-tip-dismissed') === '1';
  if (isIOS && !standalone && !dismissed) setTimeout(() => { installTip.hidden = false; }, 1300);
  $('#dismissInstallTip').addEventListener('click', () => {
    installTip.hidden = true;
    localStorage.setItem('dotcanvas-install-tip-dismissed', '1');
  });

  if (!('serviceWorker' in navigator)) return;
  let waitingWorker = null;
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
      const showUpdate = worker => { waitingWorker = worker; updateNotice.hidden = false; };
      if (registration.waiting) showUpdate(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker);
        });
      });
      $('#reloadAppBtn').addEventListener('click', () => waitingWorker?.postMessage({ type: 'SKIP_WAITING' }));
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });
    } catch (error) {
      console.error('Service worker registration failed', error);
    }
  });
})();
