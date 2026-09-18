import { useCallback, useEffect, useRef, useState } from 'react'
import './Library.css'

const WORKER_URL = import.meta.env.VITE_WORKER_URL

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function sanitizeName(name) {
  return name.replace(/[^\w.\-ぁ-んァ-ヶ一-龠]/g, '_')
}

function Library() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const fetchFiles = useCallback(async () => {
    if (!WORKER_URL) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${WORKER_URL}/files`)
      if (!res.ok) throw new Error(`一覧の取得に失敗しました (${res.status})`)
      const data = await res.json()
      data.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))
      setFiles(data)
    } catch (e) {
      setError(e.message || '一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  async function handleFileSelect(e) {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return
    setUploading(true)
    setError('')
    try {
      for (const file of selected) {
        const key = `${Date.now()}-${sanitizeName(file.name)}`
        const res = await fetch(`${WORKER_URL}/files/${encodeURIComponent(key)}`, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        })
        if (!res.ok) throw new Error(`アップロードに失敗しました: ${file.name}`)
      }
      await fetchFiles()
    } catch (e) {
      setError(e.message || 'アップロードに失敗しました')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(key) {
    if (!window.confirm('このファイルを削除しますか?')) return
    try {
      const res = await fetch(`${WORKER_URL}/files/${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('削除に失敗しました')
      setFiles((prev) => prev.filter((f) => f.key !== key))
    } catch (e) {
      setError(e.message || '削除に失敗しました')
    }
  }

  function displayName(key) {
    const idx = key.indexOf('-')
    return idx >= 0 && /^\d+$/.test(key.slice(0, idx)) ? key.slice(idx + 1) : key
  }

  if (!WORKER_URL) {
    return (
      <div className="library-page">
        <div className="card empty-state">
          ライブラリ機能はまだ設定されていません。
          <br />
          Cloudflare Workerをデプロイし、VITE_WORKER_URL を設定してください。
        </div>
      </div>
    )
  }

  return (
    <div className="library-page">
      <div className="card">
        <div className="row-between">
          <h2>ファイル一覧</h2>
          <button type="button" className="card-link" onClick={fetchFiles}>
            更新
          </button>
        </div>
        <label className="upload-area">
          {uploading ? 'アップロード中...' : 'タップしてファイルを追加'}
          <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} disabled={uploading} style={{ display: 'none' }} />
        </label>
        {error && <div className="lib-error">{error}</div>}
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">読み込み中...</div>
        ) : files.length === 0 ? (
          <div className="empty-state">ファイルはまだありません</div>
        ) : (
          files.map((f) => (
            <div className="file-row" key={f.key}>
              <div className="file-info">
                <div className="file-name">{displayName(f.key)}</div>
                <div className="file-meta">
                  {formatSize(f.size)} · {formatDate(f.uploaded)}
                </div>
              </div>
              <div className="file-actions">
                <a className="btn" href={`${WORKER_URL}/files/${encodeURIComponent(f.key)}`} target="_blank" rel="noreferrer">
                  DL
                </a>
                <button type="button" className="btn btn-danger" onClick={() => handleDelete(f.key)}>
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Library
