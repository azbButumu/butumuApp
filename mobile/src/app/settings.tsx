// Web 版 src/pages/Settings.jsx の移植。責任者ローテーションの設定。
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { formatDateJa, todayStr } from '@shared/date'
import { cycleLabel, dutiesFrom, normalizeRotation } from '@shared/duty'
import { getAuthInstance, signOutUser, updateProfile } from '@shared/auth'
import { memberLabel, sortMembers } from '@shared/members'
import { setValue, subscribeList, subscribeValue } from '@shared/firebaseData'

import { DateField } from '@/components/DateField'
import { GradePicker } from '@/components/AuthGate'
import { ProjectsCard } from '@/components/ProjectsCard'
import { Btn, Card, CardTitle, EmptyState, Field, Input } from '@/components/ui'
import { useTheme } from '@/theme'

export default function SettingsScreen() {
  const c = useTheme()
  const [rotationRaw, setRotationRaw] = useState<any>(null)
  const [members, setMembers] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [newMember, setNewMember] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  const [accounts, setAccounts] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [editName, setEditName] = useState<string | null>(null)
  const [editGrade, setEditGrade] = useState('')

  useEffect(() => {
    const unsubs = [
      subscribeValue('dutyRotation', setRotationRaw),
      subscribeList('members', setAccounts),
      subscribeList('projects', setProjects),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  const today = todayStr()
  const rotation = useMemo(() => normalizeRotation(rotationRaw), [rotationRaw])

  // 編集中はサーバーの値で上書きしない
  useEffect(() => {
    if (dirty) return
    setMembers(rotation.members)
    setStartDate(rotation.startDate || todayStr())
  }, [rotation, dirty])

  function edit(fn: () => void) {
    setDirty(true)
    setSaved(false)
    fn()
  }

  function addMember() {
    const name = newMember.trim()
    if (!name) return
    edit(() => {
      setMembers((list) => [...list, name])
      setNewMember('')
    })
  }

  function moveMember(index: number, delta: number) {
    edit(() =>
      setMembers((list) => {
        const target = index + delta
        if (target < 0 || target >= list.length) return list
        const next = [...list]
        ;[next[index], next[target]] = [next[target], next[index]]
        return next
      }),
    )
  }

  function save() {
    setValue('dutyRotation', { members, startDate })
    setDirty(false)
    setSaved(true)
  }

  const account = getAuthInstance().currentUser
  const uid = account?.uid
  const sortedAccounts = useMemo(() => sortMembers(accounts), [accounts])
  const me = accounts.find((m) => m.id === uid)

  function startEdit() {
    setEditName(me?.name || '')
    setEditGrade(me?.grade || '')
  }

  function saveProfile() {
    if (!uid) return
    updateProfile(uid, { name: editName || '', grade: editGrade })
    setEditName(null)
  }

  const preview = useMemo(
    () => dutiesFrom(today, { members, startDate }, {}, 7),
    [today, members, startDate],
  )

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.page}>
      <Card>
        <CardTitle>責任者ローテーション</CardTitle>
        <Text style={[styles.sub, { color: c.textMuted }]}>
          開始日から日替わりで、下の順番に1人ずつ交代します。
          {members.length > 0 ? ` 現在 ${members.length}人 → ${cycleLabel(members)}` : ''}
        </Text>

        <Field label="1番目の人が担当する日 *">
          <DateField value={startDate} onChange={(v) => edit(() => setStartDate(v))} />
        </Field>

        <Field label={`順番(${members.length}人)`}>
          {members.length === 0 ? (
            <EmptyState>まだ登録がありません</EmptyState>
          ) : (
            <View style={[styles.memberList, { borderColor: c.border }]}>
              {members.map((m, i) => (
                <View key={`${m}-${i}`} style={[styles.memberRow, { borderTopColor: c.border }]}>
                  <Text
                    style={{ width: 20, fontSize: 11, color: c.textMuted, textAlign: 'center' }}>
                    {i + 1}
                  </Text>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: c.text }}>
                    {m}
                  </Text>
                  <SmallBtn label="▲" disabled={i === 0} onPress={() => moveMember(i, -1)} />
                  <SmallBtn
                    label="▼"
                    disabled={i === members.length - 1}
                    onPress={() => moveMember(i, 1)}
                  />
                  <SmallBtn
                    label="×"
                    onPress={() => edit(() => setMembers((l) => l.filter((_, j) => j !== i)))}
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

        <Btn label="保存" variant="primary" onPress={save} />
        {dirty && (
          <Text style={[styles.hint, { color: c.textMuted }]}>未保存の変更があります</Text>
        )}
        {saved && <Text style={[styles.hint, { color: c.success }]}>保存しました</Text>}
      </Card>

      <ProjectsCard projects={projects} members={accounts} uid={uid} />

      <Card>
        <CardTitle>部員一覧({sortedAccounts.length}人)</CardTitle>
        {sortedAccounts.length === 0 ? (
          <EmptyState>まだ誰も登録していません</EmptyState>
        ) : (
          sortedAccounts.map((m: any) => (
            <View key={m.id} style={[styles.accountRow, { borderTopColor: c.border }]}>
              <Text
                style={[styles.gradeTag, { backgroundColor: c.hoverBg, color: c.textMuted }]}>
                {m.grade || '—'}
              </Text>
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: c.text }}>
                {memberLabel(m)}
                {m.id === uid ? '(あなた)' : ''}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 11, color: c.textMuted, maxWidth: 140 }}>
                {m.email}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <CardTitle>自分のアカウント</CardTitle>
        <Text style={[styles.sub, { color: c.textMuted }]}>
          {account?.email || 'ログイン中'}
          {account?.providerData?.[0]?.providerId === 'google.com' ? '(Google)' : ''}
        </Text>

        {editName === null ? (
          <>
            <View style={[styles.accountRow, { borderTopColor: c.border }]}>
              <Text
                style={[styles.gradeTag, { backgroundColor: c.hoverBg, color: c.textMuted }]}>
                {me?.grade || '—'}
              </Text>
              <Text style={{ flex: 1, fontSize: 13, color: c.text }}>{memberLabel(me)}</Text>
            </View>
            <Btn label="本名・学年を変更" onPress={startEdit} />
          </>
        ) : (
          <>
            <Field label="本名">
              <Input value={editName} onChangeText={setEditName} />
            </Field>
            <Field label="学年">
              <GradePicker value={editGrade} onChange={setEditGrade} />
            </Field>
            <View style={styles.editRow}>
              <Btn label="キャンセル" block onPress={() => setEditName(null)} />
              <Btn
                label="保存"
                variant="primary"
                block
                disabled={!editName.trim() || !editGrade}
                onPress={saveProfile}
              />
            </View>
          </>
        )}

        <View style={{ marginTop: 12 }}>
          <Btn label="ログアウト" variant="danger" onPress={signOutUser} />
        </View>
      </Card>

      {preview.length > 0 && (
        <Card>
          <CardTitle>この設定での割り当て(今日から)</CardTitle>
          {preview.map((d: any) => (
            <View key={d.date} style={styles.previewRow}>
              <Text style={{ fontSize: 12, color: c.textMuted }}>{formatDateJa(d.date)}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: c.text }}>{d.person}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  )
}

function SmallBtn({
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
  sub: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
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
  hint: { fontSize: 11, marginTop: 8, textAlign: 'center' },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  gradeTag: {
    width: 34,
    textAlign: 'center',
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
  },
  editRow: { flexDirection: 'row', gap: 8 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 3 },
})
