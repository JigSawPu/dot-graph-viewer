import type { CSSProperties } from 'react';
import { ICONS, PALETTES } from '../lib/constants';
import type { GraphNode, GraphSettings, GraphTag } from '../types';

interface InspectorPanelProps {
  node: GraphNode;
  tags: GraphTag[];
  settings: GraphSettings;
  onClose: () => void;
  onChange: (patch: Partial<GraphNode>) => void;
  onSettingsChange: (patch: Partial<GraphSettings>) => void;
  onAddChild: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function InspectorPanel({ node, tags, settings, onClose, onChange, onSettingsChange, onAddChild, onDuplicate, onDelete }: InspectorPanelProps) {
  return (
    <aside className="floating-panel inspector-panel" aria-label="Node inspector">
      <div className="panel-head">
        <div><small>SELECTED NODE</small><h2>{node.label || 'Untitled node'}</h2></div>
        <button className="panel-close" type="button" onClick={onClose} aria-label="Close inspector">×</button>
      </div>

      <div className="panel-scroll">
        <label>Title<textarea rows={2} value={node.label} onChange={event => onChange({ label: event.target.value })} /></label>
        <label>Subtitle<input value={node.subtitle} onChange={event => onChange({ subtitle: event.target.value })} placeholder="Optional description" /></label>
        <label>Notes<textarea rows={3} value={node.notes} onChange={event => onChange({ notes: event.target.value })} placeholder="Saved inside the project" /></label>

        <div className="field-grid two">
          <label>Shape<select value={node.shape} onChange={event => onChange({ shape: event.target.value as GraphNode['shape'] })}>
            <option value="roundrectangle">Rounded card</option>
            <option value="rectangle">Rectangle</option>
            <option value="ellipse">Bubble</option>
            <option value="diamond">Decision</option>
            <option value="hexagon">Hexagon</option>
          </select></label>
          <label>Width<input type="range" min="90" max="280" step="5" value={node.width} onChange={event => onChange({ width: Number(event.target.value), height: Math.max(62, Math.round(Number(event.target.value) * 0.43)) })} /></label>
        </div>

        <div className="section-label">Icon</div>
        <div className="icon-grid">
          {ICONS.map(icon => (
            <button key={icon || 'none'} className={node.icon === icon ? 'active' : ''} type="button" onClick={() => onChange({ icon })}>{icon || '—'}</button>
          ))}
        </div>

        <div className="section-label">Tag</div>
        <div className="tag-grid">
          <button className={!node.tagId ? 'active' : ''} type="button" onClick={() => onChange({ tagId: '' })}>No tag</button>
          {tags.map(tag => (
            <button key={tag.id} className={node.tagId === tag.id ? 'active' : ''} style={{ '--tag-color': tag.color } as CSSProperties} type="button" onClick={() => onChange({ tagId: tag.id })}>
              <i />{tag.name}
            </button>
          ))}
        </div>

        <div className="section-label">Pastel branch palette</div>
        <div className="palette-grid">
          {PALETTES.map(palette => (
            <button
              key={palette.name}
              className={node.branchColor.toLowerCase() === palette.branch.toLowerCase() ? 'active' : ''}
              style={{ '--swatch': palette.branch } as CSSProperties}
              type="button"
              title={palette.name}
              onClick={() => onChange({ branchColor: palette.branch, borderColor: palette.branch, fill: palette.light })}
            />
          ))}
        </div>

        <div className="field-grid three">
          <label>Fill<input type="color" value={node.fill} onChange={event => onChange({ fill: event.target.value })} /></label>
          <label>Text<input type="color" value={node.textColor} onChange={event => onChange({ textColor: event.target.value })} /></label>
          <label>Branch<input type="color" value={node.branchColor} onChange={event => onChange({ branchColor: event.target.value, borderColor: event.target.value })} /></label>
        </div>

        <div className="field-grid two">
          <label>Connection<select value={settings.edgeStyle} onChange={event => onSettingsChange({ edgeStyle: event.target.value as GraphSettings['edgeStyle'] })}>
            <option value="bezier">Smooth curve</option><option value="segments">Angular</option><option value="straight">Straight</option><option value="taxi">Elbow</option>
          </select></label>
          <label>Line width<input type="range" min="1" max="8" step="0.5" value={settings.edgeWidth} onChange={event => onSettingsChange({ edgeWidth: Number(event.target.value) })} /></label>
        </div>

        <label className="switch-row"><span>Lock position</span><input type="checkbox" checked={node.locked} onChange={event => onChange({ locked: event.target.checked })} /></label>
      </div>

      <div className="panel-actions">
        <button className="ui-button" type="button" onClick={onDuplicate}>Duplicate</button>
        <button className="ui-button danger" type="button" onClick={onDelete}>Delete</button>
        <button className="ui-button primary" type="button" onClick={onAddChild}>Add child</button>
      </div>
    </aside>
  );
}
