import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Calendar, Thermometer, List } from 'lucide-react';

/**
 * モバイル向けのフローティングアクションボタン
 * 複数のアクションをスピードダイアル形式で提供
 */
const FloatingActionButton = ({ actions, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef(null);

  // FAB以外の場所をクリックしたときに閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabRef.current && !fabRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFAB = () => {
    setIsOpen(!isOpen);
  };

  const handleActionClick = (action) => {
    setIsOpen(false);
    onAction(action);
  };

  // デフォルトのアクション一覧
  const defaultActions = [
    { id: 'add-task', label: '作業を追加', icon: <Calendar size={20} /> },
    { id: 'add-house', label: 'ハウスを追加', icon: <Thermometer size={20} /> },
    { id: 'add-crop', label: '作物を追加', icon: <List size={20} /> }
  ];

  // 表示するアクション一覧
  const displayActions = actions || defaultActions;

  return (
    <div 
      ref={fabRef}
      className={`fixed right-4 bottom-20 lg:bottom-4 z-40 flex flex-col-reverse items-end`}
    >
      {/* アクションボタン一覧 - オープン時のみ表示 */}
      {isOpen && (
        <div className="mb-2 space-y-2">
          {displayActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className="flex items-center bg-white text-gray-800 px-3 py-2 rounded-full shadow-lg transform transition-transform hover:scale-105 active:scale-95 touch-manipulation"
            >
              <div className="bg-gray-100 p-2 rounded-full mr-2">
                {action.icon}
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* メインボタン */}
      <button
        onClick={toggleFAB}
        className={`p-4 rounded-full shadow-lg transform transition-transform hover:scale-105 active:scale-95 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-green-500 hover:bg-green-600'
        } text-white touch-manipulation`}
        aria-label={isOpen ? '閉じる' : '追加メニュー'}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
};

export default FloatingActionButton;