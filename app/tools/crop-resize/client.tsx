'use client'
import { useRef, useState, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'

const RATIOS = [
  { label: 'Free',  value: null      },
  { label: '1:1',   value: 1         },
  { label: '4:3',   value: 4 / 3     },
  { label: '16:9',  value: 16 / 9    },
  { label: '3:4',   value: 3 / 4     },
  { label: '9:16',  value: 9 / 16    },
]

interface CropBox { x: number; y: number; w: number; h: number }

export default function CropResizeClient() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const imageRef   = useRef<HTMLImageElement | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // ── Image state ────────────────────────────────────────────────────────────
  const [imageSrc,   setImageSrc]   = useState<string | null>(null)
  const [filename,   setFilename]   = useState('image.jpg')
  const [resultUrl,  setResultUrl]  = useState<string | null>(null)
  const [resultDims, setResultDims] = useState<{ w: number; h: number } | null>(null)

  // ── Resize state ───────────────────────────────────────────────────────────
  const [width,      setWidth]      = useState(0)
  const [height,     setHeight]     = useState(0)
  const [origWidth,  setOrigWidth]  = useState(0)
  const [origHeight, setOrigHeight] = useState(0)
  const [ratio,      setRatio]      = useState<number | null>(null)

  // ── Mode: 'resize' | 'autocrop' | 'manualcrop' ────────────────────────────
  const [mode, setMode] = useState<'resize' | 'autocrop' | 'manualcrop'>('resize')

  // ── Manual crop drag state ─────────────────────────────────────────────────
  const [cropBox,   setCropBox]   = useState<CropBox | null>(null)
  const [dragging,  setDragging]  = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

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
    if (r !== null) setHeight(Math.round(width / r))
  }

  // ── Convert preview element px → original image px ────────────────────────
  const previewToImage = (box: CropBox) => {
    const el  = previewRef.current
    const img = imageRef.current
    if (!el || !img) return null

    // The img inside the div uses objectFit:contain — find rendered size
    const elW   = el.clientWidth
    const elH   = el.clientHeight        // may be taller than rendered img
    const imgW  = img.naturalWidth
    const imgH  = img.naturalHeight
    const scale = Math.min(elW / imgW, elH / imgH)
    const rendW = imgW * scale
    const rendH = imgH * scale
    // Offset if image is letterboxed inside the container
    const offX  = (elW - rendW) / 2
    const offY  = (elH - rendH) / 2

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
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'manualcrop') return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDragStart({ x, y })
    setCropBox({ x, y, w: 0, h: 0 })
    setDragging(true)
  }

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || mode !== 'manualcrop') return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCropBox({
      x: Math.min(x, dragStart.x),
      y: Math.min(y, dragStart.y),
      w: Math.abs(x - dragStart.x),
      h: Math.abs(y - dragStart.y),
    })
  }

  const onMouseUp = () => setDragging(false)

  // ── Touch support (mobile) ─────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (mode !== 'manualcrop') return
    const rect  = e.currentTarget.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    setDragStart({ x, y })
    setCropBox({ x, y, w: 0, h: 0 })
    setDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragging || mode !== 'manualcrop') return
    e.preventDefault()
    const rect  = e.currentTarget.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    setCropBox({
      x: Math.min(x, dragStart.x),
      y: Math.min(y, dragStart.y),
      w: Math.abs(x - dragStart.x),
      h: Math.abs(y - dragStart.y),
    })
  }

  // ── Canvas processing ──────────────────────────────────────────────────────
  const process = useCallback(() => {
    const img    = imageRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return
    const ctx = canvas.getContext('2d')!

    if (mode === 'resize') {
      // ── Plain resize ──
      canvas.width  = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      setResultDims({ w: width, h: height })

    } else if (mode === 'manualcrop' && cropBox && cropBox.w > 4 && cropBox.h > 4) {
      // ── Manual drag crop ──
      const imgCoords = previewToImage(cropBox)
      if (!imgCoords) return
      const { x: sx, y: sy, w: sw, h: sh } = imgCoords
      canvas.width  = sw
      canvas.height = sh
      ctx.clearRect(0, 0, sw, sh)
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
      setResultDims({ w: sw, h: sh })

    } else {
      // ── Auto center-crop by ratio / dimensions ──
      canvas.width  = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)
      const srcRatio = img.naturalWidth / img.naturalHeight
      const dstRatio = width / height
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
      if (srcRatio > dstRatio) {
        sw = img.naturalHeight * dstRatio
        sx = (img.naturalWidth - sw) / 2
      } else {
        sh = img.naturalWidth / dstRatio
        sy = (img.naturalHeight - sh) / 2
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
              position:     'relative',
              cursor:        mode === 'manualcrop' ? 'crosshair' : 'default',
              userSelect:   'none',
              padding:       0,
              overflow:     'hidden',
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
            <img
              src={imageSrc}
              alt="Original"
              draggable={false}
              style={{
                width:      '100%',
                maxHeight:   350,
                objectFit:  'contain',
                borderRadius: 8,
                display:    'block',
              }}
            />

            {/* Blue selection box shown during manual crop */}
            {mode === 'manualcrop' && cropBox && cropBox.w > 4 && cropBox.h > 4 && (
              <div
                style={{
                  position:     'absolute',
                  left:          cropBox.x,
                  top:           cropBox.y,
                  width:         cropBox.w,
                  height:        cropBox.h,
                  border:       '2px solid #6366f1',
                  background:   'rgba(99,102,241,0.15)',
                  pointerEvents: 'none',
                  boxSizing:    'border-box',
                  borderRadius:  2,
                }}
              >
                {/* Corner handles */}
                {[
                  { top: -3,  left: -3  },
                  { top: -3,  right: -3 },
                  { bottom: -3, left: -3 },
                  { bottom: -3, right: -3 },
                ].map((style, i) => (
                  <div key={i} style={{
                    position:  'absolute',
                    width:      8,
                    height:     8,
                    background: '#6366f1',
                    borderRadius: 1,
                    ...style,
                  }} />
                ))}

                {/* Dimension label inside selection */}
                {cropImageSize && (
                  <div style={{
                    position:    'absolute',
                    top:          4,
                    left:         4,
                    background:  'rgba(99,102,241,0.85)',
                    color:       '#fff',
                    fontSize:     11,
                    fontFamily:  'var(--font-mono)',
                    padding:     '2px 6px',
                    borderRadius: 4,
                    whiteSpace:  'nowrap',
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
                position:     'absolute',
                inset:         0,
                background:   'rgba(0,0,0,0.25)',
                pointerEvents: 'none',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                borderRadius:  8,
              }}>
                <p style={{
                  color:       '#e0e7ff',
                  fontSize:     14,
                  fontWeight:   500,
                  background:  'rgba(0,0,0,0.5)',
                  padding:     '8px 16px',
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
              marginBottom:    16,
              padding:        '10px 14px',
              background:     'rgba(99,102,241,0.08)',
              border:         '1px solid rgba(99,102,241,0.25)',
              borderRadius:    8,
              fontSize:        13,
              color:          '#a5b4fc',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              gap:             12,
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
                display:      'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems:   'center',
                gap:           12,
                marginBottom:  12,
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
            {mode === 'resize'     ? '↔ Apply resize'
           : mode === 'manualcrop' ? '✂ Apply manual crop'
           :                         '✂ Apply auto crop'}
          </button>

          {/* ── Result ── */}
          {resultUrl && resultDims && (
            <>
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
