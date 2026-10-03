// public/logo.jpg からアプリアイコンとファビコンを生成する。
// 元画像は 400x400 なので、拡大しても粗くならないよう最近傍ではなく
// lanczos3 で補間し、余白は元画像の背景色(白)で埋める。
import { mkdirSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'public/logo.jpg')

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

async function square(size, out, { padding = 0, background = WHITE } = {}) {
  const inner = Math.round(size * (1 - padding * 2))
  const buf = await sharp(src)
    .resize(inner, inner, { kernel: 'lanczos3' })
    .toBuffer()
  mkdirSync(dirname(out), { recursive: true })
  await sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: buf, gravity: 'center' }])
    .png()
    .toFile(out)
  console.log(`${relative(root, out)}  ${size}x${size}`)
}

// Web: ファビコン
await square(32, resolve(root, 'public/favicon-32.png'))
await square(180, resolve(root, 'public/apple-touch-icon.png'))
await square(192, resolve(root, 'public/icon-192.png'))
await square(512, resolve(root, 'public/icon-512.png'))

// アプリ: 本体アイコンとスプラッシュ
await square(1024, resolve(root, 'mobile/assets/images/icon.png'))
await square(1024, resolve(root, 'mobile/assets/images/favicon.png'))
await square(1024, resolve(root, 'mobile/assets/images/splash-icon.png'), {
  background: { r: 255, g: 255, b: 255, alpha: 0 },
})

// Android アダプティブアイコンは外周約33%が切り取られるため、
// 中央66%に収まるよう余白を入れる
await square(1024, resolve(root, 'mobile/assets/images/android-icon-foreground.png'), {
  padding: 0.22,
  background: { r: 255, g: 255, b: 255, alpha: 0 },
})
