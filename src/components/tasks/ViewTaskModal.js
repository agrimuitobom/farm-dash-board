import React from 'react';
import { BellRing, Repeat } from 'lucide-react';

const ViewTaskModal = ({
  isOpen,
  onClose,
  task,
  onEdit,
  onDelete,
  onStatusChange
}) => {
  if (!isOpen || !task) return null;

  // ステータスの表示を取得
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
        return '未着手';
      case 'in-progress':
        return '進行中';
      case 'completed':
        return '完了';
      default:
        return status;
    }
  };
  
  // 優先度の表示を取得
  const getPriorityDisplay = (priority) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return priority;
    }
  };
  
  // ステータスに応じたスタイルクラスを取得
  const getStatusClasses = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 優先度に応じたスタイルクラスを取得
  const getPriorityClasses = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">タスク詳細</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">
          <h4 className="text-xl font-medium mb-2">{task.title}</h4>
          <div className="flex items-center space-x-2 mb-4">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              getStatusClasses(task.status)
            }`}>
              {getStatusDisplay(task.status)}
            </span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              getPriorityClasses(task.priority)
            }`}>
              優先度: {getPriorityDisplay(task.priority)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">期日</p>
              <p className="text-sm font-medium">
                {new Date(task.dueDate).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">担当者</p>
              <p className="text-sm font-medium">{task.assignedTo || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ハウス</p>
              <p className="text-sm font-medium">{task.houseName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">作物</p>
              <p className="text-sm font-medium">{task.cropName || '-'}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">説明</p>
            <p className="text-sm whitespace-pre-wrap border border-gray-200 rounded-md p-3 bg-gray-50">
              {task.description || '説明なし'}
            </p>
          </div>
          
          {/* 繰り返し情報 */}
          {task.repeatType && task.repeatType !== 'none' && (
            <div className="mb-4 bg-blue-50 rounded-md p-3">
              <div className="flex items-center mb-1">
                <Repeat className="w-4 h-4 text-blue-600 mr-2" />
                <p className="text-sm font-medium text-blue-800">繰り返し</p>
              </div>
              <p className="text-sm text-blue-700">
                {task.repeatType === 'daily' && '毎日'}
                {task.repeatType === 'weekly' && '毎週'}
                {task.repeatType === 'monthly' && '毎月'}
                {task.repeatType === 'yearly' && '毎年'}
                {task.repeatEndDate && ` (終了日: ${new Date(task.repeatEndDate).toLocaleDateString('ja-JP')})`}
              </p>
            </div>
          )}
          
          {/* リマインダー情報 */}
          {task.reminderTime && (
            <div className="mb-4 bg-yellow-50 rounded-md p-3">
              <div className="flex items-center mb-1">
                <BellRing className="w-4 h-4 text-yellow-600 mr-2" />
                <p className="text-sm font-medium text-yellow-800">リマインダー</p>
              </div>
              <p className="text-sm text-yellow-700">
                {task.reminderTime <= 60 ? `${task.reminderTime}分前` : 
                 task.reminderTime <= 1440 ? `${Math.floor(task.reminderTime / 60)}時間前` : 
                 `${Math.floor(task.reminderTime / 1440)}日前`}
              </p>
            </div>
          )}
          
          {/* ステータス変更ボタン */}
          <div className="flex flex-wrap gap-2 mt-4 mb-4">
            <p className="text-sm text-gray-600 w-full">ステータス変更:</p>
            {task.status !== 'pending' && (
              <button
                onClick={() => {
                  onStatusChange(task.id, 'pending');
                  onClose();
                }}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                未着手に設定
              </button>
            )}
            {task.status !== 'in-progress' && (
              <button
                onClick={() => {
                  onStatusChange(task.id, 'in-progress');
                  onClose();
                }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
              >
                進行中に設定
              </button>
            )}
            {task.status !== 'completed' && (
              <button
                onClick={() => {
                  onStatusChange(task.id, 'completed');
                  onClose();
                }}
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
              >
                完了に設定
              </button>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              onClose();
              onEdit(task);
            }}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
          >
            編集
          </button>
          <button
            onClick={() => {
              onClose();
              onDelete(task.id);
            }}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
          >
            削除
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTaskModal;