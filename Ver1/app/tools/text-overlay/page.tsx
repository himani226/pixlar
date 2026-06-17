import type { Metadata } from 'next'
import TextOverlayClient from './client'

export const metadata: Metadata = {
  title: 'Add Text to Image Online Free — Text Overlay Tool',
  description:
    'Add text, captions, or watermarks to images online for free. Choose font, size, color, position. Works in browser — no upload needed, instant download.',
  keywords: ['add text to image', 'text overlay image', 'watermark image free', 'caption image online', 'write on photo'],
  alternates: { canonical: '/tools/text-overlay' },
}

export default function TextOverlayPage() {
  return <TextOverlayClient />
}
