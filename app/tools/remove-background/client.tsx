'use client'
import { useState, useRef, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'

// Background replacement options
type BgMode = 'transparent' | 'color' | 'image'

// Solid color presets
const COLOR_PRESETS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
  { label: 'Light grey', value: '#f3f4f6' },
  { label: 'Dark grey', value: '#374151' },
  { label: 'Light blue', value: '#dbeafe' },
  { label: 'Navy', value: '#1e3a5f' },
  { label: 'Cream', value: '#fef9ef' },
  { label: 'Blush pink', value: '#fce7f3' },
  { label: 'Mint', value: '#d1fae5' },
  { label: 'Lavender', value: '#ede9fe' },
]

export default function RemoveBackgroundClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgImgRef = useRef<HTMLImageElement | null>(null)

  // Manual background image transform — user-adjustable
  const [bgScale, setBgScale] = useState(1)     // 1 = cover-fit, >1 = zoomed in
  const [bgOffsetX, setBgOffsetX] = useState(0)   // px shift from center
  const [bgOffsetY, setBgOffsetY] = useState(0)   // px shift from center
  const [bgDragging, setBgDragging] = useState(false)
  const [bgDragStart, setBgDragStart] = useState({ x: 0, y: 0 })
  const bgDragStartOffsetRef = useRef({ x: 0, y: 0 })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [bgBackdropColor, setBgBackdropColor] = useState('#ffffff')

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [filename, setFilename] = useState('image.png')
  const [removing, setRemoving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [fgBlob, setFgBlob] = useState<Blob | null>(null)   // transparent PNG from AI
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [bgMode, setBgMode] = useState<BgMode>('transparent')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [bgImageSrc, setBgImageSrc] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState(0)

  // ── Step 1: Run AI background removal ─────────────────────────────────────
  const removeBackground = async (file: File) => {
    setRemoving(true)
    setProgress(0)
    setResultUrl(null)
    setFgBlob(null)
    setErrorMsg(null)
    setOriginalSize(file.size)
    setImageSrc(URL.createObjectURL(file))
    setFilename(file.name.replace(/\.[^.]+$/, '') + '.png')

    try {
      setStatusMsg('Loading AI model (first time ~5s)...')
      setProgress(10)

      // Dynamic import so it only loads when needed
      const { removeBackground: removeBg } = await import('@imgly/background-removal')

      setStatusMsg('Analysing image...')
      setProgress(30)

      const resultBlob = await removeBg(file, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 60) + 30
            setProgress(Math.min(pct, 90))
          }
        },
      })

      setProgress(95)
      setStatusMsg('Compositing...')
      setFgBlob(resultBlob)

      // Apply current bg mode
      await applyBackground(resultBlob, bgMode, bgColor, bgImageSrc)
      setProgress(100)
      setStatusMsg('Done!')
    } catch (err) {
      console.error('Background removal error:', err)
      const message = err instanceof Error ? err.message : String(err)

      if (message.includes('fetch') || message.includes('NetworkError')) {
        setStatusMsg('Could not download the AI model. Check your internet connection and try again.')
      } else if (message.includes('memory') || message.includes('Memory')) {
        setStatusMsg(' Image too large for this device. Try a smaller image.')
      } else {
        setStatusMsg(' Background removal failed. Please try a different image.')
      }
    } finally {
      setRemoving(false)
    }
  }

  // ── Step 2: Composite foreground onto chosen background ───────────────────
  const applyBackground = useCallback(async (
    fg: Blob | null,
    mode: BgMode,
    color: string,
    bgSrc: string | null,
    scale: number = bgScale,
    offX: number = bgOffsetX,
    offY: number = bgOffsetY,
    backdropColor: string = bgBackdropColor,
  ) => {
    if (!fg || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    // Load foreground (transparent PNG)
    const fgUrl = URL.createObjectURL(fg)
    const fgImg = await loadImage(fgUrl)
    canvas.width = fgImg.naturalWidth
    canvas.height = fgImg.naturalHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (mode === 'transparent') {
      // Just draw the fg — no background
      ctx.drawImage(fgImg, 0, 0)
    } else if (mode === 'color') {
      // Fill solid color, then draw fg on top
      ctx.fillStyle = color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(fgImg, 0, 0)
    } else if (mode === 'image' && bgSrc) {
      // Fill backdrop color first — shows through wherever the bg image doesn't cover
      ctx.fillStyle = backdropColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const bgImg = bgImgRef.current
      if (bgImg) {
        // CONTAIN-fit as the base (whole image visible, not cropped) — scale shrinks/grows from there
        const baseScale = Math.min(
          canvas.width / bgImg.naturalWidth,
          canvas.height / bgImg.naturalHeight,
        )
        const finalScale = baseScale * scale
        const bw = bgImg.naturalWidth * finalScale
        const bh = bgImg.naturalHeight * finalScale
        const bx = (canvas.width - bw) / 2 + offX
        const by = (canvas.height - bh) / 2 + offY
        ctx.drawImage(bgImg, bx, by, bw, bh)
      }
      ctx.drawImage(fgImg, 0, 0)
    }

    URL.revokeObjectURL(fgUrl)

    // Export result
    const mime = mode === 'transparent' ? 'image/png' : 'image/jpeg'
    canvas.toBlob(
      (blob) => { if (blob) setResultUrl(URL.createObjectURL(blob)) },
      mime, 0.95,
    )
  }, [])

  // Re-apply whenever bg settings change and we already have a foreground
  const reApply = useCallback(async (
    mode: BgMode,
    color: string,
    bgSrc: string | null,
    scale?: number,
    offX?: number,
    offY?: number,
    backdropColor?: string,
  ) => {
    if (!fgBlob) return
    await applyBackground(fgBlob, mode, color, bgSrc, scale, offX, offY, backdropColor)
  }, [fgBlob, applyBackground])

  const handleBgModeChange = (m: BgMode) => {
    setBgMode(m)
    reApply(m, bgColor, bgImageSrc)
  }

  const handleColorChange = (c: string) => {
    setBgColor(c)
    if (bgMode === 'color') reApply('color', c, bgImageSrc)
  }

  const handleBgImage = async (file: File) => {
    const url = URL.createObjectURL(file)
    setBgImageSrc(url)
    setBgScale(1); setBgOffsetX(0); setBgOffsetY(0)
    setBgBackdropColor('#ffffff')   // default backdrop — user can change after
    const img = new Image()
    img.onload = () => {
      bgImgRef.current = img
      setBgMode('image')
      reApply('image', bgColor, url, 1, 0, 0, '#ffffff')
    }
    img.src = url
  }

  const handleBackdropColor = (c: string) => {
    setBgBackdropColor(c)
    reApply('image', bgColor, bgImageSrc, bgScale, bgOffsetX, bgOffsetY, c)
  }

  // ── Zoom slider ──
  const handleBgScale = (s: number) => {
    setBgScale(s)
    reApply('image', bgColor, bgImageSrc, s, bgOffsetX, bgOffsetY)
  }

  // ── Drag-to-reposition on the canvas itself ──
  const handleBgPointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (bgMode !== 'image') return
    setBgDragging(true)
    setBgDragStart({ x: e.clientX - bgOffsetX, y: e.clientY - bgOffsetY })
  }

  const handleBgPointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!bgDragging || bgMode !== 'image') return
    const newX = e.clientX - bgDragStart.x
    const newY = e.clientY - bgDragStart.y
    setBgOffsetX(newX)
    setBgOffsetY(newY)
    reApply('image', bgColor, bgImageSrc, bgScale, newX, newY)
  }

  const handleBgPointerUp = () => setBgDragging(false)

  const resetBgTransform = () => {
    setBgScale(1); setBgOffsetX(0); setBgOffsetY(0)
    reApply('image', bgColor, bgImageSrc, 1, 0, 0)
  }

  const downloadExt = bgMode === 'transparent' ? 'png' : 'jpg'
  const downloadFilename = filename.replace(/\.[^.]+$/, '') + `_nobg.${downloadExt}`

  return (
    <ToolLayout
      title="Background Remover"
      description="Remove image backgrounds automatically using AI. Export as transparent PNG or replace with a solid color or custom image."
      icon="✂️"
    >
      {/* ── Split pane ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: imageSrc ? '1fr 360px' : '1fr',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* ── LEFT: Preview ── */}
        <div style={{ position: 'sticky', top: 72 }}>
          {!imageSrc ? (
            <FileDropzone
              onFile={removeBackground}
              accept="image/jpeg,image/png,image/webp"
              label="Drop your image here"
              sublabel="JPG, PNG or WebP — processed in browser"
              maxMB={20}
            />
          ) : (
            <div style={{
              background: 'repeating-conic-gradient(#1e1e26 0% 25%, #26262f 0% 50%) 0 0 / 16px 16px',
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              position: 'relative',
              minHeight: 200,
            }}>
              {/* Result canvas */}
              {/* Result canvas */}
              <canvas
                ref={canvasRef}
                onMouseDown={handleBgPointerDown}
                onMouseMove={handleBgPointerMove}
                onMouseUp={handleBgPointerUp}
                onMouseLeave={handleBgPointerUp}
                style={{
                  width: '100%',
                  display: 'block',
                  cursor: bgMode === 'image' ? (bgDragging ? 'grabbing' : 'grab') : 'default',
                }}
              />
              {/* Error Message */}
              {errorMsg && (
                <div style={{
                  marginTop: 12, padding: '10px 14px',
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: 8, fontSize: 13, color: '#fca5a5',
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Progress overlay while processing */}
              {removing && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(12,12,16,0.85)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    border: '3px solid var(--bg4)',
                    borderTop: '3px solid var(--brand)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{statusMsg}</p>
                  <div style={{ width: 200 }}>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Change image button */}
              <label style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: 12,
                color: '#e0e7ff',
                cursor: 'pointer',
              }}>
                🔄 New image
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) removeBackground(f); e.target.value = '' }} />
              </label>
            </div>
          )}

          {/* Download */}
          {resultUrl && !removing && (
            <div style={{ marginTop: 12 }}>
              <DownloadButton
                url={resultUrl}
                filename={downloadFilename}
                label={`Download ${bgMode === 'transparent' ? 'PNG' : 'JPG'}`}
                originalSize={originalSize}
                compressedSize={0}
              />
            </div>
          )}
        </div>

        {/* ── RIGHT: Controls ── */}
        {imageSrc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Background mode */}
            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                Background replacement
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  { id: 'transparent', icon: '⬜', label: 'Transparent PNG', sub: 'No background — exports as PNG' },
                  { id: 'color', icon: '🎨', label: 'Solid color', sub: 'Fill with any color' },
                  { id: 'image', icon: '🖼', label: 'Custom image', sub: 'Use your own background photo' },
                ] as { id: BgMode; icon: string; label: string; sub: string }[]).map((opt) => (
                  <label key={opt.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: bgMode === opt.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                    border: `1px solid ${bgMode === opt.id ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="bgmode" value={opt.id}
                      checked={bgMode === opt.id}
                      onChange={() => handleBgModeChange(opt.id)}
                      style={{ accentColor: 'var(--brand)' }} />
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{opt.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Solid color picker */}
            {bgMode === 'color' && (
              <div className="card" style={{ padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Color</p>
                {/* Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => handleColorChange(c.value)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: c.value,
                        border: bgColor === c.value
                          ? '2px solid var(--brand)'
                          : '2px solid var(--border)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
                {/* Custom color */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={bgColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    style={{ width: 40, height: 36, padding: 2, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                  <input type="text" value={bgColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13 }} />
                </div>
              </div>
            )}

            {/* Custom background image */}
            {bgMode === 'image' && (
              <div className="card" style={{ padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
                  Background image
                </p>
                {bgImageSrc ? (
                  <>
                    <div style={{ position: 'relative', marginBottom: 14 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bgImageSrc} alt="Background"
                        style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />
                      <label style={{
                        position: 'absolute',
                        bottom: 6,
                        right: 6,
                        background: 'rgba(0,0,0,0.6)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        color: '#fff',
                        cursor: 'pointer',
                      }}>
                        Change
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBgImage(f); e.target.value = '' }} />
                      </label>
                    </div>

                    {/* Zoom slider */}
                    {/* Size slider — 1 = whole image visible (contain), can shrink much smaller */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                        Size: {Math.round(bgScale * 100)}%
                      </label>
                      <input type="range" min={0.1} max={3} step={0.05} value={bgScale}
                        onChange={(e) => handleBgScale(Number(e.target.value))}
                        style={{ width: '100%' }} />
                      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                        Shrink it down for a logo-style placement — the area around it fills with the backdrop color below.
                      </p>
                    </div>

                    {/* Backdrop color — fills space around the background image */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                        Backdrop color
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {COLOR_PRESETS.map((c) => (
                          <button
                            key={c.value}
                            title={c.label}
                            onClick={() => handleBackdropColor(c.value)}
                            style={{
                              width: 24, height: 24, borderRadius: 5,
                              background: c.value,
                              border: bgBackdropColor === c.value ? '2px solid var(--brand)' : '2px solid var(--border)',
                              cursor: 'pointer', flexShrink: 0,
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="color" value={bgBackdropColor}
                          onChange={(e) => handleBackdropColor(e.target.value)}
                          style={{ width: 36, height: 32, padding: 2, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer' }} />
                        <input type="text" value={bgBackdropColor}
                          onChange={(e) => handleBackdropColor(e.target.value)}
                          style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                      </div>
                    </div>

                    {/* Drag hint + reset */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontSize: 11, color: 'var(--text-3)',
                    }}>
                      <span>🖱 Drag the image on the canvas to reposition</span>
                      <button onClick={resetBgTransform} className="btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }}>
                        Reset
                      </button>
                    </div>
                  </>
                ) : (
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '20px',
                    border: '1.5px dashed var(--border)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 14,
                    color: 'var(--text-2)',
                    transition: 'border-color 0.2s',
                  }}>
                    + Upload background image
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBgImage(f); e.target.value = '' }} />
                  </label>
                )}
              </div>
            )}

            {/* Tips */}
            <div className="card" style={{ padding: 14, background: 'rgba(99,102,241,0.04)' }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#a5b4fc', marginBottom: 8 }}>
                💡 Tips for best results
              </p>
              {[
                'Works best on people, products, and animals',
                'High contrast between subject and background helps',
                'First run downloads the AI model (~5MB, cached after)',
                'Transparent PNG is best for logos and stickers',
              ].map((tip) => (
                <p key={tip} style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4, paddingLeft: 8 }}>
                  • {tip}
                </p>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Responsive */}
      <style>{`
        @media (max-width: 700px) {
          div[style*="1fr 360px"] { grid-template-columns: 1fr !important; }
          div[style*="sticky"]    { position: relative !important; top: 0 !important; }
        }
      `}</style>
    </ToolLayout>
  )
}

// ── Utility: load an image from URL ───────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
