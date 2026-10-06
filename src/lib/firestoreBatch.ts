import { writeBatch, type Firestore, type WriteBatch } from 'firebase/firestore'

/** Firestore rejects a batch above 500 operations. Stay under that. */
const BATCH_SIZE = 400

export async function commitInBatches(
  database: Firestore,
  ops: Array<(batch: WriteBatch) => void>,
): Promise<void> {
  if (ops.length === 0) return
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = writeBatch(database)
    for (const op of ops.slice(i, i + BATCH_SIZE)) op(batch)
    await batch.commit()
  }
}
