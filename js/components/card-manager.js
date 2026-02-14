import { enableTouchDrag } from './drag-drop.js';

/**
 * カード管理モジュール
 * カードの作成、追加、削除などを管理
 */

let itemCount = 0;
let initialImageSrcs = [];

/**
 * カードIDを生成
 * @returns {string} - 一意のカードID
 */
function generateCardId() {
  return `item-${String(itemCount++).padStart(3, '0')}`;
}

/**
 * カード要素を作成
 * @param {string} src - 画像のURL
 * @param {boolean} isEx - EXデッキのカードか
 * @returns {Element} - カード要素のラッパー
 */
function createCardElement(src, isEx = false) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('tier-item-wrapper');
  wrapper.id = `${generateCardId()} ${isEx ? 'ex' : 'normal'}`;

  const img = document.createElement('img');
  img.src = src;
  img.classList.add('tier-item');
  img.setAttribute('draggable', 'true');
  img.id = wrapper.id.split(' ')[0]; // IDの数字部分のみ

  // イベントリスナー
  img.addEventListener('dragstart', window.drag);
  img.addEventListener('touchstart', enableTouchDrag, { passive: false });

  // 右クリック処理
  img.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    handleCardRightClick(wrapper, img);
  });

  wrapper.appendChild(img);
  return wrapper;
}

/**
 * カードの右クリック処理
 * @param {Element} wrapper - カードラッパー
 * @param {Element} img - 画像要素
 */
function handleCardRightClick(wrapper, img) {
  const parent = wrapper.parentElement;
  const poolRow = document.getElementById('poolRow');

  // 初期画像は削除不可
  if (parent.id === 'poolRow' && !initialImageSrcs.includes(img.src)) {
    wrapper.remove(); // プール内なら削除
  } else if (parent.id !== 'poolRow') {
    // プール外ならプールに戻す
    wrapper.style = '';
    poolRow.appendChild(wrapper);
  }
}

/**
 * カードをプールに追加
 * @param {string} src - 画像のURL
 * @param {boolean} toFirst - 先頭に追加するか
 * @param {boolean} isEx - EXデッキのカードか
 */
export function addCardToPool(src, toFirst = false, isEx = false) {
  const wrapper = createCardElement(src, isEx);
  const targetPool = isEx ? document.getElementById('poolRow2') : document.getElementById('poolRow');

  if (toFirst && targetPool.firstChild) {
    targetPool.insertBefore(wrapper, targetPool.firstChild);
  } else {
    targetPool.appendChild(wrapper);
  }
}

/**
 * 複数のカードをプールに追加
 * @param {string[]} cards - 画像URLの配列
 * @param {boolean} isEx - EXデッキのカードか
 */
export function addCardsToPool(cards, isEx = false) {
  cards.forEach(src => addCardToPool(src, false, isEx));
}

/**
 * 初期カードを設定
 * @param {string[]} imageSrcs - 初期画像のURL配列
 */
export function initializeCards(imageSrcs) {
  // 初期画像のsrcを絶対パスで保持
  initialImageSrcs = imageSrcs.map(src => {
    const a = document.createElement('a');
    a.href = src;
    return a.href;
  });

  imageSrcs.forEach(src => addCardToPool(src));

  const poolRow = document.getElementById('poolRow');
  poolRow.querySelectorAll('.tier-item-wrapper').forEach(item => {
    item.id = 'initial';
  });
}

/**
 * プール内のカードをソート
 * @param {string} poolId - ソート対象のプールID
 */
export function sortPoolCards(poolId) {
  const pool = document.getElementById(poolId);
  if (!pool) return;

  const sortedItems = Array.from(pool.children).sort((a, b) => {
    const idA = a.querySelector('img')?.id.toLowerCase() || '';
    const idB = b.querySelector('img')?.id.toLowerCase() || '';
    return idA.localeCompare(idB);
  });

  sortedItems.forEach(item => pool.appendChild(item));
}

/**
 * 指定されたタイプのカードをプールから取得
 * @param {string} poolId - プールID
 * @param {string} type - カードタイプ ('normal' または 'ex')
 * @returns {Element[]} - カード要素の配列
 */
export function getCardsFromPool(poolId, type) {
  const pool = document.getElementById(poolId);
  if (!pool) return [];

  return Array.from(pool.querySelectorAll('.tier-item-wrapper'))
    .filter(item => item.id.includes(type));
}

/**
 * カードをスロットに戻す（スタイルリセット付き）
 * @param {Element} card - カード要素
 * @param {string} poolId - 戻し先のプールID
 */
export function returnCardToPool(card, poolId) {
  card.style = '';
  const pool = document.getElementById(poolId);
  if (pool) {
    pool.appendChild(card);
  }
}

/**
 * すべてのカードをデッキに戻す
 */
export function returnAllCardsToDeck() {
  const poolRow = document.getElementById('poolRow');
  const poolRow2 = document.getElementById('poolRow2');
  const mainContent = document.querySelector('.main-content');
  const centerSlot = document.querySelector('.center-slot');

  // メインコンテンツ内のカードを戻す
  const allItemsMain = mainContent.querySelectorAll('.tier-item-wrapper');
  allItemsMain.forEach(item => {
    item.style = '';
    if (item.id.includes('ex')) {
      poolRow2.appendChild(item);
    } else {
      poolRow.appendChild(item);
    }
  });

  // 手札のカードを戻す
  const allItemsCenter = centerSlot.querySelectorAll('.tier-item-wrapper');
  allItemsCenter.forEach(item => {
    item.style = '';
    if (item.id.includes('ex')) {
      poolRow2.appendChild(item);
    } else {
      poolRow.appendChild(item);
    }
  });

  // ソート
  sortPoolCards('poolRow');
  sortPoolCards('poolRow2');
}

/**
 * ランダムにカードを選択
 * @param {string} poolId - プールID
 * @param {number} count - 選択枚数
 * @returns {Element[]} - 選択されたカード要素の配列
 */
export function drawRandomCards(poolId, count) {
  const poolItems = getCardsFromPool(poolId, 'normal');
  const selectedItems = [];

  while (selectedItems.length < count && poolItems.length > 0) {
    const randomIndex = Math.floor(Math.random() * poolItems.length);
    const selectedItem = poolItems.splice(randomIndex, 1)[0];
    selectedItem.style = '';
    selectedItems.push(selectedItem);
  }

  return selectedItems;
}
