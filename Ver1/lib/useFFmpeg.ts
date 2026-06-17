'use client'
import { useState, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

export interface FFmpegState {
  loaded: boolean
  loading: boolean
  progress: number
  load: () => Promise<FFmpeg | null>
  ffmpeg: FFmpeg | null
}

// Singleton FFmpeg instance shared across hook calls in the same session
let sharedFFmpeg: FFmpeg | null = null
let loadPromise: Promise<FFmpeg> | null = null

export function useFFmpeg(): FFmpegState {
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const load = useCallback(async (): Promise<FFmpeg | null> => {
    // Return existing instance
    if (sharedFFmpeg && loaded) return sharedFFmpeg

    // Wait for existing load
    if (loadPromise) {
      const ff = await loadPromise
      setLoaded(true)
      return ff
    }

    setLoading(true)

    try {
      const ff = new FFmpeg()

      ff.on('progress', ({ progress: p }) => {
        setProgress(Math.round(Math.min(p * 100, 99)))
      })

      // Load FFmpeg core files from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

      loadPromise = (async () => {
        await ff.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        })
        return ff
      })()

      sharedFFmpeg = await loadPromise
      setLoaded(true)
      return sharedFFmpeg
    } catch (err) {
      console.error('FFmpeg load error:', err)
      loadPromise = null
      return null
    } finally {
      setLoading(false)
    }
  }, [loaded])

  return { loaded, loading, progress, load, ffmpeg: sharedFFmpeg }
}
