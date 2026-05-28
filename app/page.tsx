import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PixlrTools — Free Online Image & Video Tools',
  alternates: { canonical: '/' },
}

const IMAGE_TOOLS = [
  {
    href: '/tools/compress-image',
    icon: '⚡',
    name: 'Image Compressor',
    desc: 'Reduce image file size without visible quality loss. Supports JPG, PNG, WebP.',
    badge: 'Most popular',
  },
  {
    href: '/tools/crop-resize',
    icon: '✂️',
    name: 'Crop & Resize',
    desc: 'Crop to any ratio or resize to exact pixel dimensions instantly.',
    badge: null,
  },
  {
    href: '/tools/text-overlay',
    icon: '✏️',
    name: 'Text Overlay',
    desc: 'Add custom text, captions, or watermarks on images with full font control.',
    badge: null,
  },
  {
    href: '/tools/format-converter',
    icon: '🔄',
    name: 'Format Converter',
    desc: 'Convert images between JPG, PNG, WebP, BMP, GIF instantly in browser.',
    badge: null,
  },
]

const VIDEO_TOOLS = [
  {
    href: '/tools/compress-video',
    icon: '🗜️',
    name: 'Video Compressor',
    desc: 'Compress MP4 videos to smaller size while keeping quality. Powered by FFmpeg.',
    badge: 'Most popular',
  },
  {
    href: '/tools/trim-video',
    icon: '✂️',
    name: 'Trim Video',
    desc: 'Cut the start and end of a video clip to the exact timestamp you need.',
    badge: null,
  },
  {
    href: '/tools/merge-video',
    icon: '🔗',
    name: 'Merge Videos',
    desc: 'Join multiple video clips together into one file seamlessly.',
    badge: null,
  },
  {
    href: '/tools/convert-video',
    icon: '🔄',
    name: 'Video Converter',
    desc: 'Convert between MP4, WebM, MKV, AVI and more formats for free.',
    badge: null,
  },
]

const FEATURES = [
  { icon: '🔒', title: '100% private', desc: 'Files are processed in your browser. Nothing is uploaded to our servers.' },
  { icon: '⚡', title: 'Lightning fast', desc: 'WebAssembly-powered processing runs at near-native speed.' },
  { icon: '💸', title: 'Always free', desc: 'Every tool is free with no limits, no watermarks, no account required.' },
  { icon: '📱', title: 'Works on any device', desc: 'Fully responsive — use on desktop, tablet, or phone.' },
]

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '80px 24px 60px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 99,
            padding: '6px 16px',
            fontSize: 13,
            color: '#a5b4fc',
            marginBottom: 24,
            fontFamily: 'var(--font-mono)',
          }}
        >
          100% free · No signup · Files stay in your browser
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            marginBottom: 20,
          }}
        >
          Free Online Image &amp;{' '}
          <span style={{ color: 'var(--brand)' }}>Video Tools</span>
        </h1>
        <p
          style={{
            fontSize: 18,
            color: 'var(--text-2)',
            maxWidth: 560,
            margin: '0 auto 36px',
            lineHeight: 1.7,
          }}
        >
          Compress, crop, resize, convert, and edit images &amp; videos directly in your browser.
          No account needed. Your files never leave your device.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#image-tools" className="btn-primary">Explore image tools</a>
          <a href="#video-tools" className="btn-ghost">Explore video tools</a>
        </div>
      </section>

      {/* Why us */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 64px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.title} className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 24 }}>{f.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{f.title}</p>
                <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Image Tools */}
      <section
        id="image-tools"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 64px' }}
      >
        <SectionHeader
          label="Image tools"
          title="Edit and convert images"
          desc="All image processing runs entirely in your browser using Canvas API and WebAssembly."
        />
        <ToolGrid tools={IMAGE_TOOLS} />
      </section>

      {/* Video Tools */}
      <section
        id="video-tools"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 64px' }}
      >
        <SectionHeader
          label="Video tools"
          title="Process videos for free"
          desc="Powered by FFmpeg.wasm — the full FFmpeg engine running inside your browser."
        />
        <ToolGrid tools={VIDEO_TOOLS} />
      </section>

      {/* SEO content block */}
      <section
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '0 24px 80px',
          color: 'var(--text-2)',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: 16,
          }}
        >
          Why use PixlrTools?
        </h2>
        <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
          PixlrTools provides free, fast, and private image and video processing tools. Unlike other
          online tools that upload your files to remote servers, PixlrTools processes everything
          locally inside your browser using modern WebAssembly technology. This means your photos,
          videos, and personal media never leave your device.
        </p>
        <p style={{ marginBottom: 16, lineHeight: 1.8 }}>
          Our <strong style={{ color: 'var(--text)' }}>image compressor</strong> reduces file sizes
          by up to 90% without noticeable quality loss, perfect for websites, email attachments, and
          social media uploads. The <strong style={{ color: 'var(--text)' }}>crop and resize tool</strong>{' '}
          lets you trim images to exact dimensions or popular aspect ratios like 1:1 for Instagram
          or 16:9 for YouTube thumbnails.
        </p>
        <p style={{ lineHeight: 1.8 }}>
          For video, our <strong style={{ color: 'var(--text)' }}>free video compressor</strong>{' '}
          uses FFmpeg.wasm to compress MP4 and other video formats directly in the browser with no
          file size limits. All tools are completely free, with no watermarks, no subscriptions, and
          no hidden fees.
        </p>
      </section>
    </>
  )
}

function SectionHeader({ label, title, desc }: { label: string; title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <span
        style={{
          display: 'inline-block',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 99,
          padding: '4px 12px',
          fontSize: 12,
          color: '#a5b4fc',
          fontFamily: 'var(--font-mono)',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.5px',
          marginBottom: 8,
        }}
      >
        {title}
      </h2>
      <p style={{ color: 'var(--text-2)', fontSize: 15 }}>{desc}</p>
    </div>
  )
}

function ToolGrid({ tools }: { tools: typeof IMAGE_TOOLS }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
      }}
    >
      {tools.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          className="tool-card-link"
          style={{ textDecoration: 'none' }}
        >
          <article
            className="card tool-card"
            style={{
              height: '100%',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {tool.badge && (
              <span
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 99,
                  padding: '2px 10px',
                  fontSize: 11,
                  color: '#a5b4fc',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {tool.badge}
              </span>
            )}
            <div style={{ fontSize: 28, marginBottom: 12 }}>{tool.icon}</div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text)',
              }}
            >
              {tool.name}
            </h3>
            <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>{tool.desc}</p>
            <div
              style={{
                marginTop: 16,
                fontSize: 13,
                color: 'var(--brand)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Use tool →
            </div>
          </article>
        </Link>
      ))}
    </div>
  )
}
