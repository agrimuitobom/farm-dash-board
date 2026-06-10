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
  HelpCircle,
  LogOut,
  Clock,
  Clipboard,
  BookOpen
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
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

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div 
      className={`bg-green-800 text-white transition-all duration-300 flex flex-col h-full ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h2 className="text-xl font-bold">西農圃場データ</h2>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-green-700"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <div className="mt-6">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center py-3 px-4 ${
                isActive 
                  ? 'bg-green-700 border-l-4 border-white' 
                  : 'hover:bg-green-700'
              }`}
            >
              <Icon className={`h-6 w-6 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
              {!collapsed && <span>{item.text}</span>}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pb-4">
        <div className="p-4">
          <Link
            to="/logout"
            className="flex items-center py-3 px-4 hover:bg-green-700 rounded-lg"
          >
            <LogOut className={`h-6 w-6 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
            {!collapsed && <span>ログアウト</span>}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;