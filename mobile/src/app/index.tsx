// Web 版 src/pages/Home.jsx の移植
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'

import { expandEventsByDate } from '@shared/calendarEvents'
import { addDays, formatDateJa, todayStr } from '@shared/date'
import {
  cycleLabel,
  dutiesFrom,
  normalizeRotation,
  overridesByDate,
  resolveDuty,
} from '@shared/duty'
import { removeItem, setItem, setValue, subscribeList, subscribeValue } from '@shared/firebaseData'

import { DateField } from '@/components/DateField'
import { DayEvent, MiniCalendar } from '@/components/MiniCalendar'
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
  const [events, setEvents] = useState<any[]>([])
  const [rotationRaw, setRotationRaw] = useState<any>(null)
  const [overrides, setOverrides] = useState<any[]>([])
  const [today, setToday] = useState(todayStr)

  const [changeOpen, setChangeOpen] = useState(false)
  const [changePerson, setChangePerson] = useState('')
  const [changeNote, setChangeNote] = useState('')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draftMembers, setDraftMembers] = useState<string[]>([])
  const [draftStart, setDraftStart] = useState('')
  const [newMember, setNewMember] = useState('')

  useEffect(() => {
    const unsubs = [
      subscribeList('orders', setOrders),
      subscribeList('printerReservations', setReservations),
      subscribeList('calendarEvents', setEvents),
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
  const eventsByDate = useMemo(
    () => expandEventsByDate(events) as Record<string, DayEvent[]>,
    [events],
  )
  const getDuty = useCallback(
    (dateStr: string) => resolveDuty(dateStr, rotation, overrideMap),
    [rotation, overrideMap],
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

  function openSettings() {
    setDraftMembers(rotation.members)
    setDraftStart(rotation.startDate || today)
    setNewMember('')
    setSettingsOpen(true)
  }

  function addMember() {
    const name = newMember.trim()
    if (!name) return
    setDraftMembers((list) => [...list, name])
    setNewMember('')
  }

  function moveMember(index: number, delta: number) {
    setDraftMembers((list) => {
      const target = index + delta
      if (target < 0 || target >= list.length) return list
      const next = [...list]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function submitSettings() {
    setValue('dutyRotation', { members: draftMembers, startDate: draftStart })
    setSettingsOpen(false)
  }

  const draftPreview = useMemo(
    () => dutiesFrom(today, { members: draftMembers, startDate: draftStart }, {}, 7),
    [today, draftMembers, draftStart],
  )

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.page}>
      <Card>
        <RowBetween>
          <CardTitle>今日の責任者</CardTitle>
          <CardLink label="ローテ設定" onPress={openSettings} />
        </RowBetween>

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
            ローテーションが未設定です。「ローテ設定」から部員と開始日を登録してください。
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

      <Card>
        <MiniCalendar eventsByDate={eventsByDate} getDuty={getDuty} />
      </Card>

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

      <AppModal
        visible={settingsOpen}
        title="責任者ローテーション"
        onClose={() => setSettingsOpen(false)}
        footer={
          <>
            <Btn label="キャンセル" onPress={() => setSettingsOpen(false)} />
            <Btn label="保存" variant="primary" block onPress={submitSettings} />
          </>
        }>
        <ModalSub>
          開始日から日替わりで、下の順番に1人ずつ交代します。
          {draftMembers.length > 0
            ? ` 現在 ${draftMembers.length}人 → ${cycleLabel(draftMembers)}`
            : ''}
        </ModalSub>

        <Field label="1番目の人が担当する日 *">
          <DateField value={draftStart} onChange={setDraftStart} />
        </Field>

        <Field label={`順番(${draftMembers.length}人)`}>
          {draftMembers.length === 0 ? (
            <EmptyState>まだ登録がありません</EmptyState>
          ) : (
            <View style={[styles.memberList, { borderColor: c.border }]}>
              {draftMembers.map((m, i) => (
                <View key={`${m}-${i}`} style={[styles.memberRow, { borderTopColor: c.border }]}>
                  <Text style={{ width: 20, fontSize: 11, color: c.textMuted, textAlign: 'center' }}>
                    {i + 1}
                  </Text>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: c.text }}>
                    {m}
                  </Text>
                  <MemberBtn label="▲" disabled={i === 0} onPress={() => moveMember(i, -1)} />
                  <MemberBtn
                    label="▼"
                    disabled={i === draftMembers.length - 1}
                    onPress={() => moveMember(i, 1)}
                  />
                  <MemberBtn
                    label="×"
                    onPress={() => setDraftMembers((l) => l.filter((_, j) => j !== i))}
                  />
                </View>
              ))}
            </View>
          )}
        </Field>

        <View style={styles.addRow}>
          <View style={{ flex: 1 }}>
            <Input
              value={newMember}
              onChangeText={setNewMember}
              placeholder="部員を追加"
              onSubmitEditing={addMember}
              returnKeyType="done"
            />
          </View>
          <Btn label="追加" onPress={addMember} />
        </View>

        {draftPreview.length > 0 && (
          <View style={[styles.dutyNext, { borderTopColor: c.border }]}>
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
              この設定での割り当て(今日から)
            </Text>
            {draftPreview.map((d: any) => (
              <View key={d.date} style={styles.nextRow}>
                <Text style={{ fontSize: 12, color: c.textMuted }}>{formatDateJa(d.date)}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: c.text }}>{d.person}</Text>
              </View>
            ))}
          </View>
        )}
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

function MemberBtn({
  label,
  onPress,
  disabled,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Btn
      label={label}
      onPress={onPress}
      disabled={disabled}
      style={{ width: 28, paddingHorizontal: 0, paddingVertical: 5 }}
    />
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
  memberList: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, overflow: 'hidden' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 10 },
})
