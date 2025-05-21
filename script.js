import { enableTouchDrag } from "./js/touch-support.js";

function allowDrop(ev) {
  ev.preventDefault();
}
window.allowDrop = allowDrop;

function drag(ev) {
  ev.dataTransfer.setData("text/plain", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  const id = ev.dataTransfer.getData("text/plain");
  const dragged = document.getElementById(id)?.closest(".tier-item-wrapper");

  // 画像プール
  const row = ev.target.closest(".tier-row");
  // カスタムスロット
  const customSlot = ev.target.closest(".custom-slot");
  // 横長スロット
  const centerSlot = ev.target.closest(".center-slot");
  // 右側の縦長長方形（新規追加）
  const sideSlot = ev.target.closest(".side-slot");

  if (!dragged) return;

  if (row) {
    let target = ev.target.closest(".tier-item-wrapper");
    if (target && target !== dragged) {
      row.insertBefore(dragged, target);
    } else {
      row.appendChild(dragged);
    }
  } else if (customSlot) {
    // すでに画像がある場合は何もしない
    const existing = customSlot.querySelector(".tier-item-wrapper");
    if (existing && existing !== dragged) {
      return;
    }
    customSlot.appendChild(dragged);
  } else if (centerSlot) {
    centerSlot.appendChild(dragged);
  } else if (sideSlot) {
    sideSlot.appendChild(dragged);
  }
}
window.drop = drop;

let itemCount = 0;
const poolRow = document.getElementById("poolRow");

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
      reader.onload = function(e) {
        addImageToPool(e.target.result, false);
      };
      reader.readAsDataURL(file);
    }
    return;
  }

  for (const file of files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const w = img.width;
        const h = img.height;
        const cols = 10;
        const rows = 4;

        // 切り出し範囲
        var startX = 0;
        var startY = null;
        const cardWidth = w /cols
        var cardHeight = null;
        var startYEx = null;
        if (w >= 700 && w <= 1300 && h >= 700 && h <= 1300) {
          startX = 0;
          startY = 117 / 1187 * h;
          cardHeight = 155 / 1187 * h;        
          startYEx = 780 / 1187 * h;
        }else if (w >= 600 && w <= 700 && h >= 600 && h <= 700) {
          startX = 0;
          startY = 67 / 680 * h;
          cardHeight = 89 / 680 * h;
          startYEx = 448 / 680 * h;
        }else{
          // 画像サイズが不正な場合は何もしない
          alert("画像サイズが不正です。");
        }

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const canvas = document.createElement("canvas");
            canvas.width = cardWidth;
            canvas.height = cardHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(
              img,
              startX + col * cardWidth,
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
            0 + i * cardWidth, startYEx, // sx, sy
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
            0 + i * cardWidth, startYEx + cardHeight, // sx, sy
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
      reader.onload = function(e) {
        addImageToPool(e.target.result, true); // 先頭に追加
      };
      reader.readAsDataURL(blob);
    }
  }
});

// 初期化時はそのまま末尾に追加
window.addEventListener("DOMContentLoaded", () => {
  const initialImages = [
    // { src: "images/deaberu.png", label: "deaberu" },
    // { src: "images/diesuire.png", label: "diesuire" },
    // { src: "images/excel.png", label: "excel" },
    // { src: "images/hakaana.png", label: "hakaana" },
    // { src: "images/huranbe.png", label: "huranbe" },
    // { src: "images/masukare.png", label: "masukare" },
    // { src: "images/ork.png", label: "ork" },
    // { src: "images/popu.png", label: "popu" },
    // { src: "images/rinkuri.png", label: "rinkuri" },
    // { src: "images/sekuen.png", label: "sekuen" },
    // { src: "images/siru.png", label: "siru" },
    // { src: "images/toga.png", label: "toga" },
    // { src: "images/urara.png", label: "urara" },
    // { src: "images/usa.png", label: "usa" },
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
  const tweetText = encodeURIComponent("Tier Makerで自分だけのティア表を作りました\nhttps://fugarta.github.io/tier-maker/");
  html2canvas(document.getElementById("mainContainer")).then(canvas => {
    canvas.toBlob(blob => {
      const url = "https://twitter.com/intent/tweet?text=" + tweetText;
      window.open(url, "_blank");
    });
  });
});
