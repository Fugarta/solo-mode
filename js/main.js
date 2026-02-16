/**
 * Solo Mode - メインエントリーポイント
 * 遊戯王一人回しツール
 */

import { initializeDesktopDragDrop, enableTouchDrag } from './components/drag-drop.js';
import { initializeCards } from './components/card-manager.js';
import { initializeCounter } from './components/counter-manager.js';
import { initializeEventListeners } from './ui/event-handlers.js';
import { initializeOCRWorker } from './services/ocr-service.js';

/**
 * アプリケーション初期化
 */
function initializeApp() {
  // デスクトップドラッグ&ドロップを初期化
  initializeDesktopDragDrop();

  // 初期カードを設定
  const initialImages = [
    'images/blanck.png',
    'images/blanck.png',
    'images/blanck.png',
  ];
  initializeCards(initialImages);

  // カウンターを初期化
  document.querySelectorAll('.counter-container').forEach(container => {
    initializeCounter(container);
  });

  // カウンターのタッチ対応
  const parentCounter = document.querySelector('#parent.counter-container');
  if (parentCounter) {
    parentCounter.addEventListener('touchstart', enableTouchDrag, { passive: false });
  }

  // イベントリスナーを設定
  initializeEventListeners();

  // OCR Workerを事前初期化（非同期でバックグラウンド実行）
  initializeOCRWorker().catch(error => {
    console.warn('OCR Workerのプリロードに失敗しましたが、処理は続行します:', error);
  });

  console.log('Solo Mode initialized successfully');
}

// DOMContentLoaded時に初期化
window.addEventListener('DOMContentLoaded', initializeApp);
