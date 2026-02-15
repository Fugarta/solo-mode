import {
  addCardToPool,
  addCardsToPool,
  returnAllCardsToDeck,
  drawRandomCards,
} from '../components/card-manager.js';
import { extractCardsFromNeuronImage, extractImagesFromClipboard } from '../services/image-service.js';
import { selectFolderAndFilterImages } from './folder-selector.js';
import { ImageBrowserModal } from './image-browser-modal.js';

/**
 * UIイベントハンドラ
 */

/**
 * 画像アップロードイベントハンドラ
 * @param {Event} event - changeイベント
 */
export async function handleImageUpload(event) {
  const files = Array.from(event.target.files);

  if (files.length === 0) return;

  // 複数ファイル = 個別カード画像として扱う
  if (files.length > 1) {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => addCardToPool(e.target.result, false);
      reader.readAsDataURL(file);
    }
    return;
  }

  // 単一ファイル = ニューロン画像として処理
  const file = files[0];
  try {
    const { mainDeck, exDeck } = await extractCardsFromNeuronImage(file);
    addCardsToPool(mainDeck, false);
    addCardsToPool(exDeck, true);
  } catch (error) {
    alert(error.message);
    console.error('ニューロン画像の処理エラー:', error);
  }
}

/**
 * 画像ペーストイベントハンドラ
 * @param {ClipboardEvent} event - pasteイベント
 */
export async function handleImagePaste(event) {
  const images = await extractImagesFromClipboard(event);
  images.forEach(dataURL => addCardToPool(dataURL, true));
}

/**
 * 盤面保存ボタンのイベントハンドラ
 */
export function handleSaveBoard() {
  const elementsToHide = [
    document.querySelector('.randomButton-container'),
    document.querySelector('.left-rectangle-container'),
    document.querySelector('#free-space'),
  ];

  // 一時的に非表示
  const originalStyles = elementsToHide.map(el => el.style.display);
  elementsToHide.forEach(el => el.style.display = 'none');

  // タイトルを取得
  const titleElement = document.querySelector('.title');
  const titleText = titleElement ? titleElement.textContent : 'Solo Mode';
  const formattedTitle = titleText.replace(/\s/g, '_').replace(/　/g, '_');

  // スクリーンショット
  html2canvas(document.getElementById('mainContainer')).then(canvas => {
    const link = document.createElement('a');
    link.download = `${formattedTitle}.png`;
    link.href = canvas.toDataURL();
    link.click();

    // 表示を復元
    elementsToHide.forEach((el, i) => el.style.display = originalStyles[i]);
  });
}

/**
 * Twitter投稿ボタンのイベントハンドラ
 */
export function handleTweetBoard() {
  const tweetText = encodeURIComponent(
    'Solo Mode で盤面を作りました\n#壁とやるソロモード\nhttps://fugarta.github.io/solo-mode/'
  );
  const url = `https://twitter.com/intent/tweet?text=${tweetText}`;
  window.open(url, '_blank');
}

/**
 * フォルダ選択ボタンのイベントハンドラ
 */
export async function handleFolderSelect() {
  try {
    const filteredImages = await selectFolderAndFilterImages();
    if (filteredImages.length === 0) {
      alert('適切なアスペクト比の画像が見つかりませんでした。');
      return;
    }
    const modal = new ImageBrowserModal(filteredImages);
    modal.show();
  } catch (error) {
    alert('フォルダ選択エラー: ' + error.message);
    console.error(error);
  }
}

/**
 * リセット&5ドローボタンのイベントハンドラ
 */
export function handleResetAndDraw() {
  // 全カードをデッキに戻す
  returnAllCardsToDeck();

  // 5枚ドロー
  const selectedCards = drawRandomCards('poolRow', 5);
  const centerSlot = document.querySelector('.center-slot');
  selectedCards.forEach(card => centerSlot.appendChild(card));
}

/**
 * 1ドローボタンのイベントハンドラ
 */
export function handleDrawOne() {
  const selectedCards = drawRandomCards('poolRow', 1);
  const centerSlot = document.querySelector('.center-slot');
  selectedCards.forEach(card => centerSlot.appendChild(card));
}

/**
 * ダブルクリックで表示/非表示を切り替え
 * @param {Element[]} elements - 対象要素の配列
 */
export function setupToggleVisibility(elements) {
  elements.forEach(element => {
    element.addEventListener('dblclick', () => {
      element.style.display = element.style.display === 'none' ? '' : 'none';
    });
  });
}

/**
 * すべてのイベントリスナーを設定
 */
export function initializeEventListeners() {
  // ファイルアップロード
  document.getElementById('imageUpload')
    .addEventListener('change', handleImageUpload);

  // クリップボードペースト
  document.addEventListener('paste', handleImagePaste);

  // 盤面保存
  document.getElementById('saveButton')
    .addEventListener('click', handleSaveBoard);

  // Twitter投稿
  document.getElementById('tweetButton')
    .addEventListener('click', handleTweetBoard);

  // リセット&5ドロー
  document.getElementById('resetButton')
    .addEventListener('click', handleResetAndDraw);

  // 1ドロー
  document.getElementById('randomButton')
    .addEventListener('click', handleDrawOne);

  // フォルダ選択
  document.getElementById('folderSelectButton')
    .addEventListener('click', handleFolderSelect);

  // フリースペースと除外ゾーンのダブルクリック切り替え
  const sideSlotGroups = document.querySelectorAll('.side-slot-group');
  if (sideSlotGroups.length >= 3) {
    setupToggleVisibility([sideSlotGroups[0], sideSlotGroups[2]]);
  }
}
