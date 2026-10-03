// Web 版 akiba-chu.html の「クイック追加」ビュー
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/theme'

export type PresetItem = { name: string; unit: string; icon?: string; url?: string }
export type Presets = Record<string, { label: string; items: PresetItem[] }>

export function QuickAdd({
  presets,
  onAdd,
}: {
  presets: Presets
  onAdd: (item: PresetItem, qty: number) => void
}) {
  const c = useTheme()
  const [qtys, setQtys] = useState<Record<string, number>>({})

  function change(key: string, delta: number) {
    setQtys((q) => ({ ...q, [key]: Math.max(0, (q[key] || 0) + delta) }))
  }

  return (
    <View>
      {Object.entries(presets).map(([catKey, cat]) => (
        <View key={catKey} style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{cat.label}</Text>
          <View style={styles.grid}>
            {cat.items.map((item, i) => {
              const key = `${catKey}_${i}`
              const qty = qtys[key] || 0
              return (
                <View
                  key={key}
                  style={[styles.card, { backgroundColor: c.panelBg, borderColor: c.border }]}>
                  <Text style={[styles.icon, { color: c.accent }]}>{item.icon || '●'}</Text>
                  <Text numberOfLines={2} style={[styles.name, { color: c.text }]}>
                    {item.name}
                  </Text>
                  <View style={styles.qtyCtrl}>
                    <Stepper label="−" onPress={() => change(key, -1)} />
                    <Text style={[styles.qtyNum, { color: c.text }]}>{qty}</Text>
                    <Stepper label="+" onPress={() => change(key, 1)} />
                  </View>
                  <Pressable
                    onPress={() => {
                      if (qty === 0) return
                      onAdd(item, qty)
                      setQtys((q) => ({ ...q, [key]: 0 }))
                    }}
                    style={({ pressed }) => [
                      styles.addBtn,
                      {
                        backgroundColor: qty === 0 ? c.hoverBg : c.accent,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: qty === 0 ? c.textMuted : '#fff',
                      }}>
                      追加する
                    </Text>
                  </Pressable>
                </View>
              )
            })}
          </View>
        </View>
      ))}
    </View>
  )
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme()
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={[styles.stepper, { backgroundColor: c.hoverBg, borderColor: c.border }]}>
      <Text style={{ color: c.text, fontSize: 14, lineHeight: 16 }}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    width: '48%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  icon: { fontSize: 18 },
  name: { fontSize: 12, textAlign: 'center', minHeight: 32 },
  qtyCtrl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum: { fontSize: 14, fontWeight: '600', minWidth: 18, textAlign: 'center' },
  addBtn: {
    alignSelf: 'stretch',
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
  },
})
