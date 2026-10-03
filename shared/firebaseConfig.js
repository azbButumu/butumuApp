// Firebase の接続設定。アプリ全体でここだけが正となる。
//
// プロジェクトを移すときはこのファイルの値だけ差し替える。
// public/firebase-config.js は scripts/sync-firebase-config.mjs が
// このファイルから自動生成するので、手で直す必要はない。
//
// 値の取得場所: Firebase Console → プロジェクトの設定 → 全般
//               → マイアプリ → ウェブアプリ → SDK の設定と構成
export const firebaseConfig = {
  apiKey: 'AIzaSyBe_xxS7IZKde-UPc3Qrv9Ud4FXMI2HUlE',
  authDomain: 'akiba-chu.firebaseapp.com',
  databaseURL: 'https://akiba-chu-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'akiba-chu',
  storageBucket: 'akiba-chu.firebasestorage.app',
  messagingSenderId: '56990994439',
  appId: '1:56990994399:web:89173dd078cdfec7aa1aa2',
}

export default firebaseConfig
