import type { Metadata } from 'next'
import CropResizeClient from './client'

export const metadata: Metadata = {
  title: 'Free Image Crop & Resize Tool — Online, No Upload',
  description:
    'Crop and resize images online for free. Set exact pixel dimensions or choose aspect ratios like 1:1, 16:9, 4:3. Works in your browser — no upload needed.',
  keywords: ['crop image online', 'resize image free', 'image resizer', 'crop photo online', 'resize photo'],
  alternates: { canonical: '/tools/crop-resize' },
}

export default function CropResizePage() {
  return <CropResizeClient />
}
