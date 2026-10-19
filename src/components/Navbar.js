import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, X, AlertTriangle, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import WeatherWidget from './WeatherWidget';
import { subscribeToUnresolvedAlerts } from '../firestoreUtils';
import { normalizeAlert } from '../utils/alerts';

const Navbar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  // weatherDataとloading状態はWeatherWidgetコンポーネントに移動
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const { currentUser, logout } = useAuth();

  // 未解決のアラートを通知として表示（リアルタイム）
  const [notifications, setNotifications] = useState([]);
  useEffect(() => subscribeToUnresolvedAlerts(
    (alerts) => setNotifications(alerts.map(normalizeAlert))
  ), []);

  useEffect(() => {
    // 現在時刻の更新
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 以前の気象データのフェッチは削除（WeatherWidgetコンポーネントに移動）

    return () => clearInterval(timer);
  }, []);

  // 通知ポップアップの表示・非表示を切り替える
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // 通知ポップアップとユーザーメニュー以外の場所をクリックしたときに閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (date) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return date.toLocaleDateString('ja-JP', options);
  };

  return (
    <nav className="bg-white shadow-sm px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center min-w-0">
          <h1 className="text-xl font-bold text-gray-800 mr-4 whitespace-nowrap">西農圃場データ</h1>
          <div className="relative hidden md:block">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="検索..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-40 2xl:w-56"
            />
          </div>
        </div>

        <div className="flex items-center flex-shrink-0">
          {/* 現在の日時 - lgサイズ以上で表示 */}
          <div className="mr-4 text-gray-600 text-sm hidden lg:block">
            {formatDate(currentTime)}
          </div>

          {/* 西条市の天気 - 幅に余裕のある xl サイズ以上で表示（狭い画面では他の項目と重なるため） */}
          <div className="mr-4 hidden xl:block">
            <WeatherWidget compact />
          </div>
          
          {/* 通知アイコン */}
          <div className="relative">
            <button
              className="p-2 rounded-full hover:bg-gray-100 relative mr-2"
              onClick={toggleNotifications}
            >
              <Bell className="h-6 w-6 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 min-w-[1rem] h-4 px-1 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {notifications.length > 99 ? '99+' : notifications.length}
                </span>
              )}
            </button>

            {/* 通知ポップアップ */}
            {showNotifications && (
              <div
                ref={notificationsRef}
                className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700">通知</h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                
                {notifications.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.slice(0, 10).map((notification) => (
                      <Link 
                        key={notification.id}
                        to={`/alerts?id=${notification.id}`}
                        className="block p-3 border-b hover:bg-gray-50 transition-colors"
                        onClick={() => setShowNotifications(false)}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <AlertTriangle className={`h-5 w-5 ${notification.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.timestamp instanceof Date ? notification.timestamp.toLocaleString('ja-JP') : ''}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p>未解決のアラートはありません</p>
                  </div>
                )}
                
                <div className="p-2 border-t bg-gray-50">
                  <Link 
                    to="/alerts"
                    className="block w-full py-2 text-center text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setShowNotifications(false)}
                  >
                    すべての通知を見る
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* ユーザーメニュー */}
          <div className="relative">
            <button 
              className="p-2 rounded-full hover:bg-gray-100 flex items-center space-x-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <User className="h-6 w-6 text-gray-600" />
              {currentUser?.displayName && (
                <span className="hidden sm:inline text-sm text-gray-700">
                  {currentUser.displayName}
                </span>
              )}
            </button>
            
            {/* ユーザーメニューポップアップ */}
            {showUserMenu && (
              <div
                ref={userMenuRef}
                className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser?.displayName || 'ユーザー'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {currentUser?.email}
                  </p>
                </div>
                
                <button
                  onClick={async () => {
                    try {
                      await logout();
                      toast.success('ログアウトしました');
                      setShowUserMenu(false);
                    } catch (error) {
                      console.error('ログアウトエラー:', error);
                      toast.error('ログアウトに失敗しました');
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>ログアウト</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;