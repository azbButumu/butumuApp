// Web 版 akiba-chu.html の「注文一覧」ビュー。モードで操作できる範囲が変わる。
import { useState } from 'react'
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'

import { AppModal, Btn, Card, Chip, EmptyState, ModalSub } from '@/components/ui'
import { useTheme } from '@/theme'

export type Order = {
  id: string
  name: string
  qty: number
  unit: string
  note?: string
  url?: string
  images?: string[]
  person: string
  status: 'pending' | 'bought' | 'partial' | 'unavail'
  boughtQty?: number
  ts: string
}

export type Mode = 'member' | 'buyer' | 'admin'

const FILTERS = [
  { key: 'all', label: 'すべて' },
  { key: 'pending', label: '未購入' },
  { key: 'bought', label: '購入済' },
  { key: 'unavail', label: '入手不可' },
] as const

export function OrderList({
  orders,
  mode,
  onSetStatus,
  onSetPartial,
  onRemove,
  onComplete,
}: {
  orders: Order[]
  mode: Mode
  onSetStatus: (id: string, status: Order['status']) => void
  onSetPartial: (id: string, boughtQty: number) => void
  onRemove: (id: string) => void
  onComplete: () => void
}) {
  const c = useTheme()
  const [filter, setFilter] = useState<string>('all')
  const [partialTarget, setPartialTarget] = useState<Order | null>(null)
  const [partialQty, setPartialQty] = useState(1)

  const canMark = mode === 'buyer' || mode === 'admin'
  const canRemove = mode === 'admin' || mode === 'member'
  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const summary = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    bought: orders.filter((o) => o.status === 'bought').length,
    unavail: orders.filter((o) => o.status === 'unavail').length,
  }

  function openPartial(o: Order) {
    setPartialTarget(o)
    setPartialQty(Math.min(o.boughtQty || 1, Math.max(1, o.qty - 1)))
  }

  function confirmPartial() {
    if (!partialTarget) return
    onSetPartial(partialTarget.id, partialQty)
    setPartialTarget(null)
  }

  function confirmRemove(o: Order) {
    Alert.alert('確認', `「${o.name}」を削除しますか?`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => onRemove(o.id) },
    ])
  }

  return (
    <View>
      <Card>
        <View style={styles.summaryBar}>
          <Sum value={summary.total} label="合計" color={c.text} />
          <Sum value={summary.pending} label="未購入" color="#a16207" />
          <Sum value={summary.bought} label="購入済" color={c.success} />
          <Sum value={summary.unavail} label="入手不可" color={c.danger} />
        </View>
      </Card>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            active={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </View>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState>注文はまだありません</EmptyState>
        </Card>
      ) : (
        filtered.map((o) => {
          const remaining = o.status === 'partial' ? o.qty - (o.boughtQty || 0) : o.qty
          return (
            <Card key={o.id} style={o.status === 'bought' ? { opacity: 0.6 } : undefined}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{o.name}</Text>
                  <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                    {remaining}
                    {o.unit} · {o.person} · {o.ts}
                  </Text>
                  {o.note ? (
                    <Text style={{ fontSize: 12, color: c.text, marginTop: 4 }}>{o.note}</Text>
                  ) : null}
                  {o.url ? (
                    <Pressable onPress={() => Linking.openURL(o.url!)}>
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 11, color: c.accent, marginTop: 4 }}>
                        {o.url}
                      </Text>
                    </Pressable>
                  ) : null}
                  {o.images && o.images.length > 0 && (
                    <View style={styles.thumbs}>
                      {o.images.map((src, i) => (
                        <Image key={i} source={{ uri: src }} style={styles.thumb} />
                      ))}
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <StatusBadge status={o.status} />
                  {canRemove && (
                    <Pressable onPress={() => confirmRemove(o)} hitSlop={6}>
                      <Text style={{ fontSize: 11, color: c.danger }}>削除</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {canMark && (
                <View style={styles.markRow}>
                  <Chip
                    label="✓ 購入済"
                    active={o.status === 'bought'}
                    color={c.success}
                    onPress={() => onSetStatus(o.id, 'bought')}
                  />
                  <Chip
                    label="△ 一部購入"
                    active={o.status === 'partial'}
                    color="#a16207"
                    onPress={() => openPartial(o)}
                  />
                  <Chip
                    label="✕ 入手不可"
                    active={o.status === 'unavail'}
                    color={c.danger}
                    onPress={() => onSetStatus(o.id, 'unavail')}
                  />
                  <Chip
                    label="⟳ 未購入"
                    active={o.status === 'pending'}
                    onPress={() => onSetStatus(o.id, 'pending')}
                  />
                </View>
              )}
            </Card>
          )
        })
      )}

      {mode === 'buyer' && (
        <Btn
          label="秋葉原での買い出し完了 — 結果を履歴に保存する"
          variant="primary"
          onPress={onComplete}
        />
      )}

      <AppModal
        visible={partialTarget !== null}
        title="一部購入"
        onClose={() => setPartialTarget(null)}
        footer={
          <>
            <Btn label="キャンセル" onPress={() => setPartialTarget(null)} />
            <Btn label="記録する" variant="primary" block onPress={confirmPartial} />
          </>
        }>
        {partialTarget && (
          <>
            <ModalSub>
              「{partialTarget.name}」 注文数: {partialTarget.qty}
              {partialTarget.unit}
            </ModalSub>
            <View style={styles.partialRow}>
              <Btn label="−" onPress={() => setPartialQty((q) => Math.max(1, q - 1))} />
              <Text style={{ fontSize: 22, fontWeight: '700', color: c.text, minWidth: 48, textAlign: 'center' }}>
                {partialQty}
              </Text>
              <Btn
                label="+"
                onPress={() =>
                  setPartialQty((q) => Math.min(Math.max(1, partialTarget.qty - 1), q + 1))
                }
              />
              <Text style={{ fontSize: 13, color: c.textMuted }}>{partialTarget.unit} 購入済</Text>
            </View>
          </>
        )}
      </AppModal>
    </View>
  )
}

function Sum({ value, label, color }: { value: number; label: string; color: string }) {
  const c = useTheme()
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const c = useTheme()
  const map = {
    bought: { label: '購入済', bg: c.successBg, fg: c.success },
    unavail: { label: '前回入手不可', bg: c.dangerBg, fg: c.danger },
    partial: { label: '一部購入', bg: c.hoverBg, fg: '#a16207' },
    pending: { label: '未購入', bg: c.hoverBg, fg: c.textMuted },
  } as const
  const s = map[status] || map.pending
  return (
    <View style={{ backgroundColor: s.bg, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 99 }}>
      <Text style={{ fontSize: 10, fontWeight: '600', color: s.fg }}>{s.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  summaryBar: { flexDirection: 'row', justifyContent: 'space-around' },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  markRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.25)',
  },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  thumb: { width: 54, height: 54, borderRadius: 6 },
  partialRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
})
