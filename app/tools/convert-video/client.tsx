'use client'
import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'
import { useFFmpeg } from '@/lib/useFFmpeg'

const FORMATS = [
  { label: 'MP4', ext: 'mp4', mime: 'video/mp4', args: ['-c:v', 'libx264', '-c:a', 'aac', '-movflags', '+faststart'] },
  { label: 'WebM', ext: 'webm', mime: 'video/webm', args: ['-c:v', 'libvpx-vp9', '-c:a', 'libopus', '-b:v', '0', '-crf', '30'] },
  { label: 'MKV', ext: 'mkv', mime: 'video/x-matroska', args: ['-c:v', 'libx264', '-c:a', 'aac'] },
  { label: 'MOV', ext: 'mov', mime: 'video/quicktime', args: ['-c:v', 'libx264', '-c:a', 'aac', '-movflags', '+faststart'] },
  { label: 'AVI', ext: 'avi', mime: 'video/x-msvideo', args: ['-c:v', 'libx264', '-c:a', 'aac'] },
  { label: 'GIF', ext: 'gif', mime: 'image/gif', args: ['-vf', 'fps=10,scale=480:-1:flags=lanczos', '-loop', '0'] },
]

export default function ConvertVideoClient() {
  const { load, loading: ffmpegLoading } = useFFmpeg()
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [filename, setFilename] = useState('video')
  const [targetFormat, setTargetFormat] = useState(FORMATS[0])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const handleFile = (file: File) => {
    setResultUrl(null)
    setVideoSrc(URL.createObjectURL(file))
    setFilename(file.name.replace(/\.[^.]+$/, ''))
  }

  const convert = async () => {
    if (!videoSrc) return
    setProcessing(true)
    setProgress(0)

    const ff = await load()
    if (!ff) { alert('Failed to load FFmpeg.'); setProcessing(false); return }

    ff.on('progress', ({ progress: p }) => setProgress(Math.round(Math.min(p * 100, 99))))

    try {
      const resp = await fetch(videoSrc)
      const data = await resp.arrayBuffer()
      await ff.writeFile('input', new Uint8Array(data))

      const outFile = `output.${targetFormat.ext}`
      await ff.exec(['-i', 'input', ...targetFormat.args, outFile])

      const out = await ff.readFile(outFile)
      const outData = new Uint8Array(out as unknown as Uint8Array)
      const blob = new Blob([outData], { type: targetFormat.mime })
      setResultUrl(URL.createObjectURL(blob))
      await ff.deleteFile('input')
      await ff.deleteFile(outFile)
      setProgress(100)
    } catch (err) {
      console.error(err)
      alert('Conversion failed. The video format may not be supported.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolLayout
      title="Video Format Converter"
      description="Convert videos between MP4, WebM, MKV, MOV, AVI, and GIF formats for free in your browser."
      icon="🔄"
    >
      <FileDropzone onFile={handleFile} accept="video/*" label="Drop your video here" maxMB={500} />

      {videoSrc && (
        <div style={{ marginTop: 20 }}>
          <video src={videoSrc} controls
            style={{ width: '100%', borderRadius: 10, maxHeight: 260, background: '#000', marginBottom: 16 }} />

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 10 }}>
              Convert to format
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FORMATS.map((f) => (
                <button key={f.label} onClick={() => { setTargetFormat(f); setResultUrl(null) }}
                  className={targetFormat.label === f.label ? 'btn-primary' : 'btn-ghost'}
                  style={{ minWidth: 70, justifyContent: 'center' }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {targetFormat.label === 'GIF' && (
            <div className="card" style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-2)' }}>
              ℹ️ GIF will be at 10fps, 480px wide. Keep source clips short (under 30s) for best results.
            </div>
          )}

          <button onClick={convert} disabled={processing || ffmpegLoading} className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}>
            {processing ? `Converting to ${targetFormat.label}...` : `Convert to ${targetFormat.label}`}
          </button>

          {processing && (
            <div style={{ marginTop: 16 }}>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{progress}%</p>
            </div>
          )}

          {resultUrl && (
            <div style={{ marginTop: 20 }}>
              {targetFormat.label === 'GIF'
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={resultUrl} alt="GIF" style={{ width: '100%', borderRadius: 10 }} />
                : <video src={resultUrl} controls style={{ width: '100%', borderRadius: 10, maxHeight: 260, background: '#000' }} />
              }
              <DownloadButton
                url={resultUrl}
                filename={`${filename}.${targetFormat.ext}`}
                label={`Download as ${targetFormat.label}`}
              />
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  )
}
