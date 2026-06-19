import type { Metadata } from 'next'
import BlurBackgroundClient from './client'

export const metadata: Metadata = {
  title: 'Free Background Blur Tool — Portrait Mode Online',
  description:
    'Blur the background of any photo for free. Get a professional portrait-mode effect with adjustable blur intensity. 100% in browser — no upload.',
  keywords: [
    'blur background online free',
    'portrait mode photo',
    'background blur tool',
    'depth of field effect online',
    'bokeh effect photo',
  ],
  alternates: { canonical: '/tools/blur-background' },
  openGraph: {
    title: 'Free Background Blur Tool',
    description: 'Blur photo backgrounds for a portrait-mode effect. Adjustable intensity, instant download.',
    url: '/tools/blur-background',
  },
}

export default function BlurBackgroundPage() {
  return <BlurBackgroundClient />
}