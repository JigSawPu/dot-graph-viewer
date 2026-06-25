import { DEFAULT_TAGS, PALETTES } from './constants';
import type { GraphDocument, GraphEdge, GraphNode, Point, ThemeMode } from '../types';

export const uid = (prefix = 'n'): string => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export function createNode(label = 'New topic', position: Point = { x: 0, y: 0 }, paletteIndex = 0, theme: ThemeMode = 'light'): GraphNode {
  const palette = PALETTES[paletteIndex % PALETTES.length];
  return {
    id: uid(),
    label,
    subtitle: '',
    icon: '',
    tagId: '',
    notes: '',
    shape: 'roundrectangle',
    width: 168,
    height: 72,
    fill: theme === 'light' ? palette.light : palette.dark,
    textColor: theme === 'light' ? '#24262d' : '#eef6ff',
    borderColor: palette.branch,
    branchColor: palette.branch,
    locked: false,
    position
  };
}

export function createEdge(source: string, target: string, color: string, directed = true): GraphEdge {
  return { id: uid('e'), source, target, color, directed };
}

export function createEmptyDocument(): GraphDocument {
  return {
    version: 1,
    title: 'DotCanvas',
    structure: 'mindmap',
    nodes: [],
    edges: [],
    tags: DEFAULT_TAGS.map(tag => ({ ...tag })),
    settings: { edgeStyle: 'bezier', edgeWidth: 3 }
  };
}

export function createExampleDocument(theme: ThemeMode = 'light'): GraphDocument {
  const root = createNode('Dream Project', { x: 0, y: 0 }, 0, theme);
  root.icon = '♡';
  root.subtitle = 'Plan with clarity';
  root.width = 210;
  root.height = 112;

  const planning = createNode('Planning', { x: 235, y: -180 }, 0, theme);
  planning.icon = '▦';
  const design = createNode('Design', { x: 235, y: 0 }, 1, theme);
  design.icon = '✦';
  const resources = createNode('Resources', { x: 235, y: 180 }, 2, theme);
  resources.icon = '▣';

  const nodes = [root, planning, design, resources];
  const edges = [
    createEdge(root.id, planning.id, planning.branchColor),
    createEdge(root.id, design.id, design.branchColor),
    createEdge(root.id, resources.id, resources.branchColor)
  ];

  const childSpecs = [
    [planning, 'Goals', 'confirmed', -245],
    [planning, 'Research', 'progress', -175],
    [planning, 'Scope', 'research', -105],
    [design, 'Visual direction', 'confirmed', -35],
    [design, 'Prototype', 'progress', 35],
    [design, 'Review', 'todo', 105],
    [resources, 'People', 'track', 145],
    [resources, 'Tools', 'estimate', 215],
    [resources, 'Timeline', 'progress', 285]
  ] as const;

  childSpecs.forEach(([parent, label, tagId, y], index) => {
    const child = createNode(label, { x: 470, y }, index % PALETTES.length, theme);
    child.tagId = tagId;
    child.branchColor = parent.branchColor;
    child.borderColor = parent.branchColor;
    child.fill = theme === 'light' ? '#fffefa' : '#15243a';
    nodes.push(child);
    edges.push(createEdge(parent.id, child.id, parent.branchColor));
  });

  return {
    version: 1,
    title: 'Dream Project',
    structure: 'mindmap',
    nodes,
    edges,
    tags: DEFAULT_TAGS.map(tag => ({ ...tag })),
    settings: { edgeStyle: 'bezier', edgeWidth: 3 }
  };
}

export function cloneDocument(document: GraphDocument): GraphDocument {
  return JSON.parse(JSON.stringify(document)) as GraphDocument;
}
