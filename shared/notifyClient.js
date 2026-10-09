// 予定の通知を Worker に頼む。送り先の絞り込みと Expo への送信は Worker 側で行う。
import { getAuthInstance } from './auth'

export async function requestEventNotification(workerUrl, event, kind) {
  if (!workerUrl) throw new Error('Worker の URL が設定されていません')
  const user = getAuthInstance().currentUser
  if (!user) throw new Error('ログインしていません')
  const idToken = await user.getIdToken()
  const res = await fetch(`${workerUrl}/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({
      kind,
      event: {
        title: event.title,
        date: event.date,
        endDate: event.endDate || '',
        tag: event.tag || '',
        repeat: event.repeat || '',
        projectId: event.projectId || '',
      },
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `通知の送信に失敗しました(${res.status})`)
  }
  return res.json()
}
