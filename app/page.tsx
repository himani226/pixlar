import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pixlar — Free Online Image & Video Tools',
  alternates: { canonical: '/' },
}

const IMAGE_TOOLS = [
  { href: '/tools/compress-image',   accent: 'var(--hex-blue)',   icon: '⚡', name: 'Image Compressor',  desc: 'Reduce image file size without visible quality loss. Supports JPG, PNG, WebP.', badge: 'Most popular' },
  { href: '/tools/crop-resize',      accent: 'var(--hex-green)',  icon: '⛶', name: 'Crop & Resize',      desc: 'Crop to any ratio or resize to exact pixel dimensions instantly.', badge: null },
  { href: '/tools/text-overlay',     accent: 'var(--hex-orange)', icon: 'T', name: 'Text Overlay',       desc: 'Add multi-line text, captions, or watermarks with full font and background control.', badge: null },
  { href: '/tools/format-converter', accent: 'var(--hex-yellow)', icon: '⇄', name: 'Format Converter',   desc: 'Convert images between JPG, PNG, WebP, BMP instantly in your browser.', badge: null },
  { href: '/tools/remove-background',accent: 'var(--hex-purple)', icon: '◐', name: 'Background Remover',  desc: 'AI-powered background removal. Export transparent PNG or replace with color or image.', badge: 'New' },
]

const VIDEO_TOOLS = [
  { href: '/tools/compress-video', accent: 'var(--hex-blue)',   icon: '🗜', name: 'Video Compressor', desc: 'Compress MP4 videos to a smaller size while keeping quality. Powered by FFmpeg.', badge: 'Most popular' },
  { href: '/tools/trim-video',     accent: 'var(--hex-orange)', icon: '✂', name: 'Trim Video',       desc: 'Cut the start and end of a video clip to the exact timestamp you need.', badge: null },
  { href: '/tools/merge-video',    accent: 'var(--hex-green)',  icon: '⧉', name: 'Merge Videos',  desc: 'Join multiple video clips together into one file seamlessly.', badge: null },
  { href: '/tools/convert-video',  accent: 'var(--hex-yellow)', icon: '⇄', name: 'Video Converter',   desc: 'Convert between MP4, WebM, MKV, AVI, GIF and more formats for free.', badge: null },
]

const FEATURES = [
  { icon: '🔒', title: '100% Private',    desc: 'Files are processed in your browser. Nothing is uploaded to our servers.' },
  { icon: '⚡', title: 'Lightning Fast',  desc: 'WebAssembly-powered processing runs at near-native speed.' },
  { icon: '∞', title: 'Always Free',     desc: 'Every tool is free with no limits, no watermarks, no account required.' },
  { icon: '▣', title: 'Cross Platform',  desc: 'Fully responsive — works on desktop, tablet, or phone.' },
]

export default function Home() {
  return (
    <>
      {/* ── HERO ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px 48px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 99, padding: '6px 16px', fontSize: 13, color: 'var(--text-2)', marginBottom: 28,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--hex-green)' }} />
          100% free · No signup · Files stay in your browser
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(34px, 6vw, 60px)',
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: '-1.5px',
          color: 'var(--navy)',
          marginBottom: 20,
        }}>
          Simple, powerful{' '}
          <span style={{ color: 'var(--brand)' }}>media tools.</span>
        </h1>

        <p style={{ fontSize: 18, color: 'var(--text-2)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Compress, crop, resize, convert, and edit images &amp; videos directly in your browser.
          Powered by WebAssembly for maximum speed and privacy.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#image-tools" className="btn-primary">Explore image tools →</a>
          <a href="#video-tools" className="btn-ghost">Explore video tools</a>
        </div>
      </section>

      {/* ── FEATURE PILLS ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="card" style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, lineHeight: 1, marginTop: 2 }}>{f.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: 'var(--navy)' }}>{f.title}</p>
                <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── IMAGE TOOLS ── */}
      <section id="image-tools" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 56px' }}>
        <SectionHeader label="Image Tools" title="Edit and convert images"
          desc="All image processing runs entirely in your browser using the Canvas API." />
        <ToolGrid tools={IMAGE_TOOLS} />
      </section>

      {/* ── DARK PANEL: Why local processing ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 24px 56px' }}>
        <div style={{
          background: 'var(--panel-dark)',
          borderRadius: 24,
          padding: 'clamp(32px, 5vw, 56px)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
          gap: 40,
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 34px)',
              fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', marginBottom: 20, lineHeight: 1.15,
            }}>
              Why local processing matters
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, marginBottom: 24, maxWidth: 440 }}>
              Most online tools upload your files to their servers. Pixlar doesn&apos;t. Everything happens
              on your device using WebAssembly. It&apos;s faster, safer, and works offline.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Your photos never touch a remote server',
                'No upload wait times for large files',
                'Privacy by design, not by promise',
              ].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 99, flexShrink: 0,
                    background: 'rgba(87,185,71,0.15)', color: 'var(--hex-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                  }}>✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: secure badge */}
          <div style={{
            background: 'var(--panel-dark-2)',
            borderRadius: 16,
            padding: '40px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(79,70,229,0.18)', color: '#a5b4fc',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>🛡</div>
            <p style={{ color: '#fff', fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
              Secure client-side execution
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Zero data leaves your device
            </p>
          </div>
        </div>
      </section>

      {/* ── VIDEO TOOLS ── */}
      <section id="video-tools" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 56px' }}>
        <SectionHeader label="Video Tools" title="Process videos for free"
          desc="Powered by FFmpeg.wasm — the full FFmpeg engine running inside your browser." />
        <ToolGrid tools={VIDEO_TOOLS} />
      </section>

      {/* ── BROWSER NATIVE + STATS ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 24px 56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.4fr)', gap: 16 }}>
          {/* Left: professional utility */}
          <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>
                Professional utility
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>
                Built for creators who value speed and quality. No ads, no tracking, just fast performant tools.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              {['WebAssembly', 'Privacy', 'Zero Upload'].map((tag) => (
                <span key={tag} style={{
                  fontSize: 12, padding: '5px 12px', borderRadius: 99,
                  background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text-2)',
                }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Right: browser native + stats */}
          <div style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: 16 }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--brand), #6d63f0)',
              backgroundColor: 'var(--brand)',
              borderRadius: 16, padding: 24, color: '#fff',
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, marginBottom: 6 }}>
                Browser Native
              </h3>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', marginBottom: 18 }}>
                Our technology turns your browser into a powerhouse.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {['⚡', '🔒', '∞'].map((e, i) => (
                  <span key={i} style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                  }}>{e}</span>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, color: 'var(--navy)', lineHeight: 1 }}>0</p>
                <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 8 }}>Servers Used</p>
              </div>
              <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, color: 'var(--navy)', lineHeight: 1 }}>∞</p>
                <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 8 }}>Privacy Score</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEO CONTENT ── */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '16px 24px 24px', color: 'var(--text-2)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>
          Why use Pixlar?
        </h2>
        <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
          Pixlar provides free, fast, and private image and video processing tools. Unlike other online
          tools that upload your files to remote servers, Pixlar processes everything locally inside your
          browser using modern WebAssembly technology. This means your photos, videos, and personal media
          never leave your device.
        </p>
        <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
          Our <strong style={{ color: 'var(--navy)' }}>image compressor</strong> reduces file sizes by up
          to 90% without noticeable quality loss, perfect for websites, email attachments, and social media
          uploads. The <strong style={{ color: 'var(--navy)' }}>crop and resize tool</strong> lets you trim
          images to exact dimensions or popular aspect ratios like 1:1 for Instagram or 16:9 for YouTube
          thumbnails.
        </p>
        <p style={{ lineHeight: 1.8 }}>
          For video, our <strong style={{ color: 'var(--navy)' }}>free video compressor</strong> uses
          FFmpeg.wasm to compress MP4 and other video formats directly in the browser with no file size
          limits. All tools are completely free, with no watermarks, no subscriptions, and no hidden fees.
        </p>
      </section>
    </>
  )
}

function SectionHeader({ label, title, desc }: { label: string; title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <span style={{
        display: 'inline-block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 10,
      }}>
        {label}
      </span>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--navy)', marginBottom: 8 }}>
        {title}
      </h2>
      <p style={{ color: 'var(--text-2)', fontSize: 15 }}>{desc}</p>
    </div>
  )
}

function ToolGrid({ tools }: { tools: typeof IMAGE_TOOLS }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
      {tools.map((tool) => (
        <Link key={tool.href} href={tool.href} className="tool-card-link" style={{ textDecoration: 'none' }}>
          <article className="card tool-card" style={{ height: '100%', position: 'relative', padding: 22 }}>
            {tool.badge && (
              <span style={{
                position: 'absolute', top: 18, right: 18,
                background: 'rgba(79,70,229,0.1)', color: 'var(--brand)',
                borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 500,
              }}>
                {tool.badge}
              </span>
            )}
            {/* Accent icon tile */}
            <div style={{
              width: 40, height: 40, borderRadius: 11, marginBottom: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: tool.accent,
              background: `color-mix(in srgb, ${tool.accent} 12%, transparent)`,
            }}>
              {tool.icon}
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, marginBottom: 7, color: 'var(--navy)' }}>
              {tool.name}
            </h3>
            <p style={{ color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.6 }}>{tool.desc}</p>
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--brand)', fontWeight: 500 }}>
              Use tool →
            </div>
          </article>
        </Link>
      ))}
    </div>
  )
}
