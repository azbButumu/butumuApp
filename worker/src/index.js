const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const parts = url.pathname.split('/').filter(Boolean) // ["files", "key..."]

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
