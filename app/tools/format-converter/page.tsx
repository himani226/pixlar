import type { Metadata } from 'next'
import FormatConverterClient from './client'

export const metadata: Metadata = {
  title: 'Free Image Format Converter — JPG PNG WebP Online',
  description:
    'Convert images between JPG, PNG, WebP, BMP formats online for free. Instant conversion in your browser. No upload, no server, 100% private.',
  keywords: ['image format converter', 'jpg to png', 'png to jpg', 'convert to webp', 'image converter online free'],
  alternates: { canonical: '/tools/format-converter' },
}

export default function FormatConverterPage() {
  return <FormatConverterClient />
}
