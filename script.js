import { enableTouchDrag } from "./js/touch-support.js";
import { initializeCounter } from "./js/counter-manager.js";
// import Tesseract from 'tesseract.js';

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

function createImageElement(src) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("tier-item-wrapper");

  const img = document.createElement("img");
  img.src = src;
  img.classList.add("tier-item");
  img.setAttribute("draggable", "true");
  img.id = "item-" + String(itemCount++).padStart(3, "0");
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
      wrapper.style = "";
      poolRow.appendChild(wrapper); // それ以外なら戻す
    }
  });

  wrapper.appendChild(img);

  return wrapper;
}

function addImageToPool(src, toFirst = false, isEx = false) {
  const wrapper = createImageElement(src);
  wrapper.id += " " + (isEx ? "ex" : "normal");
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

// OCRを実行する関数
async function recognizeTextFromImage(canvas) {
  try {
    const result = await Tesseract.recognize(
      canvas.toDataURL(), 
      'eng'
    );
    const text = result.data.text;
    const number = parseInt(text.replace(/\D/g, ""), 10);

    if (!isNaN(number)) {
      console.log('認識した数値:', number, '元のテキスト:', text);
      return number;
    } else {
      console.error('数値の認識に失敗しました:', text);
      return 0;
    }
  } catch (error) {
    console.error('OCRエラー:', error);
    return 0;
  }
}

// 画像アップロード時
document.getElementById("imageUpload").addEventListener("change", async (event) => {
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
      img.onload = async function () {
        const w = img.width;
        const h = img.height;
        const aspect = h / w;
        
        // アスペクト比ごとの設定をオブジェクトにまとめる
        const aspectRatioSettings = [
          {
            range: [1.095, 1.105],
            cols: 10,
            rows: 4,
            startX: 0,
            startY: (h) => 119 / 1187 * h,
            cardWidth: (w) => 106 / 1080 * w,
            cardHeight: (h) => 154 / 1187 * h,
            cardGap: (w) => 2 / 1080 * w,
            startYEx: (h) => 784 / 1187 * h,
            deckNum: {
              x: (w) => 238 / 1080 * w,
              y: (h) => 86 / 1187 * h,
              width: (w) => 36 / 1080 * w,
              height: (h) => 23 / 1187 * h,
            },
            exDeckNum: {
              x: (w) => 296 / 1080 * w,
              y: (h) => 748 / 1187 * h,
            },
          },
          {
            range: [1.235, 1.245],
            cols: 10,
            rows: 5,
            startX: 0,
            startY: (h) => 119 / 1341 * h,
            cardWidth: (w) => 106 / 1080 * w,
            cardHeight: (h) => 154 / 1341 * h,
            cardGap: (w) => 2 / 1080 * w,
            startYEx: (h) => 938 / 1341 * h,
            deckNum: {
              x: (w) => 238 / 1080 * w,
              y: (h) => 86 / 1341 * h,
              width: (w) => 36 / 1080 * w,
              height: (h) => 23 / 1341 * h,
            },
            exDeckNum: {
              x: (w) => 296 / 1080 * w,
              y: (h) => 902 / 1341 * h,
            },
          },
          {
            range: [1.380, 1.390],
            cols: 10,
            rows: 6,
            startX: 0,
            startY: (h) => 119 / 1495 * h,
            cardWidth: (w) => 106 / 1080 * w,
            cardHeight: (h) => 154 / 1495 * h,
            cardGap: (w) => 2 / 1080 * w,
            startYEx: (h) => 1091 / 1495 * h,
            deckNum: {
              x: (w) => 238 / 1080 * w,
              y: (h) => 86 / 1495 * h,
              width: (w) => 36 / 1080 * w,
              height: (h) => 23 / 1495 * h,
            },
            exDeckNum: {
              x: (w) => 296 / 1080 * w,
              y: (h) => 1056 / 1495 * h,
            },
          },
        ];

        function getAspectRatioSettings(aspect, w, h) {
          return aspectRatioSettings.find(
            (setting) => aspect >= setting.range[0] && aspect <= setting.range[1]
          );
        }

        // アスペクト比に応じて設定を適用
        const settings = getAspectRatioSettings(aspect, w, h);
        if (!settings) {
          alert(`画像のアスペクト比が不正です。(${w} x ${h})`);
          return;
        }

        const cols = settings.cols;
        const rows = settings.rows;
        const startX = settings.startX;
        const startY = settings.startY(h);
        const cardWidth = settings.cardWidth(w);
        const cardHeight = settings.cardHeight(h);
        const cardGap = settings.cardGap(w);
        const startYEx = settings.startYEx(h);

        const deckNumX = settings.deckNum.x(w);
        const deckNumY = settings.deckNum.y(h);
        const deckNumWidth = settings.deckNum.width(w);
        const deckNumHeight = settings.deckNum.height(h);

        const exDeckNumX = settings.exDeckNum.x(w);
        const exDeckNumY = settings.exDeckNum.y(h);

        let deckNum;
        {
          const canvas = document.createElement("canvas");
          canvas.width = deckNumWidth;
          canvas.height = deckNumHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            img,
            deckNumX,
            deckNumY,
            deckNumWidth,
            deckNumHeight,
            0,
            0,
            deckNumWidth,
            deckNumHeight
          );
          try {
            deckNum = await recognizeTextFromImage(canvas); // OCRを実行し、結果を待つ
          } catch (error) {
            deckNum = cols * rows;
          }
          if (!(deckNum > (cols * rows - 10) && deckNum <= cols * rows)) {
            deckNum = cols * rows;
          }
        }
        let cardNum = 0;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (deckNum > 0 && cardNum++ >= deckNum) {
              break; // デッキ数に達したら終了
            }
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

        let exDeckNum;
        {
          const canvas = document.createElement("canvas");
          canvas.width = deckNumWidth;
          canvas.height = deckNumHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            img,
            exDeckNumX,
            exDeckNumY,
            deckNumWidth,
            deckNumHeight,
            0,
            0,
            deckNumWidth,
            deckNumHeight
          );
          try {
            exDeckNum = await recognizeTextFromImage(canvas); // OCRを実行し、結果を待つ
          } catch (error) {
            exDeckNum = 15; // OCRエラー時はデフォルト値を設定
          }
          if (!(exDeckNum > 0 && exDeckNum <= 20)) {
            exDeckNum = 15; 
          }
        }
        let exCardNum = 0;
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 10; col++) {
            if (exDeckNum > 0 && exCardNum++ >= exDeckNum) {
              break; // デッキ数に達したら終了
            }
            const canvas = document.createElement("canvas");
            canvas.width = cardWidth;
            canvas.height = cardHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(
              img,
              0 + col * (cardWidth + cardGap), startYEx + cardHeight * row, // sx, sy
              cardWidth, cardHeight,  // sw, sh
              0, 0,                   // dx, dy
              cardWidth, cardHeight   // dw, dh
            );
            const dataUrl = canvas.toDataURL();
            addImageToPool(dataUrl, false, true);
          }
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
    { src: "images/blanck.png" },
    { src: "images/blanck.png" },
    { src: "images/blanck.png" },
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

  poolRow.querySelectorAll(".tier-item-wrapper").forEach((item) => {
    item.id = "initial";
  });

  const sideSlotGroups = document.querySelectorAll('.side-slot-group');
  if (sideSlotGroups.length >= 3) {
  // フリースペース
  const firstGroup = sideSlotGroups[0];
  firstGroup.addEventListener("dblclick", () => {
    if (firstGroup.style.display === "none") {
      firstGroup.style.display = "";
    } else {
      firstGroup.style.display = "none";
    }
  });

  // 3つめの要素
  const thirdGroup = sideSlotGroups[2];
  thirdGroup.addEventListener("dblclick", () => {
    if (thirdGroup.style.display === "none") {
      thirdGroup.style.display = "";
    } else {
      thirdGroup.style.display = "none";
    }
    });
  }

});

document.getElementById("saveButton").addEventListener("click", () => {
  const randomButtonContainer = document.querySelector(".randomButton-container");
  const counterContainer = document.querySelector(".left-rectangle-container");
  const freeSpaceContainer = document.querySelector("#free-space");

  var randomButtonContainerStyle = randomButtonContainer.style.display;
  var counterContainerStyle = counterContainer.style.display;
  var freeSpaceContainerStyle = freeSpaceContainer.style.display;

  randomButtonContainer.style.display = "none";
  counterContainer.style.display = "none";
  freeSpaceContainer.style.display = "none";

  const titleElement = document.querySelector(".title");
  const titleText = titleElement ? titleElement.textContent : "";

  // Replace spaces in titleText with hyphens
  const formattedTitleText = titleText.replace(/\s/g, "_").replace(/　/g, "_");

  html2canvas(document.getElementById("mainContainer")).then(canvas => {
    const link = document.createElement("a");
    link.download = formattedTitleText + ".png";
    link.href = canvas.toDataURL();
    link.click();
  });
  
  randomButtonContainer.style.display = randomButtonContainerStyle;
  counterContainer.style.display = counterContainerStyle;
  freeSpaceContainer.style.display = freeSpaceContainerStyle;
});

document.getElementById("tweetButton").addEventListener("click", () => {
  const tweetText = encodeURIComponent("Solo Mode で盤面を作りました\n#壁とやるソロモード\nhttps://fugarta.github.io/solo-mode/");
  html2canvas(document.getElementById("mainContainer")).then(canvas => {
    canvas.toBlob(blob => {
      const url = "https://twitter.com/intent/tweet?text=" + tweetText;
      window.open(url, "_blank");
    });
  });
});

document.getElementById("resetButton").addEventListener("click", () => {
  const poolRow = document.getElementById("poolRow");
  const mainContent = document.querySelector(".main-content");
  const centerSlot = document.querySelector(".center-slot");

  // 全ての tier-item-wrapper を poolRow に戻す
  const allItemsMain = mainContent.querySelectorAll(".tier-item-wrapper");
  allItemsMain.forEach((item) => {
    item.style = ""; // スタイルをリセット
    if (item.id.includes("ex")) {
      poolRow2.appendChild(item);
    } else {
      poolRow.appendChild(item);
    }
  });
  const allItemsCenter = centerSlot.querySelectorAll(".tier-item-wrapper");
  allItemsCenter.forEach((item) => {
    item.style = ""; // スタイルをリセット
    if (item.id.includes("ex")) {
      poolRow2.appendChild(item);
    } else {
      poolRow.appendChild(item);
    }
  });

  const poolItems = Array.from(poolRow.querySelectorAll(".tier-item-wrapper")).filter(item => item.id.includes("normal"));
  const selectedItems = [];
  while (selectedItems.length < 5 && poolItems.length > 0) {
    const randomIndex = Math.floor(Math.random() * poolItems.length);
    const selectedItem = poolItems.splice(randomIndex, 1)[0];
    selectedItem.style = ""; // スタイルをリセット
    selectedItems.push(selectedItem);
  }

  // 選ばれた5枚を center-slot に移動
  selectedItems.forEach((item) => {
    centerSlot.appendChild(item);
  });

  const sortedItems = Array.from(poolRow.children).sort((a, b) => {
    const idA = a.querySelector("img")?.id.toLowerCase() || "";
    const idB = b.querySelector("img")?.id.toLowerCase() || "";
    return idA.localeCompare(idB); // img の id を文字列として比較
  });
  sortedItems.forEach(item => poolRow.appendChild(item));

  const sortedItems2 = Array.from(poolRow2.children).sort((a, b) => {
    const idA = a.querySelector("img")?.id.toLowerCase() || "";
    const idB = b.querySelector("img")?.id.toLowerCase() || "";
    return idA.localeCompare(idB); // img の id を文字列として比較
  });
  sortedItems2.forEach(item => poolRow2.appendChild(item));
});

document.getElementById("randomButton").addEventListener("click", () => {
  const poolRow = document.getElementById("poolRow");
  const centerSlot = document.querySelector(".center-slot");

  const poolItems = Array.from(poolRow.querySelectorAll(".tier-item-wrapper")).filter(item => item.id.includes("normal"));

  if (poolItems.length > 0) {
    const randomIndex = Math.floor(Math.random() * poolItems.length);
    const selectedItem = poolItems.splice(randomIndex, 1)[0];
    selectedItem.style = ""; // スタイルをリセット
    centerSlot.appendChild(selectedItem);
  }
});

// カウンターを含む要素を動的に作成する場合
document.querySelectorAll(".counter-container").forEach((container) => {
  initializeCounter(container);
});
document.querySelector(".counter-container").addEventListener("touchstart", enableTouchDrag, { passive: false });