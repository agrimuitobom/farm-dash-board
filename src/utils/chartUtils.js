// chartUtils.js
// グラフ用データ整形ユーティリティ

/**
 * 横棒グラフ用にデータを整形する
 * @param {Array} data - 元データの配列
 * @param {string} nameKey - 名前のキー
 * @param {Array} valueKeys - 値のキーの配列
 * @param {Array} colors - 色の配列
 * @returns {Object} グラフ設定
 */
export const formatBarChartData = (data, nameKey, valueKeys, colors = ['#4f46e5', '#60a5fa', '#93c5fd']) => {
  if (!data || data.length === 0) return { data: [], bars: [] };
  
  const chartData = [...data];
  
  // 各値に対応するバー設定を作成
  const bars = valueKeys.map((key, index) => ({
    dataKey: key,
    fill: colors[index % colors.length],
    name: key
  }));
  
  return { data: chartData, bars };
};

/**
 * 積み上げ棒グラフ用にデータを整形する
 * @param {Array} data - 元データの配列
 * @param {string} nameKey - 名前のキー
 * @param {Array} valueKeys - 値のキーの配列
 * @param {Array} colors - 色の配列
 * @returns {Object} グラフ設定
 */
export const formatStackedBarChartData = (data, nameKey, valueKeys, colors = ['#4f46e5', '#60a5fa', '#93c5fd']) => {
  return formatBarChartData(data, nameKey, valueKeys, colors);
};

/**
 * 円グラフ用にデータを整形する
 * @param {Array} data - 元データの配列
 * @param {string} nameKey - 名前のキー
 * @param {string} valueKey - 値のキー
 * @param {Array} colors - 色の配列
 * @returns {Array} 整形されたデータ
 */
export const formatPieChartData = (data, nameKey, valueKey, colors = ['#4f46e5', '#60a5fa', '#93c5fd', '#818cf8', '#c7d2fe']) => {
  if (!data || data.length === 0) return [];
  
  return data.map((item, index) => ({
    name: item[nameKey],
    value: item[valueKey],
    fill: colors[index % colors.length]
  }));
};

/**
 * 折れ線グラフ用にデータを整形する
 * @param {Array} data - 元データの配列
 * @param {string} xAxisKey - X軸のキー
 * @param {Array} lineKeys - 線ごとのキーの配列
 * @param {Array} colors - 色の配列
 * @returns {Object} グラフ設定
 */
export const formatLineChartData = (data, xAxisKey, lineKeys, colors = ['#4f46e5', '#60a5fa', '#93c5fd', '#818cf8', '#c7d2fe']) => {
  if (!data || data.length === 0) return { data: [], lines: [] };
  
  // データは変更なしで使用
  const chartData = [...data];
  
  // 各線のプロパティを設定
  const lines = lineKeys.map((key, index) => ({
    dataKey: key,
    stroke: colors[index % colors.length],
    name: key
  }));
  
  return { data: chartData, lines };
};

/**
 * レーダーチャート用にデータを整形する
 * @param {Array} data - 元データの配列
 * @param {Array} keys - 各軸のキー
 * @param {string} nameKey - エンティティ名のキー
 * @param {Array} colors - 色の配列
 * @returns {Object} グラフ設定
 */
export const formatRadarChartData = (data, keys, nameKey, colors = ['#4f46e5', '#60a5fa', '#93c5fd']) => {
  if (!data || data.length === 0) return { data: [], entities: [] };
  
  // レーダーチャート用に軸ごとにデータを整形
  const chartData = keys.map(key => {
    const obj = { key };
    data.forEach(item => {
      obj[item[nameKey]] = item[key];
    });
    return obj;
  });
  
  // エンティティごとの設定
  const entities = data.map((item, index) => ({
    dataKey: item[nameKey],
    fill: colors[index % colors.length],
    stroke: colors[index % colors.length],
    name: item[nameKey]
  }));
  
  return { data: chartData, entities };
};

/**
 * 散布図用にデータを整形する
 * @param {Array} data - 元データの配列
 * @param {string} xKey - X軸のキー
 * @param {string} yKey - Y軸のキー
 * @param {string} nameKey - 名前のキー
 * @param {string} sizeKey - サイズのキー（オプション）
 * @returns {Array} 整形されたデータ
 */
export const formatScatterChartData = (data, xKey, yKey, nameKey, sizeKey = null) => {
  if (!data || data.length === 0) return [];
  
  return data.map(item => {
    const obj = {
      x: item[xKey],
      y: item[yKey],
      name: item[nameKey]
    };
    
    if (sizeKey && item[sizeKey] !== undefined) {
      obj.z = item[sizeKey]; // バブルチャート用のサイズ
    }
    
    return obj;
  });
};

/**
 * 複合チャート用にデータを整形する
 * @param {Array} data - 元データの配列
 * @param {string} xAxisKey - X軸のキー
 * @param {Array} barKeys - 棒グラフのキーの配列
 * @param {Array} lineKeys - 線グラフのキーの配列
 * @param {Array} barColors - 棒グラフの色の配列
 * @param {Array} lineColors - 線グラフの色の配列
 * @returns {Object} グラフ設定
 */
export const formatComposedChartData = (
  data, 
  xAxisKey, 
  barKeys, 
  lineKeys, 
  barColors = ['#4f46e5', '#60a5fa'], 
  lineColors = ['#ef4444', '#f97316']
) => {
  if (!data || data.length === 0) return { data: [], bars: [], lines: [] };
  
  // 棒グラフの設定
  const bars = barKeys.map((key, index) => ({
    dataKey: key,
    fill: barColors[index % barColors.length],
    name: key
  }));
  
  // 線グラフの設定
  const lines = lineKeys.map((key, index) => ({
    dataKey: key,
    stroke: lineColors[index % lineColors.length],
    name: key
  }));
  
  return { data: [...data], bars, lines };
};

/**
 * 年月の文字列をわかりやすい表示形式に変換する
 * @param {string} yearMonth - "YYYY-MM" 形式の文字列
 * @returns {string} "YYYY年MM月" 形式の文字列
 */
export const formatYearMonth = (yearMonth) => {
  if (!yearMonth || typeof yearMonth !== 'string') return '';
  
  const [year, month] = yearMonth.split('-');
  return `${year}年${parseInt(month)}月`;
};

/**
 * 小数点以下の桁数を指定してフォーマットする
 * @param {number} value - 数値
 * @param {number} digits - 小数点以下の桁数
 * @returns {string} フォーマットされた文字列
 */
export const formatDecimal = (value, digits = 1) => {
  if (value === undefined || value === null) return '-';
  return value.toFixed(digits);
};

/**
 * 数値を単位付きでフォーマットする
 * @param {number} value - 数値
 * @param {string} unit - 単位
 * @returns {string} 単位付きの文字列
 */
export const formatWithUnit = (value, unit = '') => {
  if (value === undefined || value === null) return '-';
  return `${value} ${unit}`;
};

/**
 * パーセンテージをフォーマットする
 * @param {number} value - 数値（0-1）
 * @param {number} digits - 小数点以下の桁数
 * @returns {string} パーセント形式の文字列
 */
export const formatPercent = (value, digits = 1) => {
  if (value === undefined || value === null) return '-';
  return `${(value * 100).toFixed(digits)}%`;
};

/**
 * 増減率をフォーマットし、適切なスタイルクラスを返す
 * @param {number} current - 現在値
 * @param {number} previous - 過去値
 * @returns {Object} {value, className} 形式のオブジェクト
 */
export const formatGrowthRate = (current, previous) => {
  if (current === undefined || previous === undefined || previous === 0) {
    return { value: '-', className: '' };
  }
  
  const rate = ((current / previous) - 1) * 100;
  const className = rate >= 0 ? 'text-green-600' : 'text-red-600';
  const prefix = rate >= 0 ? '+' : '';
  const value = `${prefix}${rate.toFixed(1)}%`;
  
  return { value, className };
};
