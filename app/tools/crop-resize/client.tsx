'use client'
import { useRef, useState, useCallback } from 'react'
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

export default function CropResizeClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [origWidth, setOrigWidth] = useState(0)
  const [origHeight, setOrigHeight] = useState(0)
  const [ratio, setRatio] = useState<number | null>(null)
  const [mode, setMode] = useState<'resize' | 'crop'>('resize')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [filename, setFilename] = useState('image.jpg')

  const handleFile = (file: File) => {
    setResultUrl(null)
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

  const process = useCallback(() => {
    const img = imageRef.current
    if (!img || !canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, width, height)

    if (mode === 'resize') {
      ctx.drawImage(img, 0, 0, width, height)
    } else {
      // Crop: center-crop from original
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
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          setResultUrl(url)
        }
      },
      'image/jpeg',
      0.95
    )
  }, [width, height, mode])

  return (
    <ToolLayout
      title="Crop & Resize Image"
      description="Crop images to a specific ratio or resize to exact pixel dimensions. Works entirely in your browser."
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
          {/* Preview */}
          <div className="result-panel" style={{ marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Original"
              style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8 }}
            />
          </div>

          {/* Mode */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['resize', 'crop'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={mode === m ? 'btn-primary' : 'btn-ghost'}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {m === 'resize' ? '↔ Resize' : '✂ Crop'}
              </button>
            ))}
          </div>

          {/* Ratio presets (for crop mode) */}
          {mode === 'crop' && (
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

          {/* Dimensions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Width (px)</label>
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
              <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Height (px)</label>
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

          <button onClick={process} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Apply {mode === 'resize' ? 'resize' : 'crop'}
          </button>

          {resultUrl && (
            <>
              <div className="result-panel" style={{ marginTop: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
                  Result: {width} × {height} px
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                  src={resultUrl}
                  alt="Result"
                  style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8 }}
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
