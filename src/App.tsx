import { useEffect, useMemo, useRef, useState } from 'react';
import { BottomDock } from './components/BottomDock';
import { ExportDialog } from './components/ExportDialog';
import { GraphCanvas, type GraphCanvasHandle } from './components/GraphCanvas';
import { InspectorPanel } from './components/InspectorPanel';
import { MorePanel } from './components/MorePanel';
import { PwaStatus } from './components/PwaStatus';
import { StructureDialog } from './components/StructureDialog';
import { TopBar } from './components/TopBar';
import { useDocumentHistory } from './hooks/useDocumentHistory';
import { useVisualViewport } from './hooks/useVisualViewport';
import { PALETTES } from './lib/constants';
import { createEdge, createExampleDocument, createNode, uid } from './lib/document';
import { documentToDot, parseDot } from './lib/dot';
import { createStructureTemplate } from './lib/templates';
import type { DiagramStructure, EditorTool, GraphDocument, GraphNode, GraphSettings, PanelId, Point, PositionMap, ThemeMode } from './types';

const THEME_KEY = 'dotcanvas.react.theme';

function downloadText(content: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    anchor.remove();
  }, 500);
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dotcanvas';
}

function nextPaletteIndex(document: GraphDocument, parentId?: string): number {
  if (!parentId) return document.nodes.length % PALETTES.length;
  const count = document.edges.filter(edge => edge.source === parentId).length;
  return count % PALETTES.length;
}

export default function App() {
  useVisualViewport();
  const { document, commit, replace, undo, redo, canUndo, canRedo } = useDocumentHistory();
  const graphRef = useRef<GraphCanvasHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(() => localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light');
  const [tool, setTool] = useState<EditorTool>('select');
  const [panel, setPanel] = useState<PanelId>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [replaceGraph, setReplaceGraph] = useState(false);
  const [pendingLayout, setPendingLayout] = useState<{ structure: DiagramStructure; fit: boolean } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState('');

  const selectedNode = useMemo(
    () => document.nodes.find(node => node.id === selectedNodeId) ?? null,
    [document.nodes, selectedNodeId]
  );

  useEffect(() => {
    window.document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    const meta = window.document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', theme === 'light' ? '#f7f8fb' : '#06101d');
  }, [theme]);

  useEffect(() => {
    if (!pendingLayout) return;
    const frame = window.requestAnimationFrame(() => {
      graphRef.current?.applyLayout(pendingLayout.structure, { fit: pendingLayout.fit });
      setPendingLayout(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [document, pendingLayout]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 1900);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const closeTransientUi = () => {
    setPanel(null);
    setTool('select');
    setConnectSourceId(null);
  };

  const selectNode = (nodeId: string) => {
    if (tool === 'connect') {
      if (!connectSourceId) {
        setConnectSourceId(nodeId);
        setSelectedNodeId(nodeId);
        setSelectedEdgeId(null);
        setToast('Now tap the destination node');
        return;
      }
      if (connectSourceId === nodeId) return;
      commit(current => {
        const target = current.nodes.find(node => node.id === nodeId);
        const source = current.nodes.find(node => node.id === connectSourceId);
        if (!target || !source) return current;
        current.edges.push(createEdge(source.id, target.id, target.branchColor));
        return current;
      });
      setConnectSourceId(null);
      setTool('select');
      setSelectedNodeId(nodeId);
      setToast('Nodes connected');
      return;
    }
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  };

  const addNodeAt = (position: Point) => {
    const node = createNode('New topic', position, nextPaletteIndex(document), theme);
    commit(current => { current.nodes.push(node); return current; });
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setPanel('inspector');
  };

  const addNode = () => addNodeAt(graphRef.current?.getCenterPosition() ?? { x: 0, y: 0 });

  const addChild = () => {
    if (!selectedNode) {
      setToast('Select a parent node first');
      return;
    }
    const paletteIndex = nextPaletteIndex(document, selectedNode.id);
    const child = createNode('New child', { x: selectedNode.position.x + 230, y: selectedNode.position.y + 80 }, paletteIndex, theme);
    child.branchColor = PALETTES[paletteIndex].branch;
    child.borderColor = child.branchColor;
    commit(current => {
      current.nodes.push(child);
      current.edges.push(createEdge(selectedNode.id, child.id, child.branchColor));
      return current;
    });
    setSelectedNodeId(child.id);
    setPanel('inspector');
  };

  const updateSelectedNode = (patch: Partial<GraphNode>) => {
    if (!selectedNodeId) return;
    commit(current => {
      const node = current.nodes.find(item => item.id === selectedNodeId);
      if (!node) return current;
      Object.assign(node, patch);
      if (patch.branchColor) {
        current.edges.forEach(edge => {
          if (edge.target === node.id) edge.color = patch.branchColor!;
        });
      }
      return current;
    });
  };

  const updateSettings = (patch: Partial<GraphSettings>) => {
    commit(current => { current.settings = { ...current.settings, ...patch }; return current; });
  };

  const deleteSelection = () => {
    if (selectedNodeId) {
      commit(current => {
        current.nodes = current.nodes.filter(node => node.id !== selectedNodeId);
        current.edges = current.edges.filter(edge => edge.source !== selectedNodeId && edge.target !== selectedNodeId);
        return current;
      });
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      commit(current => { current.edges = current.edges.filter(edge => edge.id !== selectedEdgeId); return current; });
      setSelectedEdgeId(null);
    }
    setPanel(null);
  };

  const duplicateSelected = () => {
    if (!selectedNode) return;
    const copy = { ...selectedNode, id: uid(), label: `${selectedNode.label} copy`, position: { x: selectedNode.position.x + 48, y: selectedNode.position.y + 48 } };
    commit(current => { current.nodes.push(copy); return current; });
    setSelectedNodeId(copy.id);
  };

  const applyPositions = (positions: PositionMap) => {
    commit(current => {
      current.nodes.forEach(node => { if (positions[node.id]) node.position = positions[node.id]; });
      return current;
    });
  };

  const applyStructure = (structure: DiagramStructure) => {
    if (replaceGraph || document.nodes.length === 0) {
      replace(createStructureTemplate(structure, theme));
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    } else {
      commit(current => { current.structure = structure; return current; });
    }
    setPanel(null);
    setPendingLayout({ structure, fit: replaceGraph || document.nodes.length === 0 });
  };

  const loadExample = () => {
    replace(createExampleDocument(theme));
    setPanel(null);
    setSelectedNodeId(null);
    setPendingLayout({ structure: 'mindmap', fit: true });
  };

  const openFile = () => fileInputRef.current?.click();

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const imported = text.trim().startsWith('{')
        ? JSON.parse(text) as GraphDocument
        : parseDot(text, theme);
      imported.title = file.name.replace(/\.(dot|gv|json)$/i, '') || imported.title;
      replace(imported);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setPanel(null);
      setPendingLayout({ structure: imported.structure ?? 'mindmap', fit: true });
      setToast(`${file.name} opened`);
    } catch (error) {
      console.error(error);
      setToast('Could not parse this file');
    }
  };

  const rename = () => {
    const value = window.prompt('Document name', document.title);
    if (!value?.trim()) return;
    commit(current => { current.title = value.trim(); return current; });
  };

  const exportProject = (type: 'dot' | 'json' | 'png' | 'jpg') => {
    const base = slugify(document.title);
    if (type === 'dot') downloadText(documentToDot(document), `${base}.dot`, 'text/vnd.graphviz');
    if (type === 'json') downloadText(JSON.stringify(document, null, 2), `${base}.dotcanvas.json`, 'application/json');
    if (type === 'png' || type === 'jpg') {
      const uri = graphRef.current?.exportImage(type, theme === 'light' ? '#f7f8fb' : '#06101d');
      if (uri) {
        const anchor = window.document.createElement('a');
        anchor.href = uri;
        anchor.download = `${base}.${type}`;
        anchor.click();
      }
    }
    setPanel(null);
  };

  return (
    <main className="app-shell">
      <input ref={fileInputRef} type="file" accept=".dot,.gv,.json,text/plain,text/vnd.graphviz,application/json" hidden onChange={event => { void importFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />

      <TopBar
        title={document.title}
        canUndo={canUndo}
        canRedo={canRedo}
        onRename={rename}
        onUndo={undo}
        onRedo={redo}
        onOpen={openFile}
        onStructures={() => setPanel('structures')}
        onExport={() => setPanel('export')}
        onToggleTheme={() => setTheme(current => current === 'light' ? 'dark' : 'light')}
      />

      <section className="canvas-shell">
        <GraphCanvas
          ref={graphRef}
          document={document}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          tool={tool}
          connectSourceId={connectSourceId}
          onNodeTap={selectNode}
          onEdgeTap={edgeId => { setSelectedEdgeId(edgeId); setSelectedNodeId(null); setPanel(null); }}
          onCanvasTap={() => undefined}
          onSelectionCleared={() => { setSelectedNodeId(null); setSelectedEdgeId(null); if (tool !== 'connect') setPanel(null); }}
          onPositionsCommitted={applyPositions}
          onZoomChanged={setZoom}
        />

        {document.nodes.length === 0 && (
          <div className="empty-state">
            <div className="empty-mark">◇</div>
            <h1>Turn ideas into a visual map</h1>
            <p>Create a topic, open a DOT file, or begin with a structured diagram template.</p>
            <div className="empty-actions">
              <button className="ui-button primary" type="button" onClick={addNode}>Create central topic</button>
              <button className="ui-button" type="button" onClick={() => setPanel('structures')}>Browse structures</button>
            </div>
          </div>
        )}

        <button className="minimap-button" type="button" onClick={() => graphRef.current?.fit()} aria-label="Fit graph">▦</button>
        <div className="zoom-control">
          <button type="button" onClick={() => graphRef.current?.zoomBy(1 / 1.18)} aria-label="Zoom out">−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => graphRef.current?.zoomBy(1.18)} aria-label="Zoom in">+</button>
        </div>
      </section>

      <BottomDock
        tool={tool}
        inspectorOpen={panel === 'inspector'}
        onSelect={() => { setTool('select'); setConnectSourceId(null); }}
        onAddNode={addNode}
        onAddChild={addChild}
        onConnect={() => { setPanel(null); setTool(current => current === 'connect' ? 'select' : 'connect'); setConnectSourceId(null); }}
        onInspector={() => selectedNode ? setPanel(panel === 'inspector' ? null : 'inspector') : setToast('Select a node first')}
        onFit={() => graphRef.current?.fit()}
        onMore={() => setPanel(panel === 'more' ? null : 'more')}
      />

      {panel === 'inspector' && selectedNode && (
        <InspectorPanel
          node={selectedNode}
          tags={document.tags}
          settings={document.settings}
          onClose={() => setPanel(null)}
          onChange={updateSelectedNode}
          onSettingsChange={updateSettings}
          onAddChild={addChild}
          onDuplicate={duplicateSelected}
          onDelete={deleteSelection}
        />
      )}

      {panel === 'more' && (
        <MorePanel
          onClose={() => setPanel(null)}
          onOpen={openFile}
          onExample={loadExample}
          onStructures={() => setPanel('structures')}
          onReflow={() => { setPanel(null); setPendingLayout({ structure: document.structure, fit: false }); }}
          onExport={() => setPanel('export')}
          onToggleTheme={() => { setTheme(current => current === 'light' ? 'dark' : 'light'); setPanel(null); }}
          onFit={() => { graphRef.current?.fit(); setPanel(null); }}
        />
      )}

      <StructureDialog
        open={panel === 'structures'}
        current={document.structure}
        replaceGraph={replaceGraph}
        onReplaceGraphChange={setReplaceGraph}
        onApply={applyStructure}
        onClose={() => setPanel(null)}
      />

      <ExportDialog open={panel === 'export'} onClose={() => setPanel(null)} onExport={exportProject} />
      <PwaStatus />
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
