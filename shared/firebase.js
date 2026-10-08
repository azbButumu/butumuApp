import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { akibaFirebaseConfig, firebaseConfig } from './firebaseConfig'

if (!firebaseConfig.databaseURL) {
  // 未設定のまま getDatabase() を呼ぶと分かりにくいエラーになるため、先に止める
  throw new Error(
    'firebaseConfig.databaseURL が未設定です。Firebase Console → 構築 → ' +
      'Realtime Database を作成し、表示される URL を shared/firebaseConfig.js に入れてください。',
  )
}

export const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

// 秋葉注専用。旧プロジェクトの DB を別名のアプリとして開く
export const akibaApp = initializeApp(akibaFirebaseConfig, 'akiba')
export const akibaDb = getDatabase(akibaApp)
