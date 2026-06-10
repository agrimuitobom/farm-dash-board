// src/components/TaskListView.js
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, User, Clock, AlertTriangle, Filter, Search, ChevronDown } from 'lucide-react';

const TaskListView = ({ tasks, onEditTask, onCompleteTask }) => {
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);

  // ダミーデータ（実際のデータがない場合）
  const dummyTasks = [
    { id: 1, title: '温室ハウス2の水やり', priority: '高', assignedTo: '山田', dueDate: '2025-06-01', status: 'pending', description: '朝と夕方の2回実施' },
    { id: 2, title: 'トマトの収穫', priority: '中', assignedTo: '佐藤', dueDate: '2025-06-02', status: 'pending', description: '赤く熟したものを収穫' },
    { id: 3, title: '温室ハウス4の追肥', priority: '中', assignedTo: '鈴木', dueDate: '2025-06-03', status: 'completed', description: '液肥を1000倍希釈で散布' },
    { id: 4, title: '温室ハウス1の害虫防除', priority: '高', assignedTo: '山田', dueDate: '2025-06-04', status: 'pending', description: 'アブラムシの防除' },
    { id: 5, title: '温室ハウス3の誘引作業', priority: '低', assignedTo: '田中', dueDate: '2025-06-05', status: 'pending', description: 'キュウリの蔓の誘引' },
    { id: 6, title: 'レタスの定植', priority: '中', assignedTo: '佐藤', dueDate: '2025-06-10', status: 'pending', description: '苗150本の定植' },
    { id: 7, title: 'ナスの剪定', priority: '低', assignedTo: '鈴木', dueDate: '2025-06-15', status: 'pending', description: '側枝の整理' },
    { id: 8, title: 'キュウリの害虫防除', priority: '高', assignedTo: '山田', dueDate: '2025-06-15', status: 'pending', description: 'ハダニの防除' },
    { id: 9, title: 'パプリカの収穫', priority: '中', assignedTo: '田中', dueDate: '2025-06-20', status: 'pending', description: '色づいたものを収穫' },
    { id: 10, title: '土壌分析', priority: '中', assignedTo: '佐藤', dueDate: '2025-06-25', status: 'pending', description: 'pH測定と栄養分析' },
    { id: 11, title: '灌水システムの点検', priority: '高', assignedTo: '山田', dueDate: '2025-06-28', status: 'pending', description: 'ポンプとタイマーの動作確認' },
    { id: 12, title: '温室の清掃', priority: '低', assignedTo: '全員', dueDate: '2025-06-30', status: 'pending', description: '月末の定期清掃' }
  ];

  const displayTasks = tasks.length > 0 ? tasks : dummyTasks;

  // ユニークな担当者リストを取得
  const uniqueAssignees = [...new Set(displayTasks.map(task => task.assignedTo))];

  // フィルタリングとソート
  useEffect(() => {
    let filtered = displayTasks.filter(task => {
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesAssignee = filterAssignee === 'all' || task.assignedTo === filterAssignee;
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesAssignee && matchesSearch;
    });

    // ソート
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'priority':
          const priorityOrder = { '高': 3, '中': 2, '低': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'assignedTo':
          aValue = a.assignedTo.toLowerCase();
          bValue = b.assignedTo.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTasks(filtered);
  }, [displayTasks, filterStatus, filterPriority, filterAssignee, searchTerm, sortBy, sortOrder]);

  // 日付を表示用の文字列に変換する関数
  const formatDate = (date) => {
    if (date instanceof Date) {
      return date.toLocaleDateString('ja-JP');
    }
    return date; // 既に文字列の場合はそのまま返す
  };
  const getDueDateColor = (dueDate) => {
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
                  <option value="高">高</option>
                  <option value="中">中</option>
                  <option value="低">低</option>
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
            {filteredTasks.filter(task => task.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">完了済み</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredTasks.filter(task => task.status === 'completed').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">期限今日まで</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredTasks.filter(task => {
              const today = new Date();
              const due = new Date(task.dueDate);
              return due <= today && task.status === 'pending';
            }).length}
          </div>
        </div>
      </div>

      {/* タスクリスト */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.priority === '高'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === '中'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {task.priority}優先
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.status === 'completed' ? '完了' : '未完了'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mt-1">{task.description}</p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {task.assignedTo}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span className={getDueDateColor(task.dueDate)}>
                          {formatDate(task.dueDate)} ({getDueDateLabel(task.dueDate)})
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
                    {task.status === 'pending' && (
                      <button
                        onClick={() => onCompleteTask && onCompleteTask(task)}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        完了
                      </button>
                    )}
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