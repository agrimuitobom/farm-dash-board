// 土壌水分センサーを付けているハウスか（ハウスの編集画面の「土壌水分センサーあり」）
//
// センサーを付けていない Pico が、つながっていないピンの値（100% など）を送ってくることがあるので、
// 「土壌水分センサーあり」にしていないハウスでは土壌水分を表示しない。
// 記録されたデータ自体は消さない（あとでセンサーありにすれば表示される）。

export const hasSoilSensor = (house) => house?.hasSoilSensor === true;

/**
 * 計測値から、表示しない土壌水分を取り除く（センサーありのハウスはそのまま）
 * @param {Object} house - ハウス（hasSoilSensor を見る）
 * @param {Object|null} reading - 計測値（soilMoisture を含むことがある）
 */
export const withoutUnusedSoil = (house, reading) => {
  if (!reading || hasSoilSensor(house) || reading.soilMoisture === undefined) return reading;
  const { soilMoisture, ...rest } = reading;
  return rest;
};
