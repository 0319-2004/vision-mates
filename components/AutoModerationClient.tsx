'use client'

import { useEffect } from 'react'
import { startAutoModeration } from '@/lib/moderation'

export default function AutoModerationClient() {
  useEffect(() => {
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => startAutoModeration())
      : window.setTimeout(() => startAutoModeration(), 0)

    return () => {
      if (typeof id === 'number') {
        window.clearTimeout(id)
      } else if (id && 'cancelIdleCallback' in window) {
        // @ts-ignore
        window.cancelIdleCallback(id)
      }
    }
  }, [])

  return null
}


