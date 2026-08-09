import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { isFirebaseConfigured, storage } from '../lib/firebase'
import { uid } from './localDb'

export async function uploadPaymentProof(file: File): Promise<{
  url: string
  name: string
}> {
  if (!isFirebaseConfigured || !storage) {
    // Demo mode: store as data URL in localStorage-backed flow
    const dataUrl = await fileToDataUrl(file)
    return { url: dataUrl, name: file.name }
  }

  const path = `payment-proofs/${uid('proof')}_${file.name.replace(/\s+/g, '_')}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  return { url, name: file.name }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}
