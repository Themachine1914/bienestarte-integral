import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { isFirebaseConfigured, storage } from '../lib/firebase'
import { uid } from './localDb'

const MAX_BYTES = 8 * 1024 * 1024

export async function uploadPaymentProof(file: File): Promise<{
  url: string
  name: string
}> {
  if (file.size > MAX_BYTES) {
    throw new Error(
      'El comprobante no puede pesar más de 8 MB. Usa una foto más liviana o un PDF más pequeño.',
    )
  }

  const contentType = contentTypeFor(file)
  if (!isAllowedType(contentType)) {
    throw new Error('El comprobante debe ser una imagen (JPG, PNG) o un PDF.')
  }

  if (!isFirebaseConfigured || !storage) {
    const dataUrl = await fileToDataUrl(file)
    return { url: dataUrl, name: file.name }
  }

  const path = `payment-proofs/${uid('proof')}_${safeName(file.name)}`
  const storageRef = ref(storage, path)
  try {
    await uploadBytes(storageRef, file, { contentType })
    const url = await getDownloadURL(storageRef)
    return { url, name: file.name }
  } catch (error) {
    throw new Error(uploadErrorMessage(error))
  }
}

function contentTypeFor(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  return file.type || 'application/octet-stream'
}

function isAllowedType(type: string): boolean {
  return type.startsWith('image/') || type === 'application/pdf'
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
}

function uploadErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''
  const server = serverResponseOf(error)

  if (code === 'storage/unauthorized') {
    return 'No se pudo guardar el comprobante. Hay que publicar las reglas de Storage en Firebase.'
  }
  if (
    code === 'storage/unknown' ||
    code === 'storage/bucket-not-found' ||
    /not found|does not exist/i.test(server)
  ) {
    return 'No se pudo guardar el comprobante: Storage de Firebase no está creado. En la consola, abre Storage y pulsa Comenzar.'
  }
  if (code === 'storage/retry-limit-exceeded' || code === 'storage/canceled') {
    return 'La subida del comprobante se interrumpió. Inténtalo de nuevo.'
  }
  if (error instanceof Error && !error.message.includes('Firebase Storage')) {
    return error.message
  }
  return 'No se pudo guardar el comprobante. Inténtalo de nuevo.'
}

function serverResponseOf(error: unknown): string {
  if (typeof error !== 'object' || !error || !('customData' in error)) return ''
  const data = (error as { customData?: { serverResponse?: unknown } }).customData
  return typeof data?.serverResponse === 'string' ? data.serverResponse : ''
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}
