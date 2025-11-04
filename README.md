# DG-Hakkason-backend

これは、株式会社デジタルガレージの社内ハッカソンで開発された、マーケティング提案AIアプリケーションのバックエンドサーバーです。

## 概要

このアプリケーションは、社内の顧客データを分析し、GoogleのGemini APIを活用して、効果的なマーケティング手法を提案することを目的としています。バックエンドはNode.jsとExpressで構築されており、データの整形、外部APIとの連携、フロントエンドへのデータ提供を担います。

APIの外部公開には`ngrok`を利用しています。

## 主な機能

- 顧客データの整形・分析
- Gemini APIへの連携とマーケティング提案の取得
- フロントエンドアプリケーションへのAPI提供

## 技術スタック

- **バックエンド:** Node.js, Express.js
- **API公開:** ngrok

## APIエンドポイント

- `GET /`: サーバーの稼働状況を確認します。
- `GET /open`: 顧客データの整形処理と、Gemini APIによるマーケティング提案の取得を同時に実行します。
- `GET /ai_advice`: Gemini APIによるマーケティング提案のみを取得します。

## セットアップと実行

1.  **リポジトリをクローンします**
    ```bash
    git clone https://github.com/RAM-lang360/DG-Hakkason.git
    cd DG-Hakkason/api
    ```

2.  **依存関係をインストールします**
    ```bash
    npm install
    ```

3.  **開発サーバーを起動します**
    ```bash
    npm run dev
    ```
    サーバーは `http://localhost:3000` で起動します。

4.  **ngrokでAPIを公開します**
    ```bash
    ngrok http 3000
    ```
    ngrokが生成したURLをフロントエンドアプリケーションに設定してください。
