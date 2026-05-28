'use client'
import { useState, useRef } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'
import { useFFmpeg } from '@/lib/useFFmpeg'

function toHMS(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export default function TrimVideoClient() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { load, loading: ffmpegLoading } = useFFmpeg()
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [filename, setFilename] = useState('video.mp4')
  const [duration, setDuration] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const handleFile = (file: File) => {
    setResultUrl(null)
    const url = URL.createObjectURL(file)
    setVideoSrc(url)
    setFilename(file.name)
  }

  const handleLoadedMetadata = () => {
    const vid = videoRef.current
    if (!vid) return
    const d = vid.duration
    setDuration(d)
    setStartTime(0)
    setEndTime(d)
  }

  const trim = async () => {
    if (!videoSrc) return
    setProcessing(true)
    setProgress(0)

    const ff = await load()
    if (!ff) {
      alert('Failed to load FFmpeg. Please try again.')
      setProcessing(false)
      return
    }

    ff.on('progress', ({ progress: p }) => setProgress(Math.round(Math.min(p * 100, 99))))

    try {
      const resp = await fetch(videoSrc)
      const data = await resp.arrayBuffer()
      await ff.writeFile('input.mp4', new Uint8Array(data))

      const trimDuration = endTime - startTime

      await ff.exec([
        '-ss', String(startTime),
        '-i', 'input.mp4',
        '-t', String(trimDuration),
        '-c', 'copy',          // stream copy = ultra fast, no re-encoding
        '-movflags', '+faststart',
        'output.mp4',
      ])

      const out = await ff.readFile('output.mp4')
      const outData = new Uint8Array(out as unknown as Uint8Array)
      const blob = new Blob([outData], { type: 'video/mp4' })
      setResultUrl(URL.createObjectURL(blob))
      await ff.deleteFile('input.mp4')
      await ff.deleteFile('output.mp4')
      setProgress(100)
    } catch (err) {
      console.error(err)
      alert('Trim failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolLayout
      title="Video Trimmer"
      description="Cut the start and end of a video to keep only the part you need. Fast stream-copy — no re-encoding."
      icon="✂️"
    >
      <FileDropzone onFile={handleFile} accept="video/*" label="Drop your video here" maxMB={500} />

      {videoSrc && (
        <div style={{ marginTop: 20 }}>
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            onLoadedMetadata={handleLoadedMetadata}
            style={{ width: '100%', borderRadius: 10, maxHeight: 280, background: '#000', marginBottom: 20 }}
          />

          {duration > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                    Start time: <strong style={{ color: 'var(--text)' }}>{toHMS(startTime)}</strong>
                  </label>
                  <input
                    type="range" min={0} max={endTime - 1} step={0.1}
                    value={startTime}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setStartTime(v)
                      if (videoRef.current) videoRef.current.currentTime = v
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                    End time: <strong style={{ color: 'var(--text)' }}>{toHMS(endTime)}</strong>
                  </label>
                  <input
                    type="range" min={startTime + 1} max={duration} step={0.1}
                    value={endTime}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setEndTime(v)
                    }}
                  />
                </div>
              </div>

              <div className="card" style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-2)' }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  <span>Duration: <strong style={{ color: 'var(--text)' }}>{toHMS(duration)}</strong></span>
                  <span>Clip: <strong style={{ color: 'var(--brand)' }}>{toHMS(endTime - startTime)}</strong></span>
                </div>
              </div>

              <button onClick={trim} disabled={processing || ffmpegLoading} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}>
                {processing ? 'Trimming...' : '✂ Trim video'}
              </button>
            </>
          )}

          {processing && (
            <div style={{ marginTop: 16 }}>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{progress}% — trimming...</p>
            </div>
          )}

          {resultUrl && (
            <div style={{ marginTop: 20 }}>
              <video src={resultUrl} controls
                style={{ width: '100%', borderRadius: 10, maxHeight: 280, background: '#000' }} />
              <DownloadButton url={resultUrl} filename={`trimmed_${filename}`} label="Download Trimmed Video" />
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  )
}
