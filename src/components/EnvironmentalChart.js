import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, RefreshCw } from 'lucide-react';

const EnvironmentalChart = ({ data, onRefresh, timeRange = 24, onTimeRangeChange }) => {
  const [selectedMetrics, setSelectedMetrics] = useState(['temperature', 'humidity', 'soilMoisture']);
  const [localTimeRange, setLocalTimeRange] = useState(timeRange);

  // メトリクスの定義
  const metrics = [
    { id: 'temperature', name: '温度', color: '#ef4444', unit: '°C' },
    { id: 'humidity', name: '湿度', color: '#3b82f6', unit: '%' },
    { id: 'soilMoisture', name: '土壌水分', color: '#10b981', unit: '%' },
    { id: 'light', name: '光量', color: '#f59e0b', unit: 'lux' },
    { id: 'co2', name: 'CO2', color: '#8b5cf6', unit: 'ppm' }
  ];

  // メトリクスの選択を切り替える
  const toggleMetric = (metricId) => {
    if (selectedMetrics.includes(metricId)) {
      setSelectedMetrics(selectedMetrics.filter(id => id !== metricId));
    } else {
      setSelectedMetrics([...selectedMetrics, metricId]);
    }
  };

  // 時間範囲の変更を処理
  const handleTimeRangeChange = (value) => {
    setLocalTimeRange(value);
    if (onTimeRangeChange) {
      onTimeRangeChange(value);
    }
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded">
          <p className="font-medium text-sm text-gray-700 mb-2">{label}</p>
          {payload.map((entry, index) => {
            const metric = metrics.find(m => m.id === entry.dataKey);
            return (
              <div key={`item-${index}`} className="flex items-center text-sm mb-1">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">{metric?.name}: </span>
                <span className="font-medium ml-1">
                  {entry.value != null ? entry.value.toFixed(1) : 'N/A'} {metric?.unit}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // データのフォーマット
  const formatData = (inputData) => {
    if (!inputData || !Array.isArray(inputData) || inputData.length === 0) {
      return [];
    }

    return inputData.map(item => {
      // タイムスタンプをフォーマット
      const date = item.timestamp ? new Date(item.timestamp) : new Date();
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      return {
        ...item,
        time
      };
    });
  };

  const formattedData = formatData(data);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">環境データ推移</h3>
        <div className="flex items-center space-x-2">
          <select
            value={localTimeRange}
            onChange={(e) => handleTimeRangeChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={6}>6時間</option>
            <option value={12}>12時間</option>
            <option value={24}>24時間</option>
            <option value={48}>2日間</option>
            <option value={168}>1週間</option>
          </select>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 rounded-full hover:bg-gray-100"
              title="データを更新"
            >
              <RefreshCw className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* メトリクス選択ボタン */}
      <div className="flex flex-wrap gap-2 mb-4">
        {metrics.map(metric => (
          <button
            key={metric.id}
            className={`px-3 py-1 text-xs rounded-full flex items-center ${
              selectedMetrics.includes(metric.id) 
                ? 'bg-gray-200 font-medium' 
                : 'bg-gray-100 text-gray-500'
            }`}
            onClick={() => toggleMetric(metric.id)}
          >
            <div 
              className="w-2 h-2 rounded-full mr-1" 
              style={{ backgroundColor: metric.color }}
            />
            {metric.name}
          </button>
        ))}
      </div>

      {/* チャート */}
      <div className="h-64">
        {formattedData && formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                tickMargin={5}
              />
              <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              
              {selectedMetrics.includes('temperature') && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="temperature" 
                  name="温度" 
                  stroke="#ef4444" 
                  activeDot={{ r: 6 }} 
                  dot={false}
                />
              )}
              
              {selectedMetrics.includes('humidity') && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="humidity" 
                  name="湿度" 
                  stroke="#3b82f6" 
                  activeDot={{ r: 6 }} 
                  dot={false}
                />
              )}
              
              {selectedMetrics.includes('soilMoisture') && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="soilMoisture" 
                  name="土壌水分" 
                  stroke="#10b981" 
                  activeDot={{ r: 6 }} 
                  dot={false}
                />
              )}
              
              {selectedMetrics.includes('light') && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="light" 
                  name="光量" 
                  stroke="#f59e0b" 
                  activeDot={{ r: 6 }} 
                  dot={false}
                />
              )}
              
              {selectedMetrics.includes('co2') && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="co2" 
                  name="CO2" 
                  stroke="#8b5cf6" 
                  activeDot={{ r: 6 }} 
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">データがありません</p>
          </div>
        )}
      </div>
      
      {formattedData && formattedData.length > 0 && (
        <div className="mt-2 flex items-center justify-end text-xs text-gray-500">
          <Clock className="h-3 w-3 mr-1" />
          <span>最終更新: {new Date().toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
};

export default EnvironmentalChart;