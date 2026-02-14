# Solo Mode

## 概要
このプロジェクトは、遊戯王の一人回し（ソリティア）を行うためのウェブアプリケーションです。

## 主な機能
- ニューロンアプリからのデッキ画像の自動認識（OCR）
- ドラッグ&ドロップによるカード配置
- タッチデバイス対応
- カウンター機能
- ランダムドロー
- 盤面の画像保存
- Twitter投稿

## ファイル構成
```
card-sim/
├── index.html              # メインHTML
├── css/                    # スタイルシート
│   ├── main.css           # メインCSS（すべてをインポート）
│   ├── variables.css      # CSS変数
│   ├── layout.css         # レイアウト
│   ├── components.css     # コンポーネント
│   ├── controls.css       # ボタン・フォーム
│   └── responsive.css     # レスポンシブデザイン
├── js/                     # JavaScript
│   ├── main.js            # エントリーポイント
│   ├── config/            # 設定
│   │   └── ocr-config.js  # OCR設定
│   ├── services/          # サービス層
│   │   ├── ocr-service.js      # OCR処理
│   │   └── image-service.js    # 画像処理
│   ├── components/        # コンポーネント
│   │   ├── card-manager.js     # カード管理
│   │   ├── counter-manager.js  # カウンター管理
│   │   └── drag-drop.js        # ドラッグ&ドロップ
│   └── ui/                # UI層
│       └── event-handlers.js   # イベントハンドラ
├── images/                 # 画像アセット
├── backup/                 # 旧ファイルのバックアップ
├── REFACTORING_GUIDE.md   # リファクタリングガイド
└── README.md              # このファイル
```

## 技術スタック
- HTML5 / CSS3
- JavaScript (ES6 Modules)
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR
- [html2canvas](https://html2canvas.hertzen.com/) - スクリーンショット

## ライセンス
このプロジェクトは [MIT License](./LICENSE) のもとで公開されています。
