import { OCR_VALIDATION } from '../config/ocr-config.js';

/**
 * OCRサービス
 * Tesseract.jsを使った文字認識処理
 */

/**
 * キャンバスから数値をOCRで認識
 * @param {HTMLCanvasElement} canvas - OCR対象のキャンバス
 * @returns {Promise<number>} - 認識された数値（失敗時は0）
 */
export async function recognizeNumberFromCanvas(canvas) {
  try {
    const result = await Tesseract.recognize(
      canvas.toDataURL(),
      'eng'
    );
    const text = result.data.text;
    const number = parseInt(text.replace(/\D/g, ''), 10);

    if (!isNaN(number)) {
      console.log('OCR認識成功:', number, '元のテキスト:', text);
      return number;
    } else {
      console.warn('数値の認識に失敗:', text);
      return -1;
    }
  } catch (error) {
    console.error('OCRエラー:', error);
    return -1;
  }
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
 * デバッグ用: Canvas を画像として保存/表示
 * @param {HTMLCanvasElement} canvas - 保存対象のCanvas
 * @param {string} name - ファイル名（拡張子なし）
 */
function debugSaveCanvas(canvas, name = 'debug') {
  // ダウンロード
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${name}_${Date.now()}.png`;
  link.click();
}

/**
 * デッキ枚数をOCRで認識（検証付き）
 * @param {HTMLImageElement} img - デッキ画像
 * @param {Object} region - OCR対象領域
 * @param {number} maxCardCount - 最大カード枚数
 * @returns {Promise<number>} - 検証済みデッキ枚数
 */
export async function recognizeDeckNumber(img, region, maxCardCount) {
  const canvas = extractRegionToCanvas(img, region);
  let deckNum = await recognizeNumberFromCanvas(canvas);

  // 検証: 妥当な範囲内かチェック
  const minValid = maxCardCount + OCR_VALIDATION.deckNum.minOffset;
  const isValid = deckNum >= minValid && deckNum <= maxCardCount;

  if (!isValid) {
    console.warn(
      `デッキ枚数の検証失敗: ${deckNum} (有効範囲: ${minValid}-${maxCardCount})`,
      'デフォルト値を使用:', maxCardCount
    );
    deckNum = maxCardCount;
  }

  return deckNum;
}

/**
 * EXデッキ枚数をOCRで認識（検証付き）
 * @param {HTMLImageElement} img - デッキ画像
 * @param {Object} region - OCR対象領域
 * @returns {Promise<number>} - 検証済みEXデッキ枚数
 */
export async function recognizeExDeckNumber(img, region) {
  const canvas = extractRegionToCanvas(img, region);
  let exDeckNum = await recognizeNumberFromCanvas(canvas);

  // 検証: 0-20枚の範囲内かチェック
  const { min, max, default: defaultValue } = OCR_VALIDATION.exDeckNum;
  const isValid = exDeckNum >= min && exDeckNum <= max;

  if (!isValid) {
    console.warn(
      `EXデッキ枚数の検証失敗: ${exDeckNum} (有効範囲: ${min}-${max})`,
      'デフォルト値を使用:', defaultValue
    );
    exDeckNum = defaultValue;
  }

  return exDeckNum;
}
