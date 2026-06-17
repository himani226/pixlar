'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'

const RATIOS = [
  { label: 'Free',  value: null   },
  { label: '1:1',   value: 1      },
  { label: '4:3',   value: 4 / 3  },
  { label: '16:9',  value: 16 / 9 },
  { label: '3:4',   value: 3 / 4  },
  { label: '9:16',  value: 9 / 16 },
]

interface CropBox { x: number; y: number; w: number; h: number }

// All possible drag interactions
type DragMode =
  | 'none' | 'draw' | 'move'
  | 'nw' | 'ne' | 'sw' | 'se'
  | 'n'  | 's'  | 'e'  | 'w'

export default function CropResizeClient() {
  const canvasRef        = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef         = useRef<HTMLImageElement | null>(null)
  const previewRef       = useRef<HTMLDivElement>(null)

  // ── Image ─────────────────────────────────────────────────────────────────
  const [imageSrc,   setImageSrc]   = useState<string | null>(null)
  const [filename,   setFilename]   = useState('image.jpg')
  const [resultUrl,  setResultUrl]  = useState<string | null>(null)
  const [resultDims, setResultDims] = useState<{ w: number; h: number } | null>(null)

  // ── Resize / dimensions ───────────────────────────────────────────────────
  const [width,      setWidth]      = useState(0)
  const [height,     setHeight]     = useState(0)
  const [origWidth,  setOrigWidth]  = useState(0)
  const [origHeight, setOrigHeight] = useState(0)
  const [ratio,      setRatio]      = useState<number | null>(null)

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'resize' | 'autocrop' | 'manualcrop'>('resize')

  // ── Manual crop state ─────────────────────────────────────────────────────
  const [cropBox,   setCropBox]   = useState<CropBox | null>(null)
  const [dragMode,  setDragMode]  = useState<DragMode>('none')
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [boxAtDrag, setBoxAtDrag] = useState<CropBox | null>(null)

  // ── Autocrop draggable frame state ────────────────────────────────────────
  const [autoCropBox,  setAutoCropBox]  = useState<CropBox | null>(null)
  const [autoBoxAtDrag, setAutoBoxAtDrag] = useState<CropBox | null>(null)

  // ── Load file ─────────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    setResultUrl(null)
    setCropBox(null)
    setAutoCropBox(null)
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

  // ── Dimension helpers ─────────────────────────────────────────────────────
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
      setAutoCropBox(null)   // reset so it re-centers
    }
  }

  // ── Preview px → image px ─────────────────────────────────────────────────
  const previewToImage = useCallback((box: CropBox) => {
    const el  = previewRef.current
    const img = imageRef.current
    if (!el || !img) return null
    const elW   = el.clientWidth
    const elH   = el.clientHeight
    const scale = Math.min(elW / img.naturalWidth, elH / img.naturalHeight)
    const rendW = img.naturalWidth  * scale
    const rendH = img.naturalHeight * scale
    const offX  = (elW - rendW) / 2
    const offY  = (elH - rendH) / 2
    const sx    = Math.round((box.x - offX) * (img.naturalWidth  / rendW))
    const sy    = Math.round((box.y - offY) * (img.naturalHeight / rendH))
    const sw    = Math.round(box.w * (img.naturalWidth  / rendW))
    const sh    = Math.round(box.h * (img.naturalHeight / rendH))
    return {
      x: Math.max(0, sx),
      y: Math.max(0, sy),
      w: Math.min(sw, img.naturalWidth  - Math.max(0, sx)),
      h: Math.min(sh, img.naturalHeight - Math.max(0, sy)),
    }
  }, [])

  // ── Build centered autocrop frame in preview coords ───────────────────────
  const buildAutoCropBox = useCallback((): CropBox | null => {
    const el  = previewRef.current
    const img = imageRef.current
    if (!el || !img || height === 0) return null
    const elW   = el.clientWidth
    const elH   = el.clientHeight
    const scale = Math.min(elW / img.naturalWidth, elH / img.naturalHeight)
    const rendW = img.naturalWidth  * scale
    const rendH = img.naturalHeight * scale
    const offX  = (elW - rendW) / 2
    const offY  = (elH - rendH) / 2
    const dstR  = width / height
    const srcR  = rendW / rendH
    let bw = 0, bh = 0
    if (srcR > dstR) { bh = rendH; bw = bh * dstR }
    else             { bw = rendW; bh = bw / dstR  }
    return { x: offX + (rendW - bw) / 2, y: offY + (rendH - bh) / 2, w: bw, h: bh }
  }, [width, height])

  // ── Hit-test for handles ──────────────────────────────────────────────────
  const HANDLE = 12
  const hitTest = useCallback((px: number, py: number, box: CropBox): DragMode => {
    const { x, y, w, h } = box
    const onL = Math.abs(px - x)       < HANDLE
    const onR = Math.abs(px - (x + w)) < HANDLE
    const onT = Math.abs(py - y)       < HANDLE
    const onB = Math.abs(py - (y + h)) < HANDLE
    const inX = px > x - HANDLE && px < x + w + HANDLE
    const inY = py > y - HANDLE && py < y + h + HANDLE
    if (onT && onL) return 'nw'
    if (onT && onR) return 'ne'
    if (onB && onL) return 'sw'
    if (onB && onR) return 'se'
    if (onT && inX) return 'n'
    if (onB && inX) return 's'
    if (onL && inY) return 'w'
    if (onR && inY) return 'e'
    if (px > x && px < x + w && py > y && py < y + h) return 'move'
    return 'none'
  }, [])

  // ── Live preview canvas for resize + autocrop ────────────────────────────
  const renderPreview = useCallback(() => {
    const img    = imageRef.current
    const canvas = previewCanvasRef.current
    if (!img || !canvas) return
    const ctx = canvas.getContext('2d')!
    const MAX = 700

    if (mode === 'resize') {
      const scale = Math.min(MAX / width, MAX / height, 1)
      const dw = Math.max(1, Math.round(width  * scale))
      const dh = Math.max(1, Math.round(height * scale))
      canvas.width = dw; canvas.height = dh
      ctx.clearRect(0, 0, dw, dh)
      ctx.drawImage(img, 0, 0, dw, dh)
    } else if (mode === 'autocrop') {
      // Draw full image dimmed — overlay shows the crop frame
      const scale = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1)
      const dw = Math.max(1, Math.round(img.naturalWidth  * scale))
      const dh = Math.max(1, Math.round(img.naturalHeight * scale))
      canvas.width = dw; canvas.height = dh
      ctx.clearRect(0, 0, dw, dh)
      ctx.globalAlpha = 0.4
      ctx.drawImage(img, 0, 0, dw, dh)
      ctx.globalAlpha = 1
    }
  }, [mode, width, height])

  useEffect(() => {
    if (imageSrc && (mode === 'resize' || mode === 'autocrop')) renderPreview()
  }, [imageSrc, width, height, mode, renderPreview])

  // Initialize autocrop frame when mode or dimensions change
  useEffect(() => {
    if (mode === 'autocrop' && imageSrc) {
      // Small delay so DOM has rendered and we can measure el size
      const t = setTimeout(() => {
        setAutoCropBox((prev) => prev ?? buildAutoCropBox())
      }, 50)
      return () => clearTimeout(t)
    }
    if (mode !== 'autocrop') setAutoCropBox(null)
  }, [mode, imageSrc, width, height, buildAutoCropBox])

  // ── Pointer helpers ───────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const getTouchPos = (e: React.TouchEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
  }

  // ── Stretch helper (shared by mouse + touch) ──────────────────────────────
  const applyStretch = (dm: DragMode, b: CropBox, dx: number, dy: number, lockAR?: number): CropBox => {
    let { x: bx, y: by, w: bw, h: bh } = b
    if (dm === 'move') return { x: bx + dx, y: by + dy, w: bw, h: bh }
    if (dm === 'nw') { bx += dx; by += dy; bw -= dx; bh -= dy }
    if (dm === 'ne') {           by += dy; bw += dx; bh -= dy }
    if (dm === 'sw') { bx += dx;           bw -= dx; bh += dy }
    if (dm === 'se') {                     bw += dx; bh += dy }
    if (dm === 'n')  {           by += dy;           bh -= dy }
    if (dm === 's')  {                               bh += dy }
    if (dm === 'w')  { bx += dx;           bw -= dx           }
    if (dm === 'e')  {                     bw += dx           }
    // Lock aspect ratio for autocrop
    if (lockAR) {
      if (['se','ne','e'].includes(dm))        { bh = bw / lockAR }
      if (['sw','nw','w'].includes(dm))        { bh = bw / lockAR }
      if (['n','s'].includes(dm))              { bw = bh * lockAR }
      if (dm === 'ne' || dm === 'nw')          { by = b.y + b.h - bh }
    }
    if (bw < 10) { if (['nw','sw','w'].includes(dm)) bx = b.x + b.w - 10; bw = 10 }
    if (bh < 10) { if (['nw','ne','n'].includes(dm)) by = b.y + b.h - 10; bh = 10 }
    return { x: bx, y: by, w: bw, h: bh }
  }

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'manualcrop' && mode !== 'autocrop') return
    e.preventDefault()
    const { x, y } = getPos(e)

    if (mode === 'autocrop') {
      const box = autoCropBox ?? buildAutoCropBox()
      if (!box) return
      setAutoCropBox(box)
      const hit = hitTest(x, y, box)
      if (hit !== 'none') { setDragMode(hit); setDragStart({ x, y }); setAutoBoxAtDrag({ ...box }) }
      return
    }

    // manualcrop
    if (cropBox) {
      const hit = hitTest(x, y, cropBox)
      if (hit !== 'none') { setDragMode(hit); setDragStart({ x, y }); setBoxAtDrag({ ...cropBox }); return }
    }
    setDragMode('draw'); setDragStart({ x, y }); setCropBox({ x, y, w: 0, h: 0 }); setBoxAtDrag(null)
  }

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'manualcrop' && mode !== 'autocrop') return
    const { x, y } = getPos(e)

    // Update cursor on hover
    const hoverBox = mode === 'autocrop' ? autoCropBox : cropBox
    if (dragMode === 'none' && hoverBox) {
      const cursors: Record<string, string> = {
        nw:'nw-resize', ne:'ne-resize', sw:'sw-resize', se:'se-resize',
        n:'n-resize', s:'s-resize', w:'w-resize', e:'e-resize',
        move:'move', none:'crosshair',
      }
      e.currentTarget.style.cursor = cursors[hitTest(x, y, hoverBox)] ?? 'crosshair'
    }

    if (dragMode === 'none') return
    const dx = x - dragStart.x
    const dy = y - dragStart.y

    if (mode === 'autocrop' && autoBoxAtDrag) {
      const ar = autoBoxAtDrag.w / autoBoxAtDrag.h
      setAutoCropBox(applyStretch(dragMode, autoBoxAtDrag, dx, dy, ar))
      return
    }

    if (dragMode === 'draw') {
      setCropBox({ x: Math.min(x, dragStart.x), y: Math.min(y, dragStart.y), w: Math.abs(dx), h: Math.abs(dy) })
      return
    }
    if (boxAtDrag) setCropBox(applyStretch(dragMode, boxAtDrag, dx, dy))
  }

  const onMouseUp = () => { setDragMode('none'); setBoxAtDrag(null); setAutoBoxAtDrag(null) }

  // ── Touch handlers ────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (mode !== 'manualcrop' && mode !== 'autocrop') return
    const { x, y } = getTouchPos(e)

    if (mode === 'autocrop') {
      const box = autoCropBox ?? buildAutoCropBox()
      if (!box) return
      setAutoCropBox(box)
      const hit = hitTest(x, y, box)
      if (hit !== 'none') { setDragMode(hit); setDragStart({ x, y }); setAutoBoxAtDrag({ ...box }) }
      return
    }

    if (cropBox) {
      const hit = hitTest(x, y, cropBox)
      if (hit !== 'none') { setDragMode(hit); setDragStart({ x, y }); setBoxAtDrag({ ...cropBox }); return }
    }
    setDragMode('draw'); setDragStart({ x, y }); setCropBox({ x, y, w: 0, h: 0 }); setBoxAtDrag(null)
  }

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((mode !== 'manualcrop' && mode !== 'autocrop') || dragMode === 'none') return
    e.preventDefault()
    const { x, y } = getTouchPos(e)
    const dx = x - dragStart.x; const dy = y - dragStart.y

    if (mode === 'autocrop' && autoBoxAtDrag) {
      const ar = autoBoxAtDrag.w / autoBoxAtDrag.h
      setAutoCropBox(applyStretch(dragMode, autoBoxAtDrag, dx, dy, ar)); return
    }

    if (dragMode === 'draw') {
      setCropBox({ x: Math.min(x, dragStart.x), y: Math.min(y, dragStart.y), w: Math.abs(dx), h: Math.abs(dy) }); return
    }
    if (boxAtDrag) setCropBox(applyStretch(dragMode, boxAtDrag, dx, dy))
  }

  // ── Canvas export ─────────────────────────────────────────────────────────
  const process = useCallback(() => {
    const img    = imageRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return
    const ctx = canvas.getContext('2d')!

    if (mode === 'resize') {
      canvas.width = width; canvas.height = height
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      setResultDims({ w: width, h: height })

    } else if (mode === 'manualcrop' && cropBox && cropBox.w > 4 && cropBox.h > 4) {
      const c = previewToImage(cropBox)
      if (!c) return
      canvas.width = c.w; canvas.height = c.h
      ctx.clearRect(0, 0, c.w, c.h)
      ctx.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
      setResultDims({ w: c.w, h: c.h })

    } else {
      // autocrop — use user-positioned frame if available, else center
      canvas.width = width; canvas.height = height
      ctx.clearRect(0, 0, width, height)
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight

      if (autoCropBox && previewRef.current) {
        const c = previewToImage(autoCropBox)
        if (c) { sx = c.x; sy = c.y; sw = c.w; sh = c.h }
      } else {
        const sr = img.naturalWidth / img.naturalHeight
        const dr = width / height
        if (sr > dr) { sw = img.naturalHeight * dr; sx = (img.naturalWidth - sw) / 2 }
        else         { sh = img.naturalWidth  / dr; sy = (img.naturalHeight - sh) / 2 }
      }
      sx = Math.max(0, Math.min(sx, img.naturalWidth  - sw))
      sy = Math.max(0, Math.min(sy, img.naturalHeight - sh))
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
      setResultDims({ w: width, h: height })
    }

    canvas.toBlob((blob) => { if (blob) setResultUrl(URL.createObjectURL(blob)) }, 'image/jpeg', 0.95)
  }, [width, height, mode, cropBox, autoCropBox, previewToImage])

  // ── Computed pixel dimensions for labels ─────────────────────────────────
  const cropImageSize  = cropBox && cropBox.w > 4 && cropBox.h > 4 ? previewToImage(cropBox) : null
  const autoImageSize  = autoCropBox ? previewToImage(autoCropBox) : null

  return (
    <ToolLayout
      title="Crop & Resize Image"
      description="Resize to exact dimensions, auto-crop by ratio with a draggable frame, or manually drag to select any crop area."
      icon="✂️"
    >
      <FileDropzone onFile={handleFile} accept="image/*" label="Drop your image here" sublabel="Supports all image formats" maxMB={100} />

      {imageSrc && (
        <div style={{ marginTop: 24 }}>

          {/* ── Preview area ── */}
          <div
            ref={previewRef}
            className="result-panel"
            style={{
              marginBottom:  16,
              position:     'relative',
              cursor:        mode === 'manualcrop' ? 'crosshair' : mode === 'autocrop' ? 'default' : 'default',
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
            {/* Resize + autocrop: live canvas preview */}
            {(mode === 'resize' || mode === 'autocrop') && (
              <div style={{ position: 'relative' }}>
                <canvas ref={previewCanvasRef} style={{ width: '100%', display: 'block', borderRadius: 8 }} />

                {/* Live label */}
                <div style={{
                  position:'absolute', top:8, left:8,
                  background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)',
                  borderRadius:99, padding:'2px 10px', fontSize:11,
                  color:'#a5b4fc', fontFamily:'var(--font-mono)', pointerEvents:'none',
                }}>
                  {mode === 'resize' ? `Live preview · ${width} × ${height} px` : `Drag to reposition · ${width} × ${height} px`}
                </div>

                {/* Autocrop draggable frame */}
                {mode === 'autocrop' && autoCropBox && (() => {
                  // Scale autocrop box from previewRef coords to previewCanvas coords
                  const el = previewRef.current
                  const pc = previewCanvasRef.current
                  if (!el || !pc) return null
                  const scaleX = pc.offsetWidth  / el.clientWidth
                  const scaleY = pc.offsetHeight / el.clientHeight
                  const fb = {
                    x: autoCropBox.x * scaleX,
                    y: autoCropBox.y * scaleY,
                    w: autoCropBox.w * scaleX,
                    h: autoCropBox.h * scaleY,
                  }
                  return (
                    <div style={{
                      position:'absolute', left:fb.x, top:fb.y, width:fb.w, height:fb.h,
                      pointerEvents:'none', boxSizing:'border-box',
                    }}>
                      {/* Vignette outside frame */}
                      <div style={{
                        position:'absolute', inset:0,
                        border:'2px solid #6366f1',
                        boxShadow:'0 0 0 9999px rgba(0,0,0,0.45)',
                        boxSizing:'border-box', borderRadius:1,
                      }} />
                      {/* Rule-of-thirds lines */}
                      {[33,66].map(p => <div key={`v${p}`} style={{ position:'absolute', top:0, bottom:0, left:`${p}%`, width:1, background:'rgba(255,255,255,0.25)' }} />)}
                      {[33,66].map(p => <div key={`h${p}`} style={{ position:'absolute', left:0, right:0, top:`${p}%`, height:1, background:'rgba(255,255,255,0.25)' }} />)}
                      {/* Corner handles */}
                      {[{top:-5,left:-5},{top:-5,right:-5},{bottom:-5,left:-5},{bottom:-5,right:-5}].map((s,i) => (
                        <div key={i} style={{ position:'absolute', width:12, height:12, background:'#6366f1', border:'2px solid #fff', borderRadius:2, ...s }} />
                      ))}
                      {/* Edge handles */}
                      {[
                        {top:'50%',left:-5,transform:'translateY(-50%)'},
                        {top:'50%',right:-5,transform:'translateY(-50%)'},
                        {left:'50%',top:-5,transform:'translateX(-50%)'},
                        {left:'50%',bottom:-5,transform:'translateX(-50%)'},
                      ].map((s,i) => (
                        <div key={`e${i}`} style={{ position:'absolute', width:10, height:10, background:'#818cf8', border:'2px solid #fff', borderRadius:99, ...s }} />
                      ))}
                      {/* Dimension label */}
                      {autoImageSize && (
                        <div style={{
                          position:'absolute', bottom:-24, left:0,
                          fontSize:11, color:'#a5b4fc', fontFamily:'var(--font-mono)',
                          whiteSpace:'nowrap', background:'rgba(0,0,0,0.5)', padding:'2px 6px', borderRadius:4,
                        }}>
                          {autoImageSize.w} × {autoImageSize.h} px
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Manual crop: original image with drag overlay */}
            {mode === 'manualcrop' && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc} alt="Original" draggable={false}
                  style={{ width:'100%', maxHeight:350, objectFit:'contain', borderRadius:8, display:'block' }} />

                {/* Blue selection box */}
                {cropBox && cropBox.w > 4 && cropBox.h > 4 && (
                  <div style={{
                    position:'absolute', left:cropBox.x, top:cropBox.y, width:cropBox.w, height:cropBox.h,
                    border:'2px solid #6366f1', background:'rgba(99,102,241,0.15)',
                    pointerEvents:'none', boxSizing:'border-box', borderRadius:2,
                  }}>
                    {/* Corner handles */}
                    {[{top:-5,left:-5},{top:-5,right:-5},{bottom:-5,left:-5},{bottom:-5,right:-5}].map((s,i) => (
                      <div key={i} style={{ position:'absolute', width:12, height:12, background:'#6366f1', border:'2px solid #fff', borderRadius:2, ...s }} />
                    ))}
                    {/* Edge handles */}
                    {[
                      {top:'50%',left:-5,transform:'translateY(-50%)'},
                      {top:'50%',right:-5,transform:'translateY(-50%)'},
                      {left:'50%',top:-5,transform:'translateX(-50%)'},
                      {left:'50%',bottom:-5,transform:'translateX(-50%)'},
                    ].map((s,i) => (
                      <div key={`e${i}`} style={{ position:'absolute', width:10, height:10, background:'#818cf8', border:'2px solid #fff', borderRadius:99, ...s }} />
                    ))}
                    {/* Pixel label */}
                    {cropImageSize && (
                      <div style={{
                        position:'absolute', top:4, left:4,
                        background:'rgba(99,102,241,0.85)', color:'#fff',
                        fontSize:11, fontFamily:'var(--font-mono)',
                        padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap', pointerEvents:'none',
                      }}>
                        {cropImageSize.w} × {cropImageSize.h} px
                      </div>
                    )}
                  </div>
                )}

                {/* Hint overlay when no selection */}
                {!cropBox && (
                  <div style={{
                    position:'absolute', inset:0, background:'rgba(0,0,0,0.25)',
                    pointerEvents:'none', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8,
                  }}>
                    <p style={{ color:'#e0e7ff', fontSize:14, fontWeight:500, background:'rgba(0,0,0,0.5)', padding:'8px 16px', borderRadius:8 }}>
                      🖱 Click and drag to select crop area
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Mode buttons ── */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <button onClick={() => { setMode('resize'); setCropBox(null); setAutoCropBox(null) }}
              className={mode === 'resize' ? 'btn-primary' : 'btn-ghost'} style={{ flex:1, justifyContent:'center' }}>
              ↔ Resize
            </button>
            <button onClick={() => { setMode('autocrop'); setCropBox(null) }}
              className={mode === 'autocrop' ? 'btn-primary' : 'btn-ghost'} style={{ flex:1, justifyContent:'center' }}>
              ✂ Auto crop
            </button>
            <button onClick={() => { setMode('manualcrop'); setAutoCropBox(null) }}
              className={mode === 'manualcrop' ? 'btn-primary' : 'btn-ghost'} style={{ flex:1, justifyContent:'center' }}>
              🖱 Manual crop
            </button>
          </div>

          {/* Manual crop info */}
          {mode === 'manualcrop' && (
            <div style={{
              marginBottom:16, padding:'10px 14px',
              background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)',
              borderRadius:8, fontSize:13, color:'#a5b4fc',
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
            }}>
              <span>
                {cropBox && cropBox.w > 4
                  ? `✓ ${cropImageSize?.w ?? '—'} × ${cropImageSize?.h ?? '—'} px — drag handles to resize, click Apply`
                  : 'Click and drag on the image to select a crop area'}
              </span>
              {cropBox && (
                <button onClick={() => setCropBox(null)} className="btn-ghost"
                  style={{ padding:'3px 10px', fontSize:12, flexShrink:0 }}>Clear</button>
              )}
            </div>
          )}

          {/* Autocrop info */}
          {mode === 'autocrop' && (
            <div style={{
              marginBottom:16, padding:'10px 14px',
              background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)',
              borderRadius:8, fontSize:13, color:'#a5b4fc',
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
            }}>
              <span>Drag the frame to reposition · drag handles to resize (ratio locked) · click Apply to crop</span>
              {autoCropBox && (
                <button onClick={() => setAutoCropBox(null)} className="btn-ghost"
                  style={{ padding:'3px 10px', fontSize:12, flexShrink:0 }}>Reset</button>
              )}
            </div>
          )}

          {/* Ratio presets (autocrop only) */}
          {mode === 'autocrop' && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
              {RATIOS.map((r) => (
                <button key={r.label} onClick={() => handleRatio(r.value)}
                  className={ratio === r.value ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding:'6px 14px', fontSize:13 }}>
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* Dimensions (resize + autocrop) */}
          {mode !== 'manualcrop' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:13, color:'var(--text-2)', display:'block', marginBottom:6 }}>Width (px)</label>
                  <input type="number" value={width} min={1} max={8000}
                    onChange={(e) => handleWidthChange(Number(e.target.value))} style={{ width:'100%' }} />
                </div>
                <span style={{ color:'var(--text-3)', marginTop:20 }}>×</span>
                <div>
                  <label style={{ fontSize:13, color:'var(--text-2)', display:'block', marginBottom:6 }}>Height (px)</label>
                  <input type="number" value={height} min={1} max={8000}
                    onChange={(e) => handleHeightChange(Number(e.target.value))} style={{ width:'100%' }} />
                </div>
              </div>
              <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:16 }}>
                Original: {origWidth} × {origHeight} px
              </p>
            </>
          )}

          {/* Apply */}
          <button onClick={process}
            disabled={mode === 'manualcrop' && (!cropBox || cropBox.w < 5 || cropBox.h < 5)}
            className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
            {mode === 'resize' ? '↔ Apply resize' : mode === 'manualcrop' ? '✂ Apply manual crop' : '✂ Apply auto crop'}
          </button>

          {/* Result */}
          {resultUrl && resultDims && (
            <>
              {mode === 'manualcrop' && (
                <div className="result-panel" style={{ marginTop:20 }}>
                  <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:8 }}>
                    Result: {resultDims.w} × {resultDims.h} px
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="Result"
                    style={{ width:'100%', maxHeight:350, objectFit:'contain', borderRadius:8 }} />
                </div>
              )}
              <DownloadButton url={resultUrl} filename={`${mode}_${filename}`} label="Download Image" />
            </>
          )}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display:'none' }} />
    </ToolLayout>
  )
}
