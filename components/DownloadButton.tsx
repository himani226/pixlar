'use client'
import { useState } from 'react'

interface DownloadButtonProps {
  url: string
  filename: string
  label?: string
  originalSize?: number
  compressedSize?: number
}

export default function DownloadButton({
  url,
  filename,
  label = 'Download',
  originalSize,
  compressedSize,
}: DownloadButtonProps) {
  const [clicked, setClicked] = useState(false)

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setClicked(true)
    setTimeout(() => setClicked(false), 3000)
  }

  const savings =
    originalSize && compressedSize
      ? Math.round((1 - compressedSize / originalSize) * 100)
      : null

  return (
    <div style={{ marginTop: 24 }}>
      {savings !== null && savings > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginBottom: 16,
            padding: '12px 16px',
            background: 'rgba(20,184,166,0.06)',
            border: '1px solid rgba(20,184,166,0.15)',
            borderRadius: 10,
            fontSize: 13,
          }}
        >
          <span style={{ color: 'var(--text-2)' }}>
            Original: <strong style={{ color: 'var(--text)' }}>{formatSize(originalSize!)}</strong>
          </span>
          <span style={{ color: 'var(--text-2)' }}>
            Result: <strong style={{ color: 'var(--text)' }}>{formatSize(compressedSize!)}</strong>
          </span>
          <span style={{ color: '#5eead4' }}>
            ↓ {savings}% smaller
          </span>
        </div>
      )}
      <button
        onClick={handleDownload}
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
      >
        {clicked ? '✓ Downloaded!' : `↓ ${label} — Free`}
      </button>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
        No watermark · No signup · 100% free
      </p>
    </div>
  )
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
