import React from 'react';
import ChartComponent from './ChartComponent';
import { BarChart2, Award, Maximize2 } from 'lucide-react';
import { formatBarChartData } from '../../utils/chartUtils';

const ProductivityReport = ({ data, reportTitle, quantityUnit = 'kg', areaUnit = 'm²' }) => {
  // データがない場合
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">{reportTitle || 'ハウス別生産性'}</h3>
        <div className="flex justify-center items-center h-60 bg-gray-50 rounded border border-gray-200">
          <p className="text-gray-500">データがありません</p>
        </div>
      </div>
    );
  }

  // グラフ表示用にデータを整形
  const productivityData = data.map(item => ({
    name: item.name,
    productivity: parseFloat(item.productivity.toFixed(2))
  }));

  const { data: chartData, bars } = formatBarChartData(
    productivityData,
    'name',
    ['productivity'],
    ['#4f46e5']
  );

  // 最も生産性の高いハウスと平均生産性を計算
  const sortedData = [...data].sort((a, b) => b.productivity - a.productivity);
  const topHouse = sortedData[0];
  const averageProductivity = data.reduce((sum, item) => sum + item.productivity, 0) / data.length;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      {/* ヘッダー部分 */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center">
          <BarChart2 className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold">{reportTitle || 'ハウス別生産性'}</h3>
        </div>
        <span className="text-sm text-gray-500">単位: {quantityUnit}/{areaUnit}</span>
      </div>

      {/* サマリー部分 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border-b">
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="flex items-center mb-2">
            <Award className="w-5 h-5 text-yellow-500 mr-2" />
            <p className="text-sm text-gray-500">最高生産性ハウス</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold">{topHouse?.name || '-'}</p>
            <p className="text-lg font-bold text-blue-600">
              {topHouse?.productivity.toFixed(2) || '-'} {quantityUnit}/{areaUnit}
            </p>
          </div>
        </div>
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="flex items-center mb-2">
            <Maximize2 className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-sm text-gray-500">平均生産性</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold">全ハウス平均</p>
            <p className="text-lg font-bold text-green-600">
              {averageProductivity.toFixed(2)} {quantityUnit}/{areaUnit}
            </p>
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
                    生産性: {entry.value} {quantityUnit}/{areaUnit}
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
                  ハウス
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  収穫量 ({quantityUnit})
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  面積 ({areaUnit})
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  生産性 ({quantityUnit}/{areaUnit})
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均比
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => {
                const comparedToAverage = (item.productivity / averageProductivity - 1) * 100;
                const isAboveAverage = comparedToAverage >= 0;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.totalQuantity.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.totalArea.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-medium">{item.productivity.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${isAboveAverage ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {isAboveAverage ? '+' : ''}{comparedToAverage.toFixed(1)}%
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

export default ProductivityReport;
