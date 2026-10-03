// ログインと招待パスワードの関門。_layout.tsx でアプリ全体を包む。
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Google from 'expo-auth-session/providers/google'
import { GoogleAuthProvider, getReactNativePersistence, initializeAuth, signInWithCredential } from 'firebase/auth'
import { ReactNode, useEffect, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import {
  INVITE_CODE,
  authErrorMessage,
  joinWithCode,
  sendResetEmail,
  setAuth,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  subscribeAuthState,
} from '@shared/auth'
import { app } from '@shared/firebase'
import { subscribeValue } from '@shared/firebaseData'

import { Btn, Field, Input } from '@/components/ui'
import { useTheme } from '@/theme'

// Google ログインに必要なクライアントIDはプラットフォームごとに違う。
// これが無いまま useIdTokenAuthRequest を呼ぶと例外になるため、
// フックは GoogleButton の中に置き、ID がある場合だけマウントする。
const GOOGLE_CLIENT_ID =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
    : Platform.OS === 'android'
      ? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
      : process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID

// React Native では永続化に AsyncStorage を明示的に渡す必要がある
// (指定しないと再起動ごとにログアウトしてしまう)
const auth = setAuth(
  initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }),
)

export function AuthGate({ children }: { children: ReactNode }) {
  const c = useTheme()
  const [user, setUser] = useState<any>(undefined) // undefined = 判定中
  const [member, setMember] = useState<any>(undefined)

  useEffect(() => subscribeAuthState(setUser), [])

  useEffect(() => {
    if (!user) {
      setMember(undefined)
      return
    }
    return subscribeValue(`members/${user.uid}`, setMember)
  }, [user])

  if (user === undefined || (user && member === undefined)) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    )
  }
  if (!user) return <SignInScreen />
  if (!member) return <JoinScreen user={user} />
  return <>{children}</>
}

function SignInScreen() {
  const c = useTheme()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setError('')
    setInfo('')
    if (isSignUp && invite.trim() !== INVITE_CODE) {
      setError('招待パスワードが違います。')
      return
    }
    setBusy(true)
    try {
      if (isSignUp) {
        const cred = await signUpWithEmail(email, password)
        await joinWithCode(cred.user, invite)
      } else {
        await signInWithEmail(email, password)
      }
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
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.card, { backgroundColor: c.panelBg, borderColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>部室アプリ</Text>
        <Text style={[styles.lead, { color: c.textMuted }]}>
          {isSignUp
            ? '新しいアカウントを作成します。'
            : '部員向けのアプリです。ログインしてください。'}
        </Text>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => { setIsSignUp(false); setError(''); setInfo('') }}
            style={[
              styles.tab,
              !isSignUp
                ? { backgroundColor: c.accent, borderColor: 'transparent' }
                : { backgroundColor: c.hoverBg, borderColor: c.border },
            ]}>
            <Text style={{ fontSize: 13, color: !isSignUp ? '#fff' : c.textMuted }}>ログイン</Text>
          </Pressable>
          <Pressable
            onPress={() => { setIsSignUp(true); setError(''); setInfo('') }}
            style={[
              styles.tab,
              isSignUp
                ? { backgroundColor: c.accent, borderColor: 'transparent' }
                : { backgroundColor: c.hoverBg, borderColor: c.border },
            ]}>
            <Text style={{ fontSize: 13, color: isSignUp ? '#fff' : c.textMuted }}>新規登録</Text>
          </Pressable>
        </View>

        <Field label="メールアドレス">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </Field>
        <Field label="パスワード">
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder={isSignUp ? '6文字以上' : ''}
            secureTextEntry
            autoCapitalize="none"
          />
        </Field>
        {isSignUp && (
          <Field label="招待パスワード">
            <Input
              value={invite}
              onChangeText={setInvite}
              placeholder="部内で共有されているもの"
              secureTextEntry
              autoCapitalize="none"
            />
          </Field>
        )}

        {error ? <Notice text={error} kind="error" /> : null}
        {info ? <Notice text={info} kind="info" /> : null}

        <Btn
          label={busy ? '処理中...' : isSignUp ? 'アカウントを作成' : 'ログイン'}
          variant="primary"
          disabled={busy}
          onPress={submit}
        />

        {!isSignUp && (
          <Pressable onPress={reset} style={styles.linkBtn}>
            <Text style={{ fontSize: 12, color: c.accent }}>パスワードを忘れた場合</Text>
          </Pressable>
        )}

        {GOOGLE_CLIENT_ID ? (
          <>
            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: c.border }]} />
              <Text style={{ fontSize: 11, color: c.textMuted }}>または</Text>
              <View style={[styles.line, { backgroundColor: c.border }]} />
            </View>
            <GoogleButton busy={busy} onError={setError} />
            <Text style={[styles.note, { color: c.textMuted }]}>
              初めて Google でログインする場合も、次の画面で招待パスワードの入力が必要です。
            </Text>
          </>
        ) : (
          <Text style={[styles.note, { color: c.textMuted }]}>
            Google ログインは未設定です。mobile/.env にこの端末向けのクライアントID
            ({Platform.OS === 'ios'
              ? 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
              : Platform.OS === 'android'
                ? 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'
                : 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'}
            ) を設定すると使えるようになります。
          </Text>
        )}
      </View>
    </ScrollView>
  )
}

// クライアントIDがある場合のみマウントされる。フックをここに閉じ込めている。
function GoogleButton({
  busy,
  onError,
}: {
  busy: boolean
  onError: (msg: string) => void
}) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  })

  useEffect(() => {
    if (response?.type !== 'success') return
    const idToken = response.params?.id_token
    if (!idToken) return
    signInWithCredential(auth, GoogleAuthProvider.credential(idToken)).catch((err) =>
      onError(authErrorMessage(err)),
    )
  }, [response, onError])

  return (
    <Btn
      label="Google でログイン"
      disabled={!request || busy}
      onPress={() => promptAsync()}
    />
  )
}

function JoinScreen({ user }: { user: any }) {
  const c = useTheme()
  const [invite, setInvite] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setError('')
    if (invite.trim() !== INVITE_CODE) {
      setError('招待パスワードが違います。')
      return
    }
    setBusy(true)
    try {
      await joinWithCode(user, invite)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.card, { backgroundColor: c.panelBg, borderColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>招待パスワード</Text>
        <Text style={[styles.lead, { color: c.textMuted }]}>
          {user.email || 'このアカウント'} でログインしました。{'\n'}
          部内で共有されている招待パスワードを入力してください。
        </Text>
        <Field label="招待パスワード">
          <Input value={invite} onChangeText={setInvite} secureTextEntry autoCapitalize="none" />
        </Field>
        {error ? <Notice text={error} kind="error" /> : null}
        <Btn
          label={busy ? '確認中...' : '続ける'}
          variant="primary"
          disabled={busy}
          onPress={submit}
        />
        <Pressable onPress={signOutUser} style={styles.linkBtn}>
          <Text style={{ fontSize: 12, color: c.accent }}>別のアカウントでログインする</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

function Notice({ text, kind }: { text: string; kind: 'error' | 'info' }) {
  const c = useTheme()
  const bg = kind === 'error' ? c.dangerBg : c.successBg
  const fg = kind === 'error' ? c.danger : c.success
  return (
    <View style={[styles.notice, { backgroundColor: bg }]}>
      <Text style={{ fontSize: 12, lineHeight: 18, color: fg }}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 22,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 19, fontWeight: '600', marginBottom: 6 },
  lead: { fontSize: 12, lineHeight: 19, marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  notice: { padding: 9, borderRadius: 6, marginBottom: 10 },
  linkBtn: { marginTop: 12, alignItems: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  note: { fontSize: 11, lineHeight: 17, marginTop: 12 },
})
