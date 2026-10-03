import { ref, onValue, push, set, update, remove } from 'firebase/database'
import { db } from '../firebase'

export function subscribeList(path, callback) {
  const listRef = ref(db, path)
  return onValue(listRef, (snap) => {
    const val = snap.val()
    const list = val ? Object.entries(val).map(([id, v]) => ({ id, ...v })) : []
    callback(list)
  })
}

export function addItem(path, data) {
  const itemRef = push(ref(db, path))
  set(itemRef, { ...data, id: itemRef.key })
  return itemRef.key
}

export function updateItem(path, id, changes) {
  return update(ref(db, `${path}/${id}`), changes)
}

export function removeItem(path, id) {
  return remove(ref(db, `${path}/${id}`))
}

export function subscribeValue(path, callback) {
  return onValue(ref(db, path), (snap) => callback(snap.val()))
}

export function setItem(path, id, data) {
  return set(ref(db, `${path}/${id}`), data)
}

export function setValue(path, data) {
  return set(ref(db, path), data)
}
