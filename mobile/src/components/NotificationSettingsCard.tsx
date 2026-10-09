// 予定の通知を受け取るかどうかを、タグごと・所属している制作ごとに選ぶ。アプリ版のみ。
import * as Notifications from 'expo-notifications'
import { useEffect, useMemo, useState } from 'react'
import { Linking, StyleSheet, Switch, Text, View } from 'react-native'

import { setValue, subscribeValue } from '@shared/firebaseData'
import { projectEnabled, tagEnabled } from '@shared/notifications'
import { projectsOfUser } from '@shared/projects'
import { TAGS } from '@shared/tags'

import { Btn, Card, CardTitle, TagChip } from '@/components/ui'
import { registerForPush } from '@/notifications'
import { useTheme } from '@/theme'

export function NotificationSettingsCard({ projects, uid }: { projects: any[]; uid?: string }) {
  const c = useTheme()
  const [settings, setSettings] = useState<any>(null)
  const [permission, setPermission] = useState<Notifications.NotificationPermissionsStatus | null>(
    null,
  )

  useEffect(() => {
    if (!uid) return
    return subscribeValue(`notifications/${uid}`, setSettings)
  }, [uid])

  useEffect(() => {
    Notifications.getPermissionsAsync().then(setPermission, () => setPermission(null))
  }, [])

  const myProjects = useMemo(() => projectsOfUser(projects, uid), [projects, uid])

  // オフにしたものだけ false で残し、オンに戻したら消す(未設定 = 受け取る)
  function setTag(tag: string, on: boolean) {
    if (uid) setValue(`notifications/${uid}/tags/${tag}`, on ? null : false)
  }

  function setProject(projectId: string, on: boolean) {
    if (uid) setValue(`notifications/${uid}/projects/${projectId}`, on ? null : false)
  }

  async function allow() {
    if (!uid) return
    if (permission && !permission.granted && !permission.canAskAgain) {
      Linking.openSettings()
      return
    }
    await registerForPush(uid)
    setPermission(await Notifications.getPermissionsAsync())
  }

  return (
    <Card>
      <CardTitle>通知</CardTitle>
      <Text style={[styles.sub, { color: c.textMuted }]}>
        カレンダーで「通知する」にした予定を、当日の指定された時刻に、この設定に合わせてお知らせします。
      </Text>

      {permission && !permission.granted && (
        <View style={[styles.warn, { backgroundColor: c.dangerBg }]}>
          <Text style={{ fontSize: 12, color: c.danger, marginBottom: 8, lineHeight: 17 }}>
            この端末では通知が許可されていません。
          </Text>
          <Btn
            label={permission.canAskAgain ? '通知を許可する' : '端末の設定を開く'}
            onPress={allow}
          />
        </View>
      )}

      <Text style={[styles.section, { color: c.textMuted }]}>全員向けの予定(タグごと)</Text>
      {TAGS.map((t: any) => (
        <ToggleRow
          key={t.key}
          on={tagEnabled(settings, t.key)}
          onChange={(on) => setTag(t.key, on)}>
          <TagChip label={t.key} color={t.color} />
        </ToggleRow>
      ))}

      <Text style={[styles.section, { color: c.textMuted }]}>制作限定の予定</Text>
      {myProjects.length === 0 ? (
        <Text style={{ fontSize: 12, color: c.textMuted, lineHeight: 17 }}>
          所属している制作がありません。下の「制作グループ」から参加できます。
        </Text>
      ) : (
        myProjects.map((p: any) => (
          <ToggleRow
            key={p.id}
            on={projectEnabled(settings, p.id)}
            onChange={(on) => setProject(p.id, on)}>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: c.text }}>
              {p.name}
            </Text>
          </ToggleRow>
        ))
      )}
    </Card>
  )
}

function ToggleRow({
  on,
  onChange,
  children,
}: {
  on: boolean
  onChange: (on: boolean) => void
  children: React.ReactNode
}) {
  const c = useTheme()
  return (
    <View style={[styles.row, { borderTopColor: c.border }]}>
      <View style={{ flex: 1, flexDirection: 'row' }}>{children}</View>
      <Switch
        value={on}
        onValueChange={onChange}
        trackColor={{ true: c.accent, false: c.border }}
        thumbColor="#fff"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  sub: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  warn: { padding: 10, borderRadius: 8, marginBottom: 8 },
  section: { fontSize: 11, fontWeight: '600', marginTop: 10, marginBottom: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
