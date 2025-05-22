export function enableTouchDrag(ev) {
  ev.preventDefault();

  const draggingElem = ev.target.closest('.tier-item-wrapper');
  if (!draggingElem) return;

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
    draggingElem.style.position = 'fixed';
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
          draggingElem.classList.remove('touch-dragging');
          draggingElem.style.left = '';
          draggingElem.style.position = '';
          draggingElem.style.top = '';
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
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
    draggingElem.classList.remove('touch-dragging');
    draggingElem.style.left = '';
    draggingElem.style.position = '';

    if (isEnableReset) {
      draggingElem.style.top = '';
    }
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
}
