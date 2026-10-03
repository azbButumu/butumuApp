// Web 版 akiba-chu.html の「履歴」ビュー
import { useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'

import { Card, EmptyState } from '@/components/ui'
import { useTheme } from '@/theme'

import type { Order } from './OrderList'

export type HistorySession = { id?: string; date: string; ts: number; orders: Order[] }

export function History({ sessions }: { sessions: HistorySession[] }) {
  const c = useTheme()
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  if (sessions.length === 0) {
    return (
      <Card>
        <EmptyState>履歴はまだありません</EmptyState>
      </Card>
    )
  }

  return (
    <View>
      {sessions.map((session, si) => {
        const list = session.orders || []
        const bought = list.filter((o) => o.status === 'bought').length
        const unavail = list.filter((o) => o.status === 'unavail').length
        const isOpen = !collapsed[si]
        return (
          <Card key={session.id || si}>
            <Pressable
              onPress={() => setCollapsed((m) => ({ ...m, [si]: isOpen }))}
              style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>
                  {session.date}
                </Text>
                <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                  {list.length}件 / 購入済{bought} / 入手不可{unavail}
                </Text>
              </View>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</Text>
            </Pressable>

            {isOpen &&
              list.map((o, oi) => (
                <View key={oi} style={[styles.item, { borderTopColor: c.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: c.text }}>{o.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: c.textMuted }}>
                        {o.qty}
                        {o.unit} · {o.person}
                      </Text>
                      {o.url ? (
                        <Pressable onPress={() => Linking.openURL(o.url!)}>
                          <Text style={{ fontSize: 11, color: c.accent }}>URL</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color:
                        o.status === 'bought'
                          ? c.success
                          : o.status === 'unavail'
                            ? c.danger
                            : c.textMuted,
                    }}>
                    {o.status === 'bought' ? '購入済' : o.status === 'unavail' ? '入手不可' : '未購入'}
                  </Text>
                </View>
              ))}
          </Card>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
