import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * "Añadir a pantalla de inicio" installs whatever the manifest points at, not
 * the page you happen to be on — so installing from the panel used to open the
 * public homepage. While she is inside /admin the head points at the admin
 * manifest instead, which starts on the panel and installs as its own app.
 */
export function InstallManifest() {
  const { pathname } = useLocation()
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  useEffect(() => {
    const manifest =
      document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (manifest) {
      manifest.href = isAdmin ? '/admin.webmanifest' : '/manifest.webmanifest'
    }

    const appleTitle = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]',
    )
    if (appleTitle) {
      appleTitle.content = isAdmin ? 'Bienestarte Admin' : 'Bienestarte'
    }
  }, [isAdmin])

  return null
}
