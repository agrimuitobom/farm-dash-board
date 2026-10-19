// 環境データの正常範囲
//
// ハウスごとの閾値は houses ドキュメントの thresholds に保存する
//   thresholds: { temperature: { min, max }, humidity: { min, max } }
// 未設定の項目は下の既定値を使う。アラートの自動判定（raspberry-pi/alert_monitor.py）、
// ハウスカード、常時表示画面はすべて同じ値で判定する。

export const DEFAULT_THRESHOLDS = {
  temperature: { min: 18, max: 30 },
  humidity: { min: 50, max: 80 }
};

// 土壌水分はセンサー未導入のため、ハウスごとの設定は持たない
export const environmentalRanges = {
  temperature: { ...DEFAULT_THRESHOLDS.temperature, unit: '°C' },
  humidity: { ...DEFAULT_THRESHOLDS.humidity, unit: '%' },
  soilMoisture: { min: 60, max: 85, unit: '%' }
};

const pickNumber = (value, fallback) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/**
 * ハウスの閾値（未設定の項目は既定値）を返す
 * @param {Object} house - ハウス情報（thresholds を含む場合あり）
 * @returns {{temperature: {min: number, max: number}, humidity: {min: number, max: number}}}
 */
export const getHouseThresholds = (house) => {
  const result = {};
  Object.keys(DEFAULT_THRESHOLDS).forEach((key) => {
    const custom = house?.thresholds?.[key] || {};
    result[key] = {
      min: pickNumber(custom.min, DEFAULT_THRESHOLDS[key].min),
      max: pickNumber(custom.max, DEFAULT_THRESHOLDS[key].max)
    };
  });
  return result;
};
