// ハウスの「栽培作物」（houses の crops 配列）から、作物名と定植日をまとめる
//
// ハウス詳細の「栽培作物」で登録した作物を正とし、ハウスカード・7インチ画面・収穫記録などが
// 使う currentCrop（作物名）と plantDate（定植日）をそこから求める。
// crops が空のハウス（作物を登録していないハウス）は、ハウスの編集画面で入れた値をそのまま使う。

/**
 * 作物の日付を Date にそろえる（Firestore の Timestamp・Date・"yyyy-MM-dd" の文字列に対応）
 * @returns {Date|null} 読めなければ null
 */
export const toDateValue = (value) => {
  if (!value) return null;
  let date = null;
  if (typeof value === 'string') {
    // "yyyy-MM-dd" は日本時間のその日として扱う
    date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value.toDate === 'function') {
    date = value.toDate();
  } else if (typeof value.seconds === 'number') {
    date = new Date(value.seconds * 1000);
  }
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

/**
 * 栽培作物から作物名（複数なら「・」でつなぐ）と定植日（いちばん早い栽培開始日）を求める
 * @param {Array} crops - houses の crops 配列
 * @returns {{currentCrop: string, plantDate: Date|null}}
 */
export const summarizeCrops = (crops) => {
  const names = [...new Set(crops.map(crop => (crop.cropName || '').trim()).filter(Boolean))];
  const startDates = crops.map(crop => toDateValue(crop.startDate)).filter(Boolean);
  return {
    currentCrop: names.join('・'),
    plantDate: startDates.length > 0 ? new Date(Math.min(...startDates)) : null
  };
};

/**
 * 栽培作物が登録されていれば、currentCrop と plantDate をそこから求めた値にしたハウスを返す
 * @param {Object} house - ハウス
 * @returns {Object}
 */
export const withCropSummary = (house) => {
  if (!house || !Array.isArray(house.crops) || house.crops.length === 0) return house;
  const { currentCrop, plantDate } = summarizeCrops(house.crops);
  return {
    ...house,
    currentCrop: currentCrop || house.currentCrop,
    plantDate: plantDate || house.plantDate
  };
};
