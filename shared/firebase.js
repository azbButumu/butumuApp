import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// akiba-chu プロジェクトを流用(秋葉注ページ public/akiba-chu.html と同じ設定)
const firebaseConfig = {
  apiKey: 'AIzaSyBe_xxS7IZKde-UPc3Qrv9Ud4FXMI2HUlE',
  authDomain: 'akiba-chu.firebaseapp.com',
  databaseURL: 'https://akiba-chu-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'akiba-chu',
  storageBucket: 'akiba-chu.firebasestorage.app',
  messagingSenderId: '56990994439',
  appId: '1:56990994399:web:89173dd078cdfec7aa1aa2',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
