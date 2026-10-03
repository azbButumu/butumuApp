import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { ref, set } from 'firebase/database'
import { db } from './firebase'

// 新規登録に必要な共通の招待コード。
// この照合はアプリ内のみ。DB のルールは変更していないため、Firebase API を
// 直接叩ける人には回避される。塞ぎたくなったら firebase-rules/ を参照。
export const INVITE_CODE = 'ebarasoroku'

// auth インスタンスの作り方が Web と React Native で違うため、
// 各プラットフォームの起動時に setAuth() で渡してもらう。
let authInstance = null

export function setAuth(instance) {
  authInstance = instance
  return instance
}

export function getAuthInstance() {
  if (!authInstance) throw new Error('setAuth() が呼ばれていません')
  return authInstance
}

export function subscribeAuthState(callback) {
  return onAuthStateChanged(getAuthInstance(), callback)
}

export function signUpWithEmail(email, password) {
  return createUserWithEmailAndPassword(getAuthInstance(), email.trim(), password)
}

export function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(getAuthInstance(), email.trim(), password)
}

export function sendResetEmail(email) {
  return sendPasswordResetEmail(getAuthInstance(), email.trim())
}

export function signOutUser() {
  return signOut(getAuthInstance())
}

// 部員として登録する。招待コードはアプリ側で照合済みのものを記録に残す。
export function joinWithCode(user, code) {
  return set(ref(db, `members/${user.uid}`), {
    code: code.trim(),
    joinedAt: Date.now(),
    email: user.email || '',
    provider: user.providerData?.[0]?.providerId || 'unknown',
  })
}

const MESSAGES = {
  'auth/invalid-email': 'メールアドレスの形式が正しくありません。',
  'auth/missing-password': 'パスワードを入力してください。',
  'auth/weak-password': 'パスワードは6文字以上にしてください。',
  'auth/email-already-in-use': 'このメールアドレスは既に登録されています。ログインしてください。',
  'auth/invalid-credential': 'メールアドレスまたはパスワードが違います。',
  'auth/wrong-password': 'メールアドレスまたはパスワードが違います。',
  'auth/user-not-found': 'このメールアドレスは登録されていません。',
  'auth/too-many-requests': '試行回数が多すぎます。しばらく待ってからお試しください。',
  'auth/network-request-failed': '通信に失敗しました。接続を確認してください。',
  'auth/popup-closed-by-user': 'ログインがキャンセルされました。',
  'auth/popup-blocked': 'ポップアップがブロックされました。ブラウザの設定を確認してください。',
  'auth/operation-not-allowed':
    'このログイン方法が有効になっていません。Firebase Console で有効化してください。',
  PERMISSION_DENIED: 'データへのアクセスが拒否されました。ログイン状態を確認してください。',
}

export function authErrorMessage(err) {
  if (!err) return ''
  const code = err.code || ''
  if (MESSAGES[code]) return MESSAGES[code]
  if (/permission_denied/i.test(err.message || '')) return MESSAGES.PERMISSION_DENIED
  return err.message || 'エラーが発生しました。'
}
