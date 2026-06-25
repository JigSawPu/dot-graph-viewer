import { PALETTES } from './constants';
import { createEdge, createEmptyDocument, createNode } from './document';
import type { GraphDocument, ThemeMode } from '../types';

function parseAttributes(raw = ''): Record<string, string> {
  const output: Record<string, string> = {};
  const regex = /(\w+)\s*=\s*("(?:\\.|[^"])*"|[^,\]\s]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw))) {
    output[match[1]] = match[2]
      .replace(/^"|"$/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"');
  }
  return output;
}

function normalizeIdentifier(value: string): string {
  return value.replace(/^"|"$/g, '');
}

export function parseDot(source: string, theme: ThemeMode): GraphDocument {
  const clean = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/^\s*#.*$/gm, '');

  const nodeAttributes = new Map<string, Record<string, string>>();
  const edges: Array<{ source: string; target: string; directed: boolean; attrs: Record<string, string> }> = [];
  const edgeRegex = /([A-Za-z_][\w.-]*|"[^"]+")\s*(->|--)\s*([A-Za-z_][\w.-]*|"[^"]+")\s*(?:\[([^\]]*)\])?/g;
  let match: RegExpExecArray | null;

  while ((match = edgeRegex.exec(clean))) {
    const sourceId = normalizeIdentifier(match[1]);
    const targetId = normalizeIdentifier(match[3]);
    nodeAttributes.set(sourceId, nodeAttributes.get(sourceId) ?? {});
    nodeAttributes.set(targetId, nodeAttributes.get(targetId) ?? {});
    edges.push({ source: sourceId, target: targetId, directed: match[2] === '->', attrs: parseAttributes(match[4]) });
  }

  const nodeRegex = /(?:^|[;{}\n])\s*([A-Za-z_][\w.-]*|"[^"]+")\s*\[([^\]]+)\]/g;
  while ((match = nodeRegex.exec(clean))) {
    const id = normalizeIdentifier(match[1]);
    if (['node', 'edge', 'graph'].includes(id)) continue;
    nodeAttributes.set(id, { ...(nodeAttributes.get(id) ?? {}), ...parseAttributes(match[2]) });
  }

  if (nodeAttributes.size === 0) {
    const idRegex = /(?:^|[;{}\n])\s*([A-Za-z_][\w.-]*|"[^"]+")\s*(?=;|\n|})/g;
    while ((match = idRegex.exec(clean))) {
      const id = normalizeIdentifier(match[1]);
      if (!['digraph', 'graph', 'strict', 'node', 'edge'].includes(id)) nodeAttributes.set(id, {});
    }
  }

  const document = createEmptyDocument();
  document.title = 'Imported graph';
  document.nodes = [];
  document.edges = [];

  const shapeMap: Record<string, 'roundrectangle' | 'rectangle' | 'ellipse' | 'diamond' | 'hexagon'> = {
    box: 'rectangle', rect: 'rectangle', rectangle: 'rectangle', ellipse: 'ellipse', circle: 'ellipse', diamond: 'diamond', hexagon: 'hexagon'
  };

  [...nodeAttributes.entries()].forEach(([id, attrs], index) => {
    const palette = PALETTES[index % PALETTES.length];
    const node = createNode(attrs.label || id, { x: 0, y: 0 }, index, theme);
    node.id = id;
    node.subtitle = attrs.dotcanvas_subtitle || '';
    node.notes = attrs.dotcanvas_notes || '';
    node.icon = attrs.dotcanvas_icon || '';
    node.tagId = attrs.dotcanvas_tag || '';
    node.shape = shapeMap[attrs.shape] || 'roundrectangle';
    node.fill = attrs.fillcolor || node.fill;
    node.textColor = attrs.fontcolor || node.textColor;
    node.borderColor = attrs.color || palette.branch;
    node.branchColor = attrs.dotcanvas_branch || attrs.color || palette.branch;
    document.nodes.push(node);
  });

  edges.forEach(item => {
    const target = document.nodes.find(node => node.id === item.target);
    document.edges.push(createEdge(item.source, item.target, item.attrs.color || target?.branchColor || '#8b7cf6', item.directed));
  });

  return document;
}

function escapeDot(value: unknown): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

export function documentToDot(document: GraphDocument): string {
  const lines = [
    'digraph DotCanvas {',
    '  graph [overlap=false, splines=curved];',
    '  node [style=filled];'
  ];

  document.nodes.forEach(node => {
    const shape = {
      roundrectangle: 'box', rectangle: 'box', ellipse: 'ellipse', diamond: 'diamond', hexagon: 'hexagon'
    }[node.shape];
    lines.push(
      `  "${escapeDot(node.id)}" [label="${escapeDot(node.label)}", shape=${shape}, fillcolor="${node.fill}", color="${node.borderColor}", fontcolor="${node.textColor}", pos="${node.position.x.toFixed(1)},${(-node.position.y).toFixed(1)}!", dotcanvas_subtitle="${escapeDot(node.subtitle)}", dotcanvas_notes="${escapeDot(node.notes)}", dotcanvas_icon="${escapeDot(node.icon)}", dotcanvas_tag="${escapeDot(node.tagId)}", dotcanvas_branch="${node.branchColor}"];`
    );
  });

  document.edges.forEach(edge => {
    const operator = edge.directed ? '->' : '--';
    lines.push(`  "${escapeDot(edge.source)}" ${operator} "${escapeDot(edge.target)}" [color="${edge.color}"];`);
  });

  lines.push('}');
  return lines.join('\n');
}
