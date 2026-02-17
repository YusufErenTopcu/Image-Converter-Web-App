import { strToU8, zipSync } from 'fflate'

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function dedupeFileName(name, used) {
  if (!used.has(name)) {
    used.add(name)
    return name
  }

  const dot = name.lastIndexOf('.')
  const base = dot === -1 ? name : name.slice(0, dot)
  const ext = dot === -1 ? '' : name.slice(dot)

  let i = 2
  while (used.has(`${base} (${i})${ext}`)) i += 1
  const next = `${base} (${i})${ext}`
  used.add(next)
  return next
}

export async function downloadConvertedAsZip(items, { zipName = 'converted-images.zip' } = {}) {
  const done = (items || []).filter((x) => x?.status === 'done' && x?.convertedBlob)
  if (done.length === 0) {
    throw new Error('No converted files available to download.')
  }

  const used = new Set()
  const named = done.map((item) => ({
    item,
    fileName: dedupeFileName(item.convertedName || 'converted', used),
  }))

  const map = {}
  for (const { item, fileName } of named) {
    map[fileName] = new Uint8Array(await item.convertedBlob.arrayBuffer())
  }

  const manifest = named
    .map(({ item, fileName }) => {
      const mime = item.convertedMime || ''
      const size = item.convertedSize || ''
      return `${fileName}\t${mime}\t${size}`
    })
    .join('\n')

  map['manifest.txt'] = strToU8(manifest)

  const zipped = zipSync(map, { level: 6 })
  const blob = new Blob([zipped], { type: 'application/zip' })
  triggerDownload(blob, zipName)
}
