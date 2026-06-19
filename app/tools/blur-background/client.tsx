'use client'
import { useState, useRef, useCallback } from 'react'
import ToolLayout from '@/components/ToolLayout'
import FileDropzone from '@/components/FileDropzone'
import DownloadButton from '@/components/DownloadButton'

export default function BlurBackgroundClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const origImgRef = useRef<HTMLImageElement | null>(null)
  const fgImgRef    = useRef<HTMLImageElement | null>(null)

  const [imageSrc,   setImageSrc]   = useState<string | null>(null)
  const [filename,   setFilename]   = useState('image.jpg')
  const [processing, setProcessing] = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [statusMsg,  setStatusMsg]  = useState('')
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)
  const [fgBlob,     setFgBlob]     = useState<Blob | null>(null)
  const [resultUrl,  setResultUrl]  = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState(0)

  // ── Adjustable effect controls ────────────────────────────────────────────
  const [blurAmount, setBlurAmount] = useState(12)   // px — background blur strength
  const [edgeFeather, setEdgeFeather] = useState(2)  // px — softens subject edge so it blends in

  // ── Step 1: Run AI segmentation to get the subject cutout ─────────────────
  const processImage = async (file: File) => {
    setProcessing(true)
    setProgress(0)
    setResultUrl(null)
    setFgBlob(null)
    setErrorMsg(null)
    setOriginalSize(file.size)
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setFilename(file.name)

    try {
      setStatusMsg('Loading AI model (first time ~5s)...')
      setProgress(10)

      const { removeBackground } = await import('@imgly/background-removal')

      setStatusMsg('Detecting subject...')
      setProgress(30)

      const resultBlob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 60) + 30
            setProgress(Math.min(pct, 90))
          }
        },
      })

      setProgress(95)
      setStatusMsg('Applying blur...')
      setFgBlob(resultBlob)

      // Load both images then composite
      const [origImg, fgImg] = await Promise.all([
        loadImage(url),
        loadImage(URL.createObjectURL(resultBlob)),
      ])
      origImgRef.current = origImg
      fgImgRef.current   = fgImg

      render(origImg, fgImg, blurAmount, edgeFeather)
      setProgress(100)
      setStatusMsg('Done!')
    } catch (err) {
      console.error('Blur background error:', err)
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('fetch') || message.includes('NetworkError')) {
        setErrorMsg('Could not download the AI model. Check your internet connection and try again.')
      } else if (message.includes('memory') || message.includes('Memory')) {
        setErrorMsg('Image too large for this device. Try a smaller image.')
      } else {
        setErrorMsg('Could not process this image. Please try a different one.')
      }
    } finally {
      setProcessing(false)
    }
  }

  // ── Step 2: Composite — blurred full image, then sharp subject on top ─────
  const render = useCallback((
    origImg: HTMLImageElement,
    fgImg: HTMLImageElement,
    blur: number,
    feather: number,
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    canvas.width  = origImg.naturalWidth
    canvas.height = origImg.naturalHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw the full original image, blurred — this becomes the background
    ctx.filter = `blur(${blur}px)`
    ctx.drawImage(origImg, 0, 0, canvas.width, canvas.height)
    ctx.filter = 'none'

    // Optionally soften the subject's edge so it blends naturally
    if (feather > 0) {
      ctx.filter = `blur(${feather}px)`
    }
    ctx.drawImage(fgImg, 0, 0, canvas.width, canvas.height)
    ctx.filter = 'none'

    canvas.toBlob(
      (blob) => { if (blob) setResultUrl(URL.createObjectURL(blob)) },
      'image/jpeg', 0.95,
    )
  }, [])

  // ── Re-render instantly when sliders change (no AI re-run needed) ─────────
  const handleBlurChange = (val: number) => {
    setBlurAmount(val)
    if (origImgRef.current && fgImgRef.current) {
      render(origImgRef.current, fgImgRef.current, val, edgeFeather)
    }
  }

  const handleFeatherChange = (val: number) => {
    setEdgeFeather(val)
    if (origImgRef.current && fgImgRef.current) {
      render(origImgRef.current, fgImgRef.current, blurAmount, val)
    }
  }

  return (
    <ToolLayout
      title="Blur Background"
      description="Blur the background of any photo for a portrait-mode effect. AI detects the subject automatically — keep it sharp while the rest blurs."
      icon="🌫️"
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: imageSrc ? '1fr 340px' : '1fr',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* ── LEFT: Preview ── */}
        <div style={{ position: 'sticky', top: 72 }}>
          {!imageSrc ? (
            <FileDropzone
              onFile={processImage}
              accept="image/jpeg,image/png,image/webp"
              label="Drop your photo here"
              sublabel="Works best with people, animals, or clear subjects"
              maxMB={20}
            />
          ) : (
            <div style={{
              background:   'var(--bg2)',
              border:       '1px solid var(--border)',
              borderRadius:  16,
              overflow:     'hidden',
              position:     'relative',
              minHeight:     200,
            }}>
              <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />

              {processing && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(12,12,16,0.85)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 40, height: 40, border: '3px solid var(--bg4)',
                    borderTop: '3px solid var(--brand)', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{statusMsg}</p>
                  <div style={{ width: 200 }}>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              )}

              <label style={{
                position: 'absolute', bottom: 10, right: 10,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                padding: '5px 12px', fontSize: 12, color: '#e0e7ff', cursor: 'pointer',
              }}>
                🔄 New photo
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processImage(f); e.target.value = '' }} />
              </label>
            </div>
          )}

          {errorMsg && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 8, fontSize: 13, color: '#fca5a5',
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {resultUrl && !processing && (
            <div style={{ marginTop: 12 }}>
              <DownloadButton
                url={resultUrl}
                filename={`blurred_${filename}`}
                label="Download Photo"
                originalSize={originalSize}
                compressedSize={0}
              />
            </div>
          )}
        </div>

        {/* ── RIGHT: Controls ── */}
        {imageSrc && fgBlob && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                Background blur
              </p>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                Intensity: {blurAmount}px
              </label>
              <input type="range" min={0} max={40} step={1} value={blurAmount}
                onChange={(e) => handleBlurChange(Number(e.target.value))}
                style={{ width: '100%' }} />
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                Higher values create a stronger portrait-mode / bokeh effect.
              </p>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                Edge softness
              </p>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
                Feather: {edgeFeather}px
              </label>
              <input type="range" min={0} max={8} step={0.5} value={edgeFeather}
                onChange={(e) => handleFeatherChange(Number(e.target.value))}
                style={{ width: '100%' }} />
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                Softens the subject&apos;s outline slightly so it blends naturally into the blur.
              </p>
            </div>

            <div className="card" style={{ padding: 14, background: 'rgba(99,102,241,0.04)' }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#a5b4fc', marginBottom: 8 }}>
                💡 Tips
              </p>
              {[
                'Works best with a single clear subject in the frame',
                'Lower blur for subtle depth, higher for dramatic bokeh',
                'Try 0px edge softness first, then increase if the cutout looks too sharp',
              ].map((tip) => (
                <p key={tip} style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4, paddingLeft: 8 }}>
                  • {tip}
                </p>
              ))}
            </div>

          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <style>{`
        @media (max-width: 700px) {
          div[style*="1fr 340px"] { grid-template-columns: 1fr !important; }
          div[style*="sticky"]    { position: relative !important; top: 0 !important; }
        }
      `}</style>
    </ToolLayout>
  )
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src     = src
  })
}