import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import HouseDetail from './components/HouseDetail';

// モバイル最適化コンポーネント
import MobileNav from './components/mobile/MobileNav';
import MobileHouseDetail from './components/mobile/MobileHouseDetail';
import { useMediaQuery } from './hooks/useMediaQuery';

// ページをインポート
import Houses from './pages/Houses';
import Crops from './pages/Crops';
import Reports from './pages/Reports';
import Calendar from './pages/Calendar';
import MobileCalendar from './pages/MobileCalendar';
import Alerts from './pages/Alerts';
import AdminSettings from './pages/AdminSettings';
import Staff from './pages/Staff';
import Shifts from './pages/Shifts';
import Tasks from './pages/Tasks';
import Visitors from './pages/Visitors';
import Trainings from './pages/Trainings';

import './App.css';

function AppContent() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  useEffect(() => {
    // プレースホルダー画像のURL修正
    // 画像URLの問題を包括的に対処
    window.addEventListener('error', function(e) {
      // 画像要素のみを処理
      if (e.target.tagName !== 'IMG') return;
      
      const src = e.target.src || '';
      let newSrc = src;
      
      // ケース1: via.placeholder.com → placehold.jp に修正
      if (src.includes('via.placeholder.com')) {
        newSrc = src.replace('via.placeholder.com', 'placehold.jp');
        console.log(`画像URLを修正しました(ケース1): ${src} -> ${newSrc}`);
        e.target.src = newSrc;
        return;
      }
      
      // ケース2: URLスキーマがないプレースホルダー画像の場合
      if (src.match(/^[^:]*via\.placeholder/)) {
        newSrc = 'https://' + src;
        newSrc = newSrc.replace('via.placeholder.com', 'placehold.jp');
        console.log(`画像URLを修正しました(ケース2): ${src} -> ${newSrc}`);
        e.target.src = newSrc;
        return;
      }
      
      // ケース3: FFFFFF などのカラーコードのみの場合
      if (src.match(/\/(FFFFFF|[0-9A-F]{6})$/i)) {
        const match = src.match(/([0-9A-F]{6})\/?(FFFFFF|[0-9A-F]{6})?$/i);
        if (match) {
          const bgColor = match[1] || '56E39F';
          const textColor = match[2] || 'FFFFFF';
          newSrc = `https://placehold.jp/150/${bgColor}/${textColor}.png?text=画像`;
          console.log(`画像URLを修正しました(ケース3): ${src} -> ${newSrc}`);
          e.target.src = newSrc;
          return;
        }
      }
      
      // ケース4: その他の壊れた画像URLの場合、デフォルトプレースホルダーを設定
      if (src && (src.includes('ERR_NAME') || src === '' || src === 'undefined')) {
        const randomColors = ['4CAF50', '2196F3', 'FFC107', 'E91E63', '9C27B0', '795548'];
        const bgColor = randomColors[Math.floor(Math.random() * randomColors.length)];
        newSrc = `https://placehold.jp/150/${bgColor}/FFFFFF.png?text=画像`;
        console.log(`デフォルトプレースホルダーを設定しました: ${newSrc}`);
        e.target.src = newSrc;
        return;
      }
      
    }, true);
    
    // 追加: すべての画像要素を監視して、読み込み前にURLを修正
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            // 追加された要素が画像の場合
            if (node.tagName === 'IMG') {
              checkAndFixImageUrl(node);
            }
            // 追加された要素の子要素に画像がある場合
            const images = node.querySelectorAll ? node.querySelectorAll('img') : [];
            images.forEach(checkAndFixImageUrl);
          }
        });
      });
    });
    
    // 画像URLをチェック・修正する関数
    function checkAndFixImageUrl(imgElement) {
      const src = imgElement.src || imgElement.getAttribute('src') || '';
      
      if (src.includes('via.placeholder.com')) {
        const newSrc = src.replace('via.placeholder.com', 'placehold.jp');
        console.log(`事前修正: ${src} -> ${newSrc}`);
        imgElement.src = newSrc;
      }
    }
    
    // DOM全体を監視開始
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // 既存の画像要素も修正
    document.querySelectorAll('img').forEach(checkAndFixImageUrl);
    
    // モバイル向けスタイルを動的に追加
    const style = document.createElement('style');
    style.textContent = `
      /* モバイル向けスクロールバー非表示 */
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
      
      /* タッチ操作向け最適化 */
      .touch-manipulation {
        touch-action: manipulation;
      }
      
      /* モバイルでパディングを調整 */
      @media (max-width: 767px) {
        .mobile-adjust {
          padding-top: 60px;
          padding-bottom: 72px;
        }
      }
    `;
    document.head.appendChild(style);

    // ビューポートメタタグを確認・追加（モバイル表示のために必要）
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';

    // PWA対応のステータスバーの色を設定（iOS Safari用）
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = '#4CAF50'; // 緑色のテーマカラー

    // iOS用のアドレスバーを隠すための対策
    const appHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', appHeight);
    appHeight();

    return () => window.removeEventListener('resize', appHeight);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* モバイル用ナビゲーションバー（固定ヘッダー＋フッター） */}
      {isMobile && <MobileNav />}
      
      {/* デスクトップ用サイドバー */}
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* デスクトップ用Navbarはモバイルでは非表示 */}
        {!isMobile && <Navbar />}
        
        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 ${isMobile ? 'mobile-adjust' : 'p-4'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* 温室詳細画面 - デスクトップとモバイルで分岐 */}
            <Route path="/house/:id" element={
              isMobile ? <MobileHouseDetail /> : <HouseDetail />
            } />
            
            {/* カレンダー - デスクトップとモバイルで分岐 */}
            <Route path="/calendar" element={
              isMobile ? <MobileCalendar /> : <Calendar />
            } />
            
            {/* ページルート - モバイル対応済み */}
            <Route path="/houses" element={<Houses />} />
            <Route path="/houses/:id" element={isMobile ? <MobileHouseDetail /> : <HouseDetail />} />
            <Route path="/crops" element={<Crops />} />
            <Route path="/alerts" element={<Alerts />} />
            
            {/* まだモバイル最適化されていないページ */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/visitors" element={<Visitors />} />
            <Route path="/trainings" element={<Trainings />} />
            
            {/* キャッチオールルート - 存在しないパスはダッシュボードにリダイレクト */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// App関数をラップしてuseMediaQueryが正しく動作するようにする
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;