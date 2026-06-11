import React from 'react';
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