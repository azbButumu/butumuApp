import { firebaseConfig } from '../../shared/firebaseConfig.js'
import {
  eventNotificationContent,
  pushTokensOf,
  wantsEventNotification,
} from '../../shared/notifications.js'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_PUSH_CHUNK = 100

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

// Firebase の ID トークンを検証して uid を返す。無効なら null
async function verifyIdToken(idToken) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.users?.[0]?.localId || null
}

// 送信者本人の権限で Realtime Database を読む(DB のルールがそのまま効く)
async function readDb(path, idToken) {
  const res = await fetch(
    `${firebaseConfig.databaseURL}/${path}.json?auth=${encodeURIComponent(idToken)}`,
  )
  if (!res.ok) throw new Error(`DB の読み込みに失敗しました(${path}: ${res.status})`)
  return res.json()
}

// POST /notify  { kind: 'created' | 'updated', event: { title, date, ... } }
// アプリ版で受け取り設定をオンにしている部員(送信者本人を除く)に push 通知を送る
async function handleNotify(request) {
  const idToken = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!idToken) return json({ error: 'ログインが必要です' }, 401)
  const uid = await verifyIdToken(idToken)
  if (!uid) return json({ error: 'ログインが無効です' }, 401)

  const body = await request.json().catch(() => null)
  const event = body?.event
  if (!event || typeof event.title !== 'string' || !event.title || !event.date) {
    return json({ error: '予定の内容がありません' }, 400)
  }
  if (event.projectId && /[.#$[\]/]/.test(event.projectId)) {
    return json({ error: '制作の指定が正しくありません' }, 400)
  }
  const kind = body.kind === 'updated' ? 'updated' : 'created'

  const member = await readDb(`members/${uid}`, idToken)
  if (!member) return json({ error: '部員登録が済んでいません' }, 403)

  const [allSettings, project] = await Promise.all([
    readDb('notifications', idToken),
    event.projectId ? readDb(`projects/${event.projectId}`, idToken) : null,
  ])
  // 制作限定の予定なのに、送信者がその制作に入っていなければ送らない
  if (event.projectId && !project?.members?.[uid]) {
    return json({ error: 'この制作のメンバーではありません' }, 403)
  }

  const content = eventNotificationContent(event, kind, project?.name)
  const messages = []
  Object.entries(allSettings || {}).forEach(([targetUid, settings]) => {
    if (targetUid === uid) return
    if (!wantsEventNotification(settings, event, project, targetUid)) return
    pushTokensOf(settings).forEach((to) => {
      messages.push({ to, sound: 'default', channelId: 'default', ...content })
    })
  })

  for (let i = 0; i < messages.length; i += EXPO_PUSH_CHUNK) {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages.slice(i, i + EXPO_PUSH_CHUNK)),
    })
    if (!res.ok) return json({ error: `Expo への送信に失敗しました(${res.status})` }, 502)
  }
  return json({ ok: true, sent: messages.length })
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const parts = url.pathname.split('/').filter(Boolean) // ["files", "key..."]

    if (parts[0] === 'notify' && request.method === 'POST') {
      try {
        return await handleNotify(request)
      } catch (err) {
        return json({ error: err.message || '通知の送信に失敗しました' }, 500)
      }
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
}
