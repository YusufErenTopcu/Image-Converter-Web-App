const INPUT_FORMATS = [
  { key: 'png', label: 'PNG', extensions: ['png'], mime: ['image/png'] },
  { key: 'jpeg', label: 'JPG / JPEG', extensions: ['jpg', 'jpeg'], mime: ['image/jpeg'] },
  { key: 'webp', label: 'WEBP', extensions: ['webp'], mime: ['image/webp'] },
  { key: 'bmp', label: 'BMP', extensions: ['bmp'], mime: ['image/bmp'] },
  { key: 'gif', label: 'GIF', extensions: ['gif'], mime: ['image/gif'], limitations: 'Animated GIFs are converted using the first frame only.' },
  { key: 'tiff', label: 'TIFF', extensions: ['tif', 'tiff'], mime: ['image/tiff'], limitations: 'TIFF decoding depends on browser support.' },
  { key: 'ico', label: 'ICO', extensions: ['ico'], mime: ['image/x-icon', 'image/vnd.microsoft.icon'], limitations: 'ICO decoding depends on browser support.' },
  { key: 'svg', label: 'SVG', extensions: ['svg'], mime: ['image/svg+xml'], limitations: 'SVG is rasterized to a bitmap before conversion.' },
]

const OUTPUT_FORMATS = [
  { key: 'png', label: 'PNG', mime: 'image/png', extension: 'png', lossy: false, supportsAlpha: true },
  { key: 'jpeg', label: 'JPG / JPEG', mime: 'image/jpeg', extension: 'jpg', lossy: true, supportsAlpha: false },
  { key: 'webp', label: 'WEBP', mime: 'image/webp', extension: 'webp', lossy: true, supportsAlpha: true, runtimeSupport: 'webp-encode' },
  { key: 'bmp', label: 'BMP', mime: 'image/bmp', extension: 'bmp', lossy: false, supportsAlpha: false },
  { key: 'ico', label: 'ICO', mime: 'image/x-icon', extension: 'ico', lossy: false, supportsAlpha: true },
]

export function getOutputFormats({ webpEncodeSupported }) {
  return OUTPUT_FORMATS.map((f) => {
    if (f.runtimeSupport === 'webp-encode') {
      return { ...f, supported: Boolean(webpEncodeSupported) }
    }
    return { ...f, supported: true }
  })
}

export function supportsWebpEncode() {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const dataUrl = canvas.toDataURL('image/webp')
    return typeof dataUrl === 'string' && dataUrl.startsWith('data:image/webp')
  } catch {
    return false
  }
}

export function getFileExtension(fileName) {
  const idx = fileName.lastIndexOf('.')
  if (idx === -1) return ''
  return fileName.slice(idx + 1).toLowerCase()
}

export function detectInputFormat(file) {
  const ext = getFileExtension(file.name)
  const type = (file.type || '').toLowerCase()
  const match = INPUT_FORMATS.find((f) => f.extensions.includes(ext) || f.mime.includes(type))
  return match || null
}

export function getInputAcceptString() {
  const exts = INPUT_FORMATS.flatMap((f) => f.extensions.map((e) => `.${e}`))
  const mimes = INPUT_FORMATS.flatMap((f) => f.mime)
  return [...new Set([...mimes, ...exts])].join(',')
}

export function getInputLimitations(formatKey) {
  return INPUT_FORMATS.find((f) => f.key === formatKey)?.limitations || null
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—'
  const abs = Math.abs(bytes)
  if (abs < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unitIndex = 0
  while (Math.abs(value) >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

export function buildOutputFileName(inputName, outputExtension) {
  const idx = inputName.lastIndexOf('.')
  const base = idx === -1 ? inputName : inputName.slice(0, idx)
  return `${base}.${outputExtension}`
}

export function parseSvgIntrinsicSize(svgText) {
  const widthMatch = svgText.match(/\bwidth\s*=\s*"([0-9.]+)(px)?"/i)
  const heightMatch = svgText.match(/\bheight\s*=\s*"([0-9.]+)(px)?"/i)
  const viewBoxMatch = svgText.match(/\bviewBox\s*=\s*"\s*([0-9.+-]+)\s+([0-9.+-]+)\s+([0-9.+-]+)\s+([0-9.+-]+)\s*"/i)

  const width = widthMatch ? Number(widthMatch[1]) : null
  const height = heightMatch ? Number(heightMatch[1]) : null

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width: Math.round(width), height: Math.round(height), source: 'width/height' }
  }

  if (viewBoxMatch) {
    const vbW = Number(viewBoxMatch[3])
    const vbH = Number(viewBoxMatch[4])
    if (Number.isFinite(vbW) && Number.isFinite(vbH) && vbW > 0 && vbH > 0) {
      return { width: Math.round(vbW), height: Math.round(vbH), source: 'viewBox' }
    }
  }

  return { width: 512, height: 512, source: 'fallback' }
}
