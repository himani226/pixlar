import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

const SITE_URL = 'https://yourdomain.com' // ← replace with your Hostinger domain

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PixlrTools — Free Online Image & Video Tools',
    template: '%s | PixlrTools',
  },
  description:
    'Free online tools to compress images, crop & resize, add text overlay, convert formats, compress videos and more. No signup, no upload to server — 100% private.',
  keywords: [
    'image compressor',
    'compress image online free',
    'crop image online',
    'resize image free',
    'text overlay image',
    'image format converter',
    'compress video online free',
    'trim video online',
    'convert video format',
    'online image tools',
    'free photo editor',
  ],
  authors: [{ name: 'PixlrTools' }],
  creator: 'PixlrTools',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'PixlrTools',
    title: 'PixlrTools — Free Online Image & Video Tools',
    description:
      'Compress, crop, resize, convert images & videos for free. No account needed. Your files never leave your browser.',
    images: [{ url: '/og/og-default.png', width: 1200, height: 630, alt: 'PixlrTools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixlrTools — Free Image & Video Tools',
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
    // google: 'your-google-site-verification-code',  // add after deploying
  },
}

// JSON-LD structured data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PixlrTools',
  url: SITE_URL,
  description:
    'Free online image and video processing tools. Compress, crop, resize, add text, convert formats — all processed in your browser.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Image compression',
    'Image crop and resize',
    'Text overlay on images',
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0c0c10" />
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
        background: 'rgba(12,12,16,0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text)',
            textDecoration: 'none',
            letterSpacing: '-0.5px',
          }}
        >
          Pixlr<span style={{ color: 'var(--brand)' }}>Tools</span>
        </Link>
        <nav style={{ display: 'flex', gap: 8 }}>
          <Link href="/#image-tools" className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>
            Image
          </Link>
          <Link href="/#video-tools" className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>
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
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        marginTop: 80,
        padding: '40px 24px',
        textAlign: 'center',
        color: 'var(--text-3)',
        fontSize: 13,
      }}
    >
      <p style={{ marginBottom: 8 }}>
        © {year} PixlrTools — All tools are free forever. No account needed.
      </p>
      <p>
        Your files are processed locally in your browser and{' '}
        <strong style={{ color: 'var(--text-2)' }}>never uploaded to our servers</strong>.
      </p>
      <div style={{ marginTop: 16, display: 'flex', gap: 16, justifyContent: 'center' }}>
        <Link href="/privacy" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Privacy</Link>
        <Link href="/terms" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Terms</Link>
      </div>
    </footer>
  )
}
