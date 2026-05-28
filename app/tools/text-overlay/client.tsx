'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'

// ─── EASY CUSTOMIZATION ───────────────────────────────────────────────────────
// Add or remove fonts here. Any font loaded in the browser works.
const FONTS = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Impact',
  'Verdana',
  'Trebuchet MS',
  'Palatino',
  'Garamond',
  'Book Antiqua',
]

// Add or remove presets here. Each preset sets all fields at once.
// Great for medical forms, certificates, ID cards, etc.
const PRESETS = [
  {
    label: 'None',
    textColor: '#ffffff',
    bgColor: '#000000',
    bgOpacity: 0,
    bold: false,
    italic: false,
    shadow: true,
    fontSize: 48,
    font: 'Arial',
  },
  {
    label: 'Medical label',       // ← white text on dark-green background
    textColor: '#ffffff',
    bgColor: '#064e3b',
    bgOpacity: 85,
    bold: true,
    italic: false,
    shadow: false,
    fontSize: 36,
    font: 'Arial',
  },
  {
    label: 'ID / Badge',          // ← dark text on white background
    textColor: '#1e1b4b',
    bgColor: '#ffffff',
    bgOpacity: 90,
    bold: true,
    italic: false,
    shadow: false,
    fontSize: 40,
    font: 'Verdana',
  },
  {
    label: 'Certificate',         // ← gold text on dark background
    textColor: '#fbbf24',
    bgColor: '#1e1b4b',
    bgOpacity: 75,
    bold: true,
    italic: true,
    shadow: true,
    fontSize: 52,
    font: 'Georgia',
  },
  {
    label: 'Watermark',           // ← semi-transparent diagonal-style
    textColor: '#ffffff',
    bgColor: '#000000',
    bgOpacity: 0,
    bold: false,
    italic: true,
    shadow: true,
    fontSize: 32,
    font: 'Arial',
  },
  {
    label: 'Warning / Alert',     // ← white text on red background
    textColor: '#ffffff',
    bgColor: '#b91c1c',
    bgOpacity: 90,
    bold: true,
    italic: false,
    shadow: false,
    fontSize: 40,
    font: 'Impact',
  },
  {
    label: 'Prescription',        // ← dark text on light-blue background
    textColor: '#1e3a5f',
    bgColor: '#dbeafe',
    bgOpacity: 90,
    bold: false,
    italic: false,
    shadow: false,
    fontSize: 34,
    font: 'Courier New',
  },
  {
    label: 'Stamp / Official',    // ← red text on transparent
    textColor: '#dc2626',
    bgColor: '#000000',
    bgOpacity: 0,
    bold: true,
    italic: false,
    shadow: false,
    fontSize: 44,
    font: 'Times New Roman',
  },
]

// ─── POSITION OPTIONS (you can add more) ─────────────────────────────────────
const POSITIONS = [
  { label: 'Top left', x: 'left', y: 'top' },
  { label: 'Top center', x: 'center', y: 'top' },
  { label: 'Top right', x: 'right', y: 'top' },
  { label: 'Center', x: 'center', y: 'center' },
  { label: 'Bottom left', x: 'left', y: 'bottom' },
  { label: 'Bottom center', x: 'center', y: 'bottom' },
  { label: 'Bottom right', x: 'right', y: 'bottom' },
]

// ─────────────────────────────────────────────────────────────────────────────

interface TextBlock {
  id: number
  text: string
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

let nextId = 1

export default function TextOverlayClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [filename, setFilename] = useState('image.jpg')
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  // ── Text blocks (multi-line support) ──────────────────────────────────────
  const [blocks, setBlocks] = useState<TextBlock[]>([{ id: nextId++, text: 'Your text here' }])

  // ── Typography ────────────────────────────────────────────────────────────
  const [font, setFont] = useState('Arial')
  const [fontSize, setFontSize] = useState(48)
  const [lineGap, setLineGap] = useState(16)   // extra px between lines
  const [textColor, setTextColor] = useState('#ffffff')
  const [opacity, setOpacity] = useState(100)
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [shadow, setShadow] = useState(true)

  // ── Background box ────────────────────────────────────────────────────────
  const [bgEnabled, setBgEnabled] = useState(false)
  const [bgColor, setBgColor] = useState('#000000')
  const [bgOpacity, setBgOpacity] = useState(60)   // 0–100
  const [bgPadding, setBgPadding] = useState(20)   // px padding around text
  const [bgWidth, setBgWidth] = useState(0)    // 0 = auto, >0 = manual px
  const [bgHeight, setBgHeight] = useState(0)    // 0 = auto, >0 = manual px

  // ── Position ──────────────────────────────────────────────────────────────
  const [position, setPosition] = useState(POSITIONS[5]) // bottom center default

  // ── Canvas render ─────────────────────────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return

    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!

    // Draw the base image
    ctx.drawImage(img, 0, 0)

    // Build font string
    const fontStr = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px ${font}`
    ctx.font = fontStr

    // Split each block by \n for hard line breaks
    const lines: string[] = blocks.flatMap((b) =>
      b.text === '' ? [''] : b.text.split('\n')
    )

    const lineH = fontSize + lineGap           // total height per line
    const totalH = lines.length * lineH - lineGap // subtract trailing gap

    // Measure widest line
    ctx.font = fontStr
    const maxLineW = Math.max(...lines.map((l) => ctx.measureText(l).width))

    // Resolve anchor point
    const pad = fontSize * 0.8
    let anchorX = 0
    let anchorY = 0

    if (position.x === 'left') anchorX = pad
    else if (position.x === 'center') anchorX = canvas.width / 2
    else anchorX = canvas.width - pad

    if (position.y === 'top') anchorY = pad
    else if (position.y === 'center') anchorY = (canvas.height - totalH) / 2
    else anchorY = canvas.height - pad - totalH

    // ── Draw background box ────────────────────────────────────────────────
    if (bgEnabled && bgOpacity > 0) {
      const [br, bg, bb] = hexToRgb(bgColor)
      ctx.save()
      ctx.globalAlpha = bgOpacity / 100

      const boxW = bgWidth > 0 ? bgWidth : maxLineW + bgPadding * 2
      const boxH = bgHeight > 0 ? bgHeight : totalH + bgPadding * 2

      let boxX = anchorX
      if (position.x === 'left') boxX = anchorX - bgPadding
      else if (position.x === 'center') boxX = anchorX - boxW / 2
      else boxX = anchorX - boxW

      const boxY = anchorY - bgPadding
      const r = Math.min(12, boxH / 4)
      ctx.fillStyle = `rgb(${br},${bg},${bb})`
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

    // ── Draw each line of text ─────────────────────────────────────────────
    ctx.font = fontStr
    ctx.globalAlpha = opacity / 100

    const [tr, tg, tb] = hexToRgb(textColor)
    ctx.fillStyle = `rgb(${tr},${tg},${tb})`

    if (shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.7)'
      ctx.shadowBlur = fontSize / 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
    }

    if (position.x === 'left') ctx.textAlign = 'left'
    else if (position.x === 'center') ctx.textAlign = 'center'
    else ctx.textAlign = 'right'

    ctx.textBaseline = 'top'

    lines.forEach((line, i) => {
      ctx.fillText(line, anchorX, anchorY + i * lineH)
    })

    // Reset
    ctx.globalAlpha = 1
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }, [
    blocks, font, fontSize, lineGap, textColor, opacity,
    bold, italic, shadow, bgEnabled, bgColor, bgOpacity, bgPadding, bgWidth, bgHeight, position,
  ])

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

  // Apply a preset
  const applyPreset = (p: typeof PRESETS[0]) => {
    setTextColor(p.textColor)
    setBgColor(p.bgColor)
    setBgOpacity(p.bgOpacity)
    setBgEnabled(p.bgOpacity > 0)
    setBold(p.bold)
    setItalic(p.italic)
    setShadow(p.shadow)
    setFontSize(p.fontSize)
    setFont(p.font)
  }

  const addBlock = () => setBlocks((prev) => [...prev, { id: nextId++, text: '' }])
  const removeBlock = (id: number) => setBlocks((prev) => prev.filter((b) => b.id !== id))
  const updateBlock = (id: number, text: string) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)))

  return (
    <ToolLayout
      title="Text Overlay"
      description="Add multi-line text, captions, watermarks, or form labels to images with background boxes."
      icon="✏️"
    >
      <FileDropzone onFile={handleFile} accept="image/*" label="Drop your image here" />

      {imageSrc && (
        <div style={{ marginTop: 24 }}>

          {/* ── Live preview ── */}
          <div className="result-panel" style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
              Live preview &mdash; click Apply to finalise
            </p>
            <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 8, display: 'block' }} />
          </div>

          {/* ── Presets ── */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>
              Quick presets
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="btn-ghost"
                  style={{ padding: '5px 12px', fontSize: 12 }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Text blocks (multi-line) ── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, color: 'var(--text-2)' }}>
                Text lines — each block = one line on the image
              </label>
              <button onClick={addBlock} className="btn-ghost" style={{ padding: '4px 12px', fontSize: 12 }}>
                + Add line
              </button>
            </div>
            {blocks.map((block, idx) => (
              <div key={block.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', minWidth: 20, fontFamily: 'var(--font-mono)' }}>
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={block.text}
                  onChange={(e) => updateBlock(block.id, e.target.value)}
                  placeholder={`Line ${idx + 1}...`}
                  style={{ flex: 1, fontSize: 15 }}
                />
                {blocks.length > 1 && (
                  <button
                    onClick={() => removeBlock(block.id)}
                    className="btn-ghost"
                    style={{ padding: '4px 10px', fontSize: 14, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', flexShrink: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              Tip: each input = one new line. Use as many lines as needed.
            </p>
          </div>

          {/* ── Font + Size + Line gap ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Font</label>
              <select value={font} onChange={(e) => setFont(e.target.value)} style={{ width: '100%' }}>
                {FONTS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                Size: {fontSize}px
              </label>
              <input type="range" min={10} max={200} step={2} value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                Line gap: {lineGap}px
              </label>
              <input type="range" min={0} max={60} step={2} value={lineGap}
                onChange={(e) => setLineGap(Number(e.target.value))} />
            </div>
          </div>

          {/* ── Text color + opacity ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Text color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                  style={{ width: 40, height: 36, padding: 2, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                Text opacity: {opacity}%
              </label>
              <input type="range" min={10} max={100} value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))} />
            </div>
          </div>

          {/* ── Style toggles ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Bold', value: bold, set: setBold },
              { label: 'Italic', value: italic, set: setItalic },
              { label: 'Shadow', value: shadow, set: setShadow },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => btn.set(!btn.value)}
                className={btn.value ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '6px 14px', fontSize: 13 }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* ── Background box ── */}
          <div
            className="card"
            style={{
              marginBottom: 16, background: bgEnabled ? 'rgba(99,102,241,0.04)' : undefined,
              borderColor: bgEnabled ? 'rgba(99,102,241,0.25)' : undefined
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: bgEnabled ? 14 : 0 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>Background box</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  Coloured box behind the text — useful for medical forms, IDs, certificates
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
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
                  onChange={(e) => setBgEnabled(e.target.checked)}
                  style={{ display: 'none' }} />
              </label>
            </div>

            {bgEnabled && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Background color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                      style={{ width: 40, height: 36, padding: 2, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                    <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                      style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                    BG opacity: {bgOpacity}%
                  </label>
                  <input type="range" min={5} max={100} value={bgOpacity}
                    onChange={(e) => setBgOpacity(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                    Padding: {bgPadding}px
                  </label>
                  <input type="range" min={4} max={80} step={2} value={bgPadding}
                    onChange={(e) => setBgPadding(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                    Width: {bgWidth === 0 ? 'Auto' : `${bgWidth}px`}
                  </label>
                  <input type="range" min={0} max={2000} step={10} value={bgWidth}
                    onChange={(e) => setBgWidth(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                    Height: {bgHeight === 0 ? 'Auto' : `${bgHeight}px`}
                  </label>
                  <input type="range" min={0} max={800} step={4} value={bgHeight}
                    onChange={(e) => setBgHeight(Number(e.target.value))} />
                </div>
              </div>
            )}
          </div>

          {/* ── Position ── */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>Position</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxWidth: 320 }}>
              {POSITIONS.slice(0, 3).map((p) => (
                <button key={p.label} onClick={() => setPosition(p)}
                  className={position.label === p.label ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '6px 8px', fontSize: 12 }}>{p.label}</button>
              ))}
              <div />
              <button onClick={() => setPosition(POSITIONS[3])}
                className={position.label === 'Center' ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '6px 8px', fontSize: 12 }}>Center</button>
              <div />
              {POSITIONS.slice(4).map((p) => (
                <button key={p.label} onClick={() => setPosition(p)}
                  className={position.label === p.label ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '6px 8px', fontSize: 12 }}>{p.label}</button>
              ))}
            </div>
          </div>

          <button onClick={apply} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Apply text overlay
          </button>

          {resultUrl && (
            <DownloadButton url={resultUrl} filename={`text_${filename}`} label="Download Image" />
          )}
        </div>
      )}
    </ToolLayout>
  )
}
