import { useCallback, useRef, useState } from 'react'

export function FileUploader({ accept, onFilesAdded }) {
  const inputRef = useRef(null)
  const [isOver, setIsOver] = useState(false)

  const openFilePicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleFiles = useCallback(
    (files) => {
      if (!files || files.length === 0) return
      onFilesAdded?.(files)
    },
    [onFilesAdded],
  )

  return (
    <section className="panel" aria-label="Upload">
      <div className="panel-header">
        <h2 className="panel-title">Upload</h2>
        <button type="button" className="btn" onClick={openFilePicker}>
          Choose files
        </button>
      </div>

      <div className="panel-body">
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept={accept}
          multiple
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />

        <div
          role="button"
          tabIndex={0}
          className={`dropzone ${isOver ? 'dropzone-over' : ''}`}
          onClick={openFilePicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openFilePicker()
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOver(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOver(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOver(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          <div className="dropzone-inner">
            <div className="dropzone-title">Drag & drop images here</div>
            <p className="dropzone-subtitle muted small">or click to select multiple files</p>
            <div className="dropzone-meta">
              <span className="badge">Privacy-first</span>
              <span className="badge">Frontend-only</span>
              <span className="badge">No uploads</span>
            </div>
            <div className="dropzone-notes muted small">
              SVG is rasterized, GIF uses first frame, AVIF/TIFF/ICO depend on browser decoding, HEIC/HEIF uses WASM.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
