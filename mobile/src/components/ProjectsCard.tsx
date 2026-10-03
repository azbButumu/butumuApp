// 制作グループの一覧・作成・メンバー編集。Web 版 src/components/ProjectsCard.jsx と対応。
import { useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { addItem, removeItem, updateItem } from '@shared/firebaseData'
import { memberLabel, sortMembers } from '@shared/members'
import {
  isProjectMember,
  memberCount,
  projectMemberIds,
  sortProjects,
} from '@shared/projects'

import { AppModal, Btn, Card, CardLink, CardTitle, EmptyState, Field, Input, ModalSub, RowBetween } from '@/components/ui'
import { useTheme } from '@/theme'

export function ProjectsCard({
  projects,
  members,
  uid,
}: {
  projects: any[]
  members: any[]
  uid?: string
}) {
  const c = useTheme()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const list = useMemo(() => sortProjects(projects), [projects])
  const sortedMembers = useMemo(() => sortMembers(members), [members])
  // 購読で届く最新を使う(モーダルを開いた時点の値だと古くなる)
  const current = editingId ? projects.find((p) => p.id === editingId) : null

  function createProject() {
    const name = newName.trim()
    if (!name || !uid) return
    addItem('projects', {
      name,
      createdBy: uid,
      createdAt: Date.now(),
      members: { [uid]: true },
    })
    setNewName('')
    setAddOpen(false)
  }

  function toggleMember(projectId: string, memberId: string, join: boolean) {
    updateItem('projects', projectId, { [`members/${memberId}`]: join ? true : null })
  }

  function deleteProject(project: any) {
    Alert.alert('確認', `制作「${project.name}」を削除しますか?`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          removeItem('projects', project.id)
          setEditingId(null)
        },
      },
    ])
  }

  return (
    <Card>
      <RowBetween>
        <CardTitle>制作グループ</CardTitle>
        <CardLink label="+ 追加" onPress={() => setAddOpen(true)} />
      </RowBetween>

      {list.length === 0 ? (
        <EmptyState>制作はまだありません</EmptyState>
      ) : (
        list.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setEditingId(p.id)}
            style={[styles.row, { borderTopColor: c.border }]}>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: c.text }}>
              {p.name}
            </Text>
            {isProjectMember(p, uid) && (
              <View style={[styles.badge, { backgroundColor: c.accentBg }]}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: c.accent }}>参加中</Text>
              </View>
            )}
            <Text style={{ fontSize: 11, color: c.textMuted }}>{memberCount(p)}人</Text>
          </Pressable>
        ))
      )}

      <AppModal
        visible={addOpen}
        title="制作を追加"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <Btn label="キャンセル" onPress={() => setAddOpen(false)} />
            <Btn label="作成" variant="primary" block onPress={createProject} />
          </>
        }>
        <Field label="制作名 *">
          <Input value={newName} onChangeText={setNewName} placeholder="例: ライントレーサー" />
        </Field>
        <ModalSub>作成した人は自動で参加メンバーになります。</ModalSub>
      </AppModal>

      <AppModal
        visible={current !== null && current !== undefined}
        title={current?.name || ''}
        onClose={() => setEditingId(null)}
        footer={
          <>
            <Btn label="削除" variant="danger" onPress={() => current && deleteProject(current)} />
            <Btn label="閉じる" block onPress={() => setEditingId(null)} />
          </>
        }>
        {current && (
          <>
            <Field label="制作名">
              <Input
                value={current.name}
                onChangeText={(v) => updateItem('projects', current.id, { name: v })}
              />
            </Field>
            <Field label={`メンバー(${projectMemberIds(current).length}人)`}>
              <ModalSub>名前をタップすると参加・解除が切り替わります。</ModalSub>
              <View style={[styles.pickList, { borderColor: c.border }]}>
                {sortedMembers.map((m: any) => {
                  const joined = isProjectMember(current, m.id)
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => toggleMember(current.id, m.id, !joined)}
                      style={[
                        styles.pick,
                        { borderTopColor: c.border },
                        joined && { backgroundColor: c.accentBg },
                      ]}>
                      <Text
                        style={{ width: 30, fontSize: 11, color: c.textMuted, textAlign: 'center' }}>
                        {m.grade || '—'}
                      </Text>
                      <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: c.text }}>
                        {memberLabel(m)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: joined ? c.accent : c.textMuted,
                          fontWeight: joined ? '600' : '400',
                        }}>
                        {joined ? '参加中' : '追加'}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </Field>
          </>
        )}
      </AppModal>
    </Card>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  badge: { paddingVertical: 1, paddingHorizontal: 7, borderRadius: 99 },
  pickList: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, overflow: 'hidden' },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
