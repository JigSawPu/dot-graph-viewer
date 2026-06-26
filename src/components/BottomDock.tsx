import type { EditorTool } from '../types';

interface BottomDockProps {
  tool: EditorTool;
  inspectorOpen: boolean;
  onSelect: () => void;
  onAddNode: () => void;
  onAddChild: () => void;
  onConnect: () => void;
  onInspector: () => void;
  onFit: () => void;
  onMore: () => void;
}

const tools = [
  { key: 'select', icon: '⌖', label: 'Select' },
  { key: 'node', icon: '＋', label: 'Node' },
  { key: 'child', icon: '↳', label: 'Child' },
  { key: 'connect', icon: '⌁', label: 'Link' },
  { key: 'inspector', icon: '◉', label: 'Style' },
  { key: 'fit', icon: '⊡', label: 'Fit' },
  { key: 'more', icon: '•••', label: 'More' }
] as const;

export function BottomDock({ tool, inspectorOpen, onSelect, onAddNode, onAddChild, onConnect, onInspector, onFit, onMore }: BottomDockProps) {
  const run = (key: typeof tools[number]['key']) => {
    if (key === 'select') onSelect();
    if (key === 'node') onAddNode();
    if (key === 'child') onAddChild();
    if (key === 'connect') onConnect();
    if (key === 'inspector') onInspector();
    if (key === 'fit') onFit();
    if (key === 'more') onMore();
  };

  return (
    <nav className="bottom-dock" aria-label="Editing tools">
      {tools.map(item => {
        const active = (item.key === 'select' && tool === 'select') ||
          (item.key === 'connect' && tool === 'connect') ||
          (item.key === 'inspector' && inspectorOpen);
        return (
          <button key={item.key} className={`dock-tool${active ? ' active' : ''}`} type="button" onClick={() => run(item.key)}>
            <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
          </button>
        );
      })}
    </nav>
  );
}
