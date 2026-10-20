// src/components/TaskListView.js
import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, User, Filter, Search, ChevronDown, Trash2 } from 'lucide-react';
import { isTaskDone, PRIORITY_LABELS, PRIORITY_ORDER, PRIORITY_CLASSES } from '../utils/tasks';

/**
 * 作業の一覧（tasks は utils/tasks.js の normalizeTask でそろえたもの）
 * チェックを付けた作業は onDeleteTasks でまとめて削除できる
 */
const TaskListView = ({ tasks, onEditTask, onToggleComplete, onDeleteTask, onDeleteTasks }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);

  // ユニークな担当者リストを取得
  const uniqueAssignees = [...new Set(tasks.map(task => task.assignedTo).filter(Boolean))];

  // フィルタリングとソート
  const filteredTasks = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    const filtered = tasks.filter(task => {
      const matchesStatus = filterStatus === 'all'
        || (filterStatus === 'completed' ? isTaskDone(task) : !isTaskDone(task));
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesAssignee = filterAssignee === 'all' || task.assignedTo === filterAssignee;
      const matchesSearch = task.title.toLowerCase().includes(keyword) ||
                           task.description.toLowerCase().includes(keyword);
      
      return matchesStatus && matchesPriority && matchesAssignee && matchesSearch;
    });

    const valueOf = (task) => {
      switch (sortBy) {
        case 'dueDate':
          return task.dueDate ? task.dueDate.getTime() : Infinity;
        case 'priority':
          return PRIORITY_ORDER[task.priority] || 0;
        case 'title':
          return task.title.toLowerCase();
        case 'assignedTo':
          return task.assignedTo.toLowerCase();
        default:
          return 0;
      }
    };
    return filtered.sort((a, b) => {
      const aValue = valueOf(a);
      const bValue = valueOf(b);
      if (aValue === bValue) return 0;
      const ascending = aValue > bValue ? 1 : -1;
      return sortOrder === 'asc' ? ascending : -ascending;
    });
  }, [tasks, filterStatus, filterPriority, filterAssignee, searchTerm, sortBy, sortOrder]);

  // 選択（表示中の作業だけを対象にする）
  const visibleIds = filteredTasks.map(task => task.id);
  const selectedVisibleIds = visibleIds.filter(id => selectedIds.includes(id));
  const allSelected = visibleIds.length > 0 && selectedVisibleIds.length === visibleIds.length;
  const toggleSelect = (id) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const toggleSelectAll = (checked) => {
    setSelectedIds(prev => (checked
      ? [...new Set([...prev, ...visibleIds])]
      : prev.filter(id => !visibleIds.includes(id))));
  };
  const handleDeleteSelected = async () => {
    if (onDeleteTasks && await onDeleteTasks(selectedVisibleIds)) {
      setSelectedIds(prev => prev.filter(id => !selectedVisibleIds.includes(id)));
    }
  };

  // 日付を表示用の文字列に変換する関数
  const formatDate = (date) => (date instanceof Date ? date.toLocaleDateString('ja-JP') : '期限なし');
  const getDueDateColor = (dueDate) => {
    if (!dueDate) return 'text-gray-600';
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600 font-bold'; // 期限過ぎ
    if (diffDays === 0) return 'text-red-500 font-semibold'; // 今日
    if (diffDays <= 3) return 'text-orange-500'; // 3日以内
    if (diffDays <= 7) return 'text-yellow-600'; // 1週間以内
    return 'text-gray-600'; // それ以外
  };

  // 期限のラベル
  const getDueDateLabel = (dueDate) => {
    if (!dueDate) return '';
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)}日遅れ`;
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '明日';
    return `${diffDays}日後`;
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterAssignee('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* 検索とフィルター */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* 検索バー */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="作業を検索..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* フィルターボタン */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              フィルター
              <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* ソート */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="dueDate-asc">期限日（昇順）</option>
              <option value="dueDate-desc">期限日（降順）</option>
              <option value="priority-desc">優先度（高→低）</option>
              <option value="priority-asc">優先度（低→高）</option>
              <option value="title-asc">タイトル（昇順）</option>
              <option value="assignedTo-asc">担当者（昇順）</option>
            </select>
          </div>
        </div>

        {/* 展開可能なフィルター */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ステータスフィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">すべて</option>
                  <option value="pending">未完了</option>
                  <option value="completed">完了</option>
                </select>
              </div>

              {/* 優先度フィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">優先度</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">すべて</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>

              {/* 担当者フィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">担当者</label>
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">すべて</option>
                  {uniqueAssignees.map(assignee => (
                    <option key={assignee} value={assignee}>{assignee}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                フィルターをクリア
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">総作業数</div>
          <div className="text-2xl font-bold text-gray-900">{filteredTasks.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">未完了</div>
          <div className="text-2xl font-bold text-orange-600">
            {filteredTasks.filter(task => !isTaskDone(task)).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">完了済み</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredTasks.filter(task => isTaskDone(task)).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">期限今日まで</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredTasks.filter(task => task.dueDate && task.dueDate <= new Date() && !isTaskDone(task)).length}
          </div>
        </div>
      </div>

      {/* タスクリスト */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* まとめて選択・削除 */}
        <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
          <label className="flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => toggleSelectAll(e.target.checked)}
              className="h-4 w-4 mr-2"
            />
            表示中の作業をすべて選択
          </label>
          {selectedVisibleIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              選択した {selectedVisibleIds.length} 件を削除
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-200">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 transition-colors ${selectedIds.includes(task.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(task.id)}
                    onChange={() => toggleSelect(task.id)}
                    aria-label={`${task.title}を選択`}
                    className="h-4 w-4 mr-4 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className={`text-lg font-medium ${isTaskDone(task) ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${PRIORITY_CLASSES[task.priority] || PRIORITY_CLASSES.medium}`}
                      >
                        {PRIORITY_LABELS[task.priority] || '中'}優先
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isTaskDone(task) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {isTaskDone(task) ? '完了' : '未完了'}
                      </span>
                    </div>
                    
                    {task.description && <p className="text-gray-600 mt-1">{task.description}</p>}
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      {task.assignedTo && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {task.assignedTo}
                        </div>
                      )}
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span className={isTaskDone(task) ? 'text-gray-500' : getDueDateColor(task.dueDate)}>
                          {formatDate(task.dueDate)}
                          {!isTaskDone(task) && task.dueDate && ` (${getDueDateLabel(task.dueDate)})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onEditTask && onEditTask(task)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => onToggleComplete && onToggleComplete(task)}
                      className={`px-3 py-1 text-sm rounded ${isTaskDone(task) ? 'border border-gray-300 hover:bg-gray-50' : 'bg-green-500 text-white hover:bg-green-600'}`}
                    >
                      {isTaskDone(task) ? '未完了に戻す' : '完了'}
                    </button>
                    <button
                      onClick={() => onDeleteTask && onDeleteTask(task)}
                      className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              条件に一致する作業が見つかりません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskListView;