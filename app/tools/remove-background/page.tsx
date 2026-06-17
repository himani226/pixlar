import type { Metadata } from 'next'
import RemoveBackgroundClient from './client'

export const metadata: Metadata = {
  title: 'Free Background Remover — Remove Image Background Online',
  description:
    'Remove image background automatically for free. Export as transparent PNG, replace with solid color or custom image. 100% in browser — no upload.',
  keywords: [
    'remove background online free',
    'background remover',
    'transparent background',
    'remove bg free',
    'image background eraser',
  ],
  alternates: { canonical: '/tools/remove-background' },
  openGraph: {
    title: 'Free Background Remover',
    description: 'Remove image backgrounds instantly. Export transparent PNG or replace with any color or image.',
    url: '/tools/remove-background',
  },
}

export default function RemoveBackgroundPage() {
  return <RemoveBackgroundClient />
}
