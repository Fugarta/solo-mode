import { enableTouchDrag } from "./js/touch-support.js";
import { initializeCounter } from "./js/counter-manager.js";

window.allowDrop = allowDrop;
window.drop = drop;
window.drag = drag;

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text/plain", ev.target.id);
  console.log("drag", ev.target);
}

function drop(ev) {
  ev.preventDefault();
  const id = ev.dataTransfer.getData("text/plain");
  const dragged = document.getElementById(id)?.closest(".tier-item-wrapper");
  const draggedCounter = document.getElementById(id)?.closest(".counter-container");
  // 画像プール
  const row = ev.target.closest(".tier-row");
  // カスタムスロット
  const customSlot = ev.target.closest(".custom-slot");
  // 横長スロット
  const centerSlot = ev.target.closest(".center-slot");
  // 右側の縦長長方形
  const sideSlot = ev.target.closest(".side-slot");
  const tierItem = ev.target.closest(".tier-item-wrapper");

  if (draggedCounter) {
    if (tierItem) {
      const clonedCounter = draggedCounter.cloneNode(true);
      initializeCounter(clonedCounter); // 複製したカウンターを初期化
      clonedCounter.id = `clonedCounter-${Date.now()}`;
      tierItem.appendChild(clonedCounter);
      return;
    }
  }

  if (row) {
    let target = ev.target.closest(".tier-item-wrapper");
    dragged.style = ""; // スタイルをリセット
    if (target && target !== dragged) {
      row.insertBefore(dragged, target);
    } else {
      row.appendChild(dragged);
    }
  } else if (customSlot) {
    // すでに画像がある場合は少し下にずらして重ねる
    const existingItems = customSlot.querySelectorAll(".tier-item-wrapper");
    if (existingItems.length == 1) {
      if (existingItems[0] === dragged) {
        return; // ドロップ先が同じ場合は何もしない
      }
    }
    const baseZIndex = 1; // 基本の zIndex

    existingItems.forEach((item, index) => {
      item.style.position = "absolute";
      item.style.zIndex = `${baseZIndex + index}`; // 枚数に応じて zIndex を調整
    });

    // ドロップされた画像を最前面に配置
    dragged.style.position = "absolute";
    dragged.style.top = "calc(var(--slot-width)*0." + existingItems.length + ")"; // 一番上に配置
    dragged.style.zIndex = `${baseZIndex + existingItems.length}`; // 最前面に配置

    customSlot.appendChild(dragged);
  } else if (centerSlot) {
    dragged.style = ""; // スタイルをリセット
    centerSlot.appendChild(dragged);
  } else if (sideSlot) {
    dragged.style = ""; // スタイルをリセット
    sideSlot.appendChild(dragged);
  }
}


let itemCount = 0;
const poolRow = document.getElementById("poolRow");
const poolRow2 = document.getElementById("poolRow2");
// 初期画像のsrc一覧を保持
let initialImageSrcs = [];

function createImageElement(src,) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("tier-item-wrapper");

  const img = document.createElement("img");
  img.src = src;
  img.classList.add("tier-item");
  img.setAttribute("draggable", "true");
  img.id = "item-" + itemCount++;
  img.addEventListener("dragstart", drag);
  img.addEventListener("touchstart", enableTouchDrag, { passive: false });

  // 右クリック処理
  img.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const parent = wrapper.parentElement;
    // 初期画像は削除不可
    if (parent.id === "poolRow" && !initialImageSrcs.includes(img.src)) {
      wrapper.remove(); // プール内なら削除
    } else if (parent.id !== "poolRow") {
      poolRow.appendChild(wrapper); // それ以外なら戻す
    }
  });

  wrapper.appendChild(img);

  return wrapper;
}

function addImageToPool(src, toFirst = false, isEx = false) {
  const wrapper = createImageElement(src);
  if (!isEx) {
    if (toFirst && poolRow.firstChild) {
      poolRow.insertBefore(wrapper, poolRow.firstChild);
    } else {
      poolRow.appendChild(wrapper);
    }
  }
  else {
    if (toFirst && poolRow2.firstChild) {
      poolRow2.insertBefore(wrapper, poolRow2.firstChild);
    } else {
      poolRow2.appendChild(wrapper);
    }

  }
}

// 画像アップロード時
document.getElementById("imageUpload").addEventListener("change", (event) => {
  const files = event.target.files;

  if (files.length > 1) {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = function (e) {
        addImageToPool(e.target.result, false);
      };
      reader.readAsDataURL(file);
    }
    return;
  }

  for (const file of files) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const w = img.width;
        const h = img.height;
        const aspect = h / w;

        // アスペクト比に応じて決定
        let cols, rows, startX, startY, cardWidth, cardHeight, cardGap, startYEx;

        if (aspect >= 1.095 && aspect <= 1.105) {
          // パターン1
          cols = 10;
          rows = 4;
          startX = 0;
          startY = 119 / 1187 * h;
          cardWidth = 106 / 1080 * w;
          cardHeight = 154 / 1187 * h;
          cardGap = 2 / 1080 * w;
          startYEx = 784 / 1187 * h;
        } else if (aspect >= 1.235 && aspect <= 1.245) {
          // パターン2
          cols = 10;
          rows = 5;
          startX = 0;
          startY = 119 / 1341 * h;;
          cardWidth = 106 / 1080 * w;
          cardHeight = 154 / 1341 * h;
          cardGap = 2 / 1080 * w;
          startYEx = 938 / 1341 * h;
        } else if (aspect >= 1.380 && aspect <= 1.390) {
          // パターン3
          cols = 10;
          rows = 6;
          startX = 0;
          startY = 119 / 1495 * h;;
          cardWidth = 106 / 1080 * w;
          cardHeight = 154 / 1495 * h;
          cardGap = 2 / 1080 * w;
          startYEx = 1091 / 1495 * h;
        } else {
          // その他
          alert("画像のアスペクト比が不正です。("+ w + " x "+  h + ")");
          return;
        }

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const canvas = document.createElement("canvas");
            canvas.width = cardWidth;
            canvas.height = cardHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(
              img,
              startX + col * (cardWidth + cardGap),
              startY + row * cardHeight,
              cardWidth,
              cardHeight,
              0,
              0,
              cardWidth,
              cardHeight
            );
            const dataUrl = canvas.toDataURL();
            addImageToPool(dataUrl, false); // 先頭に追加
          }
        }
        for (let i = 0; i < 10; i++) {
          const canvas = document.createElement("canvas");
          canvas.width = cardWidth;
          canvas.height = cardHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            img,
            0 + i * (cardWidth + cardGap), startYEx, // sx, sy
            cardWidth, cardHeight,  // sw, sh
            0, 0,                   // dx, dy
            cardWidth, cardHeight   // dw, dh
          );
          const dataUrl = canvas.toDataURL();
          addImageToPool(dataUrl, false, true);
        }
        for (let i = 0; i < 5; i++) {
          const canvas = document.createElement("canvas");
          canvas.width = cardWidth;
          canvas.height = cardHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            img,
            0 + i * (cardWidth + cardGap), startYEx + cardHeight, // sx, sy
            cardWidth, cardHeight,  // sw, sh
            0, 0,                   // dx, dy
            cardWidth, cardHeight   // dw, dh
          );
          const dataUrl = canvas.toDataURL();
          addImageToPool(dataUrl, false, true);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// 画像ペースト時
document.addEventListener("paste", (event) => {
  const items = event.clipboardData.items;
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const blob = item.getAsFile();
      const reader = new FileReader();
      reader.onload = function (e) {
        addImageToPool(e.target.result, true); // 先頭に追加
      };
      reader.readAsDataURL(blob);
    }
  }
});

// 初期化時はそのまま末尾に追加
window.addEventListener("DOMContentLoaded", () => {
  const initialImages = [
    { src: "images/ura.jpg" },
    { src: "images/ura.jpg" },
    { src: "images/ura.jpg" },
  ];

  // 初期画像のsrcを絶対パスで保持
  initialImageSrcs = initialImages.map(obj => {
    const a = document.createElement('a');
    a.href = obj.src;
    return a.href;
  });

  initialImages.forEach(obj => {
    addImageToPool(obj.src); // 末尾に追加
  });

  // side-slot-group のうち2つめ（除外）のダブルクリックで表示/非表示を切替
  const sideSlotGroups = document.querySelectorAll('.side-slot-group');
  if (sideSlotGroups.length >= 2) {
    const secondGroup = sideSlotGroups[1];
    secondGroup.addEventListener("dblclick", () => {
      if (secondGroup.style.display === "none") {
        secondGroup.style.display = "";
      } else {
        secondGroup.style.display = "none";
      }
    });
  }
});

document.getElementById("saveButton").addEventListener("click", () => {
  // html2canvas は display:none の要素は描画しないため、
  // 非表示にした side-slot-group は保存画像に含まれません
  html2canvas(document.getElementById("mainContainer")).then(canvas => {
    const link = document.createElement("a");
    link.download = "tier-list.png";
    link.href = canvas.toDataURL();
    link.click();
  });
});

document.getElementById("tweetButton").addEventListener("click", () => {
  const tweetText = encodeURIComponent("Solo Mode で盤面を作りました\nhttps://fugarta.github.io/solo-modeS/");
  html2canvas(document.getElementById("mainContainer")).then(canvas => {
    canvas.toBlob(blob => {
      const url = "https://twitter.com/intent/tweet?text=" + tweetText;
      window.open(url, "_blank");
    });
  });
});


// カウンターを含む要素を動的に作成する場合
document.querySelectorAll(".counter-container").forEach((container) => {
  initializeCounter(container);
});
document.querySelector(".counter-container").addEventListener("touchstart", enableTouchDrag, { passive: false });