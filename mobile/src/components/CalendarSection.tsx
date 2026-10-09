// Web 版 src/components/CalendarSection.jsx の移植。ホームから使う。
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { getAuthInstance } from '@shared/auth'
import { expandEventsByDate, isOccurrenceSkipped, visibleEvents } from '@shared/calendarEvents'
import { formatDateJa, todayStr, weekdayJaOf } from '@shared/date'
import { normalizeRotation, overridesByDate, resolveDuty } from '@shared/duty'
import { addItem, removeItem, subscribeList, subscribeValue, updateItem } from '@shared/firebaseData'
import { projectsOfUser } from '@shared/projects'
import { TAG_COLORS, TAGS } from '@shared/tags'

import { DateField } from './DateField'
import { DayEvent, MiniCalendar } from './MiniCalendar'
import {
  AppModal,
  Btn,
  Card,
  CardTitle,
  Chip,
  EmptyState,
  Field,
  Input,
  ModalSub,
  RowBetween,
  TagChip,
} from './ui'
import { useTheme } from '@/theme'

const EMPTY_FORM = {
  title: '',
  startDate: '',
  endDate: '',
  tag: '一般',
  note: '',
  repeat: '',
  repeatUntil: '',
  projectId: '',
}

export function CalendarSection() {
  const c = useTheme()
  const [events, setEvents] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [editingStart, setEditingStart] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [rotationRaw, setRotationRaw] = useState<any>(null)
  const [overrides, setOverrides] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])

  const uid = getAuthInstance().currentUser?.uid

  useEffect(() => {
    const unsubs = [
      subscribeList('calendarEvents', setEvents),
      subscribeList('dutyOverrides', setOverrides),
      subscribeValue('dutyRotation', setRotationRaw),
      subscribeList('projects', setProjects),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  const rotation = useMemo(() => normalizeRotation(rotationRaw), [rotationRaw])
  const overrideMap = useMemo(() => overridesByDate(overrides), [overrides])
  const getDuty = useCallback(
    (dateStr: string) => resolveDuty(dateStr, rotation, overrideMap),
    [rotation, overrideMap],
  )

  // 公開範囲に選べるのは自分が所属している制作だけ
  const myProjects = useMemo(() => projectsOfUser(projects, uid), [projects, uid])
  const projectNames = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])) as Record<string, string>,
    [projects],
  )

  const eventsByDate = useMemo(
    () => expandEventsByDate(visibleEvents(events, projects, uid)) as Record<string, DayEvent[]>,
    [events, projects, uid],
  )

  const dayEvents = useMemo(
    () =>
      [...(eventsByDate[selectedDate] || [])].sort(
        (a: any, b: any) =>
          a.start.localeCompare(b.start) || a.event.title.localeCompare(b.event.title),
      ),
    [eventsByDate, selectedDate],
  )

  function openAddForm() {
    setEditing(null)
    setEditingStart('')
    setForm({ ...EMPTY_FORM, startDate: selectedDate })
    setFormOpen(true)
  }

  function openEditForm(ev: any, start: string) {
    setEditing(ev)
    setEditingStart(start || ev.date)
    setForm({
      title: ev.title || '',
      startDate: ev.date,
      endDate: ev.endDate || '',
      tag: ev.tag || '一般',
      note: ev.note || '',
      repeat: ev.repeat || '',
      repeatUntil: ev.repeatUntil || '',
      projectId: ev.projectId || '',
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setEditingStart('')
  }

  // 除外日は「毎週」の各回の初日で記録する。他の回には影響しない
  function skipOccurrence() {
    if (!editing || !editingStart) return
    updateItem('calendarEvents', editing.id, { [`skipDates/${editingStart}`]: true })
    closeForm()
  }

  function restoreOccurrence() {
    if (!editing || !editingStart) return
    updateItem('calendarEvents', editing.id, { [`skipDates/${editingStart}`]: null })
    closeForm()
  }

  function submitForm() {
    if (!form.title.trim() || !form.startDate) return
    const project = myProjects.find((p: any) => p.id === form.projectId)
    const weekly = form.repeat === 'weekly'
    const payload: any = {
      title: form.title.trim(),
      date: form.startDate,
      endDate: form.endDate && form.endDate > form.startDate ? form.endDate : '',
      tag: form.tag,
      note: form.note.trim(),
      repeat: weekly ? 'weekly' : '',
      repeatUntil:
        weekly && form.repeatUntil && form.repeatUntil >= form.startDate ? form.repeatUntil : '',
      projectId: project ? project.id : '',
      projectName: project ? project.name : '',
      updatedAt: Date.now(),
    }
    // くりかえしをやめたら、残った除外日が単発の予定を中止扱いにしないよう消す
    if (!weekly) payload.skipDates = null
    if (editing) {
      updateItem('calendarEvents', editing.id, payload)
    } else {
      addItem('calendarEvents', { ...payload, createdAt: Date.now(), createdBy: uid || '' })
    }
    closeForm()
  }

  function deleteEvent() {
    if (editing) removeItem('calendarEvents', editing.id)
    closeForm()
  }

  const occurrenceSkipped = editing ? isOccurrenceSkipped(editing, editingStart) : false

  return (
    <View>
      <Card>
        <MiniCalendar
          interactive
          eventsByDate={eventsByDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          getDuty={getDuty}
        />
      </Card>

      <View style={styles.legend}>
        {TAGS.map((t: any) => (
          <TagChip key={t.key} label={t.key} color={t.color} />
        ))}
      </View>

      <Card>
        <RowBetween>
          <CardTitle>{formatDateJa(selectedDate)}の予定</CardTitle>
          <Btn label="+ 追加" variant="primary" onPress={openAddForm} />
        </RowBetween>
        {dayEvents.length === 0 ? (
          <EmptyState>予定はありません</EmptyState>
        ) : (
          dayEvents.map(({ event: ev, start, skipped }: any) => (
            <Pressable
              key={`${ev.id}-${start}`}
              onPress={() => openEditForm(ev, start)}
              style={[styles.eventRow, { borderTopColor: c.border }]}>
              <TagChip label={ev.tag} color={TAG_COLORS[ev.tag] || TAG_COLORS['その他']} />
              <Text
                numberOfLines={1}
                style={[
                  styles.eventTitle,
                  { color: c.text },
                  skipped && { textDecorationLine: 'line-through', color: c.textMuted },
                ]}>
                {ev.title}
              </Text>
              {ev.projectId ? (
                <View style={[styles.badge, styles.projectBadge, { backgroundColor: c.accentBg }]}>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 10, fontWeight: '600', color: c.accent }}>
                    {projectNames[ev.projectId] || ev.projectName}のみ
                  </Text>
                </View>
              ) : null}
              {skipped && (
                <View style={[styles.badge, { backgroundColor: c.dangerBg }]}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: c.danger }}>中止</Text>
                </View>
              )}
              {ev.repeat === 'weekly' && (
                <View style={[styles.badge, { backgroundColor: c.accentBg }]}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: c.accent }}>毎週</Text>
                </View>
              )}
              {ev.endDate ? (
                <Text style={{ fontSize: 11, color: c.textMuted }}>
                  〜{ev.endDate.slice(5).replace('-', '/')}
                </Text>
              ) : null}
            </Pressable>
          ))
        )}
      </Card>

      <AppModal
        visible={formOpen}
        title={editing ? '予定の編集' : '予定を追加'}
        onClose={closeForm}
        footer={
          <>
            {editing && (
              <Btn
                label={editing.repeat === 'weekly' ? 'すべて削除' : '削除'}
                variant="danger"
                onPress={deleteEvent}
              />
            )}
            <Btn label="キャンセル" onPress={closeForm} />
            <Btn label={editing ? '更新' : '追加'} variant="primary" block onPress={submitForm} />
          </>
        }>
        {editing?.repeat === 'weekly' && editingStart ? (
          <View
            style={[
              styles.occurrenceBox,
              occurrenceSkipped
                ? { backgroundColor: c.dangerBg, borderColor: 'transparent' }
                : { backgroundColor: c.hoverBg, borderColor: c.border },
            ]}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 2 }}>
              {formatDateJa(editingStart)}の回
            </Text>
            {occurrenceSkipped ? (
              <>
                <Text style={[styles.occurrenceNote, { color: c.danger }]}>
                  この回は中止になっています。
                </Text>
                <Btn label="中止を取り消す" onPress={restoreOccurrence} />
              </>
            ) : (
              <>
                <Text style={[styles.occurrenceNote, { color: c.textMuted }]}>
                  下の編集内容はすべての回に反映されます。この回だけ休むときはこちら。
                </Text>
                <Btn label="この回だけ中止" variant="danger" onPress={skipOccurrence} />
              </>
            )}
          </View>
        ) : null}

        <Field label="タイトル *">
          <Input
            value={form.title}
            onChangeText={(v) => setForm({ ...form, title: v })}
            placeholder="例: 新歓ミーティング"
          />
        </Field>

        <Field label="開始日 *">
          <DateField
            value={form.startDate}
            onChange={(v) => setForm({ ...form, startDate: v })}
          />
        </Field>

        <Field label="終了日(連日の場合)">
          <DateField
            value={form.endDate}
            onChange={(v) => setForm({ ...form, endDate: v })}
            minimumDate={form.startDate}
            clearable
          />
        </Field>

        <Field label="くりかえし">
          <View style={styles.chipRow}>
            <Chip
              label="なし"
              active={form.repeat === ''}
              onPress={() => setForm({ ...form, repeat: '', repeatUntil: '' })}
            />
            <Chip
              label="毎週"
              active={form.repeat === 'weekly'}
              onPress={() => setForm({ ...form, repeat: 'weekly' })}
            />
          </View>
          {form.repeat === 'weekly' && (
            <Text style={{ marginTop: 6, fontSize: 11, color: c.textMuted }}>
              {form.startDate
                ? `毎週${weekdayJaOf(form.startDate)}曜日にくりかえします`
                : '開始日を入れると、その曜日が毎週の曜日になります'}
            </Text>
          )}
        </Field>

        {form.repeat === 'weekly' && (
          <Field label="くりかえす最終日(空欄なら無期限)">
            <DateField
              value={form.repeatUntil}
              onChange={(v) => setForm({ ...form, repeatUntil: v })}
              minimumDate={form.startDate}
              clearable
            />
          </Field>
        )}

        <Field label="タグ">
          <View style={styles.chipRow}>
            {TAGS.map((t: any) => (
              <Chip
                key={t.key}
                label={t.key}
                color={t.color}
                active={form.tag === t.key}
                onPress={() => setForm({ ...form, tag: t.key })}
              />
            ))}
          </View>
        </Field>

        <Field label="公開範囲">
          <View style={styles.chipRow}>
            <Chip
              label="全員"
              active={form.projectId === ''}
              onPress={() => setForm({ ...form, projectId: '' })}
            />
            {myProjects.map((p: any) => (
              <Chip
                key={p.id}
                label={p.name}
                active={form.projectId === p.id}
                onPress={() => setForm({ ...form, projectId: p.id })}
              />
            ))}
          </View>
          <Text style={{ marginTop: 6, fontSize: 11, color: c.textMuted, lineHeight: 17 }}>
            {myProjects.length === 0
              ? '制作を選ぶと、その制作のメンバーだけに見える予定になります。設定タブの「制作グループ」から参加できます。'
              : '制作を選ぶと、その制作のメンバーだけに見える予定になります。'}
          </Text>
        </Field>

        <Field label="メモ(任意)">
          <Input
            value={form.note}
            onChangeText={(v) => setForm({ ...form, note: v })}
            multiline
          />
        </Field>
      </AppModal>
    </View>
  )
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  eventTitle: { flex: 1, fontSize: 13 },
  badge: { paddingVertical: 1, paddingHorizontal: 7, borderRadius: 99 },
  projectBadge: { maxWidth: '40%' },
  occurrenceBox: {
    padding: 10,
    marginBottom: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  occurrenceNote: { fontSize: 11, lineHeight: 15, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
})
