// 飽差（g/m³）: その温度で空気があと何 g の水蒸気を含めるか
//
// 温度と湿度から計算するので、センサーや Firestore のデータを増やさずに出せる。
//   飽和水蒸気圧 e(hPa) = 6.1078 × 10^(7.5T / (T + 237.3))   （Tetens の式）
//   飽和水蒸気量(g/m³)  = 217 × e / (T + 273.15)
//   飽差(g/m³)          = 飽和水蒸気量 × (1 − 湿度 / 100)
//
// 目安（一般的な施設栽培の基準）: 3 未満は多湿、3〜6 が適正、6 を超えると乾燥。

export const HUMIDITY_DEFICIT_RANGE = { min: 3, max: 6, unit: 'g/m³' };

/**
 * 飽差を計算する
 * @param {number} temperature - 温度（℃）
 * @param {number} humidity - 相対湿度（%）
 * @returns {number|null} 飽差（g/m³、小数1桁）。計算できなければ null
 */
export const calcHumidityDeficit = (temperature, humidity) => {
  if (typeof temperature !== 'number' || typeof humidity !== 'number'
    || !Number.isFinite(temperature) || !Number.isFinite(humidity)) {
    return null;
  }
  const rh = Math.min(100, Math.max(0, humidity));
  const saturationPressure = 6.1078 * Math.pow(10, (7.5 * temperature) / (temperature + 237.3));
  const saturationAmount = (217 * saturationPressure) / (temperature + 273.15);
  return Math.round(saturationAmount * (1 - rh / 100) * 10) / 10;
};

/**
 * 飽差の状態
 * @param {number|null} value - 飽差（g/m³）
 * @returns {{label: string, level: 'low'|'ok'|'high'|null}} low は多湿、high は乾燥
 */
export const judgeHumidityDeficit = (value) => {
  if (typeof value !== 'number') return { label: '', level: null };
  if (value < HUMIDITY_DEFICIT_RANGE.min) return { label: '多湿', level: 'low' };
  if (value > HUMIDITY_DEFICIT_RANGE.max) return { label: '乾燥', level: 'high' };
  return { label: '適正', level: 'ok' };
};
