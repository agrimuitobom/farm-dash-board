// 環境データ（温度・湿度など）を CSV にする
//
// 読み込みは1時間ごとのまとめから行うので、平均の間隔を変えても Firestore の読み取り件数は同じ。
// 間隔で変わるのは CSV の行数（ファイルの大きさ）だけ。

import { calcHumidityDeficit } from './humidityDeficit';

export const CSV_INTERVALS = [
  { id: 'raw', label: 'そのまま（記録した間隔）', minutes: 0 },
  { id: '10min', label: '10分ごとの平均', minutes: 10 },
  { id: '1hour', label: '1時間ごとの平均', minutes: 60 },
  { id: 'day', label: '1日ごと（平均・最高・最低）', minutes: 24 * 60 }
];

// CSV に出す項目（データのある項目だけ列を作る。温度・湿度・飽差は常に出す）
const METRICS = [
  { key: 'temperature', label: '温度(℃)', digits: 1, always: true },
  { key: 'humidity', label: '湿度(%)', digits: 1, always: true },
  { key: 'humidityDeficit', label: '飽差(g/m³)', digits: 1, always: true },
  { key: 'soilMoisture', label: '土壌水分(%)', digits: 1 },
  { key: 'co2', label: 'CO2(ppm)', digits: 0 }
];

const pad = (n) => String(n).padStart(2, '0');
const formatDate = (d) => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
const formatDateTime = (d) => `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const round = (v, digits) => (isNumber(v) ? Number(v.toFixed(digits)) : '');

// 区切りの始まり（日本時間で 10:00, 10:10 ... や 0時）
const bucketStart = (date, minutes) => {
  if (minutes >= 24 * 60) return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const d = new Date(date);
  d.setSeconds(0, 0);
  d.setMinutes(Math.floor(d.getMinutes() / minutes) * minutes);
  return d;
};

const withDeficit = (r) => ({ ...r, humidityDeficit: calcHumidityDeficit(r.temperature, r.humidity) });

const summarize = (values) => {
  const nums = values.filter(isNumber);
  if (nums.length === 0) return { avg: null, max: null, min: null };
  return {
    avg: nums.reduce((sum, v) => sum + v, 0) / nums.length,
    max: Math.max(...nums),
    min: Math.min(...nums)
  };
};

/**
 * CSV の見出しと行を作る
 * @param {Array<{houseName: string, readings: Array}>} houses - ハウスごとの計測値（順不同でよい）
 * @param {string} intervalId - CSV_INTERVALS の id
 * @returns {{headers: string[], rows: Array<Array>}}
 */
export const buildEnvironmentalCsv = (houses, intervalId) => {
  const interval = CSV_INTERVALS.find(i => i.id === intervalId) || CSV_INTERVALS[1];
  const all = houses.flatMap(h => h.readings);
  const metrics = METRICS.filter(m => m.always || all.some(r => isNumber(r[m.key])));
  const daily = interval.minutes >= 24 * 60;

  const headers = [daily ? '日付' : '日時', 'ハウス'];
  metrics.forEach(m => {
    if (daily) {
      const name = m.label.replace(/\(.*\)$/, '');
      const unit = m.label.slice(name.length);
      headers.push(`${name}平均${unit}`, `${name}最高${unit}`, `${name}最低${unit}`);
    } else {
      headers.push(m.label);
    }
  });
  if (interval.minutes > 0) headers.push('データ数');

  const rows = [];
  houses.forEach(({ houseName, readings }) => {
    const sorted = readings
      .filter(r => r.timestamp instanceof Date)
      .map(withDeficit)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (interval.minutes === 0) {
      sorted.forEach(r => {
        rows.push([formatDateTime(r.timestamp), houseName, ...metrics.map(m => round(r[m.key], m.digits))]);
      });
      return;
    }

    const buckets = new Map();
    sorted.forEach(r => {
      const key = bucketStart(r.timestamp, interval.minutes).getTime();
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(r);
    });
    buckets.forEach((items, key) => {
      const start = new Date(key);
      const row = [daily ? formatDate(start) : formatDateTime(start), houseName];
      metrics.forEach(m => {
        const s = summarize(items.map(r => r[m.key]));
        if (daily) {
          row.push(round(s.avg, m.digits), round(s.max, m.digits), round(s.min, m.digits));
        } else {
          row.push(round(s.avg, m.digits));
        }
      });
      row.push(items.length);
      rows.push(row);
    });
  });
  return { headers, rows };
};

const escapeCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * CSV の文字列（Excel で文字化けしないよう先頭に BOM を付ける）
 */
export const toCsvText = ({ headers, rows }) =>
  '﻿' + [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\r\n') + '\r\n';
