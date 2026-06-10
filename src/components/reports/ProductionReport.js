import React from 'react';
import ChartComponent from './ChartComponent';
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatBarChartData, formatGrowthRate } from '../../utils/chartUtils';

const ProductionReport = ({ data, reportTitle, unit = 'kg' }) => {
  // データがない場合
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">{reportTitle || '作物別生産量'}</h3>
        <div className="flex justify-center items-center h-60 bg-gray-50 rounded border border-gray-200">
          <p className="text-gray-500">データがありません</p>
        </div>
      </div>
    );
  }

  // グラフ表示用にデータを整形
  const { data: chartData, bars } = formatBarChartData(
    data,
    'name',
    ['当月', '前月', '前年同月'],
    ['#4f46e5', '#60a5fa', '#93c5fd']
  );

  // 合計の計算
  const totals = data.reduce(
    (acc, item) => {
      acc.current += item.当月 || 0;
      acc.previous += item.前月 || 0;
      acc.previousYear += item.前年同月 || 0;
      return acc;
    },
    { current: 0, previous: 0, previousYear: 0 }
  );

  // 成長率の計算
  const monthGrowth = formatGrowthRate(totals.current, totals.previous);
  const yearGrowth = formatGrowthRate(totals.current, totals.previousYear);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      {/* ヘッダー部分 */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center">
          <BarChart2 className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold">{reportTitle || '作物別生産量'}</h3>
        </div>
        <span className="text-sm text-gray-500">単位: {unit}</span>
      </div>

      {/* サマリー部分 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 border-b">
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-sm text-gray-500 mb-1">当月合計</p>
          <p className="text-xl font-bold">{totals.current.toFixed(1)} {unit}</p>
        </div>
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-sm text-gray-500 mb-1">前月比</p>
          <div className="flex items-center">
            <p className={`text-xl font-bold ${monthGrowth.className}`}>{monthGrowth.value}</p>
            {monthGrowth.value.startsWith('+') ? (
              <TrendingUp className="w-5 h-5 ml-2 text-green-600" />
            ) : monthGrowth.value.startsWith('-') ? (
              <TrendingDown className="w-5 h-5 ml-2 text-red-600" />
            ) : null}
          </div>
        </div>
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-sm text-gray-500 mb-1">前年同月比</p>
          <div className="flex items-center">
            <p className={`text-xl font-bold ${yearGrowth.className}`}>{yearGrowth.value}</p>
            {yearGrowth.value.startsWith('+') ? (
              <TrendingUp className="w-5 h-5 ml-2 text-green-600" />
            ) : yearGrowth.value.startsWith('-') ? (
              <TrendingDown className="w-5 h-5 ml-2 text-red-600" />
            ) : null}
          </div>
        </div>
      </div>

      {/* チャート部分 */}
      <div className="p-4">
        <div className="h-80">
          <ChartComponent
            type="bar"
            data={chartData}
            config={{ bars }}
            height={300}
            xAxisKey="name"
            tooltipFormatter={(active, payload, label) => (
              <div className="bg-white p-2 border border-gray-200 shadow rounded text-sm">
                <p className="font-medium">{label}</p>
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

      {/* データテーブル部分 */}
      <div className="p-4 border-t">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作物
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当月
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  前月
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  前年同月
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  前月比
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  前年比
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => {
                const monthlyGrowth = formatGrowthRate(item.当月, item.前月);
                const yearlyGrowth = formatGrowthRate(item.当月, item.前年同月);
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.当月?.toFixed(1) || '-'} {unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.前月?.toFixed(1) || '-'} {unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.前年同月?.toFixed(1) || '-'} {unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${monthlyGrowth.className}`}>
                        {monthlyGrowth.value}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${yearlyGrowth.className}`}>
                        {yearlyGrowth.value}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductionReport;
