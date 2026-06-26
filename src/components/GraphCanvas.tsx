import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import cytoscape, { type Core, type ElementDefinition, type EventObjectNode } from 'cytoscape';
import { positionsForStructure } from '../lib/layouts';
import type { DiagramStructure, EditorTool, GraphDocument, Point, PositionMap } from '../types';

export interface GraphCanvasHandle {
  fit: () => void;
  zoomBy: (factor: number) => void;
  applyLayout: (structure: DiagramStructure, options?: { fit?: boolean }) => void;
  exportImage: (type: 'png' | 'jpg', background: string) => string;
  getCenterPosition: () => Point;
}

interface GraphCanvasProps {
  document: GraphDocument;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  tool: EditorTool;
  connectSourceId: string | null;
  onNodeTap: (nodeId: string) => void;
  onEdgeTap: (edgeId: string) => void;
  onCanvasTap: (position: Point) => void;
  onSelectionCleared: () => void;
  onPositionsCommitted: (positions: PositionMap) => void;
  onZoomChanged: (zoom: number) => void;
}

function displayLabel(node: GraphDocument['nodes'][number], document: GraphDocument): string {
  const tag = document.tags.find(item => item.id === node.tagId);
  return [node.icon, node.label, node.subtitle, tag ? `◆ ${tag.name}` : ''].filter(Boolean).join('\n');
}

function elementsForDocument(document: GraphDocument): ElementDefinition[] {
  const nodes: ElementDefinition[] = document.nodes.map(node => ({
    group: 'nodes',
    data: {
      id: node.id,
      label: displayLabel(node, document),
      shape: node.shape,
      width: node.width,
      height: node.height,
      fill: node.fill,
      textColor: node.textColor,
      borderColor: node.borderColor,
      branchColor: node.branchColor,
      image: node.image || 'none',
      locked: node.locked
    },
    position: node.position,
    locked: node.locked
  }));

  const edges: ElementDefinition[] = document.edges.map(edge => ({
    group: 'edges',
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      color: edge.color,
      arrow: edge.directed ? 'triangle' : 'none'
    }
  }));

  return [...nodes, ...edges];
}

const GRAPH_STYLE = [
        {
          selector: 'core',
          style: {
            'active-bg-opacity': 0,
            'active-bg-size': 0,
            'selection-box-opacity': 0,
            'selection-box-border-width': 0
          }
        },
        {
          selector: 'node',
          style: {
            shape: 'data(shape)',
            width: 'data(width)',
            height: 'data(height)',
            'background-color': 'data(fill)',
            'background-image': 'data(image)',
            'background-fit': 'cover',
            'background-image-opacity': 0.2,
            'border-width': 2,
            'border-color': 'data(borderColor)',
            label: 'data(label)',
            color: 'data(textColor)',
            'font-size': 13,
            'font-weight': 600,
            'text-wrap': 'wrap',
            'text-max-width': 165,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-background-color': 'data(fill)',
            'text-background-opacity': 0.65,
            'text-background-padding': 3,
            'text-background-shape': 'roundrectangle',
            padding: 12,
            'shadow-blur': 18,
            'shadow-color': 'data(branchColor)',
            'shadow-opacity': 0.18,
            'shadow-offset-y': 5,
            'overlay-opacity': 0
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'shadow-blur': 30,
            'shadow-opacity': 0.42,
            'underlay-color': 'data(branchColor)',
            'underlay-opacity': 0.13,
            'underlay-padding': 8
          }
        },
        {
          selector: 'node.connect-source',
          style: {
            'border-width': 4,
            'border-color': '#f0a45c',
            'shadow-color': '#f0a45c',
            'shadow-opacity': 0.55
          }
        },
        {
          selector: 'edge',
          style: {
            width: 3,
            'curve-style': 'bezier',
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'data(arrow)',
            'arrow-scale': 0.72,
            opacity: 0.86,
            'line-cap': 'round',
            'underlay-color': 'data(color)',
            'underlay-opacity': 0.1,
            'underlay-padding': 4,
            'overlay-opacity': 0
          }
        },
        {
          selector: 'edge:selected',
          style: {
            width: 5,
            opacity: 1,
            'underlay-opacity': 0.24,
            'underlay-padding': 7
          }
        }
      ] as unknown as cytoscape.StylesheetJson;

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(function GraphCanvas(
  {
    document,
    selectedNodeId,
    selectedEdgeId,
    tool,
    connectSourceId,
    onNodeTap,
    onEdgeTap,
    onCanvasTap,
    onSelectionCleared,
    onPositionsCommitted,
    onZoomChanged
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const documentRef = useRef(document);
  const callbacksRef = useRef({ onNodeTap, onEdgeTap, onCanvasTap, onSelectionCleared, onPositionsCommitted, onZoomChanged });

  documentRef.current = document;
  callbacksRef.current = { onNodeTap, onEdgeTap, onCanvasTap, onSelectionCleared, onPositionsCommitted, onZoomChanged };

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: elementsForDocument(documentRef.current),
      minZoom: 0.18,
      maxZoom: 4.5,
      wheelSensitivity: 0.18,
      boxSelectionEnabled: false,
      selectionType: 'single',
      style: GRAPH_STYLE,
      layout: { name: 'preset' }
    });

    cy.on('tap', event => {
      if (event.target === cy) {
        callbacksRef.current.onSelectionCleared();
        callbacksRef.current.onCanvasTap(event.position);
      }
    });
    cy.on('tap', 'node', (event: EventObjectNode) => callbacksRef.current.onNodeTap(event.target.id()));
    cy.on('tap', 'edge', event => callbacksRef.current.onEdgeTap(event.target.id()));
    cy.on('dragfree', 'node', () => {
      const positions: PositionMap = {};
      cy.nodes().forEach(node => { positions[node.id()] = { ...node.position() }; });
      callbacksRef.current.onPositionsCommitted(positions);
    });
    cy.on('zoom', () => callbacksRef.current.onZoomChanged(cy.zoom()));

    cyRef.current = cy;
    callbacksRef.current.onZoomChanged(cy.zoom());

    const resizeObserver = new ResizeObserver(() => cy.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const pan = cy.pan();
    const zoom = cy.zoom();
    cy.batch(() => {
      cy.elements().remove();
      cy.add(elementsForDocument(document));
      cy.nodes().forEach(node => { if (node.data('locked')) node.lock(); else node.unlock(); });
      cy.style().selector('edge').style({
        'curve-style': document.settings.edgeStyle,
        width: document.settings.edgeWidth
      }).update();
    });
    cy.pan(pan);
    cy.zoom(zoom);
  }, [document]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.$(':selected').unselect();
    if (selectedNodeId) cy.$id(selectedNodeId).select();
    if (selectedEdgeId) cy.$id(selectedEdgeId).select();
  }, [selectedEdgeId, selectedNodeId]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().removeClass('connect-source');
    if (tool === 'connect' && connectSourceId) cy.$id(connectSourceId).addClass('connect-source');
  }, [connectSourceId, tool]);

  useImperativeHandle(ref, () => ({
    fit: () => {
      const cy = cyRef.current;
      if (!cy || !cy.elements().length) return;
      cy.animate({ fit: { eles: cy.elements(), padding: window.innerWidth < 760 ? 82 : 120 }, duration: 280 });
    },
    zoomBy: factor => {
      const cy = cyRef.current;
      if (!cy) return;
      cy.zoom({
        level: Math.max(cy.minZoom(), Math.min(cy.maxZoom(), cy.zoom() * factor)),
        renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
      });
    },
    applyLayout: (structure, options = {}) => {
      const cy = cyRef.current;
      if (!cy || !cy.nodes().length) return;
      const positions = positionsForStructure(documentRef.current, structure);
      const shouldFit = options.fit ?? false;
      const commitPositions = () => {
        const result: PositionMap = {};
        cy.nodes().forEach(node => { result[node.id()] = { ...node.position() }; });
        callbacksRef.current.onPositionsCommitted(result);
      };

      if (positions) {
        cy.one('layoutstop', commitPositions);
        cy.layout({
          name: 'preset',
          positions: nodeId => positions[nodeId] ?? cy.$id(nodeId).position(),
          animate: true,
          animationDuration: 450,
          fit: shouldFit,
          padding: window.innerWidth < 760 ? 84 : 120
        }).run();
      } else {
        cy.one('layoutstop', commitPositions);
        cy.layout({
          name: 'cose',
          animate: true,
          animationDuration: 520,
          fit: shouldFit,
          padding: window.innerWidth < 760 ? 84 : 120,
          idealEdgeLength: 170,
          nodeRepulsion: 700000,
          gravity: 0.12,
          numIter: 800
        }).run();
      }
    },
    exportImage: (type, background) => {
      const cy = cyRef.current;
      if (!cy) return '';
      return type === 'png'
        ? cy.png({ full: true, scale: 2.2, bg: 'transparent' })
        : cy.jpg({ full: true, scale: 2.2, bg: background });
    },
    getCenterPosition: () => {
      const cy = cyRef.current;
      if (!cy) return { x: 0, y: 0 };
      return {
        x: (cy.width() / 2 - cy.pan().x) / cy.zoom(),
        y: (cy.height() / 2 - cy.pan().y) / cy.zoom()
      };
    }
  }), []);

  return <div ref={containerRef} className="graph-canvas" aria-label="Infinite graph canvas" />;
});
