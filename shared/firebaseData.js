import { ref, onValue, push, set, update, remove } from 'firebase/database'
import { akibaDb, db } from './firebase'

// 指定した DB に対する読み書き関数一式を作る
function createDataApi(database) {
  function subscribeList(path, callback) {
    const listRef = ref(database, path)
    return onValue(listRef, (snap) => {
      const val = snap.val()
      const list = val ? Object.entries(val).map(([id, v]) => ({ id, ...v })) : []
      callback(list)
    })
  }

  function addItem(path, data) {
    const itemRef = push(ref(database, path))
    set(itemRef, { ...data, id: itemRef.key })
    return itemRef.key
  }

  function updateItem(path, id, changes) {
    return update(ref(database, `${path}/${id}`), changes)
  }

  function removeItem(path, id) {
    return remove(ref(database, `${path}/${id}`))
  }

  function subscribeValue(path, callback) {
    return onValue(ref(database, path), (snap) => callback(snap.val()))
  }

  function setItem(path, id, data) {
    return set(ref(database, `${path}/${id}`), data)
  }

  function setValue(path, data) {
    return set(ref(database, path), data)
  }

  return { subscribeList, addItem, updateItem, removeItem, subscribeValue, setItem, setValue }
}

export const {
  subscribeList,
  addItem,
  updateItem,
  removeItem,
  subscribeValue,
  setItem,
  setValue,
} = createDataApi(db)

// 秋葉注専用。旧 akiba-chu プロジェクトの DB を読み書きする
export const akibaData = createDataApi(akibaDb)
