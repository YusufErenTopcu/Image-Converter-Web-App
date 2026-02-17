import { formatBytes } from '../utils/formatSupport'

function triggerDownloadFromUrl(url, fileName) {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function ImagePreview({ item }) {
  if (!item) {
    return (
      <section className="panel" aria-label="Preview">
        <div className="panel-header">
          <h2 className="panel-title">Preview</h2>
        </div>
        <div className="panel-body">
          <p className="hint">Select a file from the queue to preview.</p>
        </div>
      </section>
    )
  }

  const canDownload = item.status === 'done' && item.convertedUrl && item.convertedName

  return (
    <section className="panel" aria-label="Preview">
      <div className="panel-header">
        <h2 className="panel-title">Preview</h2>
        {canDownload ? (
          <button
            type="button"
            className="btn"
            onClick={() => triggerDownloadFromUrl(item.convertedUrl, item.convertedName)}
          >
            Download converted
          </button>
        ) : null}
      </div>

      <div className="panel-body">
        <div className="grid-2">
          <div className="preview">
            <div className="preview-header">
              <span className="preview-title">Original</span>
              <span className="muted small mono">{formatBytes(item.size)}</span>
            </div>
            <div className="preview-body">
              {item.originalUrl ? <img className="preview-img" src={item.originalUrl} alt="Original preview" /> : null}
            </div>
          </div>

          <div className="preview">
            <div className="preview-header">
              <span className="preview-title">Converted</span>
              <span className="muted small mono">
                {item.status === 'done' ? formatBytes(item.convertedSize) : item.status === 'converting' ? '…' : '—'}
              </span>
            </div>
            <div className="preview-body">
              {item.status === 'done' && item.convertedUrl ? (
                <img className="preview-img" src={item.convertedUrl} alt="Converted preview" />
              ) : (
                <span className="muted small">
                  {item.status === 'converting'
                    ? 'Converting…'
                    : item.status === 'error'
                      ? 'Conversion failed.'
                      : 'Convert to see result.'}
                </span>
              )}
            </div>
          </div>
        </div>

        {item.status === 'done' ? (
          <div className="notes">
            <div className="note">
              <div className="note-title">Sizes</div>
              <div className="muted small mono">
                {formatBytes(item.size)} → {formatBytes(item.convertedSize)}
              </div>
            </div>
          </div>
        ) : null}

        {item.warnings?.length ? (
          <div className="notes">
            <div className="note">
              <div className="note-title">Warnings</div>
              <div className="muted small">{item.warnings.join(' · ')}</div>
            </div>
          </div>
        ) : null}

        {item.error ? <div className="error small">{item.error}</div> : null}
      </div>
    </section>
  )
}
