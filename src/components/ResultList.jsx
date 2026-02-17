import { formatBytes } from '../utils/formatSupport'

function StatusBadge({ item }) {
  if (item.status === 'done') return <span className="badge badge-ok">Done</span>
  if (item.status === 'converting') return <span className="badge">Converting</span>
  if (item.status === 'error') return <span className="badge badge-bad">Error</span>
  return <span className="badge">Ready</span>
}

export function ResultList({ items, selectedId, onSelect, onRemove, onReorder }) {
  return (
    <section className="panel" aria-label="Queue">
      <div className="panel-header">
        <h2 className="panel-title">Queue</h2>
        <span className="muted small">{items.length} file(s)</span>
      </div>

      <div className="panel-body">
        {items.length === 0 ? <p className="hint">Add images to start converting.</p> : null}

        <ul className="list" aria-label="Files">
          {items.map((item) => {
            const selected = item.id === selectedId

            return (
              <li
                key={item.id}
                className={`list-item ${selected ? 'list-item-selected' : ''}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.id)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const sourceId = e.dataTransfer.getData('text/plain')
                  onReorder?.(sourceId, item.id)
                }}
              >
                <button type="button" className="list-main" onClick={() => onSelect?.(item.id)}>
                  <div className="truncate">
                    <div className="name">{item.name}</div>
                    <div className="meta muted small mono">
                      <span>{formatBytes(item.size)}</span>
                      <span>{item.inputLabel || item.inputFormat || '—'}</span>
                    </div>
                    {item.status === 'done' ? (
                      <div className="meta muted small mono">
                        <span>→</span>
                        <span>{formatBytes(item.convertedSize)}</span>
                        <span>{item.convertedName?.split('.').pop()?.toUpperCase() || '—'}</span>
                      </div>
                    ) : null}
                    {item.warnings?.length ? <div className="error small">{item.warnings[0]}</div> : null}
                    {item.error ? <div className="error small">{item.error}</div> : null}
                  </div>
                </button>

                <div className="list-actions">
                  <StatusBadge item={item} />
                  <button type="button" className="btn btn-link danger" onClick={() => onRemove?.(item.id)}>
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        {items.length > 1 ? <p className="hint">Tip: drag items to reorder.</p> : null}
      </div>
    </section>
  )
}
