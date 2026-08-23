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
