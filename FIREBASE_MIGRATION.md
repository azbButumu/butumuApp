# Firebase プロジェクトの移行手順

現在は秋葉注用の `akiba-chu` プロジェクトを流用しています。
部室アプリ専用のプロジェクトへ移すための手順です。

コード側は **`shared/firebaseConfig.js` の値を差し替えるだけ** で済むように
してあります（`public/akiba-chu.html` 用の設定は自動生成されます）。

---

## あなたの作業

### 1. 新しいプロジェクトを作る

Firebase Console → プロジェクトを追加

- プロジェクト名は任意（例: `butumu-app`）
- Google アナリティクスは不要

### 2. Realtime Database を有効化

構築 → Realtime Database → データベースを作成

- **ロケーションは現在と同じ `asia-southeast1`（シンガポール）を選ぶ**
  のが無難です（レイテンシが変わらない）
- セキュリティルールは「**テストモードで開始**」を選択
  （今はルールを使わない運用のため。後で絞る場合は `firebase-rules/` を参照）

> テストモードは30日で読み書きが拒否されるようになります。
> 期限が来たらルールを `{"rules":{".read":true,".write":true}}` に
> 置き換えるか、`firebase-rules/` の段階的なルールを適用してください。

### 3. ウェブアプリを登録して設定値を取得

プロジェクトの設定 → 全般 → マイアプリ → ウェブ（`</>` アイコン）

登録すると `firebaseConfig` が表示されます。この7つの値を私に渡してください。

```
apiKey, authDomain, databaseURL, projectId,
storageBucket, messagingSenderId, appId
```

`databaseURL` が表示されない場合は、Realtime Database の画面に
出ている `https://<...>.firebasedatabase.app` を使います。

### 4. Authentication を有効化

Authentication → 始める → Sign-in method

- **メール/パスワード** を有効化
- **Google** を有効化（サポートメールを選ぶ）

Settings → 承認済みドメイン に公開 URL を追加（`localhost` は既定で入っています）。

### 5. 既存データを移行

**旧プロジェクト（akiba-chu）**
Realtime Database → データ画面右上の「⋮」→ **JSON をエクスポート**

**新プロジェクト**
Realtime Database → 「⋮」→ **JSON をインポート**

これで以下が引き継がれます。

| パス | 内容 |
|---|---|
| `orders` | 秋葉注の注文 |
| `history` | 買い出し履歴 |
| `presets` | 秋葉注のプリセット |
| `helpText` | 秋葉注の説明文 |
| `calendarEvents` | カレンダーの予定 |
| `printerReservations` | 3Dプリンター予約 |
| `dutyRotation` | 責任者ローテーション |
| `dutyOverrides` | 責任者の当日変更 |

> `members`（ログイン済み部員の記録）は移行しても意味がありません。
> **アカウントは Firebase プロジェクトごとに別管理**なので、新プロジェクトでは
> 全員があらためてアカウントを作り、招待パスワードを入力することになります。
> エクスポートした JSON から `members` を削っておくと綺麗です。

---

## 私がやること

設定値を受け取ったら `shared/firebaseConfig.js` を差し替えて、
Web とアプリの両方のビルドを確認します。

## 設定が1箇所になっている仕組み

`public/` 配下は Vite が加工せずコピーするため、秋葉注ページ
（`public/akiba-chu.html`）は `shared/` を import できません。
設定を2箇所に書くと片方だけ直す事故が起きるので、

```
shared/firebaseConfig.js        ← ここだけが正
        ↓ scripts/sync-firebase-config.mjs
public/firebase-config.js       ← 自動生成（gitignore 済み）
        ↑ import
public/akiba-chu.html
```

`npm run dev` と `npm run build` の前に自動生成が走ります。
手動で走らせる場合は `npm run sync-config`。

## 移行後にやること

- Cloudflare へ再デプロイ（`npm run deploy`）
- アプリ側は再ビルド（`cd mobile && npm start` で確認）
- 旧プロジェクトは、しばらく残しておいて問題がなければ削除
