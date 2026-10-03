// Web 版 src/App.css の共通パーツ(card / btn / field / tag-chip / modal)に対応する部品
import { ReactNode } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native'

import { Palette, useTheme } from '@/theme'

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = useTheme()
  return (
    <View
      style={[
        { backgroundColor: c.panelBg, borderColor: c.border },
        styles.card,
        style,
      ]}>
      {children}
    </View>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  const c = useTheme()
  return <Text style={[styles.cardTitle, { color: c.text }]}>{children}</Text>
}

export function RowBetween({ children }: { children: ReactNode }) {
  return <View style={styles.rowBetween}>{children}</View>
}

export function CardLink({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme()
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={[styles.cardLink, { color: c.accent }]}>{label}</Text>
    </Pressable>
  )
}

type BtnVariant = 'default' | 'primary' | 'danger'

export function Btn({
  label,
  onPress,
  variant = 'default',
  block,
  disabled,
  style,
}: {
  label: string
  onPress: () => void
  variant?: BtnVariant
  block?: boolean
  disabled?: boolean
  style?: ViewStyle
}) {
  const c = useTheme()
  const bg = variant === 'primary' ? c.accent : variant === 'danger' ? c.dangerBg : c.hoverBg
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? c.danger : c.text
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: variant === 'default' ? c.border : 'transparent',
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        block && styles.btnBlock,
        style,
      ]}>
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const c = useTheme()
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{label}</Text>
      {children}
    </View>
  )
}

export function Input({ multiline, style, ...rest }: TextInputProps) {
  const c = useTheme()
  return (
    <TextInput
      placeholderTextColor={c.textMuted}
      multiline={multiline}
      style={[
        styles.input,
        { backgroundColor: c.bg, borderColor: c.border, color: c.text },
        multiline && styles.inputMultiline,
        style,
      ]}
      {...rest}
    />
  )
}

export function TagChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tagChip, { backgroundColor: color }]}>
      <Text style={styles.tagChipText}>{label}</Text>
    </View>
  )
}

export function Chip({
  label,
  active,
  onPress,
  color,
}: {
  label: string
  active?: boolean
  onPress: () => void
  color?: string
}) {
  const c = useTheme()
  const tint = color || c.accent
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: tint, borderColor: 'transparent' }
          : { backgroundColor: c.hoverBg, borderColor: c.border },
      ]}>
      <Text style={[styles.chipText, { color: active ? '#fff' : c.text }]}>{label}</Text>
    </Pressable>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  const c = useTheme()
  return <Text style={[styles.emptyState, { color: c.textMuted }]}>{children}</Text>
}

export function Loading() {
  const c = useTheme()
  return <ActivityIndicator style={{ marginVertical: 24 }} color={c.accent} />
}

export function ListItem({ children }: { children: ReactNode }) {
  const c = useTheme()
  return <View style={[styles.listItem, { borderTopColor: c.border }]}>{children}</View>
}

// Web 版 components/Modal.jsx に対応
export function AppModal({
  visible,
  title,
  onClose,
  children,
  footer,
}: {
  visible: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const c = useTheme()
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.modal, { backgroundColor: c.panelBg }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHead}>
            <Text style={[styles.modalTitle, { color: c.text }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={[styles.modalClose, { color: c.textMuted }]}>×</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer && <View style={styles.modalFooter}>{footer}</View>}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export function ModalSub({ children }: { children: ReactNode }) {
  const c = useTheme()
  return <Text style={[styles.modalSub, { color: c.textMuted }]}>{children}</Text>
}

export const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardLink: { fontSize: 12 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  btn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  btnBlock: { flex: 1 },
  btnText: { fontSize: 13 },
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 12, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  tagChip: {
    paddingVertical: 2,
    paddingHorizontal: 9,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  tagChipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 99,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 12 },
  emptyState: { textAlign: 'center', paddingVertical: 30, fontSize: 13 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: { width: '100%', maxWidth: 360, maxHeight: '86%', borderRadius: 14, padding: 18 },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '600' },
  modalClose: { fontSize: 22, lineHeight: 24 },
  modalBody: { flexGrow: 0 },
  modalFooter: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modalSub: { fontSize: 12, marginBottom: 10 },
})

export type { Palette }
