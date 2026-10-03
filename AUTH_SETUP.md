# 認証のセットアップ手順

**Firebase Console でやることは「ログイン方法の有効化」だけです。**
データベースのルール変更は不要です。

## 1. ログイン方法を有効化（必須・5分）

Firebase Console → プロジェクト `akiba-chu` → Authentication → 始める

Sign-in method タブで2つ有効化します。

- **メール/パスワード** … 「有効にする」をオンにして保存
- **Google** … サポートメール（あなたのアドレス）を選んで保存

これだけでログインが動きます。

## 2. 承認済みドメインを追加（デプロイ後に必要）

Authentication → Settings → 承認済みドメイン

- `localhost` は最初から入っているので、ローカル開発はそのまま動きます
- 公開 URL（`butumuapp.<subdomain>.workers.dev` など）を追加してください
  追加しないと、デプロイ先で Google ログインが失敗します

## 3. Google ログイン（アプリ版のみ・任意）

Web 版は手順1だけで動きます。**アプリ版の Google ログインだけは
OAuth クライアントIDが別途必要です。**

Firebase Console → プロジェクトの設定 → 全般 → マイアプリ で
iOS / Android / Web アプリを登録し、発行されたクライアントIDを
`mobile/.env` に設定してください。

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...apps.googleusercontent.com
```

未設定でもアプリは動きます（Google ボタンが出ず、メール/パスワードのみになる）。

## 招待パスワード

`ebarasoroku`

変更するときは `shared/auth.js` の `INVITE_CODE` を直して再デプロイします。

## 仕組み

1. メール/パスワード または Google でログイン
2. `/members/<自分のuid>` が無ければ招待パスワードの入力画面になる
3. 正しいコードを入れると `/members/<uid>` が作られ、アプリが使えるようになる

Google で初めてログインした人にも招待パスワードを要求します。
一度登録した人は次回以降この画面を飛ばします。

## 現状の制限

**招待パスワードの照合はアプリ内だけで行われます。** データベース自体は
従来どおり誰でも読み書きできる状態なので、Firebase の設定値（アプリのコードに
含まれています）を使えばログインを経由せずデータへアクセスできます。

部内で URL を共有して使う分には実用上これで足りますが、データを本当に
保護したくなったら `firebase-rules/README.md` の手順で段階的に絞れます。
コードの変更は不要で、Console に貼り付けるだけです。
