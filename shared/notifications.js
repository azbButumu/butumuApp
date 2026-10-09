// カレンダー予定の通知。アプリ版の受け取り設定と、通知の文面を決める。
// Worker(worker/src/index.js)からも読み込むので、Firebase SDK などには依存させない。
//
// 受け取り設定は notifications/<uid> に置く:
//   tokens:   { <端末ID>: { token, platform, updatedAt } }  Expo の push トークン
//   tags:     { 企画: false, ... }      タグごと(全員向けの予定)
//   projects: { <projectId>: false }    制作ごと(制作限定の予定)
// 値が無いものは「受け取る」扱い。切ったものだけ false で記録する。

import { formatDateJa } from './date'
import { isProjectMember } from './projects'

export function tagEnabled(settings, tag) {
  return settings?.tags?.[tag] !== false
}

export function projectEnabled(settings, projectId) {
  return settings?.projects?.[projectId] !== false
}

// その人に通知を送るか。制作限定の予定は制作ごとの設定、それ以外はタグごとの設定で決める
export function wantsEventNotification(settings, event, project, uid) {
  if (event.projectId) {
    return isProjectMember(project, uid) && projectEnabled(settings, event.projectId)
  }
  return tagEnabled(settings, event.tag || 'その他')
}

export function pushTokensOf(settings) {
  return Object.values(settings?.tokens || {})
    .map((t) => t?.token)
    .filter((t) => typeof t === 'string' && t.startsWith('ExponentPushToken['))
}

// ExponentPushToken[xxxx] の中身を DB のキーにする([] はキーに使えない)
export function pushTokenKey(token) {
  const m = /\[(.+)\]/.exec(token)
  return (m ? m[1] : token).replace(/[.#$[\]/]/g, '_')
}

export function eventNotificationContent(event, kind, projectName) {
  const label = projectName ? `[${projectName}]` : `[${event.tag || 'その他'}]`
  const when = event.endDate
    ? `${formatDateJa(event.date)}〜${formatDateJa(event.endDate)}`
    : formatDateJa(event.date)
  const repeat = event.repeat === 'weekly' ? '(毎週)' : ''
  return {
    title: `${label} ${event.title}`,
    body: `${kind === 'updated' ? '予定が変更されました' : '新しい予定'}: ${when}${repeat}`,
  }
}
