// Web 版 src/index.css のカラー変数をそのまま移したもの
import { useColorScheme } from 'react-native'

export type Palette = {
  bg: string
  panelBg: string
  text: string
  textMuted: string
  border: string
  hoverBg: string
  accent: string
  accentBg: string
  danger: string
  dangerBg: string
  success: string
  successBg: string
  sun: string
  sat: string
}

const light: Palette = {
  bg: '#f5f5f3',
  panelBg: '#ffffff',
  text: '#1a1a1a',
  textMuted: '#888888',
  border: '#dddddd',
  hoverBg: '#f0f0f0',
  accent: '#2563eb',
  accentBg: 'rgba(37, 99, 235, 0.1)',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  success: '#16a34a',
  successBg: '#dcfce7',
  sun: '#dc2626',
  sat: '#2563eb',
}

const dark: Palette = {
  bg: '#16171d',
  panelBg: '#1f2028',
  text: '#f3f4f6',
  textMuted: '#9ca3af',
  border: '#33343d',
  hoverBg: '#2a2b34',
  accent: '#60a5fa',
  accentBg: 'rgba(96, 165, 250, 0.15)',
  danger: '#f87171',
  dangerBg: 'rgba(248, 113, 113, 0.15)',
  success: '#4ade80',
  successBg: 'rgba(74, 222, 128, 0.15)',
  sun: '#f87171',
  sat: '#60a5fa',
}

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? dark : light
}

export const palettes = { light, dark }
