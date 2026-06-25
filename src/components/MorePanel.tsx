interface MorePanelProps {
  onClose: () => void;
  onOpen: () => void;
  onExample: () => void;
  onStructures: () => void;
  onReflow: () => void;
  onExport: () => void;
  onToggleTheme: () => void;
  onFit: () => void;
}

const actions = [
  { key: 'open', icon: '↥', label: 'Open' },
  { key: 'example', icon: '✦', label: 'Example' },
  { key: 'structures', icon: '▦', label: 'Structures' },
  { key: 'reflow', icon: '⌁', label: 'Reflow' },
  { key: 'export', icon: '↧', label: 'Export' },
  { key: 'theme', icon: '◐', label: 'Theme' },
  { key: 'fit', icon: '⊡', label: 'Fit' }
] as const;

export function MorePanel({ onClose, onOpen, onExample, onStructures, onReflow, onExport, onToggleTheme, onFit }: MorePanelProps) {
  const run = (key: typeof actions[number]['key']) => {
    if (key === 'open') onOpen();
    if (key === 'example') onExample();
    if (key === 'structures') onStructures();
    if (key === 'reflow') onReflow();
    if (key === 'export') onExport();
    if (key === 'theme') onToggleTheme();
    if (key === 'fit') onFit();
  };

  return (
    <aside className="floating-panel more-panel" aria-label="Project actions">
      <div className="panel-head">
        <div><small>PROJECT</small><h2>More actions</h2></div>
        <button className="panel-close" type="button" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="action-grid">
        {actions.map(action => (
          <button key={action.key} className="action-tile" type="button" onClick={() => run(action.key)}>
            <span aria-hidden="true">{action.icon}</span><b>{action.label}</b>
          </button>
        ))}
      </div>
    </aside>
  );
}
