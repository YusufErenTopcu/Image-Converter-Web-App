import { FormatSelector } from './FormatSelector'

export function ConversionControls({
  settings,
  setSettings,
  outputFormats,
  isConverting,
  canConvert,
  canDownloadAll,
  avifEncodeSupported,
  webpEncodeSupported,
  onConvert,
  onClear,
  onDownloadAll,
}) {
  const showQuality = settings.outputFormat === 'jpeg' || settings.outputFormat === 'webp' || settings.outputFormat === 'avif'
  const showBackground = settings.outputFormat === 'jpeg'

  const statusText = isConverting ? 'Converting in progress.' : canConvert ? 'Ready to convert.' : 'Add files to convert.'

  return (
    <section className="panel" aria-label="Conversion">
      <div className="panel-header">
        <h2 className="panel-title">Convert</h2>
        <div className="row gap">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canConvert || isConverting}
            onClick={onConvert}
          >
            {isConverting ? 'Converting…' : 'Convert all'}
          </button>
          <button type="button" className="btn" disabled={!canConvert || isConverting} onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="panel-body">
        <div className="sr-only" aria-live="polite">
          {statusText}
        </div>

        <FormatSelector
          value={settings.outputFormat}
          options={outputFormats}
          onChange={(outputFormat) => setSettings((s) => ({ ...s, outputFormat }))}
        />

        {settings.outputFormat === 'webp' && !webpEncodeSupported ? (
          <p className="hint">WEBP export is not supported by your browser.</p>
        ) : null}

        {settings.outputFormat === 'avif' && !avifEncodeSupported ? (
          <p className="hint">AVIF export is not supported by your browser.</p>
        ) : null}

        {showQuality ? (
          <div className="field">
            <label className="label" htmlFor="quality">
              Quality ({Math.round((settings.quality ?? 0.85) * 100)}%)
            </label>
            <input
              id="quality"
              className="input"
              type="range"
              min={0.1}
              max={1}
              step={0.01}
              value={settings.quality ?? 0.85}
              onChange={(e) => setSettings((s) => ({ ...s, quality: Number(e.target.value) }))}
            />
            <p className="hint">Higher quality usually means larger files.</p>
          </div>
        ) : null}

        <div className="field">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(settings.resizeEnabled)}
              onChange={(e) => setSettings((s) => ({ ...s, resizeEnabled: e.target.checked }))}
            />
            Resize
          </label>

          {settings.resizeEnabled ? (
            <div className="grid-2">
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="resizeWidth">
                  Width (px)
                </label>
                <input
                  id="resizeWidth"
                  className="input"
                  inputMode="numeric"
                  placeholder="e.g. 1024"
                  value={settings.resizeWidth}
                  onChange={(e) => setSettings((s) => ({ ...s, resizeWidth: e.target.value }))}
                />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="resizeHeight">
                  Height (px)
                </label>
                <input
                  id="resizeHeight"
                  className="input"
                  inputMode="numeric"
                  placeholder="e.g. 768"
                  value={settings.resizeHeight}
                  onChange={(e) => setSettings((s) => ({ ...s, resizeHeight: e.target.value }))}
                />
              </div>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(settings.lockAspect)}
                  onChange={(e) => setSettings((s) => ({ ...s, lockAspect: e.target.checked }))}
                />
                Lock aspect ratio
              </label>
            </div>
          ) : null}
        </div>

        {showBackground ? (
          <div className="field">
            <label className="label" htmlFor="background">
              JPEG background
            </label>
            <div className="row gap">
              <input
                id="background"
                className="input"
                type="color"
                value={settings.background || '#ffffff'}
                onChange={(e) => setSettings((s) => ({ ...s, background: e.target.value }))}
                aria-label="JPEG background color"
                style={{ width: 56, padding: 4 }}
              />
              <input
                className="input"
                type="text"
                value={settings.background || '#ffffff'}
                onChange={(e) => setSettings((s) => ({ ...s, background: e.target.value }))}
              />
            </div>
            <p className="hint">Transparent pixels will be flattened for JPEG.</p>
          </div>
        ) : null}

        <div className="row between" style={{ marginTop: 6 }}>
          <span className="muted small">Batch download</span>
          <button type="button" className="btn" disabled={!canDownloadAll} onClick={onDownloadAll}>
            Download all (ZIP)
          </button>
        </div>
      </div>
    </section>
  )
}
