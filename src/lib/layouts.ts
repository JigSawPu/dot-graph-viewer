import type { DiagramStructure, GraphDocument, PositionMap } from '../types';

function childrenOf(document: GraphDocument, parentId: string): string[] {
  return document.edges.filter(edge => edge.source === parentId).map(edge => edge.target);
}

function findRoot(document: GraphDocument): string | undefined {
  const targets = new Set(document.edges.map(edge => edge.target));
  return document.nodes.find(node => !targets.has(node.id))?.id ?? document.nodes[0]?.id;
}

function hierarchyLevels(document: GraphDocument): string[][] {
  const root = findRoot(document);
  if (!root) return [];
  const levels: string[][] = [[root]];
  const seen = new Set<string>([root]);
  let current = [root];

  while (current.length) {
    const next: string[] = [];
    current.forEach(parentId => {
      childrenOf(document, parentId).forEach(childId => {
        if (!seen.has(childId)) {
          seen.add(childId);
          next.push(childId);
        }
      });
    });
    if (next.length) levels.push(next);
    current = next;
  }

  const disconnected = document.nodes.filter(node => !seen.has(node.id)).map(node => node.id);
  if (disconnected.length) levels.push(disconnected);
  return levels;
}

function treePositions(document: GraphDocument, horizontal: boolean): PositionMap {
  const positions: PositionMap = {};
  const levels = hierarchyLevels(document);
  levels.forEach((level, depth) => {
    level.forEach((id, index) => {
      const offset = (index - (level.length - 1) / 2) * 220;
      positions[id] = horizontal ? { x: depth * 240, y: offset } : { x: offset, y: depth * 150 };
    });
  });
  return positions;
}

function mindMapPositions(document: GraphDocument): PositionMap {
  const rootId = findRoot(document);
  if (!rootId) return {};
  const positions: PositionMap = { [rootId]: { x: 0, y: 0 } };
  const branches = childrenOf(document, rootId);
  const rootChildren = branches.length ? branches : document.nodes.filter(node => node.id !== rootId).map(node => node.id);
  const sides = { right: [] as string[], left: [] as string[] };
  rootChildren.forEach((id, index) => sides[index % 2 === 0 ? 'right' : 'left'].push(id));

  Object.entries(sides).forEach(([side, branchIds]) => {
    const sign = side === 'right' ? 1 : -1;
    branchIds.forEach((branchId, branchIndex) => {
      const baseY = (branchIndex - (branchIds.length - 1) / 2) * 190;
      const queue: Array<{ id: string; depth: number }> = [{ id: branchId, depth: 1 }];
      const depthCounts = new Map<number, number>();
      const seen = new Set<string>([rootId]);
      while (queue.length) {
        const current = queue.shift();
        if (!current || seen.has(current.id)) continue;
        seen.add(current.id);
        const count = depthCounts.get(current.depth) ?? 0;
        depthCounts.set(current.depth, count + 1);
        positions[current.id] = {
          x: sign * current.depth * 230,
          y: baseY + (count - 0.5) * 92
        };
        childrenOf(document, current.id).forEach(childId => queue.push({ id: childId, depth: current.depth + 1 }));
      }
    });
  });

  document.nodes.forEach((node, index) => {
    positions[node.id] ??= { x: 230, y: (index + 1) * 105 };
  });
  return positions;
}

function radialPositions(document: GraphDocument): PositionMap {
  const rootId = findRoot(document);
  if (!rootId) return {};
  const positions: PositionMap = { [rootId]: { x: 0, y: 0 } };
  const others = document.nodes.filter(node => node.id !== rootId);
  others.forEach((node, index) => {
    const angle = (index / Math.max(1, others.length)) * Math.PI * 2;
    const radius = 210 + (index % 3) * 28;
    positions[node.id] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
  return positions;
}

function linearPositions(document: GraphDocument, mode: 'timeline' | 'gantt'): PositionMap {
  const positions: PositionMap = {};
  document.nodes.forEach((node, index) => {
    if (mode === 'timeline') {
      positions[node.id] = { x: index * 225, y: index % 2 === 0 ? -60 : 60 };
    } else {
      positions[node.id] = { x: (index % 4) * 220 + Math.floor(index / 4) * 70, y: Math.floor(index / 4) * 110 };
    }
  });
  return positions;
}

function matrixPositions(document: GraphDocument): PositionMap {
  const columns = Math.max(2, Math.ceil(Math.sqrt(document.nodes.length)));
  return Object.fromEntries(document.nodes.map((node, index) => [node.id, {
    x: (index % columns) * 220,
    y: Math.floor(index / columns) * 135
  }]));
}

function fishbonePositions(document: GraphDocument): PositionMap {
  const rootId = findRoot(document);
  if (!rootId) return {};
  const positions: PositionMap = { [rootId]: { x: 460, y: 0 } };
  document.nodes.filter(node => node.id !== rootId).forEach((node, index) => {
    const row = Math.floor(index / 2);
    positions[node.id] = {
      x: 270 - row * 125,
      y: index % 2 === 0 ? -105 - (row % 2) * 45 : 105 + (row % 2) * 45
    };
  });
  return positions;
}

export function positionsForStructure(document: GraphDocument, structure: DiagramStructure): PositionMap | null {
  if (structure === 'mindmap') return mindMapPositions(document);
  if (structure === 'flowchart') return treePositions(document, true);
  if (structure === 'orgchart' || structure === 'tree') return treePositions(document, false);
  if (structure === 'timeline') return linearPositions(document, 'timeline');
  if (structure === 'gantt') return linearPositions(document, 'gantt');
  if (structure === 'matrix') return matrixPositions(document);
  if (structure === 'fishbone') return fishbonePositions(document);
  if (structure === 'bubble') return radialPositions(document);
  return null;
}
