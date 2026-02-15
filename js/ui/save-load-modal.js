import { saveGameState, loadGameState, getSaveSlots, clearSaveSlot, updateSlotName } from '../services/save-load-service.js';

/**
 * セーブ/ロードスロット選択モーダル
 */
export class SaveLoadModal {
  constructor(mode) {
    this.mode = mode; // 'save' または 'load'
    this.modalElement = null;
  }

  /**
   * モーダルを表示
   */
  show() {
    // モーダルコンテナを取得または作成
    this.modalElement = document.getElementById('saveLoadModal');

    if (!this.modalElement) {
      this.modalElement = document.createElement('div');
      this.modalElement.id = 'saveLoadModal';
      this.modalElement.className = 'modal-overlay slot-selection-modal';
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
    const title = this.mode === 'save' ? 'セーブスロット選択' : 'ロードスロット選択';
    const slots = getSaveSlots();

    return `
      <div class="modal-container">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close" aria-label="閉じる">&times;</button>
        </div>
        <div class="modal-body">
          ${this.renderSlotList(slots)}
        </div>
        <div class="modal-footer">
          <button class="modal-close-button">キャンセル</button>
        </div>
      </div>
    `;
  }

  /**
   * スロットリストのHTMLを生成
   * @param {Array} slots - スロット情報の配列
   * @returns {string} - スロットリストHTML
   */
  renderSlotList(slots) {
    const slotItems = slots.map(slot => {
      const isEmpty = !slot.exists;
      const statusText = isEmpty ? '空き' : '保存済み';
      const dateText = isEmpty ? 'データなし' : slot.dateString;
      const slotName = slot.slotName || `スロット ${slot.number}`;

      if (this.mode === 'save') {
        // セーブモード: すべてのスロットが選択可能
        return `
          <div class="slot-item ${isEmpty ? 'empty' : ''}" data-slot="${slot.number}">
            <div class="slot-header">
              <div class="slot-title-container">
                <span class="slot-number">${slotName}</span>
                ${!isEmpty ? `<button class="rename-button" data-slot="${slot.number}" title="名前を変更">✏️</button>` : ''}
              </div>
              <span class="slot-status">${statusText}</span>
            </div>
            <div class="slot-date">${dateText}</div>
            <div class="slot-actions">
              <button class="save-button" data-slot="${slot.number}">
                ${isEmpty ? 'セーブ' : '上書きセーブ'}
              </button>
              ${!isEmpty ? `<button class="delete-button" data-slot="${slot.number}">削除</button>` : ''}
            </div>
          </div>
        `;
      } else {
        // ロードモード: 保存済みのスロットのみ選択可能
        if (isEmpty) {
          return `
            <div class="slot-item empty" data-slot="${slot.number}">
              <div class="slot-header">
                <div class="slot-title-container">
                  <span class="slot-number">${slotName}</span>
                </div>
                <span class="slot-status">${statusText}</span>
              </div>
              <div class="slot-date">${dateText}</div>
            </div>
          `;
        } else {
          return `
            <div class="slot-item" data-slot="${slot.number}">
              <div class="slot-header">
                <div class="slot-title-container">
                  <span class="slot-number">${slotName}</span>
                  <button class="rename-button" data-slot="${slot.number}" title="名前を変更">✏️</button>
                </div>
                <span class="slot-status">${statusText}</span>
              </div>
              <div class="slot-date">${dateText}</div>
              <div class="slot-actions">
                <button class="load-button" data-slot="${slot.number}">ロード</button>
                <button class="delete-button" data-slot="${slot.number}">削除</button>
              </div>
            </div>
          `;
        }
      }
    }).join('');

    return `<div class="slot-list">${slotItems}</div>`;
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

    // セーブボタン
    const saveButtons = this.modalElement.querySelectorAll('.save-button');
    saveButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slotNumber = parseInt(e.target.dataset.slot);
        this.handleSave(slotNumber);
      });
    });

    // ロードボタン
    const loadButtons = this.modalElement.querySelectorAll('.load-button');
    loadButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slotNumber = parseInt(e.target.dataset.slot);
        this.handleLoad(slotNumber);
      });
    });

    // 削除ボタン
    const deleteButtons = this.modalElement.querySelectorAll('.delete-button');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // 親のクリックイベントを防ぐ
        const slotNumber = parseInt(e.target.dataset.slot);
        this.handleDelete(slotNumber);
      });
    });

    // リネームボタン
    const renameButtons = this.modalElement.querySelectorAll('.rename-button');
    renameButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // 親のクリックイベントを防ぐ
        const slotNumber = parseInt(e.target.dataset.slot);
        this.handleRename(slotNumber);
      });
    });
  }

  /**
   * セーブ処理
   * @param {number} slotNumber - スロット番号
   */
  handleSave(slotNumber) {
    // スロット名を入力
    const slotName = prompt('セーブデータに名前を付けてください:', `セーブ ${slotNumber}`);

    if (slotName === null) {
      return; // キャンセル
    }

    try {
      const success = saveGameState(slotNumber, slotName.trim());
      if (success) {
        alert(`「${slotName.trim() || `スロット ${slotNumber}`}」にセーブしました`);
        this.hide();
      } else {
        alert('セーブに失敗しました');
      }
    } catch (error) {
      alert(`セーブエラー: ${error.message}`);
      console.error('セーブエラー:', error);
    }
  }

  /**
   * ロード処理
   * @param {number} slotNumber - スロット番号
   */
  handleLoad(slotNumber) {
    if (!confirm(`スロット${slotNumber}のデータをロードしますか？\n現在の盤面は失われます。`)) {
      return;
    }

    try {
      loadGameState(slotNumber);
      alert(`スロット${slotNumber}からロードしました`);
      this.hide();
    } catch (error) {
      alert(`ロードエラー: ${error.message}`);
      console.error('ロードエラー:', error);
    }
  }

  /**
   * 削除処理
   * @param {number} slotNumber - スロット番号
   */
  handleDelete(slotNumber) {
    if (!confirm(`スロット${slotNumber}のデータを削除しますか？\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      clearSaveSlot(slotNumber);
      alert(`スロット${slotNumber}を削除しました`);
      // モーダルを再描画
      this.show();
    } catch (error) {
      alert(`削除エラー: ${error.message}`);
      console.error('削除エラー:', error);
    }
  }

  /**
   * リネーム処理
   * @param {number} slotNumber - スロット番号
   */
  handleRename(slotNumber) {
    const slots = getSaveSlots();
    const slot = slots.find(s => s.number === slotNumber);
    const currentName = slot ? slot.slotName : `スロット ${slotNumber}`;

    const newName = prompt('新しい名前を入力してください:', currentName);

    if (newName === null || newName.trim() === '') {
      return; // キャンセルまたは空文字
    }

    try {
      updateSlotName(slotNumber, newName.trim());
      alert(`名前を「${newName.trim()}」に変更しました`);
      // モーダルを再描画
      this.show();
    } catch (error) {
      alert(`名前変更エラー: ${error.message}`);
      console.error('名前変更エラー:', error);
    }
  }
}
