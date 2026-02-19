import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { convertCanvasToFormat, decodeSourceToCanvas } from '../utils/imageConverter'
import { detectInputFormat } from '../utils/formatSupport'

function useLocalStorageState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return defaultValue
      return JSON.parse(raw)
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
  }, [key, value])

  return [value, setValue]
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function useImageConversion() {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isConverting, setIsConverting] = useState(false)

  const urlsRef = useRef(new Set())

  const [settings, setSettings] = useLocalStorageState('imgconv.settings.v1', {
    outputFormat: 'png',
    quality: 0.85,
    resizeEnabled: false,
    resizeWidth: '',
    resizeHeight: '',
    lockAspect: true,
    background: '#ffffff',
  })

  const addFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || [])
      if (files.length === 0) return

      let firstNewId = null

      setItems((prev) => {
        const next = [...prev]
        for (const file of files) {
          const format = detectInputFormat(file)
          const id = makeId()
          if (!firstNewId) firstNewId = id
          const originalUrl = URL.createObjectURL(file)
          urlsRef.current.add(originalUrl)

          next.push({
            id,
            file,
            name: file.name,
            type: file.type || '',
            size: file.size,
            lastModified: file.lastModified,
            inputFormat: format?.key || null,
            inputLabel: format?.label || null,
            status: 'ready',
            error: null,
            originalUrl,
            originalWidth: null,
            originalHeight: null,
            convertedUrl: null,
            convertedBlob: null,
            convertedSize: null,
            convertedMime: null,
            convertedName: null,
            convertedWidth: null,
            convertedHeight: null,
            warnings: [],
          })
        }
        return next
      })

      setSelectedId((prevSelected) => prevSelected || firstNewId)
    },
    [setSelectedId],
  )

  const removeItem = useCallback(
    (id) => {
      setItems((prev) => {
        const item = prev.find((x) => x.id === id)
        if (item?.originalUrl) {
          URL.revokeObjectURL(item.originalUrl)
          urlsRef.current.delete(item.originalUrl)
        }
        if (item?.convertedUrl) {
          URL.revokeObjectURL(item.convertedUrl)
          urlsRef.current.delete(item.convertedUrl)
        }

        const next = prev.filter((x) => x.id !== id)
        if (selectedId === id) setSelectedId(next[0]?.id || null)
        return next
      })
    },
    [selectedId],
  )

  const clearAll = useCallback(() => {
    setItems((prev) => {
      for (const item of prev) {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl)
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl)
      }
      urlsRef.current.clear()
      return []
    })
    setSelectedId(null)
  }, [])

  const selectItem = useCallback((id) => setSelectedId(id), [])

  const reorder = useCallback((sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return

    setItems((prev) => {
      const sourceIndex = prev.findIndex((x) => x.id === sourceId)
      const targetIndex = prev.findIndex((x) => x.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) return prev

      const next = [...prev]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }, [])

  const convertAll = useCallback(
    async ({ webpEncodeSupported, avifEncodeSupported }) => {
      if (isConverting) return
      setIsConverting(true)

      setItems((prev) =>
        prev.map((x) => {
          if (x.convertedUrl) {
            URL.revokeObjectURL(x.convertedUrl)
            urlsRef.current.delete(x.convertedUrl)
          }
          return {
            ...x,
            status: 'converting',
            error: null,
            convertedUrl: null,
            convertedBlob: null,
            convertedSize: null,
            convertedMime: null,
            convertedName: null,
            convertedWidth: null,
            convertedHeight: null,
            warnings: [],
          }
        }),
      )

      try {
        for (const item of items) {
          setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: 'converting', error: null } : x)))

          try {
            if (settings.outputFormat === 'webp' && !webpEncodeSupported) {
              throw new Error('WEBP output is not supported in this browser.')
            }

            if (settings.outputFormat === 'avif' && !avifEncodeSupported) {
              throw new Error('AVIF output is not supported in this browser.')
            }

            if (!item.inputFormat) {
              throw new Error('Unsupported input format.')
            }

            const decoded = await decodeSourceToCanvas(item.file, item.inputFormat)

            const converted = await convertCanvasToFormat(decoded.canvas, {
              ...settings,
              inputFileName: item.name,
            })

            const convertedUrl = URL.createObjectURL(converted.blob)
            urlsRef.current.add(convertedUrl)

            const mergedWarnings = [...(decoded.warnings || []), ...(converted.warnings || [])]

            setItems((prev) =>
              prev.map((x) =>
                x.id === item.id
                  ? {
                      ...x,
                      status: 'done',
                      error: null,
                      warnings: mergedWarnings,
                      originalWidth: decoded.width,
                      originalHeight: decoded.height,
                      convertedUrl,
                      convertedBlob: converted.blob,
                      convertedSize: converted.blob.size,
                      convertedMime: converted.mime,
                      convertedName: converted.outputName,
                      convertedWidth: converted.width,
                      convertedHeight: converted.height,
                    }
                  : x,
              ),
            )
          } catch (e) {
            const message = e instanceof Error ? e.message : 'Conversion failed.'
            setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: 'error', error: message } : x)))
          }
        }
      } finally {
        setIsConverting(false)
      }
    },
    [isConverting, items, settings],
  )

  const anyReady = useMemo(() => items.length > 0, [items.length])
  const selected = useMemo(() => items.find((x) => x.id === selectedId) || null, [items, selectedId])

  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      for (const url of urls) URL.revokeObjectURL(url)
      urls.clear()
    }
  }, [])

  return {
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
  }
}
