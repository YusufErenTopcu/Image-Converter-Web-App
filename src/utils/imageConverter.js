import { buildOutputFileName, parseSvgIntrinsicSize } from './formatSupport'

function getDecodeWarnings(inputFormatKey) {
  const warnings = []
  if (inputFormatKey === 'gif') warnings.push('GIF converted using the first frame only.')
  if (inputFormatKey === 'tiff') warnings.push('TIFF decoding depends on browser support.')
  if (inputFormatKey === 'ico') warnings.push('ICO decoding depends on browser support.')
  if (inputFormatKey === 'avif') warnings.push('AVIF decoding depends on browser support.')
  return warnings
}

function hexToRgb(hex) {
  const raw = (hex || '').trim()
  const normalized = raw.startsWith('#') ? raw.slice(1) : raw
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16)
    const g = parseInt(normalized[1] + normalized[1], 16)
    const b = parseInt(normalized[2] + normalized[2], 16)
    return { r, g, b }
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    return { r, g, b }
  }
  return { r: 255, g: 255, b: 255 }
}

function compositeOverBackground({ r: br, g: bg, b: bb }, { r, g, b, a }) {
  const alpha = a / 255
  const inv = 1 - alpha
  return {
    r: Math.round(r * alpha + br * inv),
    g: Math.round(g * alpha + bg * inv),
    b: Math.round(b * alpha + bb * inv),
  }
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    if (!canvas.toBlob) {
      reject(new Error('Canvas export is not supported in this browser.'))
      return
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to export as ${mimeType}.`))
          return
        }

        const requested = (mimeType || '').toLowerCase()
        const actual = (blob.type || '').toLowerCase()
        if (requested && requested !== 'image/png' && actual && actual !== requested) {
          reject(new Error(`${mimeType} export is not supported in this browser.`))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}

async function decodeViaImageElement(blob) {
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Failed to decode image.'))
      el.src = url
    })
    return { img, cleanup: () => URL.revokeObjectURL(url) }
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

async function decodeImageBitmap(blob) {
  if (typeof createImageBitmap !== 'function') return null
  try {
    const bitmap = await createImageBitmap(blob)
    return bitmap
  } catch {
    return null
  }
}

export async function decodeSourceToCanvas(file, inputFormatKey) {
  if (inputFormatKey === 'heic') {
    let converted
    try {
      const mod = await import('heic2any')
      const heic2any = mod?.default || mod

      converted = await heic2any({ blob: file, toType: 'image/png' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'HEIC/HEIF decode failed.'
      throw new Error(`HEIC/HEIF decode failed: ${msg}`)
    }

    const blobs = Array.isArray(converted) ? converted : [converted]
    const first = blobs[0]
    if (!(first instanceof Blob)) throw new Error('HEIC/HEIF decode failed.')

    const warnings = []
    if (blobs.length > 1) warnings.push('HEIC/HEIF contains multiple images; converted using the first frame only.')
    warnings.push('HEIC/HEIF decoded via WASM before conversion.')

    const bitmap = await decodeImageBitmap(first)
    if (bitmap) {
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Canvas 2D context is unavailable.')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close?.()
      return { canvas, width: canvas.width, height: canvas.height, warnings }
    }

    const { img, cleanup } = await decodeViaImageElement(first)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Canvas 2D context is unavailable.')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      return { canvas, width: canvas.width, height: canvas.height, warnings }
    } finally {
      cleanup()
    }
  }

  if (inputFormatKey === 'svg') {
    const svgText = await file.text()
    const intrinsic = parseSvgIntrinsicSize(svgText)
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' })

    const { img, cleanup } = await decodeViaImageElement(svgBlob)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = intrinsic.width
      canvas.height = intrinsic.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Canvas 2D context is unavailable.')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      return {
        canvas,
        width: canvas.width,
        height: canvas.height,
        warnings: ['SVG rasterized to bitmap before conversion.'],
      }
    } finally {
      cleanup()
    }
  }

  const bitmap = await decodeImageBitmap(file)
  if (bitmap) {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas 2D context is unavailable.')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close?.()

    return { canvas, width: canvas.width, height: canvas.height, warnings: getDecodeWarnings(inputFormatKey) }
  }

  const { img, cleanup } = await decodeViaImageElement(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas 2D context is unavailable.')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    return { canvas, width: canvas.width, height: canvas.height, warnings: getDecodeWarnings(inputFormatKey) }
  } finally {
    cleanup()
  }
}

function computeTargetSize({ srcWidth, srcHeight, resizeEnabled, targetWidth, targetHeight, lockAspect }) {
  if (!resizeEnabled) return { width: srcWidth, height: srcHeight, resized: false }

  const w = Number(targetWidth)
  const h = Number(targetHeight)
  const hasW = Number.isFinite(w) && w > 0
  const hasH = Number.isFinite(h) && h > 0

  if (!hasW && !hasH) return { width: srcWidth, height: srcHeight, resized: false }

  if (!lockAspect) {
    return {
      width: hasW ? Math.round(w) : srcWidth,
      height: hasH ? Math.round(h) : srcHeight,
      resized: true,
    }
  }

  const ratio = srcWidth / srcHeight
  if (hasW) {
    return { width: Math.round(w), height: Math.max(1, Math.round(w / ratio)), resized: true }
  }
  return { width: Math.max(1, Math.round(h * ratio)), height: Math.round(h), resized: true }
}

function detectAlpha(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) return true
  }
  return false
}

function encodeBmpFromCanvas(canvas, backgroundHex) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D context is unavailable.')

  const width = canvas.width
  const height = canvas.height
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data

  const bg = hexToRgb(backgroundHex)

  const bytesPerPixel = 3
  const rowSize = (width * bytesPerPixel + 3) & ~3
  const pixelArraySize = rowSize * height
  const fileHeaderSize = 14
  const dibHeaderSize = 40
  const pixelDataOffset = fileHeaderSize + dibHeaderSize
  const fileSize = pixelDataOffset + pixelArraySize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)
  let p = 0

  view.setUint8(p++, 0x42)
  view.setUint8(p++, 0x4d)
  view.setUint32(p, fileSize, true)
  p += 4
  view.setUint16(p, 0, true)
  p += 2
  view.setUint16(p, 0, true)
  p += 2
  view.setUint32(p, pixelDataOffset, true)
  p += 4

  view.setUint32(p, dibHeaderSize, true)
  p += 4
  view.setInt32(p, width, true)
  p += 4
  view.setInt32(p, height, true)
  p += 4
  view.setUint16(p, 1, true)
  p += 2
  view.setUint16(p, 24, true)
  p += 2
  view.setUint32(p, 0, true)
  p += 4
  view.setUint32(p, pixelArraySize, true)
  p += 4
  view.setInt32(p, 2835, true)
  p += 4
  view.setInt32(p, 2835, true)
  p += 4
  view.setUint32(p, 0, true)
  p += 4
  view.setUint32(p, 0, true)
  p += 4

  const padding = rowSize - width * bytesPerPixel

  let hadAlpha = false

  let dst = pixelDataOffset
  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const rgba = { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }
      if (rgba.a !== 255) hadAlpha = true
      const rgb = rgba.a === 255 ? rgba : compositeOverBackground(bg, rgba)
      view.setUint8(dst++, rgb.b)
      view.setUint8(dst++, rgb.g)
      view.setUint8(dst++, rgb.r)
    }
    for (let k = 0; k < padding; k += 1) view.setUint8(dst++, 0)
  }

  return { blob: new Blob([buffer], { type: 'image/bmp' }), hadAlpha }
}

async function encodeIcoFromCanvas(canvas) {
  let srcCanvas = canvas
  const max = 256
  if (canvas.width > max || canvas.height > max) {
    const scale = Math.min(max / canvas.width, max / canvas.height)
    const w = Math.max(1, Math.round(canvas.width * scale))
    const h = Math.max(1, Math.round(canvas.height * scale))
    const resized = document.createElement('canvas')
    resized.width = w
    resized.height = h
    const rctx = resized.getContext('2d')
    if (!rctx) throw new Error('Canvas 2D context is unavailable.')
    rctx.drawImage(canvas, 0, 0, w, h)
    srcCanvas = resized
  }

  const pngBlob = await canvasToBlob(srcCanvas, 'image/png')
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer())

  const count = 1
  const headerSize = 6
  const entrySize = 16
  const imageOffset = headerSize + entrySize * count
  const totalSize = imageOffset + pngBytes.length

  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  let p = 0

  view.setUint16(p, 0, true)
  p += 2
  view.setUint16(p, 1, true)
  p += 2
  view.setUint16(p, count, true)
  p += 2

  const w = srcCanvas.width
  const h = srcCanvas.height
  view.setUint8(p++, w === 256 ? 0 : w)
  view.setUint8(p++, h === 256 ? 0 : h)
  view.setUint8(p++, 0)
  view.setUint8(p++, 0)
  view.setUint16(p, 1, true)
  p += 2
  view.setUint16(p, 32, true)
  p += 2
  view.setUint32(p, pngBytes.length, true)
  p += 4
  view.setUint32(p, imageOffset, true)
  p += 4

  new Uint8Array(buffer, imageOffset).set(pngBytes)
  return new Blob([buffer], { type: 'image/x-icon' })
}

export async function convertCanvasToFormat(sourceCanvas, settings) {
  const {
    outputFormat,
    quality,
    resizeEnabled,
    resizeWidth,
    resizeHeight,
    lockAspect,
    background,
    inputFileName,
  } = settings

  const target = computeTargetSize({
    srcWidth: sourceCanvas.width,
    srcHeight: sourceCanvas.height,
    resizeEnabled,
    targetWidth: resizeWidth,
    targetHeight: resizeHeight,
    lockAspect,
  })

  const canvas = document.createElement('canvas')
  canvas.width = target.width
  canvas.height = target.height

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D context is unavailable.')

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (outputFormat === 'jpeg') {
    ctx.fillStyle = background || '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height)

  const warnings = []

  let blob
  let mime
  let extension

  if (outputFormat === 'png') {
    blob = await canvasToBlob(canvas, 'image/png')
    mime = 'image/png'
    extension = 'png'
  } else if (outputFormat === 'jpeg') {
    const hasAlpha = detectAlpha(ctx, canvas.width, canvas.height)
    blob = await canvasToBlob(canvas, 'image/jpeg', Number.isFinite(quality) ? quality : 0.85)
    mime = 'image/jpeg'
    extension = 'jpg'
    if (hasAlpha) warnings.push('Transparency flattened for JPEG output.')
  } else if (outputFormat === 'avif') {
    blob = await canvasToBlob(canvas, 'image/avif', Number.isFinite(quality) ? quality : 0.85)
    mime = 'image/avif'
    extension = 'avif'
  } else if (outputFormat === 'webp') {
    blob = await canvasToBlob(canvas, 'image/webp', Number.isFinite(quality) ? quality : 0.85)
    mime = 'image/webp'
    extension = 'webp'
  } else if (outputFormat === 'bmp') {
    const encoded = encodeBmpFromCanvas(canvas, background || '#ffffff')
    blob = encoded.blob
    mime = 'image/bmp'
    extension = 'bmp'
    if (encoded.hadAlpha) warnings.push('Transparency flattened for BMP output.')
  } else if (outputFormat === 'ico') {
    blob = await encodeIcoFromCanvas(canvas)
    mime = 'image/x-icon'
    extension = 'ico'
    if (canvas.width !== canvas.height) warnings.push('ICO output is typically square; result may be less compatible.')
    if (sourceCanvas.width > 256 || sourceCanvas.height > 256) warnings.push('ICO output was scaled down to fit within 256px.')
  } else {
    throw new Error('Unsupported output format.')
  }

  const outputName = buildOutputFileName(inputFileName, extension)
  return {
    blob,
    mime,
    outputName,
    width: canvas.width,
    height: canvas.height,
    resized: target.resized,
    warnings,
  }
}
