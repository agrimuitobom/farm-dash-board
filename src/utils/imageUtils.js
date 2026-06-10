// firestoreUtils.js に追加するコード - 作物データ取得時に画像URLを修正

/**
 * 画像URLを正規化して、プレースホルダー画像のURL問題を解決する
 * @param {string} url 元の画像URL
 * @param {string} cropName 作物名（代替テキストとして使用）
 * @returns {string} 正規化されたURL
 */
export const normalizeImageUrl = (url, cropName) => {
  // URLが空または無効な場合
  if (!url || url.includes('undefined') || url.includes('null') || url === '') {
    // 作物に基づいて色を選択
    const cropColors = {
      'トマト': 'FF6B6B',
      'キュウリ': '56E39F',
      'ナス': '9F44D3',
      'パプリカ': 'FF9A3C',
      'レタス': '59CE8F',
      'ピーマン': '2CC46B', 
      'キャベツ': '92D13D',
      'ホウレンソウ': '228B22',
      // デフォルト色
      'default': '4CAF50'
    };
    
    // 作物名に基づいて色を取得、なければデフォルト色を使用
    const bgColor = cropColors[cropName] || cropColors['default'];
    
    // 作物名をエンコードしてプレースホルダーテキストとして使用
    const encodedText = encodeURIComponent(cropName || '作物');
    
    return `https://placehold.jp/150/${bgColor}/FFFFFF.png?text=${encodedText}`;
  }
  
  // via.placeholder.com形式のURLを修正
  if (url.includes('via.placeholder.com')) {
    return url.replace('via.placeholder.com', 'placehold.jp');
  }
  
  // 不完全なURLを修正（色コードのみの場合など）
  if (url.match(/^[0-9A-F]{6}\/[0-9A-F]{6}$/i)) {
    const [bgColor, textColor] = url.split('/');
    return `https://placehold.jp/150/${bgColor}/${textColor}.png?text=${encodeURIComponent(cropName || '作物')}`;
  }
  
  // それ以外の場合は元のURLをそのまま返す
  return url;
};

// この関数を作物データ取得時に使用する