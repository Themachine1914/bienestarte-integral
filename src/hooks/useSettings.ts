import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS } from '../lib/defaults'
import { getSettings } from '../services/settings'
import type { AppSettings } from '../types'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getSettings()
      .then((s) => {
        if (mounted) setSettings(s)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { settings, loading, setSettings }
}
