// カウンターの初期化関数
export function initializeCounter(container) {
  const upButton = container.querySelector(".triangle-button.up");
  const downButton = container.querySelector(".triangle-button.down");
  const textbox = container.querySelector(".counter-textbox");

  // ▲ボタンのクリックイベント
  upButton.addEventListener("click", () => {
    let value = parseInt(textbox.value, 10);
    textbox.value = value + 1;
  });

  // ▼ボタンのクリックイベント
  downButton.addEventListener("click", () => {
    let value = parseInt(textbox.value, 10);
    if (value > 0) {
      textbox.value = value - 1;
    } else {
      container.remove(); // カウンターが負になったら削除
    }
  });  
}