// プッシュ通知の受け取り準備。この端末の Expo push トークンを
// notifications/<uid>/tokens に登録し、Worker から送ってもらう。
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { pushTokenKey } from '@shared/notifications'
import { removeItem, setItem } from '@shared/firebaseData'

// アプリを開いている最中に届いた通知も表示して音を鳴らす
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export type PushStatus = 'granted' | 'denied' | 'unsupported' | 'error'

// ログアウト時に消すため、最後に登録したものを覚えておく
let registered: { uid: string; key: string } | null = null

export async function registerForPush(uid: string, ask = true): Promise<PushStatus> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'unsupported'
  try {
    if (Platform.OS === 'android') {
      // Worker は channelId: 'default' で送る
      await Notifications.setNotificationChannelAsync('default', {
        name: '予定のお知らせ',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      })
    }
    let { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted' && ask) {
      status = (await Notifications.requestPermissionsAsync()).status
    }
    if (status !== 'granted') return 'denied'

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    const key = pushTokenKey(token)
    await setItem(`notifications/${uid}/tokens`, key, {
      token,
      platform: Platform.OS,
      updatedAt: Date.now(),
    })
    registered = { uid, key }
    return 'granted'
  } catch (err) {
    console.warn('push 通知の登録に失敗しました', err)
    return 'error'
  }
}

// ログアウトする前に呼ぶ(ログアウト後は DB に書けなくなるため)
export async function unregisterForPush() {
  if (!registered) return
  const { uid, key } = registered
  registered = null
  try {
    await removeItem(`notifications/${uid}/tokens`, key)
  } catch (err) {
    console.warn('push 通知の登録解除に失敗しました', err)
  }
}
