// Web 版 public/akiba-chu.html のネイティブ移植。
// Firebase のパス(orders / history / presets / helpText)は Web 版と同じなので
// どちらから操作しても同じデータを見る。
import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import DEFAULT_PRESETS from '@shared/akibaPresets'
import {
  addItem,
  removeItem,
  setValue,
  subscribeList,
  subscribeValue,
  updateItem,
} from '@shared/firebaseData'

import { CustomAdd } from '@/components/akiba/CustomAdd'
import { History, HistorySession } from '@/components/akiba/History'
import { Mode, Order, OrderList } from '@/components/akiba/OrderList'
import { PresetEditor } from '@/components/akiba/PresetEditor'
import { PresetItem, Presets, QuickAdd } from '@/components/akiba/QuickAdd'
import { AppModal, Btn, Chip } from '@/components/ui'
import { useTheme } from '@/theme'

type SubTab = 'quick' | 'custom' | 'list' | 'history' | 'admin'

const MODE_LABEL: Record<Mode, string> = {
  member: '部員モード',
  buyer: '購入者モード',
  admin: '管理者モード',
}

// モードごとに見せるサブタブ(Web 版 setMode の表示制御と同じ)
const VISIBLE_TABS: Record<Mode, SubTab[]> = {
  member: ['quick', 'custom', 'list', 'history'],
  buyer: ['list'],
  admin: ['quick', 'list', 'admin'],
}

const TAB_LABEL: Record<SubTab, string> = {
  quick: 'クイック追加',
  custom: '詳細追加',
  list: '注文一覧',
  history: '履歴',
  admin: '管理',
}

function nowTime() {
  return new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

export default function AkibaScreen() {
  const c = useTheme()
  const [orders, setOrders] = useState<Order[]>([])
  const [history, setHistory] = useState<HistorySession[]>([])
  const [presetsRaw, setPresetsRaw] = useState<Presets | null>(null)
  const [helpText, setHelpText] = useState('')

  const [mode, setMode] = useState<Mode>('member')
  const [tab, setTab] = useState<SubTab>('quick')
  const [modeOpen, setModeOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)

  useEffect(() => {
    const unsubs = [
      subscribeList('orders', (list: any[]) => setOrders(list as Order[])),
      subscribeList('history', (list: any[]) =>
        setHistory((list as HistorySession[]).sort((a, b) => b.ts - a.ts)),
      ),
      subscribeValue('presets', setPresetsRaw),
      subscribeValue('helpText', (v: any) => setHelpText(v || '')),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  // Firebase に presets が無いうちは既定値を使う(Web 版と同じ挙動)
  const presets: Presets = useMemo(
    () => presetsRaw || (DEFAULT_PRESETS as Presets),
    [presetsRaw],
  )

  const visibleTabs = VISIBLE_TABS[mode]
  // モードを変えたときに見えないタブに留まらないようにする
  useEffect(() => {
    if (!visibleTabs.includes(tab)) setTab(visibleTabs[0])
  }, [mode, tab, visibleTabs])

  function addOrder(partial: Partial<Order>) {
    addItem('orders', {
      name: '',
      qty: 1,
      unit: '個',
      note: '',
      url: '',
      images: [],
      person: '未記入',
      status: 'pending',
      ts: nowTime(),
      ...partial,
    })
  }

  function addQuick(item: PresetItem, qty: number) {
    addOrder({ name: item.name, qty, unit: item.unit, url: item.url || '' })
    Alert.alert('追加しました', `${item.name} を ${qty}${item.unit}`)
  }

  function completeAndReset() {
    if (orders.length === 0) {
      setCompleteOpen(false)
      Alert.alert('注文がありません')
      return
    }
    const now = new Date()
    const dateStr =
      now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) +
      ' ' +
      now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

    addItem('history', { date: dateStr, ts: Date.now(), orders })

    // 購入済のみ削除、未購入・一部購入・入手不可は残す
    orders.filter((o) => o.status === 'bought').forEach((o) => removeItem('orders', o.id))

    setCompleteOpen(false)

    // 履歴が10件に達したらリセット(Web 版と同じ)
    const newCount = history.length + 1
    if (newCount >= 10) {
      setTimeout(() => {
        setValue('history', null)
        Alert.alert('購入完了', '履歴が10件に達したためリセットしました')
      }, 500)
    } else {
      const remaining = orders.filter((o) => o.status !== 'bought').length
      Alert.alert(
        '購入完了',
        remaining > 0
          ? `${remaining}件を注文一覧に残しました(${newCount}/10)`
          : `履歴に保存しました(${newCount}/10)`,
      )
    }
    setTab('history')
  }

  const modeColor = mode === 'buyer' ? c.success : mode === 'admin' ? c.danger : c.accent

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[styles.topBar, { backgroundColor: c.panelBg, borderBottomColor: c.border }]}>
        <Pressable
          onPress={() => setModeOpen(true)}
          style={[styles.modePill, { backgroundColor: modeColor }]}>
          <Text style={styles.modePillText}>{MODE_LABEL[mode]}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => setHelpOpen(true)}
          style={[styles.helpBtn, { borderColor: c.border }]}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>?</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabStrip}>
        <View style={styles.tabRow}>
          {visibleTabs.map((t) => (
            <Chip
              key={t}
              label={t === 'list' && orders.length ? `${TAB_LABEL[t]} (${orders.length})` : TAB_LABEL[t]}
              active={tab === t}
              onPress={() => setTab(t)}
            />
          ))}
        </View>
      </ScrollView>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {tab === 'quick' && <QuickAdd presets={presets} onAdd={addQuick} />}

        {tab === 'custom' && (
          <CustomAdd
            onAdd={(o) => {
              addOrder(o)
              setTab('list')
            }}
          />
        )}

        {tab === 'list' && (
          <OrderList
            orders={orders}
            mode={mode}
            onSetStatus={(id, status) => updateItem('orders', id, { status, boughtQty: null })}
            onSetPartial={(id, boughtQty) =>
              updateItem('orders', id, { status: 'partial', boughtQty })
            }
            onRemove={(id) => removeItem('orders', id)}
            onComplete={() => setCompleteOpen(true)}
          />
        )}

        {tab === 'history' && <History sessions={history} />}

        {tab === 'admin' && (
          <PresetEditor
            presets={presets}
            helpText={helpText}
            onSavePresets={(next) => setValue('presets', next)}
            onSaveHelpText={(text) => setValue('helpText', text)}
          />
        )}
      </ScrollView>

      <AppModal
        visible={modeOpen}
        title="モードを選ぶ"
        onClose={() => setModeOpen(false)}
        footer={<Btn label="閉じる" block onPress={() => setModeOpen(false)} />}>
        {(['member', 'buyer', 'admin'] as Mode[]).map((m) => (
          <View key={m} style={{ marginBottom: 8 }}>
            <Btn
              label={MODE_LABEL[m]}
              variant={mode === m ? 'primary' : 'default'}
              onPress={() => {
                setMode(m)
                setModeOpen(false)
              }}
            />
          </View>
        ))}
        <Text style={{ fontSize: 11, color: c.textMuted, lineHeight: 16 }}>
          部員モード: 注文の追加と履歴の閲覧{'\n'}
          購入者モード: 買い出し中の購入状況の記録{'\n'}
          管理者モード: プリセットと説明文の編集
        </Text>
      </AppModal>

      <AppModal
        visible={helpOpen}
        title="このページの使い方"
        onClose={() => setHelpOpen(false)}
        footer={<Btn label="閉じる" block onPress={() => setHelpOpen(false)} />}>
        <Text style={{ fontSize: 13, color: c.text, lineHeight: 20 }}>
          {helpText ||
            '説明はまだ設定されていません。\n管理者モードの「説明文の編集」から設定できます。'}
        </Text>
      </AppModal>

      <AppModal
        visible={completeOpen}
        title="買い出し完了"
        onClose={() => setCompleteOpen(false)}
        footer={
          <>
            <Btn label="キャンセル" onPress={() => setCompleteOpen(false)} />
            <Btn label="履歴に保存" variant="primary" block onPress={completeAndReset} />
          </>
        }>
        <Text style={{ fontSize: 13, color: c.text, lineHeight: 20 }}>
          現在の注文一覧を履歴に保存します。{'\n'}
          購入済の注文は一覧から削除され、未購入・一部購入・入手不可はそのまま残ります。
        </Text>
      </AppModal>
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modePill: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 99 },
  modePillText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  helpBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabStrip: { flexGrow: 0 },
  tabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  body: { padding: 14, paddingBottom: 40 },
})
