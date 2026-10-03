import { DarkTheme, DefaultTheme, Tabs, ThemeProvider } from 'expo-router'
import { Text, useColorScheme } from 'react-native'

import { useTheme } from '@/theme'

// Web 版 src/lib/tabs.js と同じ並び・ラベル・アイコン
const TABS = [
  { name: 'index', label: 'ホーム', title: 'ホーム', icon: '🏠' },
  { name: 'akiba', label: '秋葉注', title: '秋葉注', icon: '🛒' },
  { name: 'printer', label: '3Dプリンター', title: '3Dプリンター予約', icon: '🖨️' },
  { name: 'library', label: 'ライブラリ', title: 'ライブラリ', icon: '📁' },
  { name: 'calendar', label: 'カレンダー', title: 'カレンダー', icon: '📅' },
] as const

export default function RootLayout() {
  const c = useTheme()
  const isDark = useColorScheme() === 'dark'

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: c.panelBg },
          headerTitleStyle: { fontSize: 17, fontWeight: '600', color: c.text },
          headerTintColor: c.text,
          tabBarStyle: { backgroundColor: c.panelBg, borderTopColor: c.border },
          tabBarActiveTintColor: c.accent,
          tabBarInactiveTintColor: c.textMuted,
          tabBarLabelStyle: { fontSize: 10 },
          sceneStyle: { backgroundColor: c.bg },
        }}>
        {TABS.map((t) => (
          <Tabs.Screen
            key={t.name}
            name={t.name}
            options={{
              title: t.title,
              tabBarLabel: t.label,
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{t.icon}</Text>
              ),
            }}
          />
        ))}
      </Tabs>
    </ThemeProvider>
  )
}
