// Web 版 src/pages/Home.jsx の移植
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'

import { addDays, formatDateJa, todayStr } from '@shared/date'
import { dutiesFrom, normalizeRotation, overridesByDate, resolveDuty } from '@shared/duty'
import { removeItem, setItem, subscribeList, subscribeValue } from '@shared/firebaseData'

import { CalendarSection } from '@/components/CalendarSection'
import {
  AppModal,
  Btn,
  Card,
  CardLink,
  CardTitle,
  Chip,
  EmptyState,
  Field,
  Input,
  ListItem,
  ModalSub,
  RowBetween,
} from '@/components/ui'
import { useTheme } from '@/theme'

export default function HomeScreen() {
  const c = useTheme()
  const router = useRouter()

  const [orders, setOrders] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [rotationRaw, setRotationRaw] = useState<any>(null)
  const [overrides, setOverrides] = useState<any[]>([])
  const [today, setToday] = useState(todayStr)

  const [changeOpen, setChangeOpen] = useState(false)
  const [changePerson, setChangePerson] = useState('')
  const [changeNote, setChangeNote] = useState('')

  useEffect(() => {
    const unsubs = [
      subscribeList('orders', setOrders),
      subscribeList('printerReservations', setReservations),
      subscribeList('dutyOverrides', setOverrides),
      subscribeValue('dutyRotation', setRotationRaw),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  // アプリを開いたままでも日付が変わったら切り替わるように
  useEffect(() => {
    const timer = setInterval(() => setToday((d) => (todayStr() === d ? d : todayStr())), 60000)
    return () => clearInterval(timer)
  }, [])

  const rotation = useMemo(() => normalizeRotation(rotationRaw), [rotationRaw])
  const overrideMap = useMemo(() => overridesByDate(overrides), [overrides])
  const duty = useMemo(
    () => resolveDuty(today, rotation, overrideMap),
    [today, rotation, overrideMap],
  )
  const upcoming = useMemo(
    () => dutiesFrom(addDays(today, 1), rotation, overrideMap, 5),
    [today, rotation, overrideMap],
  )

  const orderStats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      bought: orders.filter((o) => o.status === 'bought').length,
      unavail: orders.filter((o) => o.status === 'unavail').length,
    }),
    [orders],
  )

  const upcomingReservations = useMemo(
    () =>
      reservations
        .filter((r) => r.date >= today)
        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
        .slice(0, 5),
    [reservations, today],
  )

  function openChangeForm() {
    setChangePerson(duty.isOverride ? duty.person : '')
    setChangeNote(duty.note)
    setChangeOpen(true)
  }

  function submitChange() {
    const person = changePerson.trim()
    if (!person) return
    setItem('dutyOverrides', today, {
      date: today,
      person,
      note: changeNote.trim(),
      updatedAt: Date.now(),
    })
    setChangeOpen(false)
  }

  function clearChange() {
    removeItem('dutyOverrides', today)
    setChangeOpen(false)
  }

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.page}>
      <Card>
        <View style={{ marginBottom: 10 }}>
          <CardTitle>今日の責任者</CardTitle>
        </View>

        {duty.person ? (
          <>
            <View style={styles.dutyMain}>
              <Text style={[styles.dutyName, { color: c.text }]}>{duty.person}</Text>
              {duty.isOverride && (
                <View style={[styles.dutyBadge, { backgroundColor: c.dangerBg }]}>
                  <Text style={{ color: c.danger, fontSize: 11, fontWeight: '600' }}>
                    当日変更
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.dutyMeta, { color: c.textMuted }]}>
              {formatDateJa(today)}
              {duty.isOverride
                ? duty.scheduled
                  ? ` · 本来: ${duty.scheduled}`
                  : ''
                : ` · ${duty.turn + 1}/${rotation.members.length}人目`}
            </Text>
            {duty.note ? (
              <Text style={[styles.dutyNote, { backgroundColor: c.hoverBg, color: c.text }]}>
                {duty.note}
              </Text>
            ) : null}
          </>
        ) : (
          <EmptyState>
            ローテーションが未設定です。設定タブから部員と開始日を登録してください。
          </EmptyState>
        )}

        <View style={{ marginTop: 12 }}>
          <Btn
            label={duty.isOverride ? '当日変更を編集' : '今日だけ変更'}
            onPress={openChangeForm}
          />
        </View>

        {upcoming.length > 0 && (
          <View style={[styles.dutyNext, { borderTopColor: c.border }]}>
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>このあとの担当</Text>
            {upcoming.map((d: any) => (
              <View key={d.date} style={styles.nextRow}>
                <Text style={{ fontSize: 12, color: c.textMuted }}>{formatDateJa(d.date)}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: c.text }}>{d.person}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <CalendarSection />

      <Card>
        <RowBetween>
          <CardTitle>秋葉注 注文数</CardTitle>
          <CardLink label="開く →" onPress={() => router.push('/akiba')} />
        </RowBetween>
        <View style={styles.statGrid}>
          <Stat value={orderStats.total} label="合計" color={c.text} />
          <Stat value={orderStats.pending} label="未購入" color="#a16207" />
          <Stat value={orderStats.bought} label="購入済" color={c.success} />
          <Stat value={orderStats.unavail} label="入手不可" color={c.danger} />
        </View>
      </Card>

      <Card>
        <RowBetween>
          <CardTitle>3Dプリンター予約</CardTitle>
          <CardLink label="開く →" onPress={() => router.push('/printer')} />
        </RowBetween>
        {upcomingReservations.length === 0 ? (
          <EmptyState>今後の予約はありません</EmptyState>
        ) : (
          upcomingReservations.map((r) => (
            <ListItem key={r.id}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: c.text }}>
                  {formatDateJa(r.date)}
                </Text>
                <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                  {r.person || '未記入'}
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.accent }}>
                {r.start} - {r.end}
              </Text>
            </ListItem>
          ))
        )}
      </Card>

      <AppModal
        visible={changeOpen}
        title="今日の責任者を変更"
        onClose={() => setChangeOpen(false)}
        footer={
          <>
            {duty.isOverride && <Btn label="元に戻す" variant="danger" onPress={clearChange} />}
            <Btn label="キャンセル" onPress={() => setChangeOpen(false)} />
            <Btn label="保存" variant="primary" block onPress={submitChange} />
          </>
        }>
        <ModalSub>
          {formatDateJa(today)} · 本来の担当: {duty.scheduled || '未設定'}
        </ModalSub>
        <Field label="今日の責任者 *">
          <Input value={changePerson} onChangeText={setChangePerson} placeholder="名前" />
        </Field>
        {rotation.members.length > 0 && (
          <View style={styles.chipRow}>
            {rotation.members.map((m: string) => (
              <Chip
                key={m}
                label={m}
                active={changePerson === m}
                onPress={() => setChangePerson(m)}
              />
            ))}
          </View>
        )}
        <Field label="メモ(任意)">
          <Input value={changeNote} onChangeText={setChangeNote} placeholder="交代の理由など" />
        </Field>
      </AppModal>

    </ScrollView>
  )
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  const c = useTheme()
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{label}</Text>
    </View>
  )
}


const styles = StyleSheet.create({
  page: { padding: 14, paddingBottom: 40 },
  dutyMain: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 2 },
  dutyName: { fontSize: 24, fontWeight: '700' },
  dutyBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 99 },
  dutyMeta: { fontSize: 12 },
  dutyNote: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 6,
    fontSize: 12,
  },
  dutyNext: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  sectionLabel: { fontSize: 11, marginBottom: 4 },
  nextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 3,
  },
  statGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
})
