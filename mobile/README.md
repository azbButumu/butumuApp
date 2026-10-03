# butumuApp モバイル版 (Expo / React Native)

Web 版(リポジトリルート)を React Native に移植したものです。
Firebase Realtime Database の同じプロジェクト・同じパスを読むので、
**Web とアプリは同じデータを共有します**(片方で追加すれば両方に出ます)。

## 共通ロジック

日付計算・責任者ローテーション・予定の展開・Firebase アクセスは
リポジトリルートの `shared/` に置いて Web と共用しています。

- `metro.config.js` の `watchFolders` と `extraNodeModules` で `@shared` を解決
- `tsconfig.json` の `paths` に `@shared/*` を登録

`shared/` を直すと Web とアプリの両方に反映されます。

## 起動

```
npm install
npm start          # QRコードを Expo Go で読み取る
npm run android    # Android エミュレータ/実機
npm run ios        # iOS シミュレータ(Mac のみ)
```

## 環境変数

`.env` に以下を設定します(`.env.example` を参照)。

```
EXPO_PUBLIC_WORKER_URL=https://butumu-library.<subdomain>.workers.dev
```

ライブラリタブのファイル置き場(Cloudflare Worker + R2)のURLです。
未設定の場合はライブラリタブに案内が表示されます。

## 画面構成

| タブ | 対応する Web 版 |
|---|---|
| ホーム | `src/pages/Home.jsx` |
| 秋葉注 | `public/akiba-chu.html` をネイティブ画面として再実装 |
| 3Dプリンター | `src/pages/Printer3D.jsx` |
| ライブラリ | `src/pages/Library.jsx` |
| カレンダー | `src/pages/Calendar.jsx` |

## Web 版との差分

- **秋葉注**: Web 版は 910 行の HTML を iframe 表示。アプリ版はネイティブ画面として
  書き直しています。Firebase のパス(`orders` / `history` / `presets` / `helpText`)と
  データ形式は同じですが、**プリセットの初期値は `shared/akibaPresets.js` と
  `public/akiba-chu.html` の 2 箇所にあります**(片方を変えてももう片方には反映されません)。
- **日付入力**: `<input type="date">` → ネイティブの日付ピッカー(`DateField`)
- **ファイル選択**: `<input type="file">` → `expo-document-picker` / `expo-image-picker`
- **確認ダイアログ**: `window.confirm` → `Alert.alert`
