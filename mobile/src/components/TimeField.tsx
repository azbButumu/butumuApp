// Web 版の <input type="time"> に相当。ネイティブの時刻ピッカーを開く。
// 値は "HH:MM"。step 分単位に切り捨てる(Android のピッカーは刻みを指定できないため)
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/theme'

function parse(value: string): Date {
  const [h, m] = value.split(':').map(Number)
  const d = new Date()
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

function format(d: Date, step: number): string {
  const m = Math.floor(d.getMinutes() / step) * step
  return `${String(d.getHours()).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function TimeField({
  value,
  onChange,
  step = 1,
}: {
  value: string
  onChange: (next: string) => void
  step?: number
}) {
  const c = useTheme()
  const [open, setOpen] = useState(false)

  function handle(event: DateTimePickerEvent, picked?: Date) {
    // Android はダイアログなので、確定・取消どちらでも閉じる
    if (Platform.OS === 'android') setOpen(false)
    if (event.type === 'dismissed') return
    if (picked) onChange(format(picked, step))
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.box, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Text style={{ fontSize: 13, color: c.text }}>{value}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={parse(value)}
          mode="time"
          is24Hour
          minuteInterval={step as any}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handle}
        />
      )}
      {open && Platform.OS === 'ios' && (
        <Pressable onPress={() => setOpen(false)} style={styles.done}>
          <Text style={{ color: c.accent, fontSize: 13 }}>完了</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  box: {
    minWidth: 90,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  done: { paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'flex-end' },
})
