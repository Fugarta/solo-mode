import { initializeCounter } from './counter-manager.js';

/**
 * ドラッグ&ドロップ統合管理
 * デスクトップとタッチデバイスの両方に対応
 */

// ドロップゾーンの種類
const DROP_ZONE_TYPES = {
  POOL: 'tier-row',          // デッキ/EXデッキ
  CUSTOM_SLOT: 'custom-slot', // フィールドスロット
  CENTER_SLOT: 'center-slot', // 手札
  SIDE_SLOT: 'side-slot',     // 墓地/除外
};

/**
 * ドラッグ対象の種類を判定
 * @param {Element} element - ドラッグされた要素
 * @returns {Object} - {type: 'card'|'counter', element: Element}
 */
function getDraggedElementInfo(element) {
  const tierItem = element.closest('.tier-item-wrapper');
  if (tierItem) {
    return { type: 'card', element: tierItem };
  }

  const counter = element.closest('.counter-container');
  if (counter) {
    return { type: 'counter', element: counter };
  }

  return null;
}

/**
 * ドロップ先の情報を取得
 * @param {Element} target - ドロップ先の要素
 * @returns {Object|null} - {type: string, element: Element}
 */
function getDropZoneInfo(target) {
  for (const [type, className] of Object.entries(DROP_ZONE_TYPES)) {
    const element = target.closest(`.${className}`);
    if (element) {
      return { type, element };
    }
  }
  return null;
}

/**
 * カードのスタイルをリセット
 * @param {Element} card - カード要素
 * @param {boolean} resetTop - topプロパティもリセットするか
 */
function resetCardStyle(card, resetTop = true) {
  card.style.position = '';
  card.style.left = '';
  card.style.zIndex = '';
  if (resetTop) {
    card.style.top = '';
  }
}

/**
 * カスタムスロットにカードを配置（重ね配置）
 * @param {Element} slot - スロット要素
 * @param {Element} card - カード要素
 */
function placeCardInCustomSlot(slot, card) {
  const existingItems = Array.from(slot.querySelectorAll('.tier-item-wrapper'));

  // 同じ場所にドロップした場合は何もしない
  if (existingItems.length === 1 && existingItems[0] === card) {
    return;
  }

  const baseZIndex = 1;

  // 既存のカードの位置を調整
  existingItems.forEach((item, index) => {
    item.style.position = 'absolute';
    item.style.zIndex = `${baseZIndex + index}`;
  });

  // ドロップされたカードを最前面に配置
  card.style.position = 'absolute';
  card.style.top = `calc(var(--slot-width) * 0.${existingItems.length})`;
  card.style.zIndex = `${baseZIndex + existingItems.length}`;

  slot.appendChild(card);
}

/**
 * プールにカードを配置（並び替え）
 * @param {Element} pool - プール要素
 * @param {Element} card - カード要素
 * @param {Element} targetCard - ドロップ先のカード要素（null可）
 */
function placeCardInPool(pool, card, targetCard) {
  resetCardStyle(card);

  if (targetCard && targetCard !== card) {
    pool.insertBefore(card, targetCard);
  } else {
    pool.appendChild(card);
  }
}

/**
 * 通常スロットにカードを配置
 * @param {Element} slot - スロット要素
 * @param {Element} card - カード要素
 */
function placeCardInNormalSlot(slot, card) {
  resetCardStyle(card);
  slot.appendChild(card);
}

/**
 * カウンターをカードに配置
 * @param {Element} card - カード要素
 * @param {Element} counter - カウンター要素
 */
function placeCounterOnCard(card, counter) {
  const clonedCounter = counter.cloneNode(true);
  clonedCounter.id = `clonedCounter-${Date.now()}`;

  // スタイルリセット
  clonedCounter.classList.remove('touch-dragging');
  clonedCounter.style.left = '';
  clonedCounter.style.top = '';
  clonedCounter.style.position = '';

  initializeCounter(clonedCounter);
  card.appendChild(clonedCounter);
}

/**
 * ドロップ処理の実行
 * @param {Object} draggedInfo - ドラッグ対象情報
 * @param {Object} dropZoneInfo - ドロップ先情報
 * @param {Element} dropTarget - 具体的なドロップ先要素
 */
function executeDrop(draggedInfo, dropZoneInfo, dropTarget) {
  const { type: dragType, element: draggedElement } = draggedInfo;

  // カウンターのドロップ処理
  if (dragType === 'counter') {
    const targetCard = dropTarget.closest('.tier-item-wrapper');
    if (targetCard) {
      placeCounterOnCard(targetCard, draggedElement);
    }
    return;
  }

  // カードのドロップ処理
  if (dragType === 'card') {
    const { type: dropType, element: dropZone } = dropZoneInfo;

    switch (dropType) {
      case 'POOL':
        const targetCard = dropTarget.closest('.tier-item-wrapper');
        placeCardInPool(dropZone, draggedElement, targetCard);
        break;

      case 'CUSTOM_SLOT':
        placeCardInCustomSlot(dropZone, draggedElement);
        break;

      case 'CENTER_SLOT':
      case 'SIDE_SLOT':
        placeCardInNormalSlot(dropZone, draggedElement);
        break;
    }
  }
}

/**
 * デスクトップドラッグ&ドロップの初期化
 */
export function initializeDesktopDragDrop() {
  // allowDrop
  window.allowDrop = function(ev) {
    ev.preventDefault();
  };

  // drag
  window.drag = function(ev) {
    ev.dataTransfer.setData('text/plain', ev.target.id);
  };

  // drop
  window.drop = function(ev) {
    ev.preventDefault();

    const id = ev.dataTransfer.getData('text/plain');
    const draggedElement = document.getElementById(id);
    if (!draggedElement) return;

    const draggedInfo = getDraggedElementInfo(draggedElement);
    if (!draggedInfo) return;

    const dropZoneInfo = getDropZoneInfo(ev.target);
    if (!dropZoneInfo) return;

    executeDrop(draggedInfo, dropZoneInfo, ev.target);
  };
}

/**
 * タッチドラッグ&ドロップの初期化
 * @param {TouchEvent} ev - touchstartイベント
 */
export function enableTouchDrag(ev) {
  ev.preventDefault();

  const draggedInfo = getDraggedElementInfo(ev.target);
  if (!draggedInfo) return;

  const { element: draggingElem } = draggedInfo;
  let shouldResetTop = true;

  // タッチ移動時の処理
  const handleTouchMove = (ev) => {
    const touch = ev.touches[0];
    draggingElem.classList.add('touch-dragging');
    draggingElem.style.left = `${touch.clientX - draggingElem.offsetWidth / 2}px`;
    draggingElem.style.top = `${touch.clientY - draggingElem.offsetHeight / 2}px`;
  };

  // タッチ終了時の処理
  const handleTouchEnd = (ev) => {
    const touch = ev.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

    if (dropTarget) {
      const dropZoneInfo = getDropZoneInfo(dropTarget);
      if (dropZoneInfo) {
        // カスタムスロットの場合はtopをリセットしない
        shouldResetTop = dropZoneInfo.type !== 'CUSTOM_SLOT';
        executeDrop(draggedInfo, dropZoneInfo, dropTarget);
      }
    }

    // クリーンアップ
    draggingElem.classList.remove('touch-dragging');
    resetCardStyle(draggingElem, shouldResetTop);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
}
