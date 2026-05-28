'use client'
import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import DownloadButton from '@/components/DownloadButton'
import { useFFmpeg } from '@/lib/useFFmpeg'

interface VideoItem {
  file: File
  url: string
  name: string
}

export default function MergeVideoClient() {
  const { load, loading: ffmpegLoading } = useFFmpeg()
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const items: VideoItem[] = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
    }))
    setVideos((prev) => [...prev, ...items])
    setResultUrl(null)
    e.target.value = ''
  }

  const remove = (i: number) => setVideos((prev) => prev.filter((_, idx) => idx !== i))
  const moveUp = (i: number) => {
    if (i === 0) return
    setVideos((prev) => { const a = [...prev]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a })
  }
  const moveDown = (i: number) => {
    if (i === videos.length - 1) return
    setVideos((prev) => { const a = [...prev]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a })
  }

  const merge = async () => {
    if (videos.length < 2) { alert('Add at least 2 videos to merge.'); return }
    setProcessing(true)
    setProgress(0)
    setStatus('Loading FFmpeg...')

    const ff = await load()
    if (!ff) { alert('Failed to load FFmpeg.'); setProcessing(false); return }

    ff.on('progress', ({ progress: p }) => setProgress(Math.round(Math.min(p * 100, 99))))

    try {
      // Write all files
      for (let i = 0; i < videos.length; i++) {
        setStatus(`Loading clip ${i + 1} of ${videos.length}...`)
        const resp = await fetch(videos[i].url)
        const data = await resp.arrayBuffer()
        await ff.writeFile(`clip${i}.mp4`, new Uint8Array(data))
      }

      // Create concat file list
      const concatContent = videos.map((_, i) => `file 'clip${i}.mp4'`).join('\n')
      await ff.writeFile('concat.txt', concatContent)

      setStatus('Merging clips...')
      await ff.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        '-movflags', '+faststart',
        'output.mp4',
      ])

      const out = await ff.readFile('output.mp4')
      const outData = new Uint8Array(out as unknown as Uint8Array)
      const blob = new Blob([outData], { type: 'video/mp4' })
      setResultUrl(URL.createObjectURL(blob))

      // Cleanup
      for (let i = 0; i < videos.length; i++) await ff.deleteFile(`clip${i}.mp4`)
      await ff.deleteFile('concat.txt')
      await ff.deleteFile('output.mp4')
      setProgress(100)
      setStatus('Done!')
    } catch (err) {
      console.error(err)
      alert('Merge failed. Make sure all videos have the same codec and resolution.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolLayout
      title="Merge Videos"
      description="Combine multiple video clips into one file. Add videos, reorder them, then download the merged result."
      icon="🔗"
    >
      {/* Add files button */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '14px 24px',
          background: 'var(--bg3)',
          border: '1.5px dashed var(--border)',
          borderRadius: 12,
          cursor: 'pointer',
          fontSize: 15,
          color: 'var(--text-2)',
          transition: 'border-color 0.2s',
          marginBottom: 20,
        }}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.borderColor = 'var(--brand)')}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.borderColor = 'var(--border)')}
      >
        <span style={{ fontSize: 20 }}>+</span> Add video clips
        <input type="file" accept="video/*" multiple onChange={addFiles} style={{ display: 'none' }} />
      </label>

      {/* Video list */}
      {videos.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>
            Clips will be merged in this order:
          </p>
          {videos.map((v, i) => (
            <div
              key={i}
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '12px 16px' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-3)', minWidth: 20 }}>
                {i + 1}
              </span>
              <video src={v.url} style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6 }} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {v.name}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => moveUp(i)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: 14 }}>↑</button>
                <button onClick={() => moveDown(i)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: 14 }}>↓</button>
                <button onClick={() => remove(i)} className="btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 14, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {videos.length >= 2 && (
        <button onClick={merge} disabled={processing || ffmpegLoading} className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}>
          {processing ? 'Merging...' : `🔗 Merge ${videos.length} clips`}
        </button>
      )}

      {processing && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
            <span>{status}</span><span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {resultUrl && (
        <div style={{ marginTop: 24 }}>
          <video src={resultUrl} controls
            style={{ width: '100%', borderRadius: 10, maxHeight: 280, background: '#000' }} />
          <DownloadButton url={resultUrl} filename="merged_video.mp4" label="Download Merged Video" />
        </div>
      )}
    </ToolLayout>
  )
}
