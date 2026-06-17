'use client'
import { useState, useRef } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'

const FORMATS = [
  { label: 'JPG', mime: 'image/jpeg', ext: 'jpg', quality: 0.92 },
  { label: 'PNG', mime: 'image/png', ext: 'png', quality: 1 },
  { label: 'WebP', mime: 'image/webp', ext: 'webp', quality: 0.92 },
  { label: 'BMP', mime: 'image/bmp', ext: 'bmp', quality: 1 },
]

export default function FormatConverterClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [filename, setFilename] = useState('image')
  const [targetFormat, setTargetFormat] = useState(FORMATS[1])
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [resultSize, setResultSize] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleFile = (file: File) => {
    setResultUrl(null)
    setOriginalSize(file.size)
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    const base = file.name.replace(/\.[^.]+$/, '')
    setFilename(base)
  }

  const convert = () => {
    if (!imageSrc || !canvasRef.current) return
    setLoading(true)

    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!

      // White background for JPG (removes alpha)
      if (targetFormat.mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setResultUrl(URL.createObjectURL(blob))
            setResultSize(blob.size)
          }
          setLoading(false)
        },
        targetFormat.mime,
        targetFormat.quality
      )
    }
    img.src = imageSrc
  }

  return (
    <ToolLayout
      title="Image Format Converter"
      description="Convert images between JPG, PNG, WebP, and BMP formats instantly in your browser."
      icon="🔄"
    >
      <FileDropzone
        onFile={handleFile}
        accept="image/*"
        label="Drop your image here"
        sublabel="Supports JPG, PNG, WebP, BMP, GIF and more"
      />

      {imageSrc && (
        <div style={{ marginTop: 24 }}>
          <div className="result-panel" style={{ marginBottom: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt="Original"
              style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 8 }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 10 }}>
              Convert to format
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {FORMATS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => { setTargetFormat(f); setResultUrl(null) }}
                  className={targetFormat.label === f.label ? 'btn-primary' : 'btn-ghost'}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-2)' }}>
            <p>
              Output: <strong style={{ color: 'var(--text)' }}>{filename}.{targetFormat.ext}</strong>
            </p>
            {targetFormat.mime === 'image/jpeg' && (
              <p style={{ marginTop: 6, color: 'var(--text-3)', fontSize: 12 }}>
                ℹ️ Transparent areas will be replaced with white background when converting to JPG.
              </p>
            )}
            {targetFormat.mime === 'image/png' && (
              <p style={{ marginTop: 6, color: 'var(--text-3)', fontSize: 12 }}>
                ✓ PNG preserves transparency (alpha channel).
              </p>
            )}
            {targetFormat.mime === 'image/webp' && (
              <p style={{ marginTop: 6, color: 'var(--text-3)', fontSize: 12 }}>
                ✓ WebP is the best format for web — smaller than JPG and PNG.
              </p>
            )}
          </div>

          <button
            onClick={convert}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Converting...' : `Convert to ${targetFormat.label}`}
          </button>

          {resultUrl && (
            <>
              <div className="result-panel" style={{ marginTop: 20 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Converted"
                  style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 8 }} />
              </div>
              <DownloadButton
                url={resultUrl}
                filename={`${filename}.${targetFormat.ext}`}
                label={`Download as ${targetFormat.label}`}
                originalSize={originalSize}
                compressedSize={resultSize}
              />
            </>
          )}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </ToolLayout>
  )
}
