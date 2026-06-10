import React from 'react';

const TasksFilter = ({
  filterText,
  statusFilter,
  houseFilter,
  cropFilter,
  dateRangeFilter,
  houses,
  crops,
  onFilterChange,
  onDateRangeChange
}) => {
  // 日付範囲の変更ハンドラー
  const handleStartDateChange = (e) => {
    const startDate = e.target.value;
    onDateRangeChange({
      ...dateRangeFilter,
      start: startDate
    });
  };

  const handleEndDateChange = (e) => {
    const endDate = e.target.value;
    onDateRangeChange({
      ...dateRangeFilter,
      end: endDate
    });
  };

  // フィルターリセットハンドラー
  const handleResetFilters = () => {
    // フィルター状態リセット用のダミーイベントオブジェクト
    onFilterChange({ target: { name: 'filterText', value: '' } });
    onFilterChange({ target: { name: 'statusFilter', value: 'all' } });
    onFilterChange({ target: { name: 'houseFilter', value: '' } });
    onFilterChange({ target: { name: 'cropFilter', value: '' } });
    onDateRangeChange({ start: null, end: null });
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">検索</label>
          <input
            type="text"
            name="filterText"
            placeholder="タスク名・説明で検索..."
            value={filterText}
            onChange={onFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
          <select
            name="statusFilter"
            value={statusFilter}
            onChange={onFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="all">全て</option>
            <option value="pending">未着手</option>
            <option value="in-progress">進行中</option>
            <option value="completed">完了</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ハウス</label>
          <select
            name="houseFilter"
            value={houseFilter}
            onChange={onFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">全てのハウス</option>
            {houses.map(house => (
              <option key={house.id} value={house.id}>
                {house.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">作物</label>
          <select
            name="cropFilter"
            value={cropFilter}
            onChange={onFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">全ての作物</option>
            {crops.map(crop => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">期間（開始）</label>
          <input
            type="date"
            name="startDate"
            value={dateRangeFilter.start || ''}
            onChange={handleStartDateChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">期間（終了）</label>
          <input
            type="date"
            name="endDate"
            value={dateRangeFilter.end || ''}
            onChange={handleEndDateChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="flex items-end">
          <button
            onClick={handleResetFilters}
            className="p-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            フィルターをリセット
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasksFilter;