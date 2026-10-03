// Web 版 src/pages/Library.jsx の移植。
// ファイル選択は expo-document-picker、
// アップロードは expo-file-system の UploadTask(BINARY_CONTENT)で Worker の PUT API にそのまま流す。
import * as DocumentPicker from 'expo-document-picker'
import { File, UploadTask, UploadType } from 'expo-file-system'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Btn, Card, CardLink, CardTitle, EmptyState, RowBetween } from '@/components/ui'
import { useTheme } from '@/theme'

const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL

type LibFile = { key: string; size: number; uploaded: string }

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function sanitizeName(name: string) {
  return name.replace(/[^\w.\-ぁ-んァ-ヶ一-龠]/g, '_')
}

function displayName(key: string) {
  const idx = key.indexOf('-')
  return idx >= 0 && /^\d+$/.test(key.slice(0, idx)) ? key.slice(idx + 1) : key
}

export default function LibraryScreen() {
  const c = useTheme()
  const [files, setFiles] = useState<LibFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const fetchFiles = useCallback(async () => {
    if (!WORKER_URL) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${WORKER_URL}/files`)
      if (!res.ok) throw new Error(`一覧の取得に失敗しました (${res.status})`)
      const data: LibFile[] = await res.json()
      data.sort((a, b) => +new Date(b.uploaded) - +new Date(a.uploaded))
      setFiles(data)
    } catch (e: any) {
      setError(e?.message || '一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  async function pickAndUpload() {
    if (!WORKER_URL) return
    const picked = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    })
    if (picked.canceled || picked.assets.length === 0) return

    setUploading(true)
    setError('')
    try {
      for (const asset of picked.assets) {
        const key = `${Date.now()}-${sanitizeName(asset.name)}`
        const task = new UploadTask(
          new File(asset.uri),
          `${WORKER_URL}/files/${encodeURIComponent(key)}`,
          {
            httpMethod: 'PUT',
            uploadType: UploadType.BINARY_CONTENT,
            headers: { 'Content-Type': asset.mimeType || 'application/octet-stream' },
          },
        )
        const res = await task.uploadAsync()
        if (res.status < 200 || res.status >= 300) {
          throw new Error(`アップロードに失敗しました: ${asset.name}`)
        }
      }
      await fetchFiles()
    } catch (e: any) {
      setError(e?.message || 'アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  function confirmDelete(key: string) {
    Alert.alert('確認', 'このファイルを削除しますか?', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => doDelete(key) },
    ])
  }

  async function doDelete(key: string) {
    try {
      const res = await fetch(`${WORKER_URL}/files/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('削除に失敗しました')
      setFiles((prev) => prev.filter((f) => f.key !== key))
    } catch (e: any) {
      setError(e?.message || '削除に失敗しました')
    }
  }

  if (!WORKER_URL) {
    return (
      <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.page}>
        <Card>
          <EmptyState>
            ライブラリ機能はまだ設定されていません。{'\n'}
            Cloudflare Workerをデプロイし、mobile/.env の EXPO_PUBLIC_WORKER_URL を設定してください。
          </EmptyState>
        </Card>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.page}>
      <Card>
        <RowBetween>
          <CardTitle>ファイル一覧</CardTitle>
          <CardLink label="更新" onPress={fetchFiles} />
        </RowBetween>
        <Pressable
          onPress={pickAndUpload}
          disabled={uploading}
          style={[styles.uploadArea, { borderColor: c.border, backgroundColor: c.hoverBg }]}>
          <Text style={{ fontSize: 13, color: c.textMuted }}>
            {uploading ? 'アップロード中...' : 'タップしてファイルを追加'}
          </Text>
        </Pressable>
        {error ? (
          <Text style={[styles.error, { color: c.danger, backgroundColor: c.dangerBg }]}>
            {error}
          </Text>
        ) : null}
      </Card>

      <Card>
        {loading ? (
          <EmptyState>読み込み中...</EmptyState>
        ) : files.length === 0 ? (
          <EmptyState>ファイルはまだありません</EmptyState>
        ) : (
          files.map((f) => (
            <View key={f.key} style={[styles.fileRow, { borderTopColor: c.border }]}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 13, color: c.text }}>
                  {displayName(f.key)}
                </Text>
                <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                  {formatSize(f.size)} · {formatDate(f.uploaded)}
                </Text>
              </View>
              <Btn
                label="開く"
                onPress={() =>
                  WebBrowser.openBrowserAsync(
                    `${WORKER_URL}/files/${encodeURIComponent(f.key)}`,
                  )
                }
              />
              <Btn label="削除" variant="danger" onPress={() => confirmDelete(f.key)} />
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { padding: 14, paddingBottom: 40 },
  uploadArea: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 22,
    alignItems: 'center',
  },
  error: {
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
    fontSize: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
