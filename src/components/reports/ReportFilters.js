import React from 'react';
import { Filter, Calendar, Download, BarChart2 } from 'lucide-react';

const ReportFilters = ({ 
  reportType, 
  timePeriod,
  startDate,
  endDate,
  houseId,
  cropId,
  houses,
  crops,
  onReportTypeChange,
  onTimePeriodChange,
  onDateChange,
  onHouseChange,
  onCropChange,
  onGenerateReport,
  onExportCSV
}) => {
  // 期間に基づいて日付入力フィールドを制御
  const renderDateInputs = () => {
    switch (timePeriod) {
      case 'custom':
        // カスタム期間の場合は開始日と終了日を指定
        return (
          <div className="flex space-x-2">
            <div className="w-1/2">
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
              <input
                type="date"
                id="start-date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={startDate ? formatDateForInput(startDate) : ''}
                onChange={(e) => onDateChange('start', e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
              <input
                type="date"
                id="end-date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={endDate ? formatDateForInput(endDate) : ''}
                onChange={(e) => onDateChange('end', e.target.value)}
              />
            </div>
          </div>
        );
      case 'month':
        // 月次の場合は年月の選択
        return (
          <div>
            <label htmlFor="month-date" className="block text-sm font-medium text-gray-700 mb-1">年月</label>
            <input
              type="month"
              id="month-date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={startDate ? formatYearMonthForInput(startDate) : ''}
              onChange={(e) => onDateChange('month', e.target.value)}
            />
          </div>
        );
      case 'quarter':
        // 四半期の場合は年と四半期の選択
        return (
          <div className="flex space-x-2">
            <div className="w-1/2">
              <label htmlFor="quarter-year" className="block text-sm font-medium text-gray-700 mb-1">年</label>
              <select
                id="quarter-year"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={startDate ? startDate.getFullYear() : new Date().getFullYear()}
                onChange={(e) => onDateChange('year', e.target.value)}
              >
                {generateYearOptions()}
              </select>
            </div>
            <div className="w-1/2">
              <label htmlFor="quarter" className="block text-sm font-medium text-gray-700 mb-1">四半期</label>
              <select
                id="quarter"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={getQuarterFromDate(startDate)}
                onChange={(e) => onDateChange('quarter', e.target.value)}
              >
                <option value="1">第1四半期 (1-3月)</option>
                <option value="2">第2四半期 (4-6月)</option>
                <option value="3">第3四半期 (7-9月)</option>
                <option value="4">第4四半期 (10-12月)</option>
              </select>
            </div>
          </div>
        );
      case 'year':
        // 年次の場合は年の選択
        return (
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">年</label>
            <select
              id="year"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={startDate ? startDate.getFullYear() : new Date().getFullYear()}
              onChange={(e) => onDateChange('year', e.target.value)}
            >
              {generateYearOptions()}
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  // レポートタイプに基づいて追加フィルターを制御
  const renderAdditionalFilters = () => {
    switch (reportType) {
      case 'production':
        // 生産量レポートの場合はハウスでフィルタリング可能
        return (
          <div>
            <label htmlFor="house-filter" className="block text-sm font-medium text-gray-700 mb-1">ハウス</label>
            <select
              id="house-filter"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={houseId || ''}
              onChange={(e) => onHouseChange(e.target.value)}
            >
              <option value="">全てのハウス</option>
              {houses.map(house => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </div>
        );
      case 'productivity':
        // 生産性レポートの場合は作物でフィルタリング可能
        return (
          <div>
            <label htmlFor="crop-filter" className="block text-sm font-medium text-gray-700 mb-1">作物</label>
            <select
              id="crop-filter"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={cropId || ''}
              onChange={(e) => onCropChange(e.target.value)}
            >
              <option value="">全ての作物</option>
              {crops.map(crop => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))}
            </select>
          </div>
        );
      case 'trends':
        // 推移レポートの場合は作物でフィルタリング可能
        return (
          <div>
            <label htmlFor="crop-filter" className="block text-sm font-medium text-gray-700 mb-1">作物</label>
            <select
              id="crop-filter"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={cropId || ''}
              onChange={(e) => onCropChange(e.target.value)}
            >
              <option value="">全ての作物</option>
              {crops.map(crop => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))}
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  // ヘルパー関数 - 年のオプションを生成
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = currentYear - 5; i <= currentYear; i++) {
      years.push(
        <option key={i} value={i}>
          {i}年
        </option>
      );
    }
    
    return years;
  };

  // ヘルパー関数 - Date型をinput type="date"に適した形式に変換
  const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // ヘルパー関数 - Date型をinput type="month"に適した形式に変換
  const formatYearMonthForInput = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // ヘルパー関数 - 日付から四半期を取得
  const getQuarterFromDate = (date) => {
    if (!date) return 1;
    const month = date.getMonth() + 1;
    return Math.ceil(month / 3);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="mb-4 flex items-center">
        <Filter className="w-5 h-5 text-gray-500 mr-2" />
        <h3 className="text-lg font-medium">レポートフィルター</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* レポートタイプの選択 */}
        <div>
          <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-1">レポートタイプ</label>
          <select
            id="report-type"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={reportType}
            onChange={(e) => onReportTypeChange(e.target.value)}
          >
            <option value="production">作物別生産量</option>
            <option value="productivity">ハウス別生産性</option>
            <option value="trends">収穫量推移</option>
          </select>
        </div>
        
        {/* 期間タイプの選択 */}
        <div>
          <label htmlFor="time-period" className="block text-sm font-medium text-gray-700 mb-1">期間</label>
          <select
            id="time-period"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={timePeriod}
            onChange={(e) => onTimePeriodChange(e.target.value)}
          >
            <option value="month">月次</option>
            <option value="quarter">四半期</option>
            <option value="year">年次</option>
            <option value="custom">カスタム期間</option>
          </select>
        </div>
        
        {/* 追加フィルター（レポートタイプに基づく） */}
        {renderAdditionalFilters()}
      </div>
      
      {/* 日付入力欄 */}
      <div className="mt-4">
        {renderDateInputs()}
      </div>
      
      {/* ボタンエリア */}
      <div className="mt-4 flex justify-between">
        <div>
          <button
            onClick={onGenerateReport}
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg mr-2"
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            レポート生成
          </button>
          <button
            onClick={onExportCSV}
            className="flex items-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            CSVダウンロード
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
