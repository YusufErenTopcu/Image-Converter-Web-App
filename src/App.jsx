import { useMemo } from 'react'
import { ConversionControls } from './components/ConversionControls'
import { FileUploader } from './components/FileUploader'
import { ImagePreview } from './components/ImagePreview'
import { ResultList } from './components/ResultList'
import { ThemeToggle } from './components/ThemeToggle'
import { useImageConversion } from './hooks/useImageConversion'
import { getInputAcceptString, getOutputFormats, supportsWebpEncode } from './utils/formatSupport'
import { downloadConvertedAsZip } from './utils/zipDownload'

function App() {
  const {
    items,
    selected,
    selectedId,
    isConverting,
    settings,
    setSettings,
    anyReady,
    addFiles,
    removeItem,
    clearAll,
    selectItem,
    reorder,
    convertAll,
  } = useImageConversion()

  const accept = useMemo(() => getInputAcceptString(), [])
  const webpEncodeSupported = useMemo(() => supportsWebpEncode(), [])
  const outputFormats = useMemo(() => getOutputFormats({ webpEncodeSupported }), [webpEncodeSupported])
  const canDownloadAll = useMemo(() => items.some((x) => x.status === 'done' && x.convertedBlob), [items])

  return (
    <div className="app">
      <header className="app-header" role="banner">
        <div className="app-header-main">
          <div>
            <h1 className="app-title">Image Converter</h1>
            <p className="app-subtitle">Frontend-only, privacy-first image format conversion.</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="message" role="note">
          <div className="message-strong">All conversions happen locally in your browser.</div>
          <div className="muted">No files are uploaded.</div>
        </div>
      </header>

      <main role="main">
        <div className="app-main">
          <div className="col">
            <FileUploader accept={accept} onFilesAdded={addFiles} />
            <ResultList
              items={items}
              selectedId={selectedId}
              onSelect={selectItem}
              onRemove={removeItem}
              onReorder={reorder}
            />
          </div>

          <div className="col">
            <ConversionControls
              settings={settings}
              setSettings={setSettings}
              outputFormats={outputFormats}
              isConverting={isConverting}
              canConvert={anyReady}
              canDownloadAll={canDownloadAll}
              webpEncodeSupported={webpEncodeSupported}
              onConvert={() => convertAll({ webpEncodeSupported })}
              onClear={clearAll}
              onDownloadAll={async () => {
                try {
                  await downloadConvertedAsZip(items)
                } catch (e) {
                  const message = e instanceof Error ? e.message : 'Download failed.'
                  window.alert(message)
                }
              }}
            />
            <ImagePreview item={selected} />
          </div>
        </div>

        <footer className="app-footer">
          <span className="muted small">
            Canvas-based conversion. SVG is rasterized; GIF uses first frame; TIFF/ICO decode depends on browser support.
          </span>
        </footer>
      </main>
    </div>
  )
}

export default App
