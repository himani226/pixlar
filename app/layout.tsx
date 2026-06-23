import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

const SITE_URL = 'https://yourdomain.com' // ← replace with your Hostinger domain

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Pixlar — Free Online Image & Video Tools',
    template: '%s | Pixlar',
  },
  description:
    'Free online tools to compress images, crop & resize, add text overlay, remove backgrounds, convert formats, compress videos and more. No signup, no upload to server — 100% private.',
  keywords: [
    'image compressor',
    'compress image online free',
    'crop image online',
    'resize image free',
    'text overlay image',
    'background remover',
    'image format converter',
    'compress video online free',
    'trim video online',
    'convert video format',
    'online image tools',
    'free photo editor',
  ],
  authors: [{ name: 'Pixlar' }],
  creator: 'Pixlar',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Pixlar',
    title: 'Pixlar — Free Online Image & Video Tools',
    description:
      'Compress, crop, resize, convert images & videos for free. No account needed. Your files never leave your browser.',
    images: [{ url: '/og/og-default.png', width: 1200, height: 630, alt: 'Pixlar' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pixlar — Free Image & Video Tools',
    description: 'Compress, crop, convert images & videos for free. 100% private.',
    images: ['/og/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-site-verification-code',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Pixlar',
  url: SITE_URL,
  description:
    'Free online image and video processing tools. Compress, crop, resize, add text, remove backgrounds, convert formats — all processed in your browser.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'Image compression',
    'Image crop and resize',
    'Text overlay on images',
    'Background remover',
    'Image format conversion',
    'Video compression',
    'Video trimming',
    'Video merging',
    'Video format conversion',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href={SITE_URL} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#f4f5fa" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}

function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(244,245,250,0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pixlar-icon.png" alt="Pixlar" style={{ height: 32, width: 'auto', display: 'block' }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--navy)',
            letterSpacing: '-0.5px',
          }}>
            Pixlar
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/#image-tools" className="btn-ghost" style={{ padding: '7px 16px', fontSize: 14 }}>
            Image
          </Link>
          <Link href="/#video-tools" className="btn-ghost" style={{ padding: '7px 16px', fontSize: 14 }}>
            Video
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 80, background: 'var(--bg2)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 32px' }}>
        {/* Top: logo + columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(3, 1fr)',
          gap: 32,
          marginBottom: 40,
        }}>
          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pixlar-icon.png" alt="Pixlar" style={{ height: 28, width: 'auto' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--navy)' }}>
                Pixlar
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 280 }}>
              The web&apos;s fastest privacy-first media toolkit. All processing happens locally on your device.
            </p>
          </div>

          {/* Tools */}
          <FooterCol title="Tools" links={[
            { label: 'Image', href: '/#image-tools' },
            { label: 'Video', href: '/#video-tools' },
            { label: 'Background Remover', href: '/tools/remove-background' },
          ]} />

          {/* Company */}
          <FooterCol title="Company" links={[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
          ]} />

          {/* Built with */}
          <FooterCol title="Built with" links={[
            { label: 'WebAssembly', href: '/#image-tools' },
            { label: 'Canvas API', href: '/#image-tools' },
          ]} />
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 24,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12.5,
          color: 'var(--text-3)',
        }}>
          <span>© {year} Pixlar — All tools are free forever. No account needed.</span>
          <span>Your files never leave your browser.</span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-3)',
        marginBottom: 14,
      }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {links.map((l) => (
          <Link key={l.label} href={l.href}
            style={{ fontSize: 13.5, color: 'var(--text-2)', textDecoration: 'none' }}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
