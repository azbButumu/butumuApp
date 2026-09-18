export const TAGS = [
  { key: '企画', color: '#2563eb' },
  { key: '期限', color: '#dc2626' },
  { key: '一般', color: '#16a34a' },
  { key: 'その他', color: '#6b7280' },
]

export const TAG_COLORS = Object.fromEntries(TAGS.map((t) => [t.key, t.color]))
