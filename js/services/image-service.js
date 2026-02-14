import { getConfigByAspectRatio, calculateAbsolutePositions } from '../config/ocr-config.js';
import { recognizeDeckNumber, recognizeExDeckNumber } from './ocr-service.js';

/**
 * 画像処理サービス
 * カード画像の切り出しとOCR処理
 */

/**
 * ファイルを読み込んでData URLを取得
 * @param {File} file - 読み込むファイル
 * @returns {Promise<string>} - Data URL
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Data URLから画像を読み込み
 * @param {string} dataURL - Data URL
 * @returns {Promise<HTMLImageElement>} - 読み込まれた画像
 */
export function loadImage(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
}

/**
 * 画像から指定領域を切り取ってキャンバスに描画
 * @param {HTMLImageElement} img - 元画像
 * @param {Object} region - 切り取り領域 {x, y, width, height}
 * @returns {HTMLCanvasElement} - 切り取られた画像を含むキャンバス
 */
function extractRegionToCanvas(img, region) {
  const canvas = document.createElement('canvas');
  canvas.width = region.width;
  canvas.height = region.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    img,
    region.x, region.y, region.width, region.height,  // source
    0, 0, region.width, region.height                 // destination
  );

  return canvas;
}

/**
 * カード画像を切り出してキャンバスに描画
 * @param {HTMLImageElement} img - 元画像
 * @param {Object} cardPos - カード位置設定
 * @param {number} row - 行番号
 * @param {number} col - 列番号
 * @returns {string} - カード画像のData URL
 */
function extractCardImage(img, cardPos, row, col) {
  const canvas = extractRegionToCanvas(img, {
    x: cardPos.startX + col * (cardPos.width + cardPos.gap),
    y: cardPos.startY + row * cardPos.height,
    width: cardPos.width,
    height: cardPos.height,
  });

  return canvas.toDataURL();
}

/**
 * ニューロン画像からカードを切り出す
 * @param {File} file - ニューロンから保存した画像ファイル
 * @returns {Promise<Object>} - {mainDeck: string[], exDeck: string[]}
 */
export async function extractCardsFromNeuronImage(file) {
  // 画像を読み込む
  const dataURL = await readFileAsDataURL(file);
  const img = await loadImage(dataURL);

  const { width: w, height: h } = img;
  const aspect = h / w;

  // アスペクト比から設定を取得
  const config = getConfigByAspectRatio(w, h);
  if (!config) {
    throw new Error(`画像のアスペクト比が不正です。(${w} x ${h}, aspect: ${aspect.toFixed(3)})`);
  }

  // 絶対座標を計算
  const positions = calculateAbsolutePositions(config, w, h);

  // デッキ枚数をOCR認識
  const deckNum = await recognizeDeckNumber(
    img,
    positions.deckNum,
    positions.cols * positions.rows
  );

  // メインデッキのカードを切り出し
  const mainDeck = [];
  let cardCount = 0;
  for (let row = 0; row < positions.rows; row++) {
    for (let col = 0; col < positions.cols; col++) {
      if (cardCount >= deckNum) break;
      const cardDataURL = extractCardImage(img, positions.card, row, col);
      mainDeck.push(cardDataURL);
      cardCount++;
    }
    if (cardCount >= deckNum) break;
  }

  // EXデッキ枚数をOCR認識
  const exDeckNum = await recognizeExDeckNumber(
    img,
    positions.exDeck.numLabel
  );

  // EXデッキのカードを切り出し
  const exDeck = [];
  let exCardCount = 0;
  const exCardPos = {
    startX: positions.exDeck.startX,
    startY: positions.exDeck.startY,
    width: positions.card.width,
    height: positions.card.height,
    gap: positions.card.gap,
  };

  for (let row = 0; row < positions.exDeck.rows; row++) {
    for (let col = 0; col < positions.exDeck.cols; col++) {
      if (exCardCount >= exDeckNum) break;
      const cardDataURL = extractCardImage(img, exCardPos, row, col);
      exDeck.push(cardDataURL);
      exCardCount++;
    }
    if (exCardCount >= exDeckNum) break;
  }

  console.log(`カード抽出完了: メイン${mainDeck.length}枚, EX${exDeck.length}枚`);

  return { mainDeck, exDeck };
}

/**
 * クリップボードから画像を取得
 * @param {ClipboardEvent} event - ペーストイベント
 * @returns {Promise<string[]>} - 画像のData URL配列
 */
export async function extractImagesFromClipboard(event) {
  const items = event.clipboardData.items;
  const images = [];

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      const dataURL = await readFileAsDataURL(blob);
      images.push(dataURL);
    }
  }

  return images;
}
