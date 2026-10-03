import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { firebaseConfig } from './firebaseConfig'

if (!firebaseConfig.databaseURL) {
  // 未設定のまま getDatabase() を呼ぶと分かりにくいエラーになるため、先に止める
  throw new Error(
    'firebaseConfig.databaseURL が未設定です。Firebase Console → 構築 → ' +
      'Realtime Database を作成し、表示される URL を shared/firebaseConfig.js に入れてください。',
  )
}

export const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
