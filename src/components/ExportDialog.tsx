interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (type: 'dot' | 'json' | 'png' | 'jpg') => void;
}

const choices = [
  { type: 'dot', title: 'DOT', copy: 'Graphviz source' },
  { type: 'json', title: 'JSON', copy: 'Editable backup' },
  { type: 'png', title: 'PNG', copy: 'Transparent image' },
  { type: 'jpg', title: 'JPG', copy: 'Canvas background' }
] as const;

export function ExportDialog({ open, onClose, onExport }: ExportDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card export-card" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <div className="panel-head">
          <div><small>DOWNLOAD</small><h2 id="export-title">Export project</h2></div>
          <button className="panel-close" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="export-grid">
          {choices.map(choice => (
            <button key={choice.type} type="button" onClick={() => onExport(choice.type)}>
              <b>{choice.title}</b><span>{choice.copy}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
