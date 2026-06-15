'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'

const RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:4', value: 3 / 4 },
  { label: '9:16', value: 9 / 16 },
]

interface CropBox { x: number; y: number; w: number; h: number }

export default function CropResizeClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  // ── Image state ────────────────────────────────────────────────────────────
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [filename, setFilename] = useState('image.jpg')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultDims, setResultDims] = useState<{ w: number; h: number } | null>(null)

  // ── Resize state ───────────────────────────────────────────────────────────
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [origWidth, setOrigWidth] = useState(0)
  const [origHeight, setOrigHeight] = useState(0)
  const [ratio, setRatio] = useState<number | null>(null)

  // ── Mode: 'resize' | 'autocrop' | 'manualcrop' ────────────────────────────
  const [mode, setMode] = useState<'resize' | 'autocrop' | 'manualcrop'>('resize')

  // ── Manual crop drag state ─────────────────────────────────────────────────
  const [cropBox, setCropBox] = useState<CropBox | null>(null)
  const [autoCropBox, setAutoCropBox] = useState<CropBox | null>(null)
  const [autoBoxAtDrag, setAutoBoxAtDrag] = useState<CropBox | null>(null)
  type DragMode = 'none' | 'draw' | 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
  const [dragMode, setDragMode] = useState<DragMode>('none')
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [boxAtDrag, setBoxAtDrag] = useState<CropBox | null>(null)
  // ──────────────────────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    setResultUrl(null)
    setCropBox(null)
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setFilename(file.name)
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      setWidth(img.naturalWidth)
      setHeight(img.naturalHeight)
      setOrigWidth(img.naturalWidth)
      setOrigHeight(img.naturalHeight)
    }
    img.src = url
  }

  // ── Resize dimension helpers ───────────────────────────────────────────────
  const handleWidthChange = (val: number) => {
    setWidth(val)
    if (ratio) setHeight(Math.round(val / ratio))
    else if (mode === 'resize') setHeight(Math.round(val * (origHeight / origWidth)))
  }

  const handleHeightChange = (val: number) => {
    setHeight(val)
    if (ratio) setWidth(Math.round(val * ratio))
    else if (mode === 'resize') setWidth(Math.round(val * (origWidth / origHeight)))
  }

  const handleRatio = (r: number | null) => {
    setRatio(r)
    if (r !== null) {
      setHeight(Math.round(width / r))
      // Reset autocrop box so it re-centers with new ratio
      setAutoCropBox(null)
    }
  }
  // ── Detect which part of the crop box the cursor is on ────────────────────
  const HANDLE = 10 // px hit area for handles
  // ── Build a centered autocrop box in preview-element coordinates ──────────
  const buildAutoCropBox = useCallback((): CropBox | null => {
    const el = previewRef.current
    const img = imageRef.current
    if (!el || !img) return null

    const elW = el.clientWidth
    const elH = el.clientHeight
    const scale = Math.min(elW / img.naturalWidth, elH / img.naturalHeight)
    const rendW = img.naturalWidth * scale
    const rendH = img.naturalHeight * scale
    const offX = (elW - rendW) / 2
    const offY = (elH - rendH) / 2

    const dstRatio = width / height   // locked aspect ratio
    const srcRatio = rendW / rendH

    let bw = 0, bh = 0
    if (srcRatio > dstRatio) {
      bh = rendH
      bw = bh * dstRatio
    } else {
      bw = rendW
      bh = bw / dstRatio
    }

    return {
      x: offX + (rendW - bw) / 2,
      y: offY + (rendH - bh) / 2,
      w: bw,
      h: bh,
    }
  }, [width, height])
  const hitTest = (px: number, py: number, box: CropBox): DragMode => {
    const { x, y, w, h } = box
    const onLeft = Math.abs(px - x) < HANDLE
    const onRight = Math.abs(px - (x + w)) < HANDLE
    const onTop = Math.abs(py - y) < HANDLE
    const onBottom = Math.abs(py - (y + h)) < HANDLE
    const inX = px > x - HANDLE && px < x + w + HANDLE
    const inY = py > y - HANDLE && py < y + h + HANDLE

    if (onTop && onLeft) return 'nw'
    if (onTop && onRight) return 'ne'
    if (onBottom && onLeft) return 'sw'
    if (onBottom && onRight) return 'se'
    if (onTop && inX) return 'n'
    if (onBottom && inX) return 's'
    if (onLeft && inY) return 'w'
    if (onRight && inY) return 'e'
    // Inside box = move
    if (px > x && px < x + w && py > y && py < y + h) return 'move'
    return 'none'
  }


  // ── Convert preview element px → original image px ────────────────────────
  const previewToImage = (box: CropBox) => {
    const el = previewRef.current
    const img = imageRef.current
    if (!el || !img) return null

    // The img inside the div uses objectFit:contain — find rendered size
    const elW = el.clientWidth
    const elH = el.clientHeight        // may be taller than rendered img
    const imgW = img.naturalWidth
    const imgH = img.naturalHeight
    const scale = Math.min(elW / imgW, elH / imgH)
    const rendW = imgW * scale
    const rendH = imgH * scale
    // Offset if image is letterboxed inside the container
    const offX = (elW - rendW) / 2
    const offY = (elH - rendH) / 2

    const scaleX = imgW / rendW
    const scaleY = imgH / rendH

    const sx = Math.round((box.x - offX) * scaleX)
    const sy = Math.round((box.y - offY) * scaleY)
    const sw = Math.round(box.w * scaleX)
    const sh = Math.round(box.h * scaleY)

    return {
      x: Math.max(0, sx),
      y: Math.max(0, sy),
      w: Math.min(sw, imgW - Math.max(0, sx)),
      h: Math.min(sh, imgH - Math.max(0, sy)),
    }
  }

  // ── Mouse drag handlers ────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const getTouchPos = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const touch = e.touches[0]
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'manualcrop' && mode !== 'autocrop') return
    e.preventDefault()
    const { x, y } = getPos(e)

    // ── Autocrop: only allow moving the locked-ratio frame ──
    if (mode === 'autocrop') {
      const box = autoCropBox ?? buildAutoCropBox()
      if (!box) return
      setAutoCropBox(box)
      const hit = hitTest(x, y, box)
      if (hit !== 'none') {
        setDragMode(hit)
        setDragStart({ x, y })
        setAutoBoxAtDrag({ ...box })
      }
      return
    }

    if (cropBox) {
      const hit = hitTest(x, y, cropBox)
      if (hit !== 'none') {
        setDragMode(hit)
        setDragStart({ x, y })
        setBoxAtDrag({ ...cropBox })
        return
      }
    }
    // Start drawing a new box
    setDragMode('draw')
    setDragStart({ x, y })
    setCropBox({ x, y, w: 0, h: 0 })
    setBoxAtDrag(null)
  }

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'manualcrop'&& mode !== 'autocrop') return
    const { x, y } = getPos(e)

    // Update cursor based on hover position
    if (dragMode === 'none' && cropBox) {
      const hit = hitTest(x, y, cropBox)
      const cursors: Record<string, string> = {
        nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
        n: 'n-resize', s: 's-resize', w: 'w-resize', e: 'e-resize',
        move: 'move', none: 'crosshair',
      }
      e.currentTarget.style.cursor = cursors[hit] ?? 'crosshair'
    }

    if (dragMode === 'none') return
    const dx = x - dragStart.x
    const dy = y - dragStart.y

    // ── Autocrop: move or stretch the locked-ratio frame ──
    if (mode === 'autocrop' && autoBoxAtDrag) {
      const b = { ...autoBoxAtDrag }
      const ar = b.w / b.h   // preserve aspect ratio when stretching

      let { x: bx, y: by, w: bw, h: bh } = b

      if (dragMode === 'move') {
        setCropBox(null)
        setAutoCropBox({ ...b, x: bx + dx, y: by + dy })
        return
      }

      // Stretch but lock aspect ratio
      if (dragMode === 'se') { bw += dx; bh = bw / ar }
      if (dragMode === 'sw') { bx += dx; bw -= dx; bh = bw / ar }
      if (dragMode === 'ne') { bw += dx; bh = bw / ar; by = b.y + b.h - bh }
      if (dragMode === 'nw') { bx += dx; bw -= dx; bh = bw / ar; by = b.y + b.h - bh }
      if (dragMode === 's') { bh += dy; bw = bh * ar }
      if (dragMode === 'n') { by += dy; bh -= dy; bw = bh * ar }
      if (dragMode === 'e') { bw += dx; bh = bw / ar }
      if (dragMode === 'w') { bx += dx; bw -= dx; bh = bw / ar }

      if (bw < 20) bw = 20
      if (bh < 20) bh = 20

      setAutoCropBox({ x: bx, y: by, w: bw, h: bh })
      return
    }

    if (dragMode === 'draw') {
      setCropBox({
        x: Math.min(x, dragStart.x),
        y: Math.min(y, dragStart.y),
        w: Math.abs(dx),
        h: Math.abs(dy),
      })
      return
    }

    if (!boxAtDrag) return
    const b = { ...boxAtDrag }

    if (dragMode === 'move') {
      setCropBox({ ...b, x: b.x + dx, y: b.y + dy })
      return
    }

    // Stretch corners and edges
    let { x: bx, y: by, w: bw, h: bh } = b
    if (dragMode === 'nw') { bx += dx; by += dy; bw -= dx; bh -= dy }
    if (dragMode === 'ne') { by += dy; bw += dx; bh -= dy }
    if (dragMode === 'sw') { bx += dx; bw -= dx; bh += dy }
    if (dragMode === 'se') { bw += dx; bh += dy }
    if (dragMode === 'n') { by += dy; bh -= dy }
    if (dragMode === 's') { bh += dy }
    if (dragMode === 'w') { bx += dx; bw -= dx }
    if (dragMode === 'e') { bw += dx }

    // Prevent negative width/height (flip prevention)
    if (bw < 10) { if (dragMode.includes('w')) bx = b.x + b.w - 10; bw = 10 }
    if (bh < 10) { if (dragMode.includes('n')) by = b.y + b.h - 10; bh = 10 }

    setCropBox({ x: bx, y: by, w: bw, h: bh })
  }

  const onMouseUp = () => {
    setDragMode('none')
    setBoxAtDrag(null)
  }

  // ── Touch support (mobile) ─────────────────────────────────────────────────
  // ── Touch support ─────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (mode !== 'manualcrop') return
    const { x, y } = getTouchPos(e)

    if (cropBox) {
      const hit = hitTest(x, y, cropBox)
      if (hit !== 'none') {
        setDragMode(hit)
        setDragStart({ x, y })
        setBoxAtDrag({ ...cropBox })
        return
      }
    }
    setDragMode('draw')
    setDragStart({ x, y })
    setCropBox({ x, y, w: 0, h: 0 })
    setBoxAtDrag(null)
  }

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (mode !== 'manualcrop' || dragMode === 'none') return
    e.preventDefault()
    const { x, y } = getTouchPos(e)
    const dx = x - dragStart.x
    const dy = y - dragStart.y

    if (dragMode === 'draw') {
      setCropBox({
        x: Math.min(x, dragStart.x),
        y: Math.min(y, dragStart.y),
        w: Math.abs(dx),
        h: Math.abs(dy),
      })
      return
    }

    if (!boxAtDrag) return
    const b = { ...boxAtDrag }

    if (dragMode === 'move') {
      setCropBox({ ...b, x: b.x + dx, y: b.y + dy })
      return
    }

    let { x: bx, y: by, w: bw, h: bh } = b
    if (dragMode === 'nw') { bx += dx; by += dy; bw -= dx; bh -= dy }
    if (dragMode === 'ne') { by += dy; bw += dx; bh -= dy }
    if (dragMode === 'sw') { bx += dx; bw -= dx; bh += dy }
    if (dragMode === 'se') { bw += dx; bh += dy }
    if (dragMode === 'n') { by += dy; bh -= dy }
    if (dragMode === 's') { bh += dy }
    if (dragMode === 'w') { bx += dx; bw -= dx }
    if (dragMode === 'e') { bw += dx }

    if (bw < 10) bw = 10
    if (bh < 10) bh = 10

    setCropBox({ x: bx, y: by, w: bw, h: bh })
  }
  // ── Live preview render (draws scaled-down version into preview canvas) ────
  const renderPreview = useCallback(() => {
    const img = imageRef.current
    const canvas = previewCanvasRef.current
    if (!img || !canvas) return
    const ctx = canvas.getContext('2d')!

    // Max display size — keeps preview fast and responsive
    const MAX = 600
    let dispW = width
    let dispH = height

    if (mode === 'resize') {
      // Scale down proportionally to fit MAX
      const scale = Math.min(MAX / width, MAX / height, 1)
      dispW = Math.round(width * scale)
      dispH = Math.round(height * scale)
      canvas.width = dispW
      canvas.height = dispH
      ctx.clearRect(0, 0, dispW, dispH)
      ctx.drawImage(img, 0, 0, dispW, dispH)

    } else if (mode === 'autocrop') {
      // Draw the full image dimmed — the overlay frame shows the crop area
      const scale = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1)
      dispW = Math.round(img.naturalWidth * scale)
      dispH = Math.round(img.naturalHeight * scale)
      canvas.width = dispW
      canvas.height = dispH
      ctx.clearRect(0, 0, dispW, dispH)
      // Draw dimmed full image as background
      ctx.globalAlpha = 0.4
      ctx.drawImage(img, 0, 0, dispW, dispH)
      ctx.globalAlpha = 1
    }
  }, [width, height, mode])

  // Re-render preview whenever width, height, mode or image changes
  useEffect(() => {
    if (imageSrc && (mode === 'resize' || mode === 'autocrop')) {
      renderPreview()
    }
  }, [imageSrc, width, height, mode, renderPreview])

  // Initialize autocrop box when switching to autocrop or ratio changes
  useEffect(() => {
    if (mode === 'autocrop' && imageSrc) {
      setAutoCropBox((prev) => prev ?? buildAutoCropBox())
    }
    if (mode !== 'autocrop') {
      setAutoCropBox(null)
    }
  }, [mode, imageSrc, width, height, buildAutoCropBox])

  // ── Canvas processing ──────────────────────────────────────────────────────
  const process = useCallback(() => {
    const img = imageRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return
    const ctx = canvas.getContext('2d')!

    if (mode === 'resize') {
      // ── Plain resize ──
      canvas.width = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      setResultDims({ w: width, h: height })

    } else if (mode === 'manualcrop' && cropBox && cropBox.w > 4 && cropBox.h > 4) {
      // ── Manual drag crop ──
      const imgCoords = previewToImage(cropBox)
      if (!imgCoords) return
      const { x: sx, y: sy, w: sw, h: sh } = imgCoords
      canvas.width = sw
      canvas.height = sh
      ctx.clearRect(0, 0, sw, sh)
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
      setResultDims({ w: sw, h: sh })

    } else {
      // ── Autocrop: use user-positioned frame if available ──
      canvas.width = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)

      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight

      if (autoCropBox && previewRef.current) {
        // Convert autocrop box preview coords → image coords
        const el = previewRef.current
        const elW = el.clientWidth
        const elH = el.clientHeight
        const scale = Math.min(elW / img.naturalWidth, elH / img.naturalHeight)
        const rendW = img.naturalWidth * scale
        const rendH = img.naturalHeight * scale
        const offX = (elW - rendW) / 2
        const offY = (elH - rendH) / 2

        sx = Math.round((autoCropBox.x - offX) / scale)
        sy = Math.round((autoCropBox.y - offY) / scale)
        sw = Math.round(autoCropBox.w / scale)
        sh = Math.round(autoCropBox.h / scale)

        // Clamp to image bounds
        sx = Math.max(0, Math.min(sx, img.naturalWidth - sw))
        sy = Math.max(0, Math.min(sy, img.naturalHeight - sh))
        sw = Math.min(sw, img.naturalWidth - sx)
        sh = Math.min(sh, img.naturalHeight - sy)
      } else {
        // Fallback: center crop
        const srcRatio = img.naturalWidth / img.naturalHeight
        const dstRatio = width / height
        if (srcRatio > dstRatio) {
          sw = img.naturalHeight * dstRatio
          sx = (img.naturalWidth - sw) / 2
        } else {
          sh = img.naturalWidth / dstRatio
          sy = (img.naturalHeight - sh) / 2
        }
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
      setResultDims({ w: width, h: height })
    }

    canvas.toBlob(
      (blob) => { if (blob) setResultUrl(URL.createObjectURL(blob)) },
      'image/jpeg', 0.95
    )
  }, [width, height, mode, cropBox])

  // ── Computed label for the selection box ──────────────────────────────────
  const cropImageSize = cropBox && cropBox.w > 4 && cropBox.h > 4
    ? previewToImage(cropBox)
    : null

  return (
    <ToolLayout
      title="Crop & Resize Image"
      description="Resize to exact dimensions, auto-crop by ratio, or manually drag to select any crop area."
      icon="✂️"
    >
      <FileDropzone
        onFile={handleFile}
        accept="image/*"
        label="Drop your image here"
        sublabel="Supports all image formats"
        maxMB={100}
      />

      {imageSrc && (
        <div style={{ marginTop: 24 }}>

          {/* ── Image preview with drag-crop overlay ── */}
          <div
            ref={previewRef}
            className="result-panel"
            style={{
              marginBottom: 16,
              position: 'relative',
              cursor: mode === 'manualcrop' ? 'crosshair' : 'default',
              userSelect: 'none',
              padding: 0,
              overflow: 'hidden',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* Live preview canvas for resize + autocrop */}
            {/* Live preview canvas for resize + autocrop */}
            {(mode === 'resize' || mode === 'autocrop') ? (
              <div style={{ position: 'relative' }}>
                <canvas
                  ref={previewCanvasRef}
                  style={{ width: '100%', display: 'block', borderRadius: 8 }}
                />
                {/* floating label */}
                <div style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: 99,
                  padding: '2px 10px',
                  fontSize: 11,
                  color: '#a5b4fc',
                  fontFamily: 'var(--font-mono)',
                  pointerEvents: 'none',
                }}>
                  Live preview · {width} × {height} px
                </div>
                {/* Autocrop draggable frame overlay */}
                {mode === 'autocrop' && autoCropBox && (
                  <div style={{
                    position: 'absolute',
                    left: autoCropBox.x,
                    top: autoCropBox.y,
                    width: autoCropBox.w,
                    height: autoCropBox.h,
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                  }}>
                    {/* Bright crop window — cut through the dim */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      border: '2px solid #6366f1',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                      boxSizing: 'border-box',
                      borderRadius: 1,
                    }} />

                    {/* Rule-of-thirds grid lines */}
                    {[33, 66].map((pct) => (
                      <div key={`v${pct}`} style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: `${pct}%`,
                        width: 1,
                        background: 'rgba(255,255,255,0.25)',
                        pointerEvents: 'none',
                      }} />
                    ))}
                    {[33, 66].map((pct) => (
                      <div key={`h${pct}`} style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${pct}%`,
                        height: 1,
                        background: 'rgba(255,255,255,0.25)',
                        pointerEvents: 'none',
                      }} />
                    ))}

                    {/* Corner handles */}
                    {[
                      { top: -5, left: -5, cursor: 'nw-resize' },
                      { top: -5, right: -5, cursor: 'ne-resize' },
                      { bottom: -5, left: -5, cursor: 'sw-resize' },
                      { bottom: -5, right: -5, cursor: 'se-resize' },
                    ].map((s, i) => (
                      <div key={i} style={{
                        position: 'absolute',
                        width: 12,
                        height: 12,
                        background: '#6366f1',
                        border: '2px solid #fff',
                        borderRadius: 2,
                        top: s.top, left: s.left,
                        right: s.right, bottom: s.bottom,
                      }} />
                    ))}

                    {/* Edge handles */}
                    {[
                      { top: '50%', left: -5, transform: 'translateY(-50%)' },
                      { top: '50%', right: -5, transform: 'translateY(-50%)' },
                      { left: '50%', top: -5, transform: 'translateX(-50%)' },
                      { left: '50%', bottom: -5, transform: 'translateX(-50%)' },
                    ].map((s, i) => (
                      <div key={`e${i}`} style={{
                        position: 'absolute',
                        width: 10,
                        height: 10,
                        background: '#818cf8',
                        border: '2px solid #fff',
                        borderRadius: 99,
                        top: s.top, left: s.left,
                        right: s.right, bottom: s.bottom,
                        transform: s.transform,
                      }} />
                    ))}

                    {/* Size label */}
                    <div style={{
                      position: 'absolute',
                      bottom: -24,
                      left: 0,
                      fontSize: 11,
                      color: '#a5b4fc',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      background: 'rgba(0,0,0,0.5)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}>
                      {width} × {height} px
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Manual crop still shows the original image for drag selection */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt="Original"
                draggable={false}
                style={{
                  width: '100%',
                  maxHeight: 350,
                  objectFit: 'contain',
                  borderRadius: 8,
                  display: 'block',
                }}
              />
            )}

            {/* Blue selection box shown during manual crop */}
            {mode === 'manualcrop' && cropBox && cropBox.w > 4 && cropBox.h > 4 && (
              <div
                style={{
                  position: 'absolute',
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.w,
                  height: cropBox.h,
                  border: '2px solid #6366f1',
                  background: 'rgba(99,102,241,0.15)',
                  pointerEvents: 'none',
                  boxSizing: 'border-box',
                  borderRadius: 2,
                }}
              >
                {/* Corner handles */}
                {/* Corner handles — larger for easier grabbing */}
                {[
                  { top: -5, left: -5, cursor: 'nw-resize' },
                  { top: -5, right: -5, cursor: 'ne-resize' },
                  { bottom: -5, left: -5, cursor: 'sw-resize' },
                  { bottom: -5, right: -5, cursor: 'se-resize' },
                ].map((s, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    width: 12,
                    height: 12,
                    background: '#6366f1',
                    border: '2px solid #fff',
                    borderRadius: 2,
                    cursor: s.cursor,
                    pointerEvents: 'all',
                    top: s.top,
                    left: s.left,
                    right: s.right,
                    bottom: s.bottom,
                  }} />
                ))}

                {/* Edge handles — midpoints of each side */}
                {[
                  { top: '50%', left: -5, transform: 'translateY(-50%)', cursor: 'w-resize' },
                  { top: '50%', right: -5, transform: 'translateY(-50%)', cursor: 'e-resize' },
                  { left: '50%', top: -5, transform: 'translateX(-50%)', cursor: 'n-resize' },
                  { left: '50%', bottom: -5, transform: 'translateX(-50%)', cursor: 's-resize' },
                ].map((s, i) => (
                  <div key={`edge-${i}`} style={{
                    position: 'absolute',
                    width: 10,
                    height: 10,
                    background: '#818cf8',
                    border: '2px solid #fff',
                    borderRadius: 99,
                    cursor: s.cursor,
                    pointerEvents: 'all',
                    top: s.top,
                    left: s.left,
                    right: s.right,
                    bottom: s.bottom,
                    transform: s.transform,
                  }} />
                ))}

                {/* Dimension label inside selection */}
                {cropImageSize && (
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    background: 'rgba(99,102,241,0.85)',
                    color: '#fff',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>
                    {cropImageSize.w} × {cropImageSize.h} px
                  </div>
                )}
              </div>
            )}

            {/* Dark overlay outside selection */}
            {mode === 'manualcrop' && !cropBox && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.25)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
              }}>
                <p style={{
                  color: '#e0e7ff',
                  fontSize: 14,
                  fontWeight: 500,
                  background: 'rgba(0,0,0,0.5)',
                  padding: '8px 16px',
                  borderRadius: 8,
                }}>
                  🖱 Click and drag to select crop area
                </p>
              </div>
            )}
          </div>

          {/* ── Mode selector ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => { setMode('resize'); setCropBox(null) }}
              className={mode === 'resize' ? 'btn-primary' : 'btn-ghost'}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              ↔ Resize
            </button>
            <button
              onClick={() => { setMode('autocrop'); setCropBox(null) }}
              className={mode === 'autocrop' ? 'btn-primary' : 'btn-ghost'}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              ✂ Auto crop
            </button>
            <button
              onClick={() => { setMode('manualcrop'); setCropBox(null) }}
              className={mode === 'manualcrop' ? 'btn-primary' : 'btn-ghost'}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              🖱 Manual crop
            </button>
          </div>

          {/* ── Manual crop info + clear ── */}
          {mode === 'manualcrop' && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 8,
              fontSize: 13,
              color: '#a5b4fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <span>
                {cropBox && cropBox.w > 4
                  ? `✓ Selection: ${cropImageSize?.w ?? '—'} × ${cropImageSize?.h ?? '—'} px — click Apply to crop`
                  : 'Click and drag on the image above to select your crop area'}
              </span>
              {cropBox && (
                <button
                  onClick={() => setCropBox(null)}
                  className="btn-ghost"
                  style={{ padding: '3px 10px', fontSize: 12, flexShrink: 0 }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* ── Ratio presets (auto crop mode only) ── */}
          {mode === 'autocrop' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {RATIOS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => handleRatio(r.value)}
                  className={ratio === r.value ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '6px 14px', fontSize: 13 }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Dimensions (resize + autocrop) ── */}
          {mode !== 'manualcrop' && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={width}
                    min={1}
                    max={8000}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <span style={{ color: 'var(--text-3)', marginTop: 20 }}>×</span>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={height}
                    min={1}
                    max={8000}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
                Original: {origWidth} × {origHeight} px
              </p>
            </>
          )}

          {/* ── Apply button ── */}
          <button
            onClick={process}
            disabled={mode === 'manualcrop' && (!cropBox || cropBox.w < 5 || cropBox.h < 5)}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {mode === 'resize' ? '↔ Apply resize'
              : mode === 'manualcrop' ? '✂ Apply manual crop'
                : '✂ Apply auto crop'}
          </button>

          {/* ── Result ── */}
          {/* ── Result ── */}
          {resultUrl && resultDims && (
            <>
              {/* Only show result image for manual crop — resize/autocrop already show live preview */}
              {mode === 'manualcrop' && (
                <div className="result-panel" style={{ marginTop: 20 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
                    Result: {resultDims.w} × {resultDims.h} px
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resultUrl}
                    alt="Result"
                    style={{ width: '100%', maxHeight: 350, objectFit: 'contain', borderRadius: 8 }}
                  />
                </div>
              )}
              <DownloadButton
                url={resultUrl}
                filename={`${mode}_${filename}`}
                label="Download Image"
              />
            </>
          )}
        </div>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </ToolLayout>
  )
}
