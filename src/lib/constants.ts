import type { DiagramStructure, GraphTag } from '../types';

export const STORAGE_KEY = 'dotcanvas.react.document.v1';

export const DEFAULT_TAGS: GraphTag[] = [
  { id: 'confirmed', name: 'Confirmed', color: '#66b96b' },
  { id: 'progress', name: 'In progress', color: '#5d87e8' },
  { id: 'research', name: 'Research', color: '#d8a629' },
  { id: 'todo', name: 'To do', color: '#e56991' },
  { id: 'estimate', name: 'Estimate', color: '#ef894b' },
  { id: 'paid', name: 'Paid', color: '#4db58f' },
  { id: 'track', name: 'On track', color: '#3aaeb6' }
];

export const PALETTES = [
  { name: 'Lavender', branch: '#8b7cf6', light: '#fbf9ff', dark: '#1b1931' },
  { name: 'Rose', branch: '#e887b5', light: '#fff8fb', dark: '#2f1b29' },
  { name: 'Apricot', branch: '#eea05c', light: '#fffaf4', dark: '#302116' },
  { name: 'Sky', branch: '#6f9fe7', light: '#f7fbff', dark: '#17273a' },
  { name: 'Mint', branch: '#5fc2ad', light: '#f5fffc', dark: '#15302a' },
  { name: 'Sun', branch: '#ddb449', light: '#fffdf3', dark: '#302812' },
  { name: 'Coral', branch: '#ed746d', light: '#fff8f7', dark: '#321a19' },
  { name: 'Indigo', branch: '#6576dc', light: '#f8f9ff', dark: '#1a2039' }
];

export const ICONS = ['', '◇', '♡', '✦', '✓', '★', '⚑', '⌂', '☁', '☀', '⚙', '✎', '▦', '⌁', '☕', '✈', '♧', '♬', '⚡', '☑', '◎', '♙', '▣'];

export const STRUCTURES: Array<{ id: DiagramStructure; name: string; description: string }> = [
  { id: 'mindmap', name: 'Traditional Mind Map', description: 'A central idea with flowing branches.' },
  { id: 'flowchart', name: 'Logic Chart & Flowchart', description: 'Steps, decisions, and outcomes.' },
  { id: 'fishbone', name: 'Fishbone Diagram', description: 'Cause-and-effect analysis.' },
  { id: 'timeline', name: 'Timeline', description: 'Events placed in chronological order.' },
  { id: 'matrix', name: 'Matrix Layout', description: 'Compare information in rows and columns.' },
  { id: 'gantt', name: 'Gantt Chart', description: 'Tasks arranged across project phases.' },
  { id: 'orgchart', name: 'Organizational Chart', description: 'People, teams, and reporting lines.' },
  { id: 'tree', name: 'Tree Diagram', description: 'A top-down branching hierarchy.' },
  { id: 'concept', name: 'Concept Map', description: 'A free network of related concepts.' },
  { id: 'bubble', name: 'Bubble Map', description: 'A topic surrounded by associations.' }
];
