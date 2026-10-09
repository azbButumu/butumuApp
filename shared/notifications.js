// カレンダー予定の通知。「通知する」にした予定(notify: true)の当日、
// 投稿者が選んだ時刻(notifyTime、15分単位。未設定なら正午)に Worker の Cron が送る。
// ここでは通知時刻の扱い、アプリ版の受け取り設定、通知の文面を決める。
// Worker(worker/src/index.js)からも読み込むので、Firebase SDK などには依存させない。
//
// 受け取り設定は notifications/<uid> に置く:
//   tokens:   { <端末ID>: { token, platform, updatedAt } }  Expo の push トークン
//   tags:     { 企画: false, ... }      タグごと(全員向けの予定)
//   projects: { <projectId>: false }    制作ごと(制作限定の予定)
// 値が無いものは「受け取る」扱い。切ったものだけ false で記録する。

import { addDays, diffDays, formatDateJa } from './date'
import { isProjectMember } from './projects'

// Worker の Cron(wrangler.toml)もこの間隔で動く
export const NOTIFY_STEP_MINUTES = 15
export const DEFAULT_NOTIFY_TIME = '12:00'

function pad2(n) {
  return String(n).padStart(2, '0')
}

// "HH:MM" を15分単位に切り捨てて返す。不正な値は正午にする
export function normalizeNotifyTime(value) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''))
  if (!m) return DEFAULT_NOTIFY_TIME
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return DEFAULT_NOTIFY_TIME
  return `${pad2(h)}:${pad2(Math.floor(min / NOTIFY_STEP_MINUTES) * NOTIFY_STEP_MINUTES)}`
}

export function eventNotifyTime(event) {
  return normalizeNotifyTime(event.notifyTime)
}

// 時刻(ミリ秒)を、日本時間の日付と15分単位の時刻にする
export function jstSlot(ms) {
  const d = new Date(ms + 9 * 60 * 60 * 1000)
  const min = Math.floor(d.getUTCMinutes() / NOTIFY_STEP_MINUTES) * NOTIFY_STEP_MINUTES
  return {
    date: d.toISOString().slice(0, 10),
    time: `${pad2(d.getUTCHours())}:${pad2(min)}`,
  }
}

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

// 当日に送る通知の文面。start はその回の初日(毎週の予定は回ごとに終了日がずれる)
export function eventNotificationContent(event, start, projectName) {
  const label = projectName ? `[${projectName}]` : `[${event.tag || 'その他'}]`
  const span = event.endDate ? diffDays(event.date, event.endDate) : 0
  return {
    title: `${label} ${event.title}`,
    body:
      span > 0
        ? `今日から${formatDateJa(addDays(start, span))}までの予定です`
        : '今日の予定です',
  }
}
