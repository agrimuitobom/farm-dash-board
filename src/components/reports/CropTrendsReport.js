import React from 'react';
import ChartComponent from './ChartComponent';
import { LineChart, Clock, TrendingUp } from 'lucide-react';
import { formatLineChartData, formatYearMonth } from '../../utils/chartUtils';

const CropTrendsReport = ({ data, reportTitle, unit = 'kg' }) => {
  // データがない場合
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">{reportTitle || '収穫量推移'}</h3>
        <div className="flex justify-center items-center h-60 bg-gray-50 rounded border border-gray-200">
          <p className="text-gray-500">データがありません</p>
        </div>
      </div>
    );
  }

  // 作物名の取得（monthキー以外のすべてのキー）
  const cropNames = Object.keys(data[0]).filter(key => key !== 'month');

  // グラフ表示用にデータを整形
  const { data: chartData, lines } = formatLineChartData(
    data,
    'month', 
    cropNames,
    ['#4f46e5', '#60a5fa', '#93c5fd', '#818cf8', '#c7d2fe', '#f97316', '#fb923c', '#fdba74']
  );

  // 増加率の計算
  const calculateGrowthRate = (cropName) => {
    if (data.length < 2) return { rate: 0, isPositive: true };
    
    const latestMonth = data[data.length - 1];
    const previousMonth = data[data.length - 2];
    
    const latestValue = latestMonth[cropName] || 0;
    const previousValue = previousMonth[cropName] || 0;
    
    if (previousValue === 0) return { rate: 0, isPositive: true };
    
    const growthRate = ((latestValue / previousValue) - 1) * 100;
    return { 
      rate: Math.abs(growthRate).toFixed(1), 
      isPositive: growthRate >= 0
    };
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      {/* ヘッダー部分 */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center">
          <LineChart className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold">{reportTitle || '収穫量推移'}</h3>
        </div>
        <span className="text-sm text-gray-500">単位: {unit}</span>
      </div>

      {/* サマリー部分 */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center mb-2">
          <Clock className="w-5 h-5 text-blue-500 mr-2" />
          <p className="text-sm text-gray-500">対象期間</p>
        </div>
        <p className="text-lg font-bold">
          {formatYearMonth(data[0].month)} 〜 {formatYearMonth(data[data.length - 1].month)}
        </p>
      </div>

      {/* チャート部分 */}
      <div className="p-4">
        <div className="h-80">
          <ChartComponent
            type="line"
            data={chartData}
            config={{ lines }}
            height={300}
            xAxisKey="month"
            tooltipFormatter={(active, payload, label) => (
              <div className="bg-white p-2 border border-gray-200 shadow rounded text-sm">
                <p className="font-medium">{formatYearMonth(label)}</p>
                {payload.map((entry, index) => (
                  <p key={index} style={{ color: entry.color }}>
                    {entry.name}: {entry.value} {unit}
                  </p>
                ))}
              </div>
            )}
          />
        </div>
      </div>

      {/* 最近のトレンドサマリー */}
      <div className="p-4 border-t">
        <h4 className="text-base font-medium mb-3">最近のトレンド</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cropNames.map(cropName => {
            const { rate, isPositive } = calculateGrowthRate(cropName);
            return (
              <div key={cropName} className="bg-gray-50 p-3 rounded border">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{cropName}</p>
                  <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`w-4 h-4 mr-1 ${!isPositive && 'transform rotate-180'}`} />
                    <span className="text-sm font-medium">
                      {isPositive ? '+' : '-'}{rate}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">前月比</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* データテーブル部分 */}
      <div className="p-4 border-t">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  月
                </th>
                {cropNames.map(cropName => (
                  <th 
                    key={cropName}
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {cropName} ({unit})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{formatYearMonth(item.month)}</div>
                  </td>
                  {cropNames.map(cropName => (
                    <td key={cropName} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(item[cropName] || 0).toFixed(1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CropTrendsReport;
