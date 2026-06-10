import { useState, useEffect } from 'react';

/**
 * メディアクエリの状態を監視するカスタムフック
 * @param {string} query - CSSメディアクエリ (例: '(min-width: 768px)')
 * @returns {boolean} - メディアクエリに一致するかどうか
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // matchMediaはブラウザAPI
    const mediaQuery = window.matchMedia(query);
    
    // 現在の状態を設定
    setMatches(mediaQuery.matches);
    
    // リスナーを登録（画面サイズ変更時に自動的に更新）
    const updateMatches = (e) => {
      setMatches(e.matches);
    };
    
    // 近代的なブラウザではaddEventListenerを使う
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches);
      return () => {
        mediaQuery.removeEventListener('change', updateMatches);
      };
    } else {
      // 古いブラウザへの対応（IEなど）
      mediaQuery.addListener(updateMatches);
      return () => {
        mediaQuery.removeListener(updateMatches);
      };
    }
  }, [query]);
  
  return matches;
};
