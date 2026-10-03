import { useEffect, useState } from 'react'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { app } from '../../shared/firebase'
import { subscribeValue } from '../../shared/firebaseData'
import { GRADES, isProfileComplete } from '../../shared/members'
import {
  INVITE_CODE,
  authErrorMessage,
  joinWithCode,
  sendResetEmail,
  setAuth,
  updateProfile,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  subscribeAuthState,
} from '../../shared/auth'
import './AuthGate.css'

setAuth(getAuth(app))

function AuthGate({ children }) {
  const [user, setUser] = useState(undefined) // undefined = 判定中
  const [member, setMember] = useState(undefined)

  useEffect(() => subscribeAuthState(setUser), [])

  useEffect(() => {
    if (!user) {
      setMember(undefined)
      return
    }
    return subscribeValue(`members/${user.uid}`, setMember)
  }, [user])

  if (user === undefined) {
    return <div className="auth-screen"><div className="auth-loading">読み込み中...</div></div>
  }
  if (!user) return <SignInScreen />
  if (member === undefined) {
    return <div className="auth-screen"><div className="auth-loading">確認中...</div></div>
  }
  if (!member) return <JoinScreen user={user} needsCode />
  if (!isProfileComplete(member)) return <JoinScreen user={user} />
  return children
}

function SignInScreen() {
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignUp = mode === 'signup'

  async function submit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (isSignUp) {
      if (invite.trim() !== INVITE_CODE) {
        setError('招待パスワードが違います。')
        return
      }
      if (!name.trim()) {
        setError('本名を入力してください。')
        return
      }
      if (!grade) {
        setError('学年を選んでください。')
        return
      }
    }
    setBusy(true)
    try {
      if (isSignUp) {
        const cred = await signUpWithEmail(email, password)
        await joinWithCode(cred.user, invite, { name, grade })
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await signInWithPopup(getAuth(app), new GoogleAuthProvider())
      // 招待コードの入力は JoinScreen 側で求める
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function reset() {
    setError('')
    setInfo('')
    if (!email.trim()) {
      setError('メールアドレスを入力してください。')
      return
    }
    try {
      await sendResetEmail(email)
      setInfo('パスワード再設定のメールを送りました。')
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">物無App</h1>
        <p className="auth-lead">
          {isSignUp ? '新しいアカウントを作成します。' : '部員向けのアプリです。ログインしてください。'}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(''); setInfo('') }}
          >
            ログイン
          </button>
          <button
            type="button"
            className={`auth-tab ${isSignUp ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setInfo('') }}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>メールアドレス</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <label>パスワード</label>
            <input
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? '6文字以上' : ''}
            />
          </div>
          {isSignUp && (
            <>
              <div className="field">
                <label>本名</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 山田 太郎"
                />
              </div>
              <div className="field">
                <label>学年</label>
                <div className="grade-row">
                  {GRADES.map((g) => (
                    <button
                      type="button"
                      key={g}
                      className={`grade-chip ${grade === g ? 'active' : ''}`}
                      onClick={() => setGrade(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>招待パスワード</label>
                <input
                  type="password"
                  value={invite}
                  onChange={(e) => setInvite(e.target.value)}
                  placeholder="部内で共有されているもの"
                />
              </div>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? '処理中...' : isSignUp ? 'アカウントを作成' : 'ログイン'}
          </button>
        </form>

        {!isSignUp && (
          <button type="button" className="auth-link" onClick={reset}>
            パスワードを忘れた場合
          </button>
        )}

        <div className="auth-divider"><span>または</span></div>

        <button type="button" className="btn btn-block auth-google" onClick={google} disabled={busy}>
          Google でログイン
        </button>

        <p className="auth-note">
          初めて Google でログインする場合も、次の画面で招待パスワードの入力が必要です。
        </p>
      </div>
    </div>
  )
}

function JoinScreen({ user, needsCode = false }) {
  const [invite, setInvite] = useState('')
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (needsCode && invite.trim() !== INVITE_CODE) {
      setError('招待パスワードが違います。')
      return
    }
    if (!name.trim()) {
      setError('本名を入力してください。')
      return
    }
    if (!grade) {
      setError('学年を選んでください。')
      return
    }
    setBusy(true)
    try {
      if (needsCode) {
        await joinWithCode(user, invite, { name, grade })
      } else {
        await updateProfile(user.uid, { name, grade })
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">{needsCode ? '部員登録' : 'プロフィールの入力'}</h1>
        <p className="auth-lead">
          {user.email || 'このアカウント'} でログインしました。
          <br />
          {needsCode
            ? '招待パスワードと、あなたの情報を入力してください。'
            : '本名と学年が未登録です。入力してください。'}
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label>本名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 山田 太郎"
              autoFocus
            />
          </div>
          <div className="field">
            <label>学年</label>
            <div className="grade-row">
              {GRADES.map((g) => (
                <button
                  type="button"
                  key={g}
                  className={`grade-chip ${grade === g ? 'active' : ''}`}
                  onClick={() => setGrade(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          {needsCode && (
            <div className="field">
              <label>招待パスワード</label>
              <input
                type="password"
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
              />
            </div>
          )}
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? '保存中...' : '続ける'}
          </button>
        </form>
        <button type="button" className="auth-link" onClick={signOutUser}>
          別のアカウントでログインする
        </button>
      </div>
    </div>
  )
}

export default AuthGate
