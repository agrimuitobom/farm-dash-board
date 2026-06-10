import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart2, 
  Calendar, 
  Settings, 
  List, 
  AlertTriangle,
  Thermometer,
  Users,
  Clock,
  X,
  Menu,
  LogOut,
  Clipboard,
  BookOpen
} from 'lucide-react';

/**
 * モバイルデバイス用のナビゲーションコンポーネント
 * ハンバーガーメニューとスライドインサイドバーを提供
 */
const MobileNav = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // メニュー項目の定義
  const menuItems = [
    { icon: Home, text: 'ダッシュボード', path: '/' },
    { icon: Thermometer, text: '温室ハウス一覧', path: '/houses' },
    { icon: List, text: '作物管理', path: '/crops' },
    { icon: BarChart2, text: '統計・レポート', path: '/reports' },
    { icon: Calendar, text: '作業カレンダー', path: '/calendar' },
    { icon: AlertTriangle, text: 'アラート設定', path: '/alerts' },
    { icon: Users, text: 'スタッフ管理', path: '/staff' },
    { icon: Clock, text: 'シフト管理', path: '/shifts' },
    { icon: Clipboard, text: '訪問者記録', path: '/visitors' },
    { icon: BookOpen, text: '教育・訓練記録', path: '/trainings' },
    { icon: Settings, text: '設定', path: '/settings' },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* ハンバーガーメニューボタン - モバイル表示時のみ表示 */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        onClick={toggleMenu}
        aria-label="メニュー"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {/* オーバーレイ - メニュー開放時のみ表示 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}
      
      {/* サイドナビゲーション */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-800 text-white transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ヘッダー */}
        <div className="p-4 flex items-center justify-between border-b border-green-700">
          <h2 className="text-xl font-bold">西農圃場データ</h2>
          <button 
            onClick={closeMenu}
            className="p-2 rounded-full hover:bg-green-700"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* メニュー項目 */}
        <nav className="mt-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center py-4 px-6 ${
                  isActive 
                    ? 'bg-green-700 border-l-4 border-white' 
                    : 'hover:bg-green-700'
                }`}
                onClick={closeMenu}
              >
                <Icon className="h-6 w-6 mr-3" />
                <span>{item.text}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* フッター */}
        <div className="mt-auto border-t border-green-700 p-4">
          <Link
            to="/logout"
            className="flex items-center py-3 px-4 hover:bg-green-700 rounded-lg"
            onClick={closeMenu}
          >
            <LogOut className="h-6 w-6 mr-3" />
            <span>ログアウト</span>
          </Link>
        </div>
      </div>
      
      {/* ボトムナビゲーション - モバイル表示時のみ表示 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-30">
        <div className="grid grid-cols-5 h-16">
          <Link 
            to="/" 
            className={`flex flex-col items-center justify-center ${
              location.pathname === '/' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">ホーム</span>
          </Link>
          
          <Link 
            to="/houses" 
            className={`flex flex-col items-center justify-center ${
              location.pathname === '/houses' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <Thermometer size={20} />
            <span className="text-xs mt-1">温室</span>
          </Link>
          
          <Link 
            to="/calendar" 
            className={`flex flex-col items-center justify-center ${
              location.pathname === '/calendar' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <Calendar size={20} />
            <span className="text-xs mt-1">カレンダー</span>
          </Link>
          
          <Link 
            to="/crops" 
            className={`flex flex-col items-center justify-center ${
              location.pathname === '/crops' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <List size={20} />
            <span className="text-xs mt-1">作物</span>
          </Link>
          
          <Link 
            to="/alerts" 
            className={`flex flex-col items-center justify-center ${
              location.pathname === '/alerts' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <AlertTriangle size={20} />
            <span className="text-xs mt-1">アラート</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default MobileNav;