// Web 版 src/components/MiniCalendar.jsx の移植。
// 日付を左上、その横に責任者、予定はタイトル付きで最大3件表示する。
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { toDateStr, todayStr, weekdayJa } from '@shared/date'
import { useTheme } from '@/theme'

const MAX_VISIBLE_EVENTS = 3

export type DayEvent = { color: string; event: any; start: string; skipped?: boolean }
export type Duty = { person: string; isOverride: boolean } | null

function buildMonthGrid(year: number, month: number) {
  const startOffset = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  // 曜日ヘッダーと列幅を確実に揃えるため、週ごとの行に分けて返す
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function MiniCalendar({
  interactive = false,
  eventsByDate = {},
  selectedDate,
  onSelectDate,
  getDuty,
}: {
  interactive?: boolean
  eventsByDate?: Record<string, DayEvent[]>
  selectedDate?: string
  onSelectDate?: (date: string) => void
  getDuty?: (date: string) => Duty
}) {
  const c = useTheme()
  const today = todayStr()
  const [viewDate, setViewDate] = useState(() => {
    const base = selectedDate ? new Date(selectedDate) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const weeks = buildMonthGrid(year, month)

  function changeMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1))
  }

  return (
    <View>
      <View style={styles.header}>
        {interactive && (
          <Pressable onPress={() => changeMonth(-1)} hitSlop={10} style={styles.nav}>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>◀</Text>
          </Pressable>
        )}
        <Text style={[styles.title, { color: c.text }]}>
          {year}年 {month + 1}月
        </Text>
        {interactive && (
          <Pressable onPress={() => changeMonth(1)} hitSlop={10} style={styles.nav}>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>▶</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.weekdays}>
        {[0, 1, 2, 3, 4, 5, 6].map((w) => (
          <Text
            key={w}
            style={[
              styles.weekday,
              { color: w === 0 ? c.sun : w === 6 ? c.sat : c.textMuted },
            ]}>
            {weekdayJa(w)}
          </Text>
        ))}
      </View>

      <View>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.week}>
            {week.map((cellDate, i) => {
              if (!cellDate) return <View key={i} style={styles.cell} />
              const dateStr = toDateStr(cellDate)
              const isToday = dateStr === today
              const isSelected = interactive && dateStr === selectedDate
              const dow = cellDate.getDay()
              const dayEvents = eventsByDate[dateStr] || []
              const duty = getDuty ? getDuty(dateStr) : null
              const extra = dayEvents.length - MAX_VISIBLE_EVENTS
              const dayColor = dow === 0 ? c.sun : dow === 6 ? c.sat : c.text

              return (
                <Pressable
                  key={i}
                  disabled={!interactive}
                  onPress={() => onSelectDate?.(dateStr)}
                  style={[
                    styles.cell,
                    isSelected && { backgroundColor: c.accentBg, borderRadius: 8 },
                  ]}>
                  <View style={styles.cellHead}>
                    {isToday ? (
                      <View style={[styles.todayBadge, { backgroundColor: c.accent }]}>
                        <Text style={styles.todayNum}>{cellDate.getDate()}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.dayNum, { color: dayColor }]}>{cellDate.getDate()}</Text>
                    )}
                    {duty?.person ? (
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.duty,
                          duty.isOverride
                            ? { color: c.danger, fontWeight: '600' }
                            : { color: c.textMuted },
                        ]}>
                        {duty.person}
                      </Text>
                    ) : null}
                  </View>

                  {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((ev, di) => (
                    <View
                      key={di}
                      style={[
                        styles.event,
                        { backgroundColor: c.hoverBg, borderLeftColor: ev.color },
                      ]}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.eventText,
                          { color: c.text },
                          ev.skipped && {
                            textDecorationLine: 'line-through',
                            color: c.textMuted,
                            opacity: 0.6,
                          },
                        ]}>
                        {ev.event.title}
                      </Text>
                    </View>
                  ))}
                  {extra > 0 && (
                    <Text style={[styles.more, { color: c.textMuted }]}>+{extra}件</Text>
                  )}
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 6,
  },
  title: { fontSize: 14, fontWeight: '600' },
  nav: { paddingVertical: 4, paddingHorizontal: 8 },
  weekdays: { flexDirection: 'row', marginBottom: 2 },
  weekday: { flex: 1, minWidth: 0, textAlign: 'left', fontSize: 10, paddingVertical: 2, paddingLeft: 4 },
  week: { flexDirection: 'row' },
  cell: { flex: 1, minWidth: 0, minHeight: 62, padding: 3, gap: 2, overflow: 'hidden' },
  cellHead: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dayNum: { fontSize: 12, fontWeight: '600' },
  todayBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayNum: { color: '#fff', fontSize: 11, fontWeight: '600' },
  duty: { flex: 1, fontSize: 9, lineHeight: 11 },
  event: { borderLeftWidth: 2, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1 },
  eventText: { fontSize: 9, lineHeight: 12 },
  more: { fontSize: 8, paddingLeft: 3 },
})
