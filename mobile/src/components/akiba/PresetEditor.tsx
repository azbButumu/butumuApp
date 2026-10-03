// Web 版 akiba-chu.html の「管理」ビュー(プリセット編集 + 説明文)
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { Btn, Card, CardTitle, Chip, Field, Input } from '@/components/ui'
import { useTheme } from '@/theme'

import type { Presets } from './QuickAdd'

const UNITS = ['個', '本', '枚', 'm', '袋', 'セット']
const ICON_OPTIONS = [
  '≈', '⊟', '▷', '◉', '□', 'IC', '|||', '⊢', '∿', '◫',
  '○', '⊞', '~', '|', '●', '★', '▲', '♦', '⚡', '🔌',
  '🔧', '🔩', '📦', '💡',
]

export function PresetEditor({
  presets,
  helpText,
  onSavePresets,
  onSaveHelpText,
}: {
  presets: Presets
  helpText: string
  onSavePresets: (next: Presets) => void
  onSaveHelpText: (text: string) => void
}) {
  const c = useTheme()
  // 保存を押すまで Firebase には書かないので、編集中は下書きを持つ
  const [draft, setDraft] = useState<Presets>(() => JSON.parse(JSON.stringify(presets)))
  const [cat, setCat] = useState(() => Object.keys(presets)[0] || '')
  const [help, setHelp] = useState(helpText)
  const [iconPickerFor, setIconPickerFor] = useState<number | null>(null)

  const current = draft[cat]

  function patchItem(index: number, changes: Partial<Presets[string]['items'][number]>) {
    setDraft((d) => {
      const next: Presets = JSON.parse(JSON.stringify(d))
      next[cat].items[index] = { ...next[cat].items[index], ...changes }
      return next
    })
  }

  function addItem() {
    setDraft((d) => {
      const next: Presets = JSON.parse(JSON.stringify(d))
      next[cat].items.push({ name: '新しい部品', unit: '個', icon: '●', url: '' })
      return next
    })
  }

  function deleteItem(index: number) {
    setDraft((d) => {
      const next: Presets = JSON.parse(JSON.stringify(d))
      next[cat].items.splice(index, 1)
      return next
    })
  }

  if (!current) {
    return (
      <Card>
        <Text style={{ color: c.textMuted, fontSize: 13 }}>プリセットがありません。</Text>
      </Card>
    )
  }

  return (
    <View>
      <Card>
        <CardTitle>プリセット編集</CardTitle>
        <View style={styles.catRow}>
          {Object.entries(draft).map(([k, v]) => (
            <Chip key={k} label={v.label} active={k === cat} onPress={() => setCat(k)} />
          ))}
        </View>

        <Field label="カテゴリ名">
          <Input
            value={current.label}
            onChangeText={(v) =>
              setDraft((d) => {
                const next: Presets = JSON.parse(JSON.stringify(d))
                next[cat].label = v
                return next
              })
            }
          />
        </Field>

        {current.items.map((item, i) => (
          <View key={i} style={[styles.itemBox, { borderColor: c.border }]}>
            <View style={styles.itemHead}>
              <Pressable
                onPress={() => setIconPickerFor(iconPickerFor === i ? null : i)}
                style={[styles.iconBtn, { backgroundColor: c.hoverBg, borderColor: c.border }]}>
                <Text style={{ fontSize: 16, color: c.text }}>{item.icon || '●'}</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Input
                  value={item.name}
                  onChangeText={(v) => patchItem(i, { name: v })}
                  placeholder="品名"
                />
              </View>
              <Pressable
                onPress={() =>
                  Alert.alert('確認', `「${item.name}」を削除しますか?`, [
                    { text: 'キャンセル', style: 'cancel' },
                    { text: '削除', style: 'destructive', onPress: () => deleteItem(i) },
                  ])
                }
                hitSlop={6}>
                <Text style={{ fontSize: 11, color: c.danger }}>削除</Text>
              </Pressable>
            </View>

            {iconPickerFor === i && (
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((ic) => (
                  <Pressable
                    key={ic}
                    onPress={() => {
                      patchItem(i, { icon: ic })
                      setIconPickerFor(null)
                    }}
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor: item.icon === ic ? c.accent : c.hoverBg,
                        borderColor: c.border,
                      },
                    ]}>
                    <Text style={{ fontSize: 14, color: item.icon === ic ? '#fff' : c.text }}>
                      {ic}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.unitRow}>
              {UNITS.map((u) => (
                <Chip
                  key={u}
                  label={u}
                  active={item.unit === u}
                  onPress={() => patchItem(i, { unit: u })}
                />
              ))}
            </View>

            <Input
              value={item.url || ''}
              onChangeText={(v) => patchItem(i, { url: v })}
              placeholder="参考URL(任意)"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        ))}

        <Btn label="+ 項目を追加" onPress={addItem} />
        <View style={{ height: 8 }} />
        <Btn
          label="プリセットを保存"
          variant="primary"
          onPress={() => {
            onSavePresets(draft)
            Alert.alert('保存しました')
          }}
        />
      </Card>

      <Card>
        <CardTitle>説明文の編集</CardTitle>
        <Field label="「?」ボタンで表示される説明">
          <Input value={help} onChangeText={setHelp} multiline style={{ minHeight: 120 }} />
        </Field>
        <Btn
          label="説明文を保存"
          variant="primary"
          onPress={() => {
            onSaveHelpText(help)
            Alert.alert('保存しました')
          }}
        />
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  catRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  itemBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  iconOption: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
})
