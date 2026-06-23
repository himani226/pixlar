import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Pixlar privacy policy. Your files never leave your browser.',
}

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
        Privacy Policy
      </h1>
      <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 36 }}>Last updated: January 2025</p>

      {[
        {
          title: 'No data collection',
          body: 'Pixlar does not collect, store, or transmit any personal data. We do not have user accounts, login systems, or databases storing your information.',
        },
        {
          title: 'Your files stay in your browser',
          body: 'All image and video processing happens entirely in your web browser using JavaScript and WebAssembly (via FFmpeg.wasm). Your files are never uploaded to our servers. They never leave your device.',
        },
        {
          title: 'No cookies (except analytics)',
          body: 'We do not use cookies for tracking or advertising. We may use privacy-respecting analytics (such as Plausible or similar) to measure page visits in aggregate — no individual data is stored.',
        },
        {
          title: 'No third-party data sharing',
          body: 'Since we do not collect your data, we cannot share it with third parties. We have no advertising partnerships that track users.',
        },
        {
          title: 'Open source libraries',
          body: 'We use open source libraries (FFmpeg.wasm, browser-image-compression) that run locally in your browser. These libraries are loaded from CDN and operate under their own open source licenses.',
        },
        {
          title: 'Contact',
          body: 'If you have any questions about our privacy practices, contact us at: privacy@yourdomain.com',
        },
      ].map((s) => (
        <div key={s.title} style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {s.title}
          </h2>
          <p style={{ color: 'var(--text-2)', lineHeight: 1.8 }}>{s.body}</p>
        </div>
      ))}
    </div>
  )
}
