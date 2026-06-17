import type { Metadata } from 'next'
import TrimVideoClient from './client'

export const metadata: Metadata = {
  title: 'Free Video Trimmer Online — Cut MP4 Videos in Browser',
  description:
    'Trim and cut videos online for free. Set start and end time to cut the exact clip you need. Works in your browser — no upload to server.',
  keywords: ['trim video online', 'cut video online free', 'trim mp4', 'video cutter', 'clip video online'],
  alternates: { canonical: '/tools/trim-video' },
}

export default function TrimVideoPage() {
  return <TrimVideoClient />
}
