// Web 版 akiba-chu.html の「詳細追加」ビュー。
// 画像は Web 版と同じく data URL(base64) で保存するので、両方から同じように見える。
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'

import { Btn, Card, Chip, Field, Input } from '@/components/ui'
import { useTheme } from '@/theme'

const UNITS = ['個', '本', '枚', 'm', '袋', 'セット']

export function CustomAdd({
  onAdd,
}: {
  onAdd: (order: {
    name: string
    qty: number
    unit: string
    url: string
    note: string
    images: string[]
    person: string
  }) => void
}) {
  const c = useTheme()
  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState(UNITS[0])
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [person, setPerson] = useState('')
  const [images, setImages] = useState<string[]>([])

  async function pickImages() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('権限が必要です', '写真へのアクセスを許可してください。')
      return
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      base64: true,
      quality: 0.6,
    })
    if (res.canceled) return
    const added = res.assets
      .filter((a) => a.base64)
      .map((a) => `data:${a.mimeType || 'image/jpeg'};base64,${a.base64}`)
    setImages((prev) => [...prev, ...added])
  }

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) {
      Alert.alert('品名を入力してください')
      return
    }
    onAdd({
      name: trimmed,
      qty: parseInt(qty, 10) || 1,
      unit,
      url: url.trim(),
      note: note.trim(),
      images,
      person: person.trim() || '未記入',
    })
    setName('')
    setQty('1')
    setUrl('')
    setNote('')
    setImages([])
  }

  return (
    <Card>
      <Field label="品名 *">
        <Input value={name} onChangeText={setName} placeholder="例: NE555P (DIPパッケージ)" />
      </Field>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ width: 90 }}>
          <Field label="数量">
            <Input value={qty} onChangeText={setQty} keyboardType="number-pad" />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="単位">
            <View style={styles.chipRow}>
              {UNITS.map((u) => (
                <Chip key={u} label={u} active={unit === u} onPress={() => setUnit(u)} />
              ))}
            </View>
          </Field>
        </View>
      </View>

      <Field label="参考URL(任意)">
        <Input
          value={url}
          onChangeText={setUrl}
          placeholder="https://akizukidenshi.com/..."
          autoCapitalize="none"
          keyboardType="url"
        />
      </Field>

      <Field label="備考・スペック">
        <Input value={note} onChangeText={setNote} placeholder="例: 秋月の50本入り袋" multiline />
      </Field>

      <Field label="画像(任意)">
        <Pressable
          onPress={pickImages}
          style={[styles.uploadArea, { borderColor: c.border, backgroundColor: c.hoverBg }]}>
          <Text style={{ fontSize: 13, color: c.textMuted }}>タップして画像を追加</Text>
        </Pressable>
        {images.length > 0 && (
          <View style={styles.thumbs}>
            {images.map((src, i) => (
              <View key={i} style={styles.thumbWrap}>
                <Image source={{ uri: src }} style={styles.thumb} />
                <Pressable
                  onPress={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  style={[styles.thumbDel, { backgroundColor: c.danger }]}>
                  <Text style={{ color: '#fff', fontSize: 11, lineHeight: 13 }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </Field>

      <Field label="注文者名">
        <Input value={person} onChangeText={setPerson} placeholder="名前または制作名" />
      </Field>

      <Btn label="注文リストに追加" variant="primary" onPress={submit} />
    </Card>
  )
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  uploadArea: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
  },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 62, height: 62, borderRadius: 6 },
  thumbDel: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
