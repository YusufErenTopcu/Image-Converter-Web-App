# Image Converter

A privacy-first, frontend-only image format converter built with React.  
All conversions run entirely in your browser using the HTML Canvas API.

No uploads. No backend. No tracking.

---

## Highlights

- 100% client-side processing
- Files never leave your device
- Fast batch conversion with previews
- Clean, minimal, professional UI

---

## Features

- Drag & drop or file picker
- Multiple file selection and batch conversion
- Output format selection
- Quality control for lossy formats (JPG / WEBP)
- Resize images (width / height) with aspect ratio lock
- Background color selection for transparent images when exporting to JPG
- Original vs converted file size comparison
- Before / after image preview
- Light / Dark mode
- One-click batch download as ZIP

---

## Supported Formats

### Input

- PNG  
- JPG / JPEG  
- WEBP  
- BMP  
- GIF (first frame only)  
- SVG (rasterized to bitmap)  
- TIFF (browser-dependent decoding)  
- ICO (browser-dependent decoding)  

### Output

- PNG  
- JPG / JPEG  
- WEBP (browser-dependent encoding)  
- BMP  
- ICO (PNG stored inside `.ico` container)  

---

## Limitations

- SVG files are rasterized before conversion.
- GIF files are converted using the first frame only (no animation support).
- TIFF and ICO input decoding depends on browser support.
- JPG output does not support transparency; transparent pixels are flattened using the selected background color.

---

## Privacy

This application does not upload files.

Images are:
1. Read locally from your device
2. Converted using the HTML Canvas API
3. Exported back to your device

No network requests. No analytics. No storage.

---

## Run Locally

~~~bash
npm install
npm run dev

