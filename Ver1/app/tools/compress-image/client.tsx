'use client'
import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'

interface Result {
  url: string
  blob: Blob
  originalSize: number
  filename: string
}

export default function CompressImageClient() {
  const [quality, setQuality] = useState(80)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    setLoading(true)
    setProgress(0)
    setResult(null)
    setPreview(URL.createObjectURL(file))

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 10,
        maxWidthOrHeight: 4096,
        useWebWorker: true,
        initialQuality: quality / 100,
        onProgress: (p) => setProgress(p),
      })

      const url = URL.createObjectURL(compressed)
      setResult({
        url,
        blob: compressed,
        originalSize: file.size,
        filename: `compressed_${file.name}`,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to compress image. Please try another file.')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <ToolLayout
      title="Image Compressor"
      description="Reduce JPG, PNG, and WebP file sizes by up to 90% without losing noticeable quality. Processed entirely in your browser."
      icon="⚡"
    >
      {/* Quality control */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Compression quality</label>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              color: 'var(--brand)',
              background: 'rgba(99,102,241,0.1)',
              padding: '2px 10px',
              borderRadius: 6,
            }}
          >
            {quality}%
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>
          <span>Smallest file</span>
          <span>Best quality</span>
        </div>
      </div>

      {/* Dropzone */}
      <FileDropzone
        onFile={handleFile}
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
        label="Drop your image here"
        sublabel="Supports JPG, PNG, WebP, GIF, BMP"
        maxMB={100}
      />

      {/* Loading */}
      {loading && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
            <span>Compressing...</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Preview + result */}
      {result && preview && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
            <div className="result-panel">
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Original</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={preview}
                alt="Original"
                style={{ width: '100%', borderRadius: 8, objectFit: 'contain', maxHeight: 240 }}
              />
            </div>
            <div className="result-panel">
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Compressed</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={result.url}
                alt="Compressed"
                style={{ width: '100%', borderRadius: 8, objectFit: 'contain', maxHeight: 240 }}
              />
            </div>
          </div>

          <DownloadButton
            url={result.url}
            filename={result.filename}
            label="Download Compressed Image"
            originalSize={result.originalSize}
            compressedSize={result.blob.size}
          />
        </div>
      )}

      {/* FAQ for SEO */}
      <FaqSection />
    </ToolLayout>
  )
}

function FaqSection() {
  return (
    <div style={{ marginTop: 56, borderTop: '1px solid var(--border)', paddingTop: 40 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginBottom: 24 }}>
        Frequently asked questions
      </h2>
      {[
        {
          q: 'Is this image compressor free?',
          a: 'Yes, completely free with no limits, no watermarks, and no account required.',
        },
        {
          q: 'Are my images uploaded to your server?',
          a: 'No. All processing happens locally in your browser using JavaScript. Your images never leave your device.',
        },
        {
          q: 'What image formats are supported?',
          a: 'JPG, JPEG, PNG, WebP, GIF, and BMP formats are supported.',
        },
        {
          q: 'What quality setting should I use?',
          a: '80% quality is the sweet spot — it gives roughly 60-80% smaller file size with no visible quality loss.',
        },
      ].map((f) => (
        <div key={f.q} style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{f.q}</p>
          <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7 }}>{f.a}</p>
        </div>
      ))}
    </div>
  )
}
