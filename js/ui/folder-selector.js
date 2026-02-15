import { readFileAsDataURL, loadImage } from '../services/image-service.js';
import { getConfigByAspectRatio } from '../config/ocr-config.js';

/**
 * フォルダ選択とアスペクト比フィルタリング
 */

/**
 * フォルダを選択して適切なアスペクト比の画像をフィルタリング
 * @returns {Promise<Array>} - 適合した画像ファイルと情報の配列
 */
export async function selectFolderAndFilterImages() {
  // フォルダ選択用のinput要素を動的生成
  const input = document.createElement('input');
  input.type = 'file';
  input.webkitdirectory = true;  // フォルダ選択を有効化
  input.multiple = true;
  input.accept = 'image/*';

  // ファイル選択のPromise化
  const files = await new Promise((resolve, reject) => {
    input.onchange = () => {
      if (input.files.length === 0) {
        reject(new Error('画像が選択されませんでした'));
      } else {
        resolve(Array.from(input.files));
      }
    };
    input.oncancel = () => reject(new Error('フォルダ選択がキャンセルされました'));
    input.click();
  });

  // 画像ファイルのみフィルタ
  const imageFiles = files.filter(file => {
    const ext = file.name.toLowerCase();
    return ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg');
  });

  if (imageFiles.length === 0) {
    throw new Error('画像ファイルが見つかりませんでした');
  }

  // 各画像のアスペクト比をチェック
  const filteredImages = [];
  for (const file of imageFiles) {
    try {
      const dataURL = await readFileAsDataURL(file);
      const img = await loadImage(dataURL);
      const config = getConfigByAspectRatio(img.width, img.height);

      if (config) {
        // 適合画像として追加
        filteredImages.push({
          file: file,
          dataURL: dataURL,
          width: img.width,
          height: img.height,
          configName: config.name,
          aspectRatio: (img.height / img.width).toFixed(3),
        });
      }
    } catch (error) {
      console.warn(`画像の読み込みエラー (${file.name}):`, error);
      // エラーがあっても処理を続行
    }
  }

  console.log(`フィルタリング完了: ${filteredImages.length}/${imageFiles.length} 枚が適合`);
  return filteredImages;
}
