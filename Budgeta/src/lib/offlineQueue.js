/**
 * offlineQueue.js — IndexedDB queue for transactions saved while offline.
 *
 * When the device has no network, addTransaction() stores the payload here.
 * On next app open / reconnect, syncOfflineQueue() (in db.js) drains it.
 */

const DB_NAME    = 'spendseer_offline'
const DB_VERSION = 1
const STORE      = 'pending_transactions'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) {
        // local_id is our key — a UUID we generate client-side
        db.createObjectStore(STORE, { keyPath: 'local_id' })
      }
    }
    req.onsuccess  = (e) => resolve(e.target.result)
    req.onerror    = (e) => reject(e.target.error)
  })
}

/** Add a transaction payload to the offline queue. Returns the local_id. */
export async function queueTransaction(tx) {
  const db       = await openDB()
  const local_id = crypto.randomUUID()
  const entry    = { ...tx, local_id, queued_at: new Date().toISOString() }

  return new Promise((resolve, reject) => {
    const tr  = db.transaction(STORE, 'readwrite')
    const req = tr.objectStore(STORE).add(entry)
    tr.oncomplete = () => resolve(local_id)
    tr.onerror    = (e) => reject(e.target.error)
  })
}

/** Return all pending transactions, oldest first. */
export async function getPendingTransactions() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tr  = db.transaction(STORE, 'readonly')
    const req = tr.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror   = (e) => reject(e.target.error)
  })
}

/** Remove a successfully synced entry by its local_id. */
export async function removePendingTransaction(local_id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tr = db.transaction(STORE, 'readwrite')
    tr.objectStore(STORE).delete(local_id)
    tr.oncomplete = () => resolve()
    tr.onerror    = (e) => reject(e.target.error)
  })
}

/** How many transactions are waiting to sync. */
export async function pendingCount() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tr  = db.transaction(STORE, 'readonly')
    const req = tr.objectStore(STORE).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror   = (e) => reject(e.target.error)
  })
}
