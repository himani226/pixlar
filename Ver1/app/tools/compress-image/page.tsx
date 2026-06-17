import type { Metadata } from 'next'
import CompressImageClient from './client'

export const metadata: Metadata = {
  title: 'Free Image Compressor — Reduce Image Size Online',
  description:
    'Compress JPG, PNG, and WebP images online for free. Reduce image file size by up to 90% without losing quality. No upload, 100% private, instant download.',
  keywords: ['image compressor', 'compress image online', 'reduce image size', 'jpg compressor', 'png compressor'],
  alternates: { canonical: '/tools/compress-image' },
  openGraph: {
    title: 'Free Image Compressor',
    description: 'Compress images online for free. No upload needed — works in your browser.',
    url: '/tools/compress-image',
  },
}

export default function CompressImagePage() {
  return <CompressImageClient />
}
