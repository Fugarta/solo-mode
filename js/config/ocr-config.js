/**
 * OCR設定定数
 * ニューロンアプリから出力される画像のアスペクト比ごとの設定
 */

// 基準画像サイズ（ニューロンの出力サイズ）
const BASE_SIZES = {
  ROWS_4: { width: 1080, height: 1187 },
  ROWS_5: { width: 1080, height: 1341 },
  ROWS_6: { width: 1080, height: 1495 },
};

// 共通設定
const COMMON_CONFIG = {
  cols: 10,
  exRows: 2,
  exCols: 10,
};

/**
 * アスペクト比ごとのOCR設定
 */
export const OCR_ASPECT_RATIO_CONFIGS = [
  {
    name: 'ROWS_4',
    aspectRange: [1.095, 1.105],
    rows: 4,
    base: BASE_SIZES.ROWS_4,
    exStartY: 784, // ROWS_4のEXデッキ開始Y座標（相対座標で定義）
  },
  {
    name: 'ROWS_5',
    aspectRange: [1.235, 1.245],
    rows: 5,
    base: BASE_SIZES.ROWS_5,
    exStartY: 938, // ROWS_5のEXデッキ開始Y座標（相対座標で定義）
  },
  {
    name: 'ROWS_6',
    aspectRange: [1.380, 1.390],
    rows: 6,
    base: BASE_SIZES.ROWS_6,
    exStartY: 1091, // ROWS_6のEXデッキ開始Y座標（相対座標で定義）
  },
];

/**
 * 相対座標設定（すべての設定で共通）
 * 基準画像サイズに対する相対値で定義
 */
export const RELATIVE_POSITIONS = {
  card: {
    startX: 0,
    startY: 119,
    width: 106,
    height: 154,
    gap: 2,
  },
  deckNum: {
    x: 238,
    y: 86,
    width: 36,
    height: 23,
  },
  exDeck: {
    x: 296,
    y(config) {
      return config.exStartY - 36; // EXデッキ枚数ラベルのY座標（相対座標で定義）
    }
  },
};

/**
 * OCR検証パラメータ
 */
export const OCR_VALIDATION = {
  deckNum: {
    minOffset: -10, // 最大枚数 - 10 以上
    maxCardCount: (cols, rows) => cols * rows,
  },
  exDeckNum: {
    min: 0,
    max: 20,
    default: 15,
  },
};

/**
 * 画像サイズからアスペクト比設定を取得
 * @param {number} width - 画像幅
 * @param {number} height - 画像高さ
 * @returns {Object|null} - 該当する設定、なければnull
 */
export function getConfigByAspectRatio(width, height) {
  const aspect = height / width;
  return OCR_ASPECT_RATIO_CONFIGS.find(
    config => aspect >= config.aspectRange[0] && aspect <= config.aspectRange[1]
  );
}

/**
 * 相対座標から絶対座標を計算
 * @param {Object} config - アスペクト比設定
 * @param {number} width - 画像幅
 * @param {number} height - 画像高さ
 * @returns {Object} - 絶対座標設定
 */
export function calculateAbsolutePositions(config, width, height) {
  const scaleW = width / config.base.width;
  const scaleH = height / config.base.height;

  const cardHeight = RELATIVE_POSITIONS.card.height * scaleH;
  const exStartY = config.exStartY * scaleH;

  return {
    cols: COMMON_CONFIG.cols,
    rows: config.rows,
    card: {
      startX: RELATIVE_POSITIONS.card.startX * scaleW,
      startY: RELATIVE_POSITIONS.card.startY * scaleH,
      width: RELATIVE_POSITIONS.card.width * scaleW,
      height: cardHeight,
      gap: RELATIVE_POSITIONS.card.gap * scaleW,
    },
    deckNum: {
      x: RELATIVE_POSITIONS.deckNum.x * scaleW,
      y: RELATIVE_POSITIONS.deckNum.y * scaleH,
      width: RELATIVE_POSITIONS.deckNum.width * scaleW,
      height: RELATIVE_POSITIONS.deckNum.height * scaleH,
    },
    exDeck: {
      startX: 0,
      startY: exStartY,
      rows: COMMON_CONFIG.exRows,
      cols: COMMON_CONFIG.exCols,
      numLabel: {
        x: RELATIVE_POSITIONS.exDeck.x * scaleW,
        y: RELATIVE_POSITIONS.exDeck.y(config) * scaleH,
        width: RELATIVE_POSITIONS.deckNum.width * scaleW,
        height: RELATIVE_POSITIONS.deckNum.height * scaleH,
      },
    },
  };
}
