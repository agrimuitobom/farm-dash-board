import React from 'react';
import { CloudDrizzle } from 'lucide-react';
import { calcHumidityDeficit, judgeHumidityDeficit, HUMIDITY_DEFICIT_RANGE } from '../utils/humidityDeficit';

export const HUMIDITY_DEFICIT_COLORS = {
  low: 'text-blue-600',
  ok: 'text-green-600',
  high: 'text-orange-600'
};

/**
 * ハウス詳細の「現在の環境」に出す飽差（温度と湿度から計算する）
 */
const HumidityDeficitCard = ({ temperature, humidity, className = '' }) => {
  const value = calcHumidityDeficit(temperature, humidity);
  const { label, level } = judgeHumidityDeficit(value);
  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <div className="flex items-center">
        <CloudDrizzle className="h-5 w-5 text-orange-500 mr-2" />
        <span className="text-gray-700 text-sm">飽差</span>
        <span className="ml-auto text-xs text-gray-400">
          適正 {HUMIDITY_DEFICIT_RANGE.min}〜{HUMIDITY_DEFICIT_RANGE.max}
        </span>
      </div>
      <div className="mt-2 flex items-baseline">
        <span className="text-2xl font-bold">{value === null ? '--' : value.toFixed(1)}</span>
        <span className="text-gray-500 ml-1">{HUMIDITY_DEFICIT_RANGE.unit}</span>
        {label && <span className={`ml-2 text-sm font-medium ${HUMIDITY_DEFICIT_COLORS[level]}`}>{label}</span>}
      </div>
    </div>
  );
};

export default HumidityDeficitCard;
