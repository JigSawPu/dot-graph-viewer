export type ThemeMode = 'light' | 'dark';
export type EditorTool = 'select' | 'connect';
export type PanelId = 'inspector' | 'structures' | 'export' | 'more' | null;

export type DiagramStructure =
  | 'mindmap'
  | 'flowchart'
  | 'fishbone'
  | 'timeline'
  | 'matrix'
  | 'gantt'
  | 'orgchart'
  | 'tree'
  | 'concept'
  | 'bubble';

export type NodeShape = 'roundrectangle' | 'rectangle' | 'ellipse' | 'diamond' | 'hexagon';

export interface Point {
  x: number;
  y: number;
}

export interface GraphNode {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  tagId: string;
  notes: string;
  shape: NodeShape;
  width: number;
  height: number;
  fill: string;
  textColor: string;
  borderColor: string;
  branchColor: string;
  image?: string;
  locked: boolean;
  position: Point;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  color: string;
  directed: boolean;
}

export interface GraphTag {
  id: string;
  name: string;
  color: string;
}

export interface GraphSettings {
  edgeStyle: 'bezier' | 'segments' | 'straight' | 'taxi';
  edgeWidth: number;
}

export interface GraphDocument {
  version: 1;
  title: string;
  structure: DiagramStructure;
  nodes: GraphNode[];
  edges: GraphEdge[];
  tags: GraphTag[];
  settings: GraphSettings;
}

export interface PositionMap {
  [nodeId: string]: Point;
}
