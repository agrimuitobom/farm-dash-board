import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Check, 
  AlertTriangle, 
  User, 
  Download, 
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// センサータイプと重要度のカラーマッピング
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'high':
      return 'text-red-600 bg-red-100';
    case 'medium':
      return 'text-orange-600 bg-orange-100';
    case 'low':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'resolved':
      return 'text-green-600 bg-green-100';
    case 'in-progress':
      return 'text-blue-600 bg-blue-100';
    case 'pending':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const AlertHistoryView = ({ alertHistory = [], loading, exportAlerts }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState({
    start: null,
    end: null
  });
  
  const itemsPerPage = 10;
  
  // アラート履歴のフィルタリング
  const filteredAlerts = alertHistory.filter((alert) => {
    // 検索語でフィルタリング
    const textMatch = 
      alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      alert.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.houseName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // ステータスでフィルタリング
    const statusMatch = 
      filterStatus === 'all' || 
      alert.status === filterStatus;
    
    // 重要度でフィルタリング
    const severityMatch = 
      filterSeverity === 'all' || 
      alert.severity === filterSeverity;
    
    // 日付範囲でフィルタリング
    let dateMatch = true;
    if (filterDateRange.start && filterDateRange.end) {
      const alertDate = new Date(alert.timestamp);
      const startDate = new Date(filterDateRange.start);
      const endDate = new Date(filterDateRange.end);
      endDate.setHours(23, 59, 59, 999); // 終了日の終わりまで
      
      dateMatch = alertDate >= startDate && alertDate <= endDate;
    }
    
    return textMatch && statusMatch && severityMatch && dateMatch;
  });
  
  // ページネーション
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // 日付フォーマット
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ja-JP', options);
  };
  
  // 検索ハンドラー
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // 検索時は1ページ目に戻る
  };
  
  // 日付範囲フィルターハンドラー
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };
  
  // フィルターリセット
  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterSeverity('all');
    setFilterDateRange({ start: null, end: null });
    setCurrentPage(1);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">アラート履歴</h2>
        <button
          onClick={exportAlerts}
          disabled={loading || filteredAlerts.length === 0}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4 mr-2" />
          CSVエクスポート
        </button>
      </div>
      
      {/* フィルターセクション */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* 検索ボックス */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">キーワード検索</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="アラートタイトル、説明、ハウス名で検索..."
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          {/* ステータスフィルター */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">ステータス</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="pending">未対応</option>
              <option value="in-progress">対応中</option>
              <option value="resolved">解決済み</option>
            </select>
          </div>
          
          {/* 重要度フィルター */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">重要度</label>
            <select
              value={filterSeverity}
              onChange={(e) => {
                setFilterSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
        </div>
        
        {/* 日付範囲フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">開始日</label>
            <input
              type="date"
              name="start"
              value={filterDateRange.start || ''}
              onChange={handleDateFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">終了日</label>
            <input
              type="date"
              name="end"
              value={filterDateRange.end || ''}
              onChange={handleDateFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* フィルターリセットボタン */}
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            フィルターをリセット
          </button>
        </div>
      </div>
      
      {/* アラート履歴テーブル */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="animate-spin mr-2">⊙</span>
          <span className="text-gray-600">データを読み込み中...</span>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            {alertHistory.length === 0 
              ? "アラート履歴がありません"
              : "検索条件に一致するアラートがありません"}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アラート内容
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ハウス名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    重要度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(alert.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-gray-500 truncate max-w-xs">
                          {alert.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {alert.houseName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity === 'high' && '高'}
                        {alert.severity === 'medium' && '中'}
                        {alert.severity === 'low' && '低'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {alert.status === 'pending' && '未対応'}
                        {alert.status === 'in-progress' && '対応中'}
                        {alert.status === 'resolved' && '解決済み'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 px-4">
              <div className="text-sm text-gray-700">
                全{filteredAlerts.length}件中 {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredAlerts.length)}件を表示
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // 表示するページ番号を計算（最大5ページ）
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded border ${pageNum === currentPage 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AlertHistoryView;
