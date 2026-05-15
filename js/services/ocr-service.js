import { OCR_VALIDATION } from '../config/ocr-config.js';

/**
 * OCRサービス
 * Tesseract.jsを使った文字認識処理
 */

// Tesseract Workerのインスタンス（プリロード用）
let ocrWorker = null;
let workerInitPromise = null;

/**
 * Tesseract Workerを事前初期化（プリロード）
 * ページロード時に呼び出すことで、初回OCR実行時の遅延を軽減
 * @returns {Promise<void>}
 */
export async function initializeOCRWorker() {
  if (workerInitPromise) {
    // 既に初期化中または完了している場合は同じPromiseを返す
    return workerInitPromise;
  }

  workerInitPromise = (async () => {
    try {
      console.log('OCR Workerの初期化を開始...');
      ocrWorker = await Tesseract.createWorker('eng');
      console.log('OCR Workerの初期化が完了しました');
    } catch (error) {
      console.error('OCR Workerの初期化に失敗:', error);
      ocrWorker = null;
      workerInitPromise = null;
      throw error;
    }
  })();

  return workerInitPromise;
}

/**
 * OCR結果の後処理：一般的な誤認識パターンを修正
 * @param {string} text - OCR結果のテキスト
 * @returns {string} - 修正されたテキスト
 */
function correctOCRMisrecognition(text) {
  let corrected = text;

  // 一般的な誤認識パターンを修正
  const corrections = {
    'O': '0',   // O（文字）→ 0（数字）
    'o': '0',   // o（小文字）→ 0（数字）
    'I': '1',   // I（大文字）→ 1
    'l': '1',   // l（小文字）→ 1
    'Z': '2',   // Z → 2
    'z': '2',
    'B': '8',   // B → 8
    'b': '8',
    'S': '5',   // S → 5
    's': '5',
    'G': '6',   // G → 6
    'g': '6',
    '(': '0',   // ( → 0
    ')': '0',   // ) → 0
    '[': '1',   // [ → 1
    ']': '1',   // ] → 1
    '|': '1',   // | → 1
    'E': '5',   // E → 5
    'e': '5',   // e → 5 
  };

  for (const [wrong, correct] of Object.entries(corrections)) {
    corrected = corrected.split(wrong).join(correct);
  }

  return corrected;
}

/**
 * キャンバスから数値をOCRで認識
 * @param {HTMLCanvasElement} canvas - OCR対象のキャンバス
 * @returns {Promise<number>} - 認識された数値（失敗時は0）
 */
export async function recognizeNumberFromCanvas(canvas) {
  try {
    let result;

    // プリロードされたWorkerがあれば使用、なければ従来の方法
    if (ocrWorker) {
      result = await ocrWorker.recognize(canvas.toDataURL());
    } else {
      // Workerが未初期化の場合は従来の方法（互換性のため）
      result = await Tesseract.recognize(
        canvas.toDataURL(),
        'eng'
      );
    }

    let text = result.data.text;
    
    // 後処理：誤認識パターンを修正
    text = correctOCRMisrecognition(text);
    
    // 数値のみを抽出
    const number = parseInt(text.replace(/\D/g, ''), 10);

    if (!isNaN(number)) {
      console.log('OCR認識成功:', number, '元のテキスト:', result.data.text, '修正後:', text);
      return number;
    } else {
      console.warn('数値の認識に失敗:', result.data.text);
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
