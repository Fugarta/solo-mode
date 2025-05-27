import { initializeCounter } from "./counter-manager.js";

export function enableTouchDrag(ev) {
  // ドラッグ中の要素を元の位置に戻す関数
  function dragEplogue(obj, isResetTop = true, isRestEventListener = true) {
    obj.classList.remove('touch-dragging');
    obj.style.left = '';
    obj.style.position = '';
    if (isResetTop) {
      obj.style.top = '';
    }
    if (isRestEventListener) {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    }
  }

  ev.preventDefault();

  var isTierItem = true;
  var draggingElem = ev.target.closest('.tier-item-wrapper');
  if (!draggingElem) {
    draggingElem = ev.target.closest('.counter-container');
    if (!draggingElem) {
      return;
    }
    isTierItem = false;
  };

  /**
   * スマートフォンでのドラッグ移動時の挙動を設定
   *
   * @param {Event} ev
   */
  const handleTouchMove = (ev) => {
    const touch = ev.touches[0];

    // 追従用classを追加
    draggingElem.classList.add('touch-dragging');

    // ドラッグ中の要素を画面上で移動させる
    draggingElem.style.left = `${touch.clientX - draggingElem.offsetWidth / 2
      }px`;
    draggingElem.style.top = `${touch.clientY - draggingElem.offsetHeight / 2
      }px`;
  };

  /**
   * スマートフォンでのドラッグ終了時の挙動を設定
   *
   * @param {Event} ev
   */
  const handleTouchEnd = (ev) => {
    const touch = ev.changedTouches[0];
    // ドロップ先の要素を、複数の候補から取得する
    const dropElem = document.elementFromPoint(touch.clientX, touch.clientY);

    // 画像プール
    const row = dropElem?.closest(".tier-row");
    // カスタムスロット
    const customSlot = dropElem?.closest(".custom-slot");
    // 横長スロット
    const centerSlot = dropElem?.closest(".center-slot");
    // 右側の縦長長方形
    const sideSlot = dropElem?.closest(".side-slot");


    if (!isTierItem) {
      let target = dropElem?.closest(".tier-item-wrapper");
      if (target) {
        const clonedCounter = draggingElem.cloneNode(true);
        dragEplogue(clonedCounter, true, false); // 複製したカウンターのスタイルをリセット
        initializeCounter(clonedCounter); // 複製したカウンターを初期化
        clonedCounter.id = `clonedCounter-${Date.now()}`;
        target.appendChild(clonedCounter);
      }
      dragEplogue(draggingElem);
      return;
    }

    var isEnableReset = true;
    if (row) {
      let target = dropElem?.closest(".tier-item-wrapper");
      draggingElem.style = ""; // スタイルをリセット
      if (target && target !== draggingElem) {
        row.insertBefore(draggingElem, target);
      } else {
        row.appendChild(draggingElem);
      }
    } else if (customSlot) {
      // すでに画像がある場合は少し下にずらして重ねる
      const existingItems = customSlot.querySelectorAll(".tier-item-wrapper");

      // ドロップ先が同じ場合は何もしない
      if (existingItems.length == 1) {
        if (existingItems[0] === draggingElem) {
          customSlot.appendChild(draggingElem);
          dragEplogue(draggingElem);
          return;
        }
      }
      const baseZIndex = 1; // 基本の zIndex
      existingItems.forEach((item, index) => {
        item.style.position = "absolute";
        item.style.zIndex = `${baseZIndex + index}`; // 枚数に応じて zIndex を調整
      });

      // ドロップされた画像を最前面に配置
      draggingElem.style.position = "absolute";
      draggingElem.style.top = "calc(var(--gap)*" + existingItems.length + ")"; // 一番上に配置
      draggingElem.style.zIndex = `${baseZIndex + existingItems.length}`; // 最前面に配置

      isEnableReset = false;
      customSlot.appendChild(draggingElem);

    } else if (centerSlot) {
      draggingElem.style = ""; // スタイルをリセット
      centerSlot.appendChild(draggingElem);
    } else if (sideSlot) {
      draggingElem.style = ""; // スタイルをリセット
      sideSlot.appendChild(draggingElem);
    }

    // ドラッグ中の要素を元の位置に戻す
    dragEplogue(draggingElem, isEnableReset, true);
  };

  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
}
