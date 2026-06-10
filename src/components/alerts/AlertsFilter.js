import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Filter } from 'lucide-react';

const AlertsFilter = ({ 
  filterText, 
  statusFilter, 
  typeFilter,
  houseFilter, 
  dateRangeFilter,
  houses,
  onFilterChange, 
  onDateRangeChange 
}) => {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  
  // アラートタイプのオプション
  const alertTypes = [
    { value: 'all', label: 'すべてのタイプ' },
    { value: 'temperature', label: '温度' },
    { value: 'humidity', label: '湿度' },
    { value: 'co2', label: 'CO2濃度' },
    { value: 'light', label: '光量' },
    { value: 'water', label: '水分' },
    { value: 'ph', label: 'pH値' },
    { value: 'ec', label: 'EC値' },
    { value: 'system', label: 'システム' },
    { value: 'other', label: 'その他' }
  ];
  
  // 日付範囲のハンドラー
  const handleStartDateChange = (e) => {
    onDateRangeChange({
      ...dateRangeFilter,
      start: e.target.value ? new Date(e.target.value) : null
    });
  };
  
  const handleEndDateChange = (e) => {
    onDateRangeChange({
      ...dateRangeFilter,
      end: e.target.value ? new Date(e.target.value) : null
    });
  };
  
  // 日付をyyyy-MM-dd形式に変換
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };
  
  // 日付フィルターのリセット
  const resetDateFilter = () => {
    onDateRangeChange({ start: null, end: null });
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      {/* 常に表示される基本フィルター */}
      <div className="p-4 flex flex-wrap gap-4 items-center">
        {/* テキスト検索 */}
        <div className="flex-grow min-w-[250px]">
          <input
            type="text"
            name="filterText"
            value={filterText}
            onChange={onFilterChange}
            placeholder="アラートを検索..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        
        {/* ステータスフィルター */}
        <div className="min-w-[180px]">
          <select
            name="statusFilter"
            value={statusFilter}
            onChange={onFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">すべてのステータス</option>
            <option value="pending">未対応</option>
            <option value="in-progress">対応中</option>
            <option value="resolved">解決済み</option>
          </select>
        </div>
        
        {/* アラートタイプフィルター */}
        <div className="min-w-[180px]">
          <select
            name="typeFilter"
            value={typeFilter}
            onChange={onFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            {alertTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        {/* フィルター開閉ボタン */}
        <button
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4 mr-2" />
          詳細フィルター
          {isFilterExpanded ? 
            <ChevronUp className="w-4 h-4 ml-2" /> : 
            <ChevronDown className="w-4 h-4 ml-2" />
          }
        </button>
      </div>
      
      {/* 拡張フィルター */}
      {isFilterExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-4">
          <div className="flex flex-wrap gap-4">
            {/* ハウスフィルター */}
            <div className="min-w-[220px] flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">ハウス</label>
              <select
                name="houseFilter"
                value={houseFilter}
                onChange={onFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">すべてのハウス</option>
                {houses.map(house => (
                  <option key={house.id} value={house.id}>{house.name}</option>
                ))}
              </select>
            </div>
            
            {/* 日付範囲 */}
            <div className="min-w-[300px] flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  発生日の範囲
                </div>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={formatDateForInput(dateRangeFilter.start)}
                  onChange={handleStartDateChange}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">〜</span>
                <input
                  type="date"
                  value={formatDateForInput(dateRangeFilter.end)}
                  onChange={handleEndDateChange}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-lg"
                />
                {(dateRangeFilter.start || dateRangeFilter.end) && (
                  <button
                    onClick={resetDateFilter}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-red-600"
                  >
                    クリア
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsFilter;