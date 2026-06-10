import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

/**
 * 汎用チャートコンポーネント
 * @param {string} type - チャートタイプ ('bar', 'line', 'pie', 'area')
 * @param {Array} data - チャートデータ
 * @param {Object} config - チャート設定
 * @param {number} height - チャートの高さ
 * @param {string} xAxisKey - X軸のキー
 * @param {Function} tooltipFormatter - ツールチップのフォーマッター
 */
const ChartComponent = ({
  type = 'bar',
  data = [],
  config = {},
  height = 300,
  xAxisKey = 'name',
  tooltipFormatter = null
}) => {
  // データがない場合
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-60 bg-gray-50 rounded border border-gray-200">
        <p className="text-gray-500">データがありません</p>
      </div>
    );
  }

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    if (tooltipFormatter) {
      return tooltipFormatter(active, payload, label);
    }

    return (
      <div className="bg-white p-2 border border-gray-200 shadow rounded text-sm">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  // 棒グラフの場合
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {config.bars && config.bars.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.dataKey}
              fill={bar.fill}
              name={bar.name || bar.dataKey}
              stackId={bar.stackId}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // 線グラフの場合
  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {config.lines && config.lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              name={line.name || line.dataKey}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // 円グラフの場合
  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            dataKey={config.valueKey || 'value'}
            nameKey={config.nameKey || 'name'}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || config.colors[index % config.colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // エリアチャートの場合
  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {config.areas && config.areas.map((area, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey={area.dataKey}
              stroke={area.stroke}
              fill={area.fill}
              name={area.name || area.dataKey}
              stackId={area.stackId}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // デフォルトでは空のコンテナを返す
  return <div className="h-60 bg-gray-50 rounded"></div>;
};

export default ChartComponent;
