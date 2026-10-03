// Web 版の <input type="date"> に相当。ネイティブの日付ピッカーを開く
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import { formatDateJa, toDateStr } from '@shared/date'
import { useTheme } from '@/theme'

function parse(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function DateField({
  value,
  onChange,
  placeholder = '未設定',
  minimumDate,
  clearable,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  minimumDate?: string
  clearable?: boolean
}) {
  const c = useTheme()
  const [open, setOpen] = useState(false)

  function handle(event: DateTimePickerEvent, picked?: Date) {
    // Android はダイアログなので、確定・取消どちらでも閉じる
    if (Platform.OS === 'android') setOpen(false)
    if (event.type === 'dismissed') return
    if (picked) onChange(toDateStr(picked))
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.box, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Text style={{ fontSize: 13, color: value ? c.text : c.textMuted }}>
          {value ? formatDateJa(value) : placeholder}
        </Text>
      </Pressable>
      {clearable && value !== '' && (
        <Pressable onPress={() => onChange('')} hitSlop={8} style={styles.clear}>
          <Text style={{ color: c.textMuted, fontSize: 16 }}>×</Text>
        </Pressable>
      )}
      {open && (
        <DateTimePicker
          value={value ? parse(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate ? parse(minimumDate) : undefined}
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
    flex: 1,
    minWidth: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  clear: { padding: 4 },
  done: { paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'flex-end' },
})
