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

// 秋葉注だけは旧プロジェクト(akiba-chu)のデータベースを使い続ける。
// 旧 DB はルール未設定(ログイン不要)なので、認証は上の部室アプリ側で行い、
// データの読み書きだけをこちらに向ける。
export const akibaFirebaseConfig = {
  apiKey: 'AIzaSyBe_xxS7IZKde-UPc3Qrv9Ud4FXMI2HUlE',
  authDomain: 'akiba-chu.firebaseapp.com',
  databaseURL: 'https://akiba-chu-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'akiba-chu',
  storageBucket: 'akiba-chu.firebasestorage.app',
  messagingSenderId: '56990994439',
  appId: '1:56990994399:web:89173dd078cdfec7aa1aa2',
}

export default firebaseConfig
