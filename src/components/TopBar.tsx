interface TopBarProps {
  title: string;
  canUndo: boolean;
  canRedo: boolean;
  onRename: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpen: () => void;
  onStructures: () => void;
  onExport: () => void;
  onToggleTheme: () => void;
}

export function TopBar({
  title,
  canUndo,
  canRedo,
  onRename,
  onUndo,
  onRedo,
  onOpen,
  onStructures,
  onExport,
  onToggleTheme
}: TopBarProps) {
  return (
    <header className="topbar" aria-label="Document toolbar">
      <button className="brand-button" type="button" onClick={onRename} aria-label="Rename document">
        <span className="brand-mark" aria-hidden="true">◇</span>
        <span className="brand-copy"><b>{title}</b><small>Saved locally</small></span>
      </button>

      <div className="topbar-actions">
        <button className="ui-button icon-only compact-only" type="button" onClick={onOpen} aria-label="Open project">↥</button>
        <button className="ui-button desktop-label" type="button" onClick={onOpen}><span>↥</span>Open</button>
        <button className="ui-button desktop-label" type="button" onClick={onStructures}><span>▦</span>Structures</button>
        <button className="ui-button icon-only compact-only" type="button" onClick={onStructures} aria-label="Structures">▦</button>
        <button className="ui-button icon-only" type="button" disabled={!canUndo} onClick={onUndo} aria-label="Undo">↶</button>
        <button className="ui-button icon-only wide-only" type="button" disabled={!canRedo} onClick={onRedo} aria-label="Redo">↷</button>
        <button className="ui-button icon-only" type="button" onClick={onToggleTheme} aria-label="Toggle theme">◐</button>
        <button className="ui-button primary" type="button" onClick={onExport}><span>↧</span><span className="desktop-label-inline">Export</span></button>
      </div>
    </header>
  );
}
