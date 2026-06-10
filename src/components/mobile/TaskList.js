import React from 'react';
import { Edit, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

/**
 * タッチ操作に最適化したタスクリストコンポーネント
 * スワイプアクションとタッチフレンドリーなUIを提供
 */
const TaskList = ({ tasks, onEdit, onComplete }) => {
  // 優先度に基づく色とスタイルを取得
  const getPriorityStyle = (priority) => {
    if (priority === '高' || priority === 'high') {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />
      };
    } else if (priority === '中' || priority === 'medium') {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        icon: <Clock className="w-4 h-4 text-yellow-500" />
      };
    } else {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: <CheckCircle className="w-4 h-4 text-green-500" />
      };
    }
  };

  // 日付をフォーマット
  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">予定されている作業はありません</p>
        </div>
      ) : (
        <>
          {tasks.map((task) => {
            const priorityStyle = getPriorityStyle(task.priority);
            
            return (
              <div 
                key={task.id} 
                className={`bg-white rounded-lg shadow-sm border-l-4 ${priorityStyle.border} overflow-hidden touch-manipulation`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium truncate pr-2">{task.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${priorityStyle.bg} ${priorityStyle.text}`}>
                      {priorityStyle.icon}
                      <span className="ml-1">{task.priority}</span>
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap text-xs text-gray-500 mb-2 space-x-4">
                    {task.dueDate && (
                      <span>期日: {formatDate(task.dueDate)}</span>
                    )}
                    {task.assignedTo && (
                      <span>担当: {task.assignedTo}</span>
                    )}
                  </div>
                  
                  {/* タッチフレンドリーなアクションボタン */}
                  <div className="flex justify-end space-x-2 mt-2">
                    <button 
                      onClick={() => onEdit(task)}
                      className="p-3 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                      aria-label="編集"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onComplete(task)}
                      className="p-3 rounded-full bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300"
                      aria-label="完了"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default TaskList;