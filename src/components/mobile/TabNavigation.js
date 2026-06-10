import React from 'react';

/**
 * モバイル向けのタブナビゲーションコンポーネント
 * スワイプ可能なタブインターフェースを提供
 */
const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex border-b border-gray-200 w-max min-w-full">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`py-3 px-6 text-sm font-medium whitespace-nowrap touch-manipulation ${
              activeTab === index
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => onTabChange(index)}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;