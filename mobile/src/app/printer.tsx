// Web 版 src/pages/Printer3D.jsx の移植
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { addDays, formatDateJa, todayStr } from '@shared/date'
import {
  addItem,
  removeItem,
  subscribeList,
  subscribeValue,
  updateItem,
} from '@shared/firebaseData'
import { getAuthInstance } from '@shared/auth'
import { memberLabel } from '@shared/members'
import { projectsOfUser } from '@shared/projects'

import { AppModal, Btn, Chip, Field, Input, ModalSub } from '@/components/ui'
import { useTheme } from '@/theme'

const START_HOUR = 8
const END_HOUR = 24 // この時刻の手前までを枠にする

function buildSlots() {
  const slots: { start: string; end: string }[] = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    for (const m of [0, 30]) {
      const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const total = h * 60 + m + 30
      const end = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
      slots.push({ start, end })
    }
  }
  return slots
}

const SLOTS = buildSlots()

export default function PrinterScreen() {
  const c = useTheme()
  const [date, setDate] = useState(todayStr())
  const [reservations, setReservations] = useState<any[]>([])
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [person, setPerson] = useState('')
  const [note, setNote] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [me, setMe] = useState<any>(null)

  const uid = getAuthInstance().currentUser?.uid

  useEffect(() => {
    const unsubs = [
      subscribeList('printerReservations', setReservations),
      subscribeList('projects', setProjects),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  useEffect(() => {
    if (!uid) return
    return subscribeValue(`members/${uid}`, setMe)
  }, [uid])

  // 予約できるのは自分が所属している制作だけ
  const myProjects = useMemo(() => projectsOfUser(projects, uid), [projects, uid])

  const dayReservations = useMemo(
    () => reservations.filter((r) => r.date === date).sort((a, b) => a.start.localeCompare(b.start)),
    [reservations, date],
  )

  const slotOwner = useMemo(() => {
    const map: Record<number, any> = {}
    dayReservations.forEach((r) => {
      SLOTS.forEach((s, idx) => {
        if (s.start >= r.start && s.start < r.end) map[idx] = r
      })
    })
    return map
  }, [dayReservations])

  function resetSelection() {
    setSelection(null)
  }

  function handleSlotPress(idx: number) {
    const existing = slotOwner[idx]
    if (existing) {
      setEditing(existing)
      setPerson(existing.person || '')
      setNote(existing.note || '')
      setProjectId(existing.projectId || '')
      setFormOpen(true)
      return
    }
    if (!selection) {
      setSelection({ start: idx, end: idx })
      return
    }
    // 既存の選択範囲とタップしたコマを両方含む範囲に「延長」する(縮めない)
    const lo = Math.min(selection.start, idx)
    const hi = Math.max(selection.end, idx)
    let blocked = false
    for (let i = lo; i <= hi; i++) if (slotOwner[i]) blocked = true
    setSelection(blocked ? { start: idx, end: idx } : { start: lo, end: hi })
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  function submitForm() {
    if (!person.trim()) return
    const project = myProjects.find((p: any) => p.id === projectId)
    if (editing) {
      updateItem('printerReservations', editing.id, {
        person: person.trim(),
        note: note.trim(),
        projectId: projectId || '',
        projectName: project ? project.name : '',
      })
    } else if (selection) {
      addItem('printerReservations', {
        date,
        start: SLOTS[selection.start].start,
        end: SLOTS[selection.end].end,
        person: person.trim(),
        note: note.trim(),
        projectId: projectId || '',
        projectName: project ? project.name : '',
        createdAt: Date.now(),
        createdBy: uid || '',
      })
      resetSelection()
    }
    closeForm()
  }

  function deleteReservation() {
    if (editing) removeItem('printerReservations', editing.id)
    closeForm()
  }

  const selectionLabel = selection
    ? `${SLOTS[selection.start].start} 〜 ${SLOTS[selection.end].end}`
    : ''

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={styles.dateNav}>
        <Btn
          label="◀"
          onPress={() => {
            setDate((d) => addDays(d, -1))
            resetSelection()
          }}
        />
        <Btn
          label={formatDateJa(date)}
          block
          onPress={() => {
            setDate(todayStr())
            resetSelection()
          }}
        />
        <Btn
          label="▶"
          onPress={() => {
            setDate((d) => addDays(d, 1))
            resetSelection()
          }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }}>
        <View
          style={[styles.slotList, { backgroundColor: c.panelBg, borderColor: c.border }]}>
          {SLOTS.map((s, idx) => {
            const owner = slotOwner[idx]
            const isSelected = selection && idx >= selection.start && idx <= selection.end
            const isHourStart = s.start.endsWith(':00')
            return (
              <Pressable
                key={s.start}
                onPress={() => handleSlotPress(idx)}
                style={({ pressed }) => [
                  styles.slotRow,
                  {
                    borderTopColor: isHourStart ? c.border : 'transparent',
                    backgroundColor: isSelected
                      ? c.accentBg
                      : owner
                        ? c.hoverBg
                        : 'transparent',
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}>
                <Text style={[styles.slotTime, { color: c.textMuted }]}>{s.start}</Text>
                <View style={{ flex: 1 }}>
                  {owner ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>
                          {owner.person}
                        </Text>
                        {owner.projectName ? (
                          <View
                            style={{
                              paddingVertical: 1,
                              paddingHorizontal: 6,
                              borderRadius: 99,
                              backgroundColor: c.accentBg,
                            }}>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: c.accent }}>
                              {owner.projectName}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {owner.note ? (
                        <Text style={{ fontSize: 11, color: c.textMuted }}>{owner.note}</Text>
                      ) : null}
                    </>
                  ) : isSelected ? (
                    <Text style={{ fontSize: 13, color: c.accent, fontWeight: '600' }}>
                      選択中
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 12, color: c.textMuted }}>空き</Text>
                  )}
                </View>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>

      {selection && (
        <View
          style={[styles.selectionBar, { backgroundColor: c.panelBg, borderTopColor: c.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>
              {selectionLabel} を予約
            </Text>
            <Text style={{ fontSize: 11, color: c.textMuted }}>
              他の空きコマをタップすると延長できます
            </Text>
          </View>
          <Btn label="取消" onPress={resetSelection} />
          <Btn
            label="予約する"
            variant="primary"
            onPress={() => {
              setEditing(null)
              setPerson(memberLabel(me) === '不明' ? '' : memberLabel(me))
              setNote('')
              setProjectId('')
              setFormOpen(true)
            }}
          />
        </View>
      )}

      <AppModal
        visible={formOpen}
        title={editing ? '予約の編集' : '予約する'}
        onClose={closeForm}
        footer={
          <>
            {editing && <Btn label="削除" variant="danger" onPress={deleteReservation} />}
            <Btn label="キャンセル" onPress={closeForm} />
            <Btn
              label={editing ? '更新' : '予約を確定'}
              variant="primary"
              block
              onPress={submitForm}
            />
          </>
        }>
        <ModalSub>
          {editing ? `${date} ${editing.start} 〜 ${editing.end}` : `${date} ${selectionLabel}`}
        </ModalSub>
        <Field label="名前 *">
          <Input value={person} onChangeText={setPerson} placeholder="名前または制作名" />
        </Field>
        <Field label="制作(任意)">
          {myProjects.length === 0 ? (
            <Text style={{ fontSize: 11, color: c.textMuted, lineHeight: 17 }}>
              所属している制作がありません。設定タブの「制作グループ」から参加できます。
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Chip label="個人" active={projectId === ''} onPress={() => setProjectId('')} />
              {myProjects.map((p: any) => (
                <Chip
                  key={p.id}
                  label={p.name}
                  active={projectId === p.id}
                  onPress={() => setProjectId(p.id)}
                />
              ))}
            </View>
          )}
        </Field>
        <Field label="メモ(任意)">
          <Input
            value={note}
            onChangeText={setNote}
            placeholder="出力物やフィラメント色など"
            multiline
          />
        </Field>
      </AppModal>
    </View>
  )
}

const styles = StyleSheet.create({
  dateNav: { flexDirection: 'row', gap: 8, padding: 14 },
  slotList: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: 'hidden',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  slotTime: { width: 42, fontSize: 11 },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
