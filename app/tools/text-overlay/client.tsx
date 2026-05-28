'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'

// ─── CUSTOMIZATION ────────────────────────────────────────────────────────────
const FONTS = [
  'Arial', 'Georgia', 'Times New Roman', 'Courier New',
  'Impact', 'Verdana', 'Trebuchet MS', 'Palatino', 'Garamond', 'Book Antiqua',
]

const PRESETS = [
  { label: 'None',             textColor: '#ffffff', bgColor: '#000000', bgOpacity: 0,  bold: false, italic: false, shadow: true,  fontSize: 48, font: 'Arial'           },
  { label: 'Medical label',    textColor: '#ffffff', bgColor: '#064e3b', bgOpacity: 85, bold: true,  italic: false, shadow: false, fontSize: 36, font: 'Arial'           },
  { label: 'ID / Badge',       textColor: '#1e1b4b', bgColor: '#ffffff', bgOpacity: 90, bold: true,  italic: false, shadow: false, fontSize: 40, font: 'Verdana'         },
  { label: 'Certificate',      textColor: '#fbbf24', bgColor: '#1e1b4b', bgOpacity: 75, bold: true,  italic: true,  shadow: true,  fontSize: 52, font: 'Georgia'         },
  { label: 'Watermark',        textColor: '#ffffff', bgColor: '#000000', bgOpacity: 0,  bold: false, italic: true,  shadow: true,  fontSize: 32, font: 'Arial'           },
  { label: 'Warning / Alert',  textColor: '#ffffff', bgColor: '#b91c1c', bgOpacity: 90, bold: true,  italic: false, shadow: false, fontSize: 40, font: 'Impact'          },
  { label: 'Prescription',     textColor: '#1e3a5f', bgColor: '#dbeafe', bgOpacity: 90, bold: false, italic: false, shadow: false, fontSize: 34, font: 'Courier New'     },
  { label: 'Stamp / Official', textColor: '#dc2626', bgColor: '#000000', bgOpacity: 0,  bold: true,  italic: false, shadow: false, fontSize: 44, font: 'Times New Roman'  },
]

const POSITIONS = [
  { label: 'Top left',      x: 'left',   y: 'top'    },
  { label: 'Top center',    x: 'center', y: 'top'    },
  { label: 'Top right',     x: 'right',  y: 'top'    },
  { label: 'Center',        x: 'center', y: 'center' },
  { label: 'Bottom left',   x: 'left',   y: 'bottom' },
  { label: 'Bottom center', x: 'center', y: 'bottom' },
  { label: 'Bottom right',  x: 'right',  y: 'bottom' },
]

interface TextBlock { id: number; text: string }

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)]
}

let nextId = 1

export default function TextOverlayClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef    = useRef<HTMLImageElement | null>(null)

  const [imageSrc,  setImageSrc]  = useState<string | null>(null)
  const [filename,  setFilename]  = useState('image.jpg')
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  // ── Text blocks ────────────────────────────────────────────────────────────
  const [blocks, setBlocks] = useState<TextBlock[]>([{ id: nextId++, text: 'Your text here' }])

  // ── Typography ────────────────────────────────────────────────────────────
  const [font,      setFont]      = useState('Arial')
  const [fontSize,  setFontSize]  = useState(48)
  const [lineGap,   setLineGap]   = useState(16)
  const [textColor, setTextColor] = useState('#ffffff')
  const [opacity,   setOpacity]   = useState(100)
  const [bold,      setBold]      = useState(false)
  const [italic,    setItalic]    = useState(false)
  const [shadow,    setShadow]    = useState(true)

  // ── Background box ─────────────────────────────────────────────────────────
  const [bgEnabled, setBgEnabled] = useState(false)
  const [bgColor,   setBgColor]   = useState('#000000')
  const [bgOpacity, setBgOpacity] = useState(60)
  const [bgPadding, setBgPadding] = useState(20)
  const [bgWidth,   setBgWidth]   = useState(0)   // 0 = auto
  const [bgHeight,  setBgHeight]  = useState(0)   // 0 = auto

  // ── Position ───────────────────────────────────────────────────────────────
  const [position, setPosition] = useState(POSITIONS[5])

  // ── Canvas render ──────────────────────────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const img    = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return

    canvas.width  = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    const fontStr  = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px ${font}`
    ctx.font       = fontStr
    const lines: string[] = blocks.flatMap((b) => b.text === '' ? [''] : b.text.split('\n'))
    const lineH    = fontSize + lineGap
    const totalH   = lines.length * lineH - lineGap
    const maxLineW = Math.max(...lines.map((l) => ctx.measureText(l).width))

    const pad = fontSize * 0.8
    let anchorX = 0, anchorY = 0
    if      (position.x === 'left')   anchorX = pad
    else if (position.x === 'center') anchorX = canvas.width / 2
    else                               anchorX = canvas.width - pad
    if      (position.y === 'top')    anchorY = pad
    else if (position.y === 'center') anchorY = (canvas.height - totalH) / 2
    else                               anchorY = canvas.height - pad - totalH

    // Background box
    if (bgEnabled && bgOpacity > 0) {
      const [br, bg, bb] = hexToRgb(bgColor)
      const boxW = bgWidth  > 0 ? bgWidth  : maxLineW + bgPadding * 2
      const boxH = bgHeight > 0 ? bgHeight : totalH   + bgPadding * 2
      let boxX = 0
      if      (position.x === 'left')   boxX = anchorX - bgPadding
      else if (position.x === 'center') boxX = anchorX - boxW / 2
      else                               boxX = anchorX - boxW + bgPadding
      const boxY = anchorY - bgPadding
      const r = Math.min(12, boxH / 4)
      ctx.save()
      ctx.globalAlpha = bgOpacity / 100
      ctx.fillStyle   = `rgb(${br},${bg},${bb})`
      ctx.beginPath()
      ctx.moveTo(boxX + r, boxY)
      ctx.lineTo(boxX + boxW - r, boxY)
      ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r)
      ctx.lineTo(boxX + boxW, boxY + boxH - r)
      ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH)
      ctx.lineTo(boxX + r, boxY + boxH)
      ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r)
      ctx.lineTo(boxX, boxY + r)
      ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    // Text
    ctx.font        = fontStr
    ctx.globalAlpha = opacity / 100
    const [tr, tg, tb] = hexToRgb(textColor)
    ctx.fillStyle   = `rgb(${tr},${tg},${tb})`
    if (shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = fontSize / 4
      ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2
    }
    if      (position.x === 'left')   ctx.textAlign = 'left'
    else if (position.x === 'center') ctx.textAlign = 'center'
    else                               ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    lines.forEach((line, i) => ctx.fillText(line, anchorX, anchorY + i * lineH))
    ctx.globalAlpha = 1; ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0
  }, [blocks, font, fontSize, lineGap, textColor, opacity, bold, italic, shadow,
      bgEnabled, bgColor, bgOpacity, bgPadding, bgWidth, bgHeight, position])

  useEffect(() => { if (imageSrc) renderCanvas() }, [imageSrc, renderCanvas])

  const handleFile = (file: File) => {
    setResultUrl(null)
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setFilename(file.name)
    const img = new Image()
    img.onload = () => { imgRef.current = img; renderCanvas() }
    img.src = url
  }

  const apply = () => {
    renderCanvas()
    canvasRef.current?.toBlob(
      (blob) => { if (blob) setResultUrl(URL.createObjectURL(blob)) },
      'image/jpeg', 0.95
    )
  }

  const applyPreset = (p: typeof PRESETS[0]) => {
    setTextColor(p.textColor); setBgColor(p.bgColor); setBgOpacity(p.bgOpacity)
    setBgEnabled(p.bgOpacity > 0); setBold(p.bold); setItalic(p.italic)
    setShadow(p.shadow); setFontSize(p.fontSize); setFont(p.font)
  }

  const addBlock    = () => setBlocks((prev) => [...prev, { id: nextId++, text: '' }])
  const removeBlock = (id: number) => setBlocks((prev) => prev.filter((b) => b.id !== id))
  const updateBlock = (id: number, text: string) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)))

  return (
    <ToolLayout
      title="Text Overlay"
      description="Add multi-line text, captions, watermarks, or labels to images with a customisable background box."
      icon="✏️"
    >
      {/* ── SPLIT PANE LAYOUT ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        // Left = preview (sticky), right = scrollable controls
        gridTemplateColumns: imageSrc ? '1fr 380px' : '1fr',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* ── LEFT: Image / Canvas preview ── */}
        <div style={{ position: 'sticky', top: 72 }}>
          {!imageSrc ? (
            /* Dropzone shown before file selected */
            <FileDropzone
              onFile={handleFile}
              accept="image/*"
              label="Drop your image here"
              sublabel="Supports all image formats"
              maxMB={100}
            />
          ) : (
            /* Canvas replaces the image in-place once file loaded */
            <div style={{
              background:   'var(--bg2)',
              border:       '1px solid var(--border)',
              borderRadius:  16,
              overflow:     'hidden',
              position:     'relative',
            }}>
              {/* Live canvas — redraws on every control change */}
              <canvas
                ref={canvasRef}
                style={{ width: '100%', display: 'block' }}
              />

              {/* Floating badge top-left */}
              <div style={{
                position:     'absolute',
                top:           10,
                left:          10,
                background:   'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                borderRadius:  99,
                padding:      '3px 10px',
                fontSize:      11,
                color:        '#a5b4fc',
                fontFamily:   'var(--font-mono)',
                pointerEvents: 'none',
              }}>
                Live preview
              </div>

              {/* Change image button bottom-right */}
              <label style={{
                position:   'absolute',
                bottom:      10,
                right:       10,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                border:     '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding:    '5px 12px',
                fontSize:    12,
                color:      '#e0e7ff',
                cursor:     'pointer',
              }}>
                🔄 Change image
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          )}

          {/* Download button lives under the preview */}
          {resultUrl && (
            <div style={{ marginTop: 12 }}>
              <DownloadButton url={resultUrl} filename={`text_${filename}`} label="Download Image" />
            </div>
          )}
        </div>

        {/* ── RIGHT: Controls panel (only shown after image loaded) ── */}
        {imageSrc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Presets */}
            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Quick presets</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRESETS.map((p) => (
                  <button key={p.label} onClick={() => applyPreset(p)}
                    className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text lines */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 500 }}>Text lines</p>
                <button onClick={addBlock} className="btn-ghost" style={{ padding: '3px 10px', fontSize: 12 }}>
                  + Add line
                </button>
              </div>
              {blocks.map((block, idx) => (
                <div key={block.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 16, fontFamily: 'var(--font-mono)' }}>
                    {idx + 1}
                  </span>
                  <input type="text" value={block.text}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder={`Line ${idx + 1}...`}
                    style={{ flex: 1, fontSize: 14 }} />
                  {blocks.length > 1 && (
                    <button onClick={() => removeBlock(block.id)} className="btn-ghost"
                      style={{ padding: '3px 8px', fontSize: 13, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', flexShrink: 0 }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                Each input = one new line on the image.
              </p>
            </div>

            {/* Font + Size + Gap */}
            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Typography</p>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Font</label>
                <select value={font} onChange={(e) => setFont(e.target.value)} style={{ width: '100%' }}>
                  {FONTS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                  Size: {fontSize}px
                </label>
                <input type="range" min={10} max={200} step={2} value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                  Line gap: {lineGap}px
                </label>
                <input type="range" min={0} max={60} step={2} value={lineGap}
                  onChange={(e) => setLineGap(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              {/* Colour + Opacity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Colour</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                      style={{ width: 36, height: 32, padding: 2, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer' }} />
                    <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                      style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                    Opacity: {opacity}%
                  </label>
                  <input type="range" min={10} max={100} value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                </div>
              </div>
              {/* Bold / Italic / Shadow */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { label: 'Bold',   value: bold,   set: setBold   },
                  { label: 'Italic', value: italic, set: setItalic },
                  { label: 'Shadow', value: shadow, set: setShadow },
                ].map((btn) => (
                  <button key={btn.label} onClick={() => btn.set(!btn.value)}
                    className={btn.value ? 'btn-primary' : 'btn-ghost'}
                    style={{ flex: 1, justifyContent: 'center', padding: '5px 0', fontSize: 13 }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background box */}
            <div className="card" style={{
              padding: 16,
              background:  bgEnabled ? 'rgba(99,102,241,0.04)' : undefined,
              borderColor: bgEnabled ? 'rgba(99,102,241,0.25)' : undefined,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: bgEnabled ? 14 : 0 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>Background box</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    Coloured box behind text
                  </p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{
                    width: 36, height: 20, borderRadius: 99,
                    background: bgEnabled ? 'var(--brand)' : 'var(--bg4)',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 2, left: bgEnabled ? 18 : 2,
                      width: 16, height: 16, borderRadius: 99, background: '#fff',
                      transition: 'left 0.2s',
                    }} />
                  </div>
                  <input type="checkbox" checked={bgEnabled}
                    onChange={(e) => setBgEnabled(e.target.checked)} style={{ display: 'none' }} />
                </label>
              </div>

              {bgEnabled && (
                <>
                  {/* Colour + Opacity + Padding */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>BG colour</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                        style={{ width: 36, height: 32, padding: 2, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer' }} />
                      <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                        style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                        Opacity: {bgOpacity}%
                      </label>
                      <input type="range" min={5} max={100} value={bgOpacity}
                        onChange={(e) => setBgOpacity(Number(e.target.value))} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                        Padding: {bgPadding}px
                      </label>
                      <input type="range" min={0} max={80} step={2} value={bgPadding}
                        onChange={(e) => setBgPadding(Number(e.target.value))} style={{ width: '100%' }} />
                    </div>
                  </div>

                  {/* Manual width + height */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
                      Manual size <span style={{ color: 'var(--text-3)' }}>(0 = auto-fit to text)</span>
                    </p>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                        Width: {bgWidth === 0 ? 'Auto' : `${bgWidth}px`}
                      </label>
                      <input type="range" min={0} max={4000} step={10} value={bgWidth}
                        onChange={(e) => setBgWidth(Number(e.target.value))} style={{ width: '100%' }} />
                      <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                        <input type="number" value={bgWidth} min={0} max={4000}
                          onChange={(e) => setBgWidth(Number(e.target.value))}
                          style={{ width: 80, fontSize: 13 }} />
                        {bgWidth > 0 && (
                          <button onClick={() => setBgWidth(0)} className="btn-ghost"
                            style={{ padding: '3px 10px', fontSize: 12 }}>Auto</button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                        Height: {bgHeight === 0 ? 'Auto' : `${bgHeight}px`}
                      </label>
                      <input type="range" min={0} max={2000} step={4} value={bgHeight}
                        onChange={(e) => setBgHeight(Number(e.target.value))} style={{ width: '100%' }} />
                      <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                        <input type="number" value={bgHeight} min={0} max={2000}
                          onChange={(e) => setBgHeight(Number(e.target.value))}
                          style={{ width: 80, fontSize: 13 }} />
                        {bgHeight > 0 && (
                          <button onClick={() => setBgHeight(0)} className="btn-ghost"
                            style={{ padding: '3px 10px', fontSize: 12 }}>Auto</button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Position */}
            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Position</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                {POSITIONS.slice(0, 3).map((p) => (
                  <button key={p.label} onClick={() => setPosition(p)}
                    className={position.label === p.label ? 'btn-primary' : 'btn-ghost'}
                    style={{ padding: '5px 4px', fontSize: 11 }}>{p.label}</button>
                ))}
                <div />
                <button onClick={() => setPosition(POSITIONS[3])}
                  className={position.label === 'Center' ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '5px 4px', fontSize: 11 }}>Center</button>
                <div />
                {POSITIONS.slice(4).map((p) => (
                  <button key={p.label} onClick={() => setPosition(p)}
                    className={position.label === p.label ? 'btn-primary' : 'btn-ghost'}
                    style={{ padding: '5px 4px', fontSize: 11 }}>{p.label}</button>
                ))}
              </div>
            </div>

            {/* Apply button */}
            <button onClick={apply} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
              ✓ Apply &amp; save result
            </button>

          </div>
        )}
      </div>

      {/* Responsive CSS for mobile — stack vertically on small screens */}
      <style>{`
        @media (max-width: 700px) {
          div[style*="gridTemplateColumns: 1fr 380px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: relative !important;
            top: 0 !important;
          }
        }
      `}</style>
    </ToolLayout>
  )
}
