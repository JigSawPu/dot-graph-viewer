import { PALETTES } from './constants';
import { createEdge, createEmptyDocument, createNode } from './document';
import type { DiagramStructure, GraphDocument, ThemeMode } from '../types';

export function createStructureTemplate(structure: DiagramStructure, theme: ThemeMode): GraphDocument {
  const document = createEmptyDocument();
  document.structure = structure;
  document.title = structure === 'mindmap' ? 'New Mind Map' : 'New Diagram';

  const add = (label: string, paletteIndex: number, x = 0, y = 0) => {
    const node = createNode(label, { x, y }, paletteIndex, theme);
    document.nodes.push(node);
    return node;
  };
  const link = (source: string, target: string, color: string, directed = true) => {
    document.edges.push(createEdge(source, target, color, directed));
  };

  if (structure === 'mindmap') {
    const root = add('Central idea', 0);
    root.icon = '◇'; root.width = 195; root.height = 102;
    ['Research', 'Design', 'Build', 'Launch'].forEach((label, index) => {
      const node = add(label, index, 0, 0);
      link(root.id, node.id, node.branchColor);
    });
  } else if (structure === 'flowchart') {
    const start = add('Start', 4); start.shape = 'ellipse';
    const process = add('Process', 3);
    const decision = add('Decision?', 2); decision.shape = 'diamond';
    const yes = add('Approved', 4);
    const no = add('Revise', 1);
    link(start.id, process.id, process.branchColor);
    link(process.id, decision.id, decision.branchColor);
    link(decision.id, yes.id, yes.branchColor);
    link(decision.id, no.id, no.branchColor);
  } else if (structure === 'fishbone') {
    const effect = add('Observed effect', 6);
    ['People', 'Process', 'Tools', 'Environment'].forEach((label, index) => {
      const node = add(label, index);
      link(node.id, effect.id, node.branchColor);
    });
  } else if (structure === 'timeline') {
    const labels = ['Discovery', 'Planning', 'Build', 'Launch'];
    let previous: string | null = null;
    labels.forEach((label, index) => {
      const node = add(label, index);
      if (previous) link(previous, node.id, PALETTES[index - 1].branch);
      previous = node.id;
    });
  } else if (structure === 'matrix') {
    ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'].forEach((label, index) => add(label, index));
  } else if (structure === 'gantt') {
    const labels = ['Research · Week 1', 'Design · Week 2', 'Build · Weeks 3–4', 'Launch · Week 5'];
    let previous: string | null = null;
    labels.forEach((label, index) => {
      const node = add(label, index);
      if (previous) link(previous, node.id, node.branchColor);
      previous = node.id;
    });
  } else if (structure === 'orgchart') {
    const director = add('Director', 0); director.icon = '♙';
    ['Operations', 'Product', 'Sales'].forEach((label, index) => {
      const node = add(label, index + 2);
      link(director.id, node.id, node.branchColor);
    });
  } else if (structure === 'tree') {
    const root = add('Root', 0);
    const branchA = add('Branch A', 1);
    const branchB = add('Branch B', 3);
    link(root.id, branchA.id, branchA.branchColor);
    link(root.id, branchB.id, branchB.branchColor);
    ['Leaf A1', 'Leaf A2'].forEach(label => {
      const leaf = add(label, 1);
      link(branchA.id, leaf.id, leaf.branchColor);
    });
    ['Leaf B1', 'Leaf B2'].forEach(label => {
      const leaf = add(label, 3);
      link(branchB.id, leaf.id, leaf.branchColor);
    });
  } else if (structure === 'concept') {
    const core = add('Core concept', 0); core.icon = '◎';
    const nodes = ['Related idea', 'Evidence', 'Context', 'Outcome'].map((label, index) => add(label, index + 1));
    nodes.forEach(node => link(core.id, node.id, node.branchColor));
    link(nodes[0].id, nodes[1].id, PALETTES[0].branch);
    link(nodes[2].id, nodes[3].id, PALETTES[0].branch);
  } else if (structure === 'bubble') {
    const core = add('Main topic', 0); core.shape = 'ellipse'; core.width = 150; core.height = 150;
    ['Idea A', 'Idea B', 'Idea C', 'Idea D'].forEach((label, index) => {
      const node = add(label, index + 1);
      node.shape = 'ellipse'; node.width = 112; node.height = 112;
      link(core.id, node.id, node.branchColor, false);
    });
  }

  return document;
}
