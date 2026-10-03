// Firebase の接続設定。アプリ全体でここだけが正となる。
//
// プロジェクトを移すときはこのファイルの値だけ差し替える。
// public/firebase-config.js は scripts/sync-firebase-config.mjs が
// このファイルから自動生成するので、手で直す必要はない。
//
// 値の取得場所: Firebase Console → プロジェクトの設定 → 全般
//               → マイアプリ → ウェブアプリ → SDK の設定と構成
export const firebaseConfig = {
  apiKey: 'AIzaSyCcB4o6LLgixHzUkmsX4dWWsQ0zQnXvsh0',
  authDomain: 'butumuapp-81ff5.firebaseapp.com',
  databaseURL: 'https://butumuapp-81ff5-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'butumuapp-81ff5',
  storageBucket: 'butumuapp-81ff5.firebasestorage.app',
  messagingSenderId: '449725453120',
  appId: '1:449725453120:web:addba9097cb1e4238b60a5',
  // Analytics は未使用。Console の出力をそのまま残している
  measurementId: 'G-FBSMV80NBJ',
}

export default firebaseConfig
