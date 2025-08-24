# Yasashii Ippun API (Next.js + Supabase + Stripe)

## Overview
- Auth/DB: Supabase
- Hosting: Vercel
- Billing: Stripe
- Endpoints:
  - `POST /api/v1/generate` (Bearer token)
  - `GET /api/v1/me` (Bearer token)
  - `POST /api/billing/create-checkout-session` (Bearer token)
  - `POST /api/billing/portal` (Bearer token)
  - `POST /api/stripe/webhook` (no auth)

## Prerequisites
- GitHubリポジトリ（API用）を用意（例: `yasashii-ippun-api`）
- Vercelアカウント / Supabaseプロジェクト / Stripeアカウント
- Node.js 18+ / npm

## Local Development
1) Clone and install
```
cd yasashii-ippun-api
cp .env.example .env.local
npm install
npm run dev
```
2) Set env (`.env.local`)
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PRO`, `STRIPE_WEBHOOK_SECRET`
- `ALLOWED_ORIGINS=http://localhost:3000, chrome-extension://<extension-id>`
3) Supabase setup
- SQLエディタで `supabase/schema.sql` を実行（profiles/subscriptions/usage + RLS）
- 認証: 必要なOAuthプロバイダを有効化
- リダイレクトURL: サイトURL（`http://localhost:3000/*`）に加え、拡張の `https://<拡張ID>.chromiumapp.org/*` を許可
4) Stripe setup
- Product/Price を作成し `STRIPE_PRICE_ID_PRO` を設定
- Webhook に `http://localhost:3000/api/stripe/webhook`（Stripe CLI推奨）を追加し `STRIPE_WEBHOOK_SECRET` を設定
5) Test
- `GET /api/v1/me` に Bearer でSupabaseのaccess_token を渡して200を確認
- `POST /api/v1/generate` でプレースホルダの文が返ることを確認

## Deploy (Vercel)
1) GitHubに `yasashii-ippun-api` をプッシュ
2) Vercelで「New Project」→ リポジトリをインポート
3) Framework: Next.js / Root: `yasashii-ippun-api`
4) Environment Variables を追加
- `NEXT_PUBLIC_SITE_URL=https://<yourapp>.vercel.app`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PRO`, `STRIPE_WEBHOOK_SECRET`
- `ALLOWED_ORIGINS=https://<yourapp>.vercel.app, chrome-extension://<拡張ID>`
5) デプロイ後、Stripe Webhook の本番URLを `https://<yourapp>.vercel.app/api/stripe/webhook` に更新

## Auth Flow from Extension
- 拡張は `chrome.identity.launchWebAuthFlow` で `loginUrl` を開く
- サイト側でSupabase OAuthを完了→アクセストークンを取得
- 最終的に `chrome.identity.getRedirectURL()` に `#access_token=<token>` を付けてリダイレクト
- 拡張はハッシュから `access_token` を抽出し `Authorization: Bearer` でAPIにアクセス

## Endpoint Notes
- `generate`: 現在は固定文のランダム返却。実運用ではサーバ側でモデルAPIを呼び出す
- 402/429 等の課金・制限は今後 `subscriptions`/`usage` の状態に応じて実装

## Troubleshooting
- 401 Unauthorized: アクセストークンの不備。Supabaseのリダイレクト/ドメイン設定を確認
- CORS: `ALLOWED_ORIGINS` に拡張の `chrome-extension://<拡張ID>` を含める
- Webhook署名エラー: `STRIPE_WEBHOOK_SECRET` を見直し、Raw bodyを渡せているか（Next.jsの実装は対応済）
- OAuthリダイレクト不一致: Supabaseの許可リダイレクトに `https://<拡張ID>.chromiumapp.org/*` を追加

## Security
- モデルAPIキーは必ずサーバ側にのみ配置
- トークンは短寿命運用（Supabaseは自動更新あり）
- Webhook署名検証は必須

## License
- GNU Affero General Public License v3.0 (AGPL-3.0-only)
- See the bundled `LICENSE` file for full text.
