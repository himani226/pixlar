import type { Metadata } from 'next'
import MergeVideoClient from './client'

export const metadata: Metadata = {
  title: 'Free Video Merger — Join Multiple Videos Online',
  description:
    'Merge and combine multiple video clips into one online for free. No upload needed — works in your browser using FFmpeg.wasm.',
  keywords: ['merge videos online', 'join videos free', 'combine video clips', 'video merger online'],
  alternates: { canonical: '/tools/merge-video' },
}

export default function MergeVideoPage() {
  return <MergeVideoClient />
}
