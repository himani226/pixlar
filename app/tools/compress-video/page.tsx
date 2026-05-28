import type { Metadata } from 'next'
import CompressVideoClient from './client'

export const metadata: Metadata = {
  title: 'Free Video Compressor Online — Compress MP4 Without Quality Loss',
  description:
    'Compress MP4 and other video files online for free. Reduce video size while keeping quality. Powered by FFmpeg.wasm — runs entirely in your browser.',
  keywords: ['video compressor', 'compress video online free', 'reduce video size', 'mp4 compressor', 'compress video without losing quality'],
  alternates: { canonical: '/tools/compress-video' },
}

export default function CompressVideoPage() {
  return <CompressVideoClient />
}
