'use client'
import { useCallback, useRef, useState } from 'react'

interface FileDropzoneProps {
  onFile: (file: File) => void
  accept: string
  label?: string
  sublabel?: string
  maxMB?: number
}

export default function FileDropzone({
  onFile,
  accept,
  label = 'Drop your file here',
  sublabel = 'or click to browse',
  maxMB = 500,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > maxMB) {
        setError(`File too large. Max size is ${maxMB}MB.`)
        return
      }
      onFile(file)
    },
    [onFile, maxMB]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div>
      <div
        className={`dropzone${isDragging ? ' active' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        style={{
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          textAlign: 'center',
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload file"
      >
        <div style={{ fontSize: 32, marginBottom: 4 }}>
          {isDragging ? '📂' : '📁'}
        </div>
        <p style={{ fontWeight: 500, fontSize: 16, color: 'var(--text)' }}>{label}</p>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>{sublabel}</p>
        <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>
          Max {maxMB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = '' // reset so same file can be re-selected
          }}
        />
      </div>
      {error && (
        <p style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>⚠️ {error}</p>
      )}
    </div>
  )
}
