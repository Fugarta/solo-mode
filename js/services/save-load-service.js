/**
 * セーブ&ロードサービス
 * カード配置とゲーム状態をlocalStorageに保存・復元
 */

const SAVE_KEY_PREFIX = 'card-sim-save-slot-';
const MAX_SLOTS = 5;

/**
 * スロット内のカード情報を取得
 * @param {Element} slot - スロット要素
 * @returns {Array} - カード情報の配列
 */
function getCardsFromSlot(slot) {
  const cards = [];
  const wrappers = slot.querySelectorAll('.tier-item-wrapper');

  wrappers.forEach(wrapper => {
    const img = wrapper.querySelector('img');
    if (img) {
      cards.push({
        id: wrapper.id,
        src: img.src,
        style: wrapper.getAttribute('style') || '',
      });
    }
  });

  return cards;
}

/**
 * カウンター情報を取得
 * @returns {Array} - カウンター情報の配列
 */
function getCounterStates() {
  const counters = [];
  const counterElements = document.querySelectorAll('.counter-container');

  counterElements.forEach((counter, index) => {
    // 元のカウンターはスキップ（親要素のidがparent）
    if (counter.id === 'parent') {
      return;
    }

    const textbox = counter.querySelector('.counter-textbox');
    const parentSlot = counter.parentElement;

    counters.push({
      value: textbox ? textbox.value : '1',
      parentId: parentSlot ? parentSlot.className : '',
      parentDataSlot: parentSlot ? parentSlot.getAttribute('data-slot') : null,
      style: counter.getAttribute('style') || '',
    });
  });

  return counters;
}

/**
 * 現在のゲーム状態を保存
 * @param {number} slotNumber - 保存スロット番号（1-5）
 * @param {string} slotName - スロット名（オプション）
 * @returns {boolean} - 保存成功/失敗
 */
export function saveGameState(slotNumber, slotName = '') {
  if (slotNumber < 1 || slotNumber > MAX_SLOTS) {
    throw new Error('無効なスロット番号です');
  }

  try {
    const gameState = {
      timestamp: Date.now(),
      slotName: slotName || `スロット ${slotNumber}`,
      slots: {},
      counters: getCounterStates(),
    };

    // デッキプール
    gameState.slots.poolRow = getCardsFromSlot(document.getElementById('poolRow'));
    gameState.slots.poolRow2 = getCardsFromSlot(document.getElementById('poolRow2'));

    // カスタムスロット（フィールド）
    const customSlots = document.querySelectorAll('.custom-slot');
    customSlots.forEach(slot => {
      const slotNum = slot.getAttribute('data-slot');
      if (slotNum) {
        gameState.slots[`custom-slot-${slotNum}`] = getCardsFromSlot(slot);
      }
    });

    // サイドスロット（墓地、除外など）
    const sideSlots = document.querySelectorAll('.side-slot');
    sideSlots.forEach((slot, index) => {
      gameState.slots[`side-slot-${index}`] = getCardsFromSlot(slot);
    });

    // 手札スロット
    const centerSlot = document.querySelector('.center-slot');
    if (centerSlot) {
      gameState.slots['center-slot'] = getCardsFromSlot(centerSlot);
    }

    // フリースペース
    const freeSpace = document.getElementById('free-space');
    if (freeSpace) {
      gameState.slots['free-space'] = getCardsFromSlot(freeSpace);
    }

    // localStorageに保存（圧縮して容量を削減）
    const key = SAVE_KEY_PREFIX + slotNumber;
    const jsonString = JSON.stringify(gameState);
    const compressed = LZString.compress(jsonString);
    localStorage.setItem(key, compressed);

    console.log(`ゲーム状態をスロット${slotNumber}に保存しました（圧縮前: ${(jsonString.length / 1024).toFixed(2)}KB, 圧縮後: ${(compressed.length / 1024).toFixed(2)}KB）`);
    return true;
  } catch (error) {
    console.error('保存エラー:', error);
    return false;
  }
}

/**
 * カードを復元
 * @param {Element} slot - 復元先スロット
 * @param {Array} cards - カード情報の配列
 */
function restoreCardsToSlot(slot, cards) {
  if (!slot || !cards) return;

  // 既存のカードをクリア（初期カードは残す）
  const existingWrappers = slot.querySelectorAll('.tier-item-wrapper:not(#initial)');
  existingWrappers.forEach(wrapper => wrapper.remove());

  // カードを復元
  cards.forEach(cardData => {
    // 初期カードはスキップ（既に存在するため）
    if (cardData.id === 'initial') return;

    const wrapper = document.createElement('div');
    wrapper.className = 'tier-item-wrapper';
    wrapper.id = cardData.id;
    if (cardData.style) {
      wrapper.setAttribute('style', cardData.style);
    }

    const img = document.createElement('img');
    img.src = cardData.src;
    img.className = 'tier-item';
    img.setAttribute('draggable', 'true');
    img.id = cardData.id.split(' ')[0];

    // イベントリスナーを再設定
    img.addEventListener('dragstart', window.drag);
    img.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // 右クリック処理は既存のロジックに委譲
    });

    wrapper.appendChild(img);
    slot.appendChild(wrapper);
  });
}

/**
 * カウンターを復元
 * @param {Array} counters - カウンター情報の配列
 */
function restoreCounters(counters) {
  if (!counters) return;

  // 既存のカウンターをクリア（親要素のもの以外）
  const existingCounters = document.querySelectorAll('.counter-container:not(#parent)');
  existingCounters.forEach(counter => counter.remove());

  // カウンターを復元
  counters.forEach(counterData => {
    // 親となるスロットを検索
    let parentSlot = null;
    if (counterData.parentDataSlot) {
      parentSlot = document.querySelector(`[data-slot="${counterData.parentDataSlot}"]`);
    } else if (counterData.parentId) {
      parentSlot = document.querySelector(`.${counterData.parentId.split(' ')[0]}`);
    }

    if (!parentSlot) return;

    // カウンターを作成
    const counter = document.createElement('div');
    counter.className = 'counter-container';
    counter.setAttribute('draggable', 'true');
    if (counterData.style) {
      counter.setAttribute('style', counterData.style);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'triangle-button-container';

    const upButton = document.createElement('button');
    upButton.className = 'triangle-button up';
    upButton.textContent = '▲';

    const downButton = document.createElement('button');
    downButton.className = 'triangle-button down';
    downButton.textContent = '▼';

    buttonContainer.appendChild(upButton);
    buttonContainer.appendChild(downButton);

    const textbox = document.createElement('input');
    textbox.type = 'text';
    textbox.className = 'counter-textbox';
    textbox.value = counterData.value;
    textbox.readOnly = true;

    counter.appendChild(buttonContainer);
    counter.appendChild(textbox);

    // イベントリスナーを再設定
    counter.addEventListener('dragstart', window.drag);

    parentSlot.appendChild(counter);
  });
}

/**
 * ゲーム状態をロード
 * @param {number} slotNumber - ロードスロット番号（1-5）
 * @returns {boolean} - ロード成功/失敗
 */
export function loadGameState(slotNumber) {
  if (slotNumber < 1 || slotNumber > MAX_SLOTS) {
    throw new Error('無効なスロット番号です');
  }

  try {
    const key = SAVE_KEY_PREFIX + slotNumber;
    const data = localStorage.getItem(key);

    if (!data) {
      throw new Error('セーブデータが見つかりません');
    }

    // 圧縮データを解凍
    const decompressed = LZString.decompress(data);

    // 旧形式（圧縮されていない）との互換性を保つ
    const gameState = JSON.parse(decompressed || data);

    // デッキプール
    restoreCardsToSlot(document.getElementById('poolRow'), gameState.slots.poolRow);
    restoreCardsToSlot(document.getElementById('poolRow2'), gameState.slots.poolRow2);

    // カスタムスロット（フィールド）
    const customSlots = document.querySelectorAll('.custom-slot');
    customSlots.forEach(slot => {
      const slotNum = slot.getAttribute('data-slot');
      if (slotNum) {
        const slotKey = `custom-slot-${slotNum}`;
        restoreCardsToSlot(slot, gameState.slots[slotKey]);
      }
    });

    // サイドスロット（墓地、除外など）
    const sideSlots = document.querySelectorAll('.side-slot');
    sideSlots.forEach((slot, index) => {
      const slotKey = `side-slot-${index}`;
      restoreCardsToSlot(slot, gameState.slots[slotKey]);
    });

    // 手札スロット
    const centerSlot = document.querySelector('.center-slot');
    if (centerSlot && gameState.slots['center-slot']) {
      restoreCardsToSlot(centerSlot, gameState.slots['center-slot']);
    }

    // フリースペース
    const freeSpace = document.getElementById('free-space');
    if (freeSpace && gameState.slots['free-space']) {
      restoreCardsToSlot(freeSpace, gameState.slots['free-space']);
    }

    // カウンターを復元
    restoreCounters(gameState.counters);

    console.log(`ゲーム状態をスロット${slotNumber}からロードしました`);
    return true;
  } catch (error) {
    console.error('ロードエラー:', error);
    throw error;
  }
}

/**
 * 保存されているスロット情報を取得
 * @returns {Array} - スロット情報の配列
 */
export function getSaveSlots() {
  const slots = [];

  for (let i = 1; i <= MAX_SLOTS; i++) {
    const key = SAVE_KEY_PREFIX + i;
    const data = localStorage.getItem(key);

    if (data) {
      try {
        // 圧縮データを解凍（旧形式との互換性も保つ）
        const decompressed = LZString.decompress(data);
        const gameState = JSON.parse(decompressed || data);
        const date = new Date(gameState.timestamp);
        slots.push({
          number: i,
          exists: true,
          timestamp: gameState.timestamp,
          dateString: date.toLocaleString('ja-JP'),
          slotName: gameState.slotName || `スロット ${i}`,
        });
      } catch {
        slots.push({
          number: i,
          exists: false,
          slotName: `スロット ${i}`,
        });
      }
    } else {
      slots.push({
        number: i,
        exists: false,
        slotName: `スロット ${i}`,
      });
    }
  }

  return slots;
}

/**
 * スロット名を更新
 * @param {number} slotNumber - スロット番号（1-5）
 * @param {string} newName - 新しいスロット名
 */
export function updateSlotName(slotNumber, newName) {
  if (slotNumber < 1 || slotNumber > MAX_SLOTS) {
    throw new Error('無効なスロット番号です');
  }

  const key = SAVE_KEY_PREFIX + slotNumber;
  const data = localStorage.getItem(key);

  if (!data) {
    throw new Error('セーブデータが見つかりません');
  }

  try {
    // 圧縮データを解凍（旧形式との互換性も保つ）
    const decompressed = LZString.decompress(data);
    const gameState = JSON.parse(decompressed || data);
    gameState.slotName = newName || `スロット ${slotNumber}`;

    // 圧縮して保存
    const compressed = LZString.compress(JSON.stringify(gameState));
    localStorage.setItem(key, compressed);
    console.log(`スロット${slotNumber}の名前を「${gameState.slotName}」に変更しました`);
    return true;
  } catch (error) {
    console.error('スロット名更新エラー:', error);
    throw error;
  }
}

/**
 * セーブスロットをクリア
 * @param {number} slotNumber - クリアするスロット番号（1-5）
 */
export function clearSaveSlot(slotNumber) {
  if (slotNumber < 1 || slotNumber > MAX_SLOTS) {
    throw new Error('無効なスロット番号です');
  }

  const key = SAVE_KEY_PREFIX + slotNumber;
  localStorage.removeItem(key);
  console.log(`スロット${slotNumber}をクリアしました`);
}
