import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Filter, Download, Printer, Search } from 'lucide-react';

const ReportTable = ({ 
  data, 
  columns, 
  title, 
  onExportCSV, 
  onPrint,
  searchEnabled = true,
  filterEnabled = true
}) => {
  // 状態管理
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  // データがない場合
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title || 'データテーブル'}</h3>
        <div className="flex justify-center items-center h-32 bg-gray-50 rounded border border-gray-200">
          <p className="text-gray-500">データがありません</p>
        </div>
      </div>
    );
  }

  // ソート関数
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // ソート済みのデータを取得
  const getSortedData = () => {
    if (!sortConfig.key) return [...data];
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // 検索とフィルタリングを適用したデータを取得
  const getFilteredData = () => {
    let filteredData = getSortedData();
    
    // 検索クエリの適用（指定された場合）
    if (searchEnabled && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(item => {
        return Object.values(item).some(value => 
          value !== null && 
          value !== undefined && 
          value.toString().toLowerCase().includes(query)
        );
      });
    }
    
    // フィルターの適用（指定された場合）
    if (filterEnabled) {
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filteredData = filteredData.filter(item => {
            if (typeof value === 'string') {
              return item[key].toString().toLowerCase().includes(value.toLowerCase());
            }
            return item[key] === value;
          });
        }
      });
    }
    
    return filteredData;
  };

  // フィルター変更ハンドラー
  const handleFilterChange = (column, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [column.key]: value
    }));
  };

  // テーブルヘッダーレンダリング
  const renderTableHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        {columns.map(column => (
          <th 
            key={column.key}
            scope="col" 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => column.sortable !== false && handleSort(column.key)}
          >
            <div className="flex items-center">
              <span>{column.header}</span>
              {column.sortable !== false && (
                <span className="ml-1">
                  {sortConfig.key === column.key ? (
                    sortConfig.direction === 'asc' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  ) : (
                    <div className="w-4 h-4 opacity-0">•</div>
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
      {filterEnabled && (
        <tr>
          {columns.map(column => (
            <th key={`filter-${column.key}`} className="px-6 py-2 bg-gray-100">
              {column.filterable !== false && (
                <input
                  type="text"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder={`${column.header}でフィルター`}
                  value={activeFilters[column.key] || ''}
                  onChange={(e) => handleFilterChange(column, e.target.value)}
                />
              )}
            </th>
          ))}
        </tr>
      )}
    </thead>
  );

  // テーブルボディレンダリング
  const renderTableBody = () => {
    const filteredData = getFilteredData();
    
    return (
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredData.map((row, rowIndex) => (
          <tr key={rowIndex} className="hover:bg-gray-50">
            {columns.map(column => (
              <td key={`${rowIndex}-${column.key}`} className="px-6 py-4 whitespace-nowrap">
                {column.render ? column.render(row[column.key], row) : (
                  <div className={column.className || 'text-sm text-gray-900'}>
                    {row[column.key] !== undefined && row[column.key] !== null ? row[column.key] : '-'}
                  </div>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* ヘッダー部分 */}
      <div className="p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold">{title || 'データテーブル'}</h3>
        
        <div className="flex flex-wrap items-center gap-2">
          {searchEnabled && (
            <div className="relative">
              <input
                type="text"
                className="pl-8 pr-3 py-1 border border-gray-300 rounded w-64"
                placeholder="検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          )}
          
          <div className="flex items-center gap-1">
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="flex items-center px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                title="CSVダウンロード"
              >
                <Download className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">CSVダウンロード</span>
              </button>
            )}
            
            {onPrint && (
              <button
                onClick={onPrint}
                className="flex items-center px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                title="印刷"
              >
                <Printer className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">印刷</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* テーブル部分 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {renderTableHeader()}
          {renderTableBody()}
        </table>
      </div>

      {/* ページネーション（必要に応じて実装） */}
      {/* ... */}
    </div>
  );
};

export default ReportTable;
