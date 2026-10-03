// firebase/auth は React Native ビルド(dist/rn)で getReactNativePersistence を
// エクスポートするが、TypeScript は Web 版の型定義を解決するため見えない。
// 実行時には Metro が RN ビルドを選ぶので、型だけを補う。
import type { Persistence } from 'firebase/auth'

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence
}
