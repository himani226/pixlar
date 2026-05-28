import type { Metadata } from 'next'
import ConvertVideoClient from './client'

export const metadata: Metadata = {
  title: 'Free Video Format Converter — MP4 WebM MKV Online',
  description:
    'Convert videos between MP4, WebM, AVI, MKV, MOV formats online for free. No upload to server — converted in your browser.',
  keywords: ['video converter online free', 'convert mp4 to webm', 'convert video format', 'video format converter'],
  alternates: { canonical: '/tools/convert-video' },
}

export default function ConvertVideoPage() {
  return <ConvertVideoClient />
}
