import React from 'react';

/**
 * selectedIds / onToggleSelect / onToggleSelectAll を渡すと、行の先頭にチェックボックスを表示する
 */
const TasksTable = ({ tasks, onView, onEdit, onDelete, onStatusChange, selectedIds, onToggleSelect, onToggleSelectAll }) => {
  const selectable = Boolean(selectedIds && onToggleSelect);
  const allSelected = selectable && tasks.length > 0 && tasks.every(task => selectedIds.includes(task.id));

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
    <>
      {/* スマホ: 横に長い表の代わりに、1件ずつカードで表示する */}
      <div className="md:hidden space-y-3">
        {selectable && tasks.length > 0 && (
          <label className="flex items-center px-1 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onToggleSelectAll(e.target.checked)}
              className="h-5 w-5 mr-2"
            />
            表示中のタスクをすべて選択
          </label>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`rounded-lg shadow p-4 ${selectable && selectedIds.includes(task.id) ? 'bg-blue-50' : 'bg-white'}`}
          >
            <div className="flex items-start">
              {selectable && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(task.id)}
                  onChange={() => onToggleSelect(task.id)}
                  aria-label={`${task.title}を選択`}
                  className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0"
                />
              )}
              <button
                onClick={() => onView(task)}
                className="flex-1 min-w-0 text-left text-base font-medium text-gray-900 break-words"
              >
                {task.title}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className={`px-2 leading-5 font-semibold rounded-full ${getStatusClasses(task.status)}`}>
                {getStatusDisplay(task.status)}
              </span>
              <span className={`px-2 leading-5 font-semibold rounded-full ${getPriorityClasses(task.priority)}`}>
                優先度 {getPriorityDisplay(task.priority)}
              </span>
              <span className="text-sm text-gray-600">期日 {new Date(task.dueDate).toLocaleDateString('ja-JP')}</span>
            </div>
            {(task.houseName || task.cropName || task.assignedTo) && (
              <p className="mt-2 text-sm text-gray-500 break-words">
                {[task.houseName, task.cropName, task.assignedTo && `担当: ${task.assignedTo}`].filter(Boolean).join(' ・ ')}
              </p>
            )}
            <div className="mt-3 flex border-t border-gray-100 pt-2 -mb-1">
              <button onClick={() => onView(task)} className="flex-1 py-2 text-sm font-medium text-gray-700">詳細</button>
              <button onClick={() => onEdit(task)} className="flex-1 py-2 text-sm font-medium text-blue-600">編集</button>
              <button onClick={() => onDelete(task.id)} className="flex-1 py-2 text-sm font-medium text-red-600">削除</button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="bg-white rounded-lg shadow px-4 py-6 text-center text-sm text-gray-500">表示するタスクがありません</p>
        )}
      </div>

    <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th scope="col" className="pl-6 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  aria-label="表示中のタスクをすべて選択"
                  className="h-4 w-4"
                />
              </th>
            )}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              タスク名
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状態
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              優先度
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              期日
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ハウス
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              作物
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              担当者
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id} className={`hover:bg-gray-50 ${selectable && selectedIds.includes(task.id) ? 'bg-blue-50' : ''}`}>
              {selectable && (
                <td className="pl-6 py-4 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(task.id)}
                    onChange={() => onToggleSelect(task.id)}
                    aria-label={`${task.title}を選択`}
                    className="h-4 w-4"
                  />
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap">
                <button 
                  onClick={() => onView(task)}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  {task.title}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  getStatusClasses(task.status)
                }`}>
                  {getStatusDisplay(task.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  getPriorityClasses(task.priority)
                }`}>
                  {getPriorityDisplay(task.priority)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(task.dueDate).toLocaleDateString('ja-JP')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {task.houseName || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {task.cropName || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {task.assignedTo || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(task)}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  編集
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
          
          {tasks.length === 0 && (
            <tr>
              <td colSpan={selectable ? 9 : 8} className="px-6 py-4 text-center text-sm text-gray-500">
                表示するタスクがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </>
  );
};

export default TasksTable;