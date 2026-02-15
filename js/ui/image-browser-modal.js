import { extractCardsFromNeuronImage, readFileAsDataURL } from '../services/image-service.js';
import { addCardsToPool } from '../components/card-manager.js';

/**
 * 画像ブラウザモーダル
 * フィルタリングされた画像を表示し、処理やリネーム保存を行う
 */
export class ImageBrowserModal {
  constructor(filteredImages) {
    this.filteredImages = filteredImages;
    this.modalElement = null;
  }

  /**
   * モーダルを表示
   */
  show() {
    // モーダルコンテナを取得または作成
    this.modalElement = document.getElementById('imageBrowserModal');

    if (!this.modalElement) {
      this.modalElement = document.createElement('div');
      this.modalElement.id = 'imageBrowserModal';
      this.modalElement.className = 'modal-overlay';
      document.body.appendChild(this.modalElement);
    }

    // モーダルのHTML構造を作成
    this.modalElement.innerHTML = this.createModalHTML();
    this.modalElement.style.display = 'flex';

    // イベントリスナーを設定
    this.setupEventListeners();
  }

  /**
   * モーダルを非表示
   */
  hide() {
    if (this.modalElement) {
      this.modalElement.style.display = 'none';
    }
  }

  /**
   * モーダルのHTML構造を作成
   * @returns {string} - HTML文字列
   */
  createModalHTML() {
    return `
      <div class="modal-container">
        <div class="modal-header">
          <h2>適切な画像を選択 (${this.filteredImages.length}件)</h2>
          <button class="modal-close" aria-label="閉じる">&times;</button>
        </div>
        <div class="modal-body">
          ${this.renderGrid()}
        </div>
        <div class="modal-footer">
          <button class="modal-close-button">閉じる</button>
        </div>
      </div>
    `;
  }

  /**
   * 画像グリッドのHTMLを生成
   * @returns {string} - グリッドHTML
   */
  renderGrid() {
    const cards = this.filteredImages.map((imageData, index) => `
      <div class="image-card" data-index="${index}">
        <img class="image-thumbnail" src="${imageData.dataURL}" alt="${imageData.file.name}" />
        <div class="image-info">
          <div class="image-filename">${imageData.file.name}</div>
          <div class="image-aspect">${imageData.configName} (${imageData.aspectRatio})</div>
        </div>
        <div class="image-card-buttons">
          <button class="process-button" data-index="${index}">処理する</button>
          <button class="rename-button" data-index="${index}">リネーム&保存</button>
        </div>
      </div>
    `).join('');

    return `<div class="image-grid">${cards}</div>`;
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // 閉じるボタン（×）
    const closeButtons = this.modalElement.querySelectorAll('.modal-close, .modal-close-button');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.hide());
    });

    // オーバーレイクリックで閉じる
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.hide();
      }
    });

    // ESCキーで閉じる
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // 処理するボタン
    const processButtons = this.modalElement.querySelectorAll('.process-button');
    processButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.handleImageSelect(index);
      });
    });

    // リネーム&保存ボタン
    const renameButtons = this.modalElement.querySelectorAll('.rename-button');
    renameButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.handleRenameAndSave(index);
      });
    });
  }

  /**
   * 画像を処理してカードを抽出
   * @param {number} index - 画像のインデックス
   */
  async handleImageSelect(index) {
    const imageData = this.filteredImages[index];

    try {
      // カード抽出処理を実行
      const { mainDeck, exDeck } = await extractCardsFromNeuronImage(imageData.file);

      // デッキに追加
      addCardsToPool(mainDeck, false);
      addCardsToPool(exDeck, true);

      // 成功メッセージ
      alert(`カードを抽出しました\nメイン: ${mainDeck.length}枚, EX: ${exDeck.length}枚`);

      // モーダルを閉じる
      this.hide();
    } catch (error) {
      alert(`カード抽出エラー: ${error.message}`);
      console.error('カード抽出エラー:', error);
    }
  }

  /**
   * 画像をリネームして保存
   * @param {number} index - 画像のインデックス
   */
  async handleRenameAndSave(index) {
    const imageData = this.filteredImages[index];

    // ファイル名を入力
    const newName = prompt('新しいファイル名を入力してください:', imageData.file.name);

    if (!newName || newName.trim() === '') {
      return; // キャンセルまたは空文字
    }

    try {
      // Data URLを取得（既に読み込み済み）
      const dataURL = imageData.dataURL;

      // ダウンロード用のリンクを作成
      const link = document.createElement('a');
      link.href = dataURL;

      // 拡張子を確保
      const hasExtension = newName.toLowerCase().endsWith('.png') ||
                          newName.toLowerCase().endsWith('.jpg') ||
                          newName.toLowerCase().endsWith('.jpeg');
      link.download = hasExtension ? newName : `${newName}.png`;

      // ダウンロード実行
      link.click();

      console.log(`画像を保存しました: ${link.download}`);
    } catch (error) {
      alert(`保存エラー: ${error.message}`);
      console.error('保存エラー:', error);
    }
  }
}
