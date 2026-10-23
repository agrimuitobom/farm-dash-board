/**
 * Open-Meteo（https://open-meteo.com/）から西条市の天気データを取得するユーティリティ
 *
 * - API キー不要・無料（非商用利用）
 * - データは CC BY 4.0。画面に「Open-Meteo」の出典を表示すること
 */

// 西条市の緯度・経度（市の中心付近の座標）
const SAIJO_LAT = 33.9197;
const SAIJO_LON = 133.1823;

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'surface_pressure',
  'is_day'
].join(',');

const FORECAST_URL =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${SAIJO_LAT}&longitude=${SAIJO_LON}` +
  `&current=${CURRENT_FIELDS}` +
  '&daily=sunrise,sunset&forecast_days=1' +
  '&wind_speed_unit=ms&timezone=Asia%2FTokyo';

// WMO 天気コード → 日本語の説明
// https://open-meteo.com/en/docs の「WMO Weather interpretation codes」
const WEATHER_DESCRIPTIONS = {
  0: '快晴',
  1: '晴れ',
  2: '晴れ時々曇り',
  3: '曇り',
  45: '霧',
  48: '霧（着氷）',
  51: '弱い霧雨',
  53: '霧雨',
  55: '強い霧雨',
  56: '着氷性の霧雨',
  57: '強い着氷性の霧雨',
  61: '小雨',
  63: '雨',
  65: '大雨',
  66: '着氷性の雨',
  67: '強い着氷性の雨',
  71: '小雪',
  73: '雪',
  75: '大雪',
  77: '霧雪',
  80: 'にわか雨',
  81: '強いにわか雨',
  82: '激しいにわか雨',
  85: 'にわか雪',
  86: '強いにわか雪',
  95: '雷雨',
  96: '雷雨（ひょう）',
  99: '激しい雷雨（ひょう）'
};

/**
 * Open-Meteo の応答を画面で使う形に変換する
 * @param {Object} data Open-Meteo /v1/forecast の応答
 * @returns {Object} 天気データ
 */
export const parseCurrentWeather = (data) => {
  const current = data.current;
  const code = current.weather_code;
  return {
    temp: current.temperature_2m, // 気温（℃）
    feels_like: current.apparent_temperature, // 体感温度（℃）
    humidity: current.relative_humidity_2m, // 湿度（%）
    pressure: current.surface_pressure, // 気圧（hPa）
    wind_speed: current.wind_speed_10m, // 風速（m/s）
    wind_direction: current.wind_direction_10m, // 風向き（度）
    is_day: current.is_day === 1,
    weather: {
      id: code, // WMO 天気コード
      description: WEATHER_DESCRIPTIONS[code] || '不明'
    },
    location: '西条市',
    sunrise: data.daily?.sunrise?.[0] ? new Date(data.daily.sunrise[0]) : null,
    sunset: data.daily?.sunset?.[0] ? new Date(data.daily.sunset[0]) : null,
    observedAt: new Date(current.time), // Open-Meteo 側の観測（解析）時刻
    timestamp: new Date() // データ取得時刻
  };
};

/**
 * 現在の天気を取得する
 * @returns {Promise<Object|null>} 天気データ。取得できなければ null
 */
export const getCurrentWeather = async () => {
  try {
    const response = await fetch(FORECAST_URL);
    if (!response.ok) {
      console.warn(`Open-Meteo の呼び出しに失敗しました: ${response.status}`);
      return null;
    }
    return parseCurrentWeather(await response.json());
  } catch (error) {
    console.error('天気データの取得に失敗しました:', error);
    return null;
  }
};

const HOURLY_URL =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${SAIJO_LAT}&longitude=${SAIJO_LON}` +
  '&hourly=temperature_2m,relative_humidity_2m' +
  '&past_days=1&forecast_days=1&timezone=Asia%2FTokyo';

/**
 * Open-Meteo の1時間ごとの値から、指定した時間内の過去分だけを取り出す
 * @param {Object} data Open-Meteo /v1/forecast（hourly）の応答
 * @param {Date} now 現在時刻
 * @param {number} hours 何時間前まで取り出すか
 * @returns {Array<{timestamp: Date, temperature: number, humidity: number}>} 古い順
 */
export const parseRecentHourlyWeather = (data, now = new Date(), hours = 24) => {
  const { time = [], temperature_2m: temps = [], relative_humidity_2m: hums = [] } = data.hourly || {};
  const from = now.getTime() - hours * 60 * 60 * 1000;
  return time
    .map((t, i) => ({ timestamp: new Date(t), temperature: temps[i], humidity: hums[i] }))
    .filter(r => r.timestamp.getTime() >= from && r.timestamp.getTime() <= now.getTime());
};

/**
 * 西条市の過去24時間の気温・湿度（1時間ごと）を取得する
 * @returns {Promise<Array>} 古い順の配列。取得できなければ空配列
 */
export const getRecentHourlyWeather = async (hours = 24) => {
  try {
    const response = await fetch(HOURLY_URL);
    if (!response.ok) {
      console.warn(`Open-Meteo の呼び出しに失敗しました: ${response.status}`);
      return [];
    }
    return parseRecentHourlyWeather(await response.json(), new Date(), hours);
  } catch (error) {
    console.error('天気の推移データの取得に失敗しました:', error);
    return [];
  }
};

// 今日から5日後までの日ごとの予報
export const FORECAST_DAYS = 6;
// 予報の再取得間隔（予報は1日に数回しか更新されないので1時間ごとで十分）
export const FORECAST_REFRESH_MS = 60 * 60 * 1000;
// 最低気温がこの値以下の日に「低温注意」を付ける（ハウスの保温の目安）
export const LOW_TEMP_WARNING = 5;
// 降水確率がこの値以上の日に「雨」を強調する
export const RAIN_PROBABILITY_WARNING = 60;

const DAILY_URL =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${SAIJO_LAT}&longitude=${SAIJO_LON}` +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,' +
  'precipitation_probability_max,precipitation_sum,wind_speed_10m_max' +
  `&forecast_days=${FORECAST_DAYS}&wind_speed_unit=ms&timezone=Asia%2FTokyo`;

/**
 * Open-Meteo の日ごとの予報を画面で使う形に変換する
 * @param {Object} data Open-Meteo /v1/forecast（daily）の応答
 * @returns {Array<{date: Date, code: number, description: string, max: number, min: number,
 *   precipitationProbability: number|null, precipitation: number|null, windMax: number|null,
 *   lowTemp: boolean, rainy: boolean}>} 日付の古い順
 */
export const parseDailyForecast = (data) => {
  const daily = data.daily || {};
  const time = daily.time || [];
  const valueAt = (key, i) => (typeof daily[key]?.[i] === 'number' ? daily[key][i] : null);
  return time.map((day, i) => {
    // "2026-10-23" は日本時間の日付なので、ローカル時刻の 0 時として作る
    const [y, m, d] = day.split('-').map(Number);
    const code = valueAt('weather_code', i);
    const min = valueAt('temperature_2m_min', i);
    const precipitationProbability = valueAt('precipitation_probability_max', i);
    return {
      date: new Date(y, m - 1, d),
      code,
      description: WEATHER_DESCRIPTIONS[code] || '不明',
      max: valueAt('temperature_2m_max', i),
      min,
      precipitationProbability,
      precipitation: valueAt('precipitation_sum', i),
      windMax: valueAt('wind_speed_10m_max', i),
      lowTemp: min !== null && min <= LOW_TEMP_WARNING,
      rainy: precipitationProbability !== null && precipitationProbability >= RAIN_PROBABILITY_WARNING
    };
  });
};

/**
 * 西条市の今日から5日後までの日ごとの予報を取得する
 * @returns {Promise<Array|null>} 日付の古い順の配列。取得できなければ null
 */
export const getDailyForecast = async () => {
  try {
    const response = await fetch(DAILY_URL);
    if (!response.ok) {
      console.warn(`Open-Meteo の呼び出しに失敗しました: ${response.status}`);
      return null;
    }
    return parseDailyForecast(await response.json());
  } catch (error) {
    console.error('天気予報の取得に失敗しました:', error);
    return null;
  }
};

/**
 * 予報の日付の表示名（今日・明日・それ以降は「10/25(土)」）
 * @param {Date} date 予報の日付（0 時）
 * @param {Date} now 現在時刻
 * @returns {string}
 */
export const getForecastDayLabel = (date, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((date - today) / (24 * 60 * 60 * 1000));
  if (diff === 0) return '今日';
  if (diff === 1) return '明日';
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${date.getMonth() + 1}/${date.getDate()}(${weekday})`;
};

/**
 * 風向きを方角（16方位）に変換
 * @param {number} degrees 風向き（度）
 * @returns {string} 方角（例: 北、北北東）
 */
export const getWindDirection = (degrees) => {
  const directions = [
    '北', '北北東', '北東', '東北東',
    '東', '東南東', '南東', '南南東',
    '南', '南南西', '南西', '西南西',
    '西', '西北西', '北西', '北北西'
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

/**
 * WMO 天気コードからアイコン用の天気タイプに変換
 * @param {number} code WMO 天気コード
 * @returns {string} 天気タイプ
 */
export const getWeatherType = (code) => {
  if (code === 0 || code === 1) return 'clear';                   // 快晴・晴れ
  if (code === 2) return 'partly_cloudy';                         // 晴れ時々曇り
  if (code === 3) return 'clouds';                                // 曇り
  if (code === 45 || code === 48) return 'atmosphere';            // 霧
  if (code >= 51 && code <= 57) return 'drizzle';                 // 霧雨
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'; // 雨・にわか雨
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'; // 雪
  if (code >= 95) return 'thunderstorm';                          // 雷雨
  return 'unknown';
};
