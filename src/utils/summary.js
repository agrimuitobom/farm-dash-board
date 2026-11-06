// まとめページ（/summary）用の計算
//
// まとめページは人と AI アシスタント（Muse）が読むため、時刻は必ず日本時間で、
// 「いつ測った値か」を明記する。データが取れないときは見本の値を出さず、取れなかったことを出す。

import { calcHumidityDeficit } from './humidityDeficit';

const pad = (n) => String(n).padStart(2, '0');

// 日本時間の各部分（端末のタイムゾーンに関係なく）
const jstParts = (date) => {
  const d = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return {
    y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(),
    h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds()
  };
};

/** "2026-11-06T08:12:30+09:00" */
export const toJstIso = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const p = jstParts(date);
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}+09:00`;
};

/** "2026/11/06 08:12" */
export const formatJst = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const p = jstParts(date);
  return `${p.y}/${pad(p.mo)}/${pad(p.d)} ${pad(p.h)}:${pad(p.mi)}`;
};

/** 日本時間の今日の0時 */
export const startOfJstDay = (now) => {
  const p = jstParts(now);
  return new Date(Date.UTC(p.y, p.mo - 1, p.d) - 9 * 60 * 60 * 1000);
};

const METRICS = [
  { key: 'temperature', digits: 1 },
  { key: 'humidity', digits: 1 },
  { key: 'humidityDeficit', digits: 1 },
  { key: 'soilMoisture', digits: 1 },
  { key: 'co2', digits: 0 }
];

const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const round = (v, digits) => Number(v.toFixed(digits));

/**
 * 計測値の平均・最高・最低（項目ごと。値が1つも無い項目は null）
 * 飽差は1件ずつ温度・湿度から計算してから集計する
 * @returns {{count: number, temperature, humidity, humidityDeficit, soilMoisture, co2}}
 */
export const summarizeReadings = (readings) => {
  const result = { count: readings.length };
  METRICS.forEach(({ key, digits }) => {
    const values = readings
      .map(r => (key === 'humidityDeficit' ? calcHumidityDeficit(r.temperature, r.humidity) : r[key]))
      .filter(isNumber);
    result[key] = values.length === 0 ? null : {
      avg: round(values.reduce((sum, v) => sum + v, 0) / values.length, digits),
      max: round(Math.max(...values), digits),
      min: round(Math.min(...values), digits)
    };
  });
  return result;
};
