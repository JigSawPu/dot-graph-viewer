import { STRUCTURES } from '../lib/constants';
import type { DiagramStructure } from '../types';

interface StructureDialogProps {
  open: boolean;
  current: DiagramStructure;
  replaceGraph: boolean;
  onReplaceGraphChange: (value: boolean) => void;
  onApply: (structure: DiagramStructure) => void;
  onClose: () => void;
}

export function StructureDialog({ open, current, replaceGraph, onReplaceGraphChange, onApply, onClose }: StructureDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card structures-card" role="dialog" aria-modal="true" aria-labelledby="structures-title">
        <div className="panel-head">
          <div><small>DIAGRAM LIBRARY</small><h2 id="structures-title">Choose a structure</h2></div>
          <button className="panel-close" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="panel-copy">Rearrange the current graph, or replace it with a starter template.</p>
        <div className="structure-grid">
          {STRUCTURES.map(item => (
            <button key={item.id} className={`structure-option${current === item.id ? ' active' : ''}`} type="button" onClick={() => onApply(item.id)}>
              <span className={`structure-preview preview-${item.id}`} aria-hidden="true" />
              <span><b>{item.name}</b><small>{item.description}</small></span>
            </button>
          ))}
        </div>
        <label className="switch-row modal-switch"><span>Replace current graph with template</span><input type="checkbox" checked={replaceGraph} onChange={event => onReplaceGraphChange(event.target.checked)} /></label>
      </section>
    </div>
  );
}
