import { firebaseConfig } from '../../shared/firebaseConfig.js'
import { eventsStartingOn } from '../../shared/calendarEvents.js'
import {
  eventNotificationContent,
  eventNotifyTime,
  jstSlot,
  pushTokensOf,
  wantsEventNotification,
} from '../../shared/notifications.js'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_PUSH_CHUNK = 100

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function withCors(res) {
  const headers = new Headers(res.headers)
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v))
  return new Response(res.body, { status: res.status, headers })
}

function json(data, status = 200) {
  return withCors(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function base64url(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)
  let bin = ''
  bytes.forEach((b) => {
    bin += String.fromCharCode(b)
  })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// サービスアカウント(シークレット FIREBASE_SERVICE_ACCOUNT)で DB 用のアクセストークンを取る。
// 管理者として読むので DB のルールに左右されない。未設定なら null(ルール未適用の間はそれでも読める)
async function getDbAccessToken(env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return null
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope:
        'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(pem), (ch) => ch.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`))
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${base64url(sig)}`,
    }),
  })
  if (!res.ok) throw new Error(`アクセストークンを取得できませんでした(${res.status})`)
  return (await res.json()).access_token
}

async function readDb(path, accessToken) {
  const auth = accessToken ? `?access_token=${encodeURIComponent(accessToken)}` : ''
  const res = await fetch(`${firebaseConfig.databaseURL}/${path}.json${auth}`)
  if (!res.ok) throw new Error(`DB の読み込みに失敗しました(${path}: ${res.status})`)
  return res.json()
}

function listOf(obj) {
  return Object.entries(obj || {}).map(([id, v]) => ({ id, ...v }))
}

// 「通知する」にした予定のうち、今日始まる回があり、通知時刻がこの枠のものを、
// 受け取り設定に合わせて送る。scheduledTime は Cron の予定時刻(実行が遅れてもずれない)
async function sendEventNotifications(env, scheduledTime) {
  const { date: today, time } = jstSlot(scheduledTime)
  const accessToken = await getDbAccessToken(env)
  const events = eventsStartingOn(
    listOf(await readDb('calendarEvents', accessToken)).filter(
      (ev) => ev.notify === true && eventNotifyTime(ev) === time,
    ),
    today,
  )
  if (events.length === 0) return

  const [projectsRaw, allSettings] = await Promise.all([
    readDb('projects', accessToken),
    readDb('notifications', accessToken),
  ])
  const projects = projectsRaw || {}

  const messages = []
  events.forEach((event) => {
    const project = event.projectId ? projects[event.projectId] : null
    // 制作が削除された制作限定の予定は誰にも送らない
    if (event.projectId && !project) return
    const content = eventNotificationContent(event, today, project?.name)
    Object.entries(allSettings || {}).forEach(([uid, settings]) => {
      if (!wantsEventNotification(settings, event, project, uid)) return
      pushTokensOf(settings).forEach((to) => {
        messages.push({ to, sound: 'default', channelId: 'default', ...content })
      })
    })
  })

  for (let i = 0; i < messages.length; i += EXPO_PUSH_CHUNK) {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages.slice(i, i + EXPO_PUSH_CHUNK)),
    })
    if (!res.ok) throw new Error(`Expo への送信に失敗しました(${res.status})`)
  }
  console.log(`${today} ${time}: 予定 ${events.length} 件、通知 ${messages.length} 通を送信`)
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const parts = url.pathname.split('/').filter(Boolean) // ["files", "key..."]

    // 保存時に通知していた古いアプリ版向け。今は当日の指定時刻に送るので何もしない
    if (parts[0] === 'notify' && request.method === 'POST') {
      return json({ ok: true, sent: 0 })
    }

    if (parts[0] !== 'files') {
      return json({ error: 'not found' }, 404)
    }

    const key = parts.slice(1).join('/') ? decodeURIComponent(parts.slice(1).join('/')) : null

    if (request.method === 'GET' && !key) {
      const listed = await env.LIBRARY_BUCKET.list()
      const files = listed.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
      }))
      return json(files)
    }

    if (request.method === 'PUT' && key) {
      await env.LIBRARY_BUCKET.put(key, request.body, {
        httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' },
      })
      return json({ ok: true, key })
    }

    if (request.method === 'GET' && key) {
      const obj = await env.LIBRARY_BUCKET.get(key)
      if (!obj) return json({ error: 'not found' }, 404)
      const headers = new Headers()
      obj.writeHttpMetadata(headers)
      headers.set('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`)
      Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v))
      return new Response(obj.body, { headers })
    }

    if (request.method === 'DELETE' && key) {
      await env.LIBRARY_BUCKET.delete(key)
      return json({ ok: true })
    }

    return json({ error: 'method not allowed' }, 405)
  },

  // wrangler.toml の crons(15分ごと)で呼ばれる
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(sendEventNotifications(env, controller.scheduledTime))
  },
}
