import React from 'react';

/**
 * タブコンテナコンポーネント
 * 複数のタブを管理し、アクティブなタブを表示する
 */
export const Tabs = ({ children, activeTab, onChange }) => {
  // アクティブタブのコンテンツだけをフィルタリング
  const activeContent = React.Children.toArray(children).find(
    (child) => child.props.id === activeTab
  );

  return (
    <div className="tabs-container">
      <div className="tabs tabs-boxed mb-4">
        {React.Children.map(children, (child) => {
          // 各タブのヘッダー部分を生成
          const { id, label } = child.props;
          return (
            <a
              className={`tab ${activeTab === id ? 'tab-active' : ''}`}
              onClick={() => onChange && onChange(id)}
            >
              {label}
            </a>
          );
        })}
      </div>
      <div className="tab-content">
        {activeContent}
      </div>
    </div>
  );
};

/**
 * タブパネルコンポーネント
 * 個々のタブのコンテンツを表現する
 */
export const Tab = ({ children, id }) => {
  return <div id={id}>{children}</div>;
};
