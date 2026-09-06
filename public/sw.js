/**
 * Network-only service worker.
 *
 * It exists so Android treats the site as installable — Chrome only offers the
 * install prompt to a page that registers a worker with a fetch handler. It
 * deliberately caches nothing: this is a booking form that has to talk to
 * Firestore to be correct, and a stale shell showing yesterday's free slots
 * would be worse than no offline support at all.
 *
 * If offline support is ever wanted, cache the static shell only, and never
 * the Firestore calls.
 */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Present, but delegates to the network by not calling respondWith().
self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  let data = { title: 'Bienestarte Integral', body: '', url: '/' }
  try {
    data = { ...data, ...event.data.json() }
  } catch {
    const text = event.data?.text()
    if (text) data.body = text
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => 'focus' in client)
      if (existing) {
        if (typeof existing.navigate === 'function') existing.navigate(url)
        return existing.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
