'use client'
import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'
import { useFFmpeg } from '@/lib/useFFmpeg'

const QUALITY_PRESETS = [
  { label: 'High quality', crf: 23, desc: 'Best quality, ~40% smaller' },
  { label: 'Balanced', crf: 28, desc: 'Good quality, ~60% smaller' },
  { label: 'Small file', crf: 35, desc: 'Acceptable quality, ~80% smaller' },
]

export default function CompressVideoClient() {
  const { load, loading: ffmpegLoading } = useFFmpeg()
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [resultSize, setResultSize] = useState(0)
  const [filename, setFilename] = useState('video.mp4')
  const [preset, setPreset] = useState(QUALITY_PRESETS[1])
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const handleFile = (file: File) => {
    setResultUrl(null)
    setOriginalSize(file.size)
    setFilename(file.name)
    setVideoSrc(URL.createObjectURL(file))
  }

  const compress = async () => {
    if (!videoSrc) return
    setProcessing(true)
    setProgress(0)
    setStatus('Loading FFmpeg engine...')

    const ff = await load()
    if (!ff) {
      alert('Failed to load FFmpeg. Please refresh and try again.')
      setProcessing(false)
      return
    }

    ff.on('progress', ({ progress: p }) => {
      setProgress(Math.round(Math.min(p * 100, 99)))
    })

    try {
      setStatus('Preparing file...')
      const response = await fetch(videoSrc)
      const fileData = await response.arrayBuffer()

      setStatus('Compressing video...')
      await ff.writeFile('input.mp4', new Uint8Array(fileData))

      await ff.exec([
        '-i', 'input.mp4',
        '-c:v', 'libx264',
        '-crf', String(preset.crf),
        '-preset', 'fast',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart', // web-optimized MP4
        'output.mp4',
      ])

      setStatus('Reading result...')
      const rawData = await ff.readFile('output.mp4')
      const data = new Uint8Array(rawData as Uint8Array)
      const blob = new Blob([data], { type: 'video/mp4' })
      setResultSize(blob.size)
      setResultUrl(URL.createObjectURL(blob))

      // Cleanup
      await ff.deleteFile('input.mp4')
      await ff.deleteFile('output.mp4')
      setProgress(100)
      setStatus('Done!')
    } catch (err) {
      console.error(err)
      alert('Compression failed. The file may be corrupted or unsupported.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolLayout
      title="Video Compressor"
      description="Compress MP4 and other videos for free. Powered by FFmpeg.wasm — runs entirely in your browser with no server upload."
      icon="🗜️"
    >
      {/* Quality presets */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Quality preset</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {QUALITY_PRESETS.map((p) => (
            <label
              key={p.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: preset.label === p.label ? 'rgba(99,102,241,0.08)' : 'transparent',
                border: `1px solid ${preset.label === p.label ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="quality"
                checked={preset.label === p.label}
                onChange={() => setPreset(p)}
                style={{ accentColor: 'var(--brand)' }}
              />
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{p.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{p.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <FileDropzone
        onFile={handleFile}
        accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
        label="Drop your video here"
        sublabel="Supports MP4, MOV, AVI, WebM, MKV"
        maxMB={500}
      />

      {videoSrc && !resultUrl && (
        <div style={{ marginTop: 20 }}>
          <video
            src={videoSrc}
            controls
            style={{ width: '100%', borderRadius: 10, maxHeight: 280, background: '#000' }}
          />
          <button
            onClick={compress}
            disabled={processing || ffmpegLoading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
          >
            {processing ? 'Compressing...' : '🗜 Compress video'}
          </button>
        </div>
      )}

      {(processing || ffmpegLoading) && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
            <span>{status}</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)' }}>
            ℹ️ First load downloads the FFmpeg engine (~31MB). This is cached for future uses.
          </p>
        </div>
      )}

      {resultUrl && (
        <div style={{ marginTop: 24 }}>
          <video src={resultUrl} controls
            style={{ width: '100%', borderRadius: 10, maxHeight: 280, background: '#000' }} />
          <DownloadButton
            url={resultUrl}
            filename={`compressed_${filename}`}
            label="Download Compressed Video"
            originalSize={originalSize}
            compressedSize={resultSize}
          />
          <button
            onClick={() => { setResultUrl(null); setVideoSrc(null); setProgress(0) }}
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          >
            Compress another video
          </button>
        </div>
      )}
    </ToolLayout>
  )
}
