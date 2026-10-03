// shared/firebaseConfig.js から public/firebase-config.js を生成する。
//
// public/ 配下は Vite が加工せずそのままコピーするため、秋葉注ページ
// (public/akiba-chu.html) は shared/ を import できない。設定を2箇所に
// 書くと片方だけ直す事故が起きるので、こちらを自動生成して1箇所に保つ。
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const { firebaseConfig } = await import(
  new URL('../shared/firebaseConfig.js', import.meta.url).href
)

const out = resolve(root, 'public/firebase-config.js')
writeFileSync(
  out,
  `// 自動生成ファイル。直接編集しないこと。\n` +
    `// 元: shared/firebaseConfig.js / 生成: scripts/sync-firebase-config.mjs\n` +
    `export const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)}\n`,
  'utf8',
)

console.log(`firebase-config.js を生成しました (projectId: ${firebaseConfig.projectId})`)
