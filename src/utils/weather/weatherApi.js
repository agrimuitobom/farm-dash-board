/**
 * OpenWeather APIを利用して天気データを取得するユーティリティ
 */

// 西条市の緯度・経度（市の中心付近の座標）
const SAIJO_LAT = 33.9197;
const SAIJO_LON = 133.1823;

/**
 * OpenWeather APIから現在の天気データを取得
 * @returns {Promise<Object>} 天気データ
 */
export const getCurrentWeather = async () => {
  try {
    const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
    
    // APIキーが設定されていない、またはデフォルト値の場合はモックデータを返す
    if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey === 'YOUR_API_KEY_HERE' || apiKey.includes('YOUR_API')) {
      return getMockWeatherData();
    }
    
    // 現在の天気を取得するAPI呼び出し（西条市の座標を使用）
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${SAIJO_LAT}&lon=${SAIJO_LON}&units=metric&lang=ja&appid=${apiKey}`
    );
    
    if (!response.ok) {
      console.warn(`OpenWeather API呼び出しに失敗しました: ${response.status}。モックデータを使用します。`);
      return getMockWeatherData();
    }
    
    const data = await response.json();
    
    // 必要なデータだけ抽出して返す
    return {
      temp: data.main.temp, // 温度（摂氏）
      feels_like: data.main.feels_like, // 体感温度
      humidity: data.main.humidity, // 湿度（%）
      pressure: data.main.pressure, // 気圧（hPa）
      wind_speed: data.wind.speed, // 風速（m/s）
      wind_direction: data.wind.deg, // 風向き（度）
      weather: {
        id: data.weather[0].id, // 天気ID
        main: data.weather[0].main, // 主な天気（英語）
        description: data.weather[0].description, // 天気の説明（日本語）
        icon: data.weather[0].icon // アイコンコード
      },
      location: data.name, // 地域名
      country: data.sys.country, // 国コード
      sunrise: new Date(data.sys.sunrise * 1000), // 日の出時刻
      sunset: new Date(data.sys.sunset * 1000), // 日の入り時刻
      timestamp: new Date(), // データ取得時刻
    };
  } catch (error) {
    console.error('天気データの取得に失敗しました:', error);
    return getMockWeatherData();
  }
};

/**
 * 5日間の天気予報データを取得（3時間ごと）
 * @returns {Promise<Array>} 予報データの配列
 */
export const getWeatherForecast = async () => {
  try {
    const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      console.error('OpenWeather API keyが設定されていません。');
      return null;
    }
    
    // 5日間の予報を取得するAPI呼び出し（西条市の座標を使用）
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${SAIJO_LAT}&lon=${SAIJO_LON}&units=metric&lang=ja&appid=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`API呼び出しに失敗しました: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 必要なデータを整形して返す
    return data.list.map(item => ({
      dt: new Date(item.dt * 1000), // 予報日時
      temp: item.main.temp, // 温度
      humidity: item.main.humidity, // 湿度
      weather: {
        id: item.weather[0].id,
        main: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon
      },
      wind_speed: item.wind.speed,
      wind_direction: item.wind.deg,
      pop: item.pop * 100, // 降水確率（%）
    }));
  } catch (error) {
    console.error('天気予報データの取得に失敗しました:', error);
    return null;
  }
};

/**
 * 天気アイコンのURLを取得
 * @param {string} iconCode アイコンコード
 * @param {number} size アイコンサイズ (1x, 2x, 4x) デフォルトは2x
 * @returns {string} アイコン画像のURL
 */
export const getWeatherIconUrl = (iconCode, size = '2x') => {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
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
 * 天気IDからカスタム天気タイプに変換
 * @param {number} weatherId OpenWeatherの天気ID
 * @returns {string} カスタム天気タイプ
 */
export const getWeatherType = (weatherId) => {
  if (weatherId >= 200 && weatherId < 300) return 'thunderstorm'; // 雷雨
  if (weatherId >= 300 && weatherId < 400) return 'drizzle';      // 霧雨
  if (weatherId >= 500 && weatherId < 600) return 'rain';         // 雨
  if (weatherId >= 600 && weatherId < 700) return 'snow';         // 雪
  if (weatherId >= 700 && weatherId < 800) return 'atmosphere';   // 霧など
  if (weatherId === 800) return 'clear';                          // 晴れ
  if (weatherId > 800) return 'clouds';                           // 曇り
  return 'unknown';
};

/**
 * モックの天気データを生成（APIキーがない場合やテスト用）
 * @returns {Object} モック天気データ
 */
export const getMockWeatherData = () => {
  return {
    temp: 22.5,
    feels_like: 23.1,
    humidity: 65,
    pressure: 1015,
    wind_speed: 3.6,
    wind_direction: 180,
    weather: {
      id: 800,
      main: 'Clear',
      description: '晴れ',
      icon: '01d'
    },
    location: '西条市',
    country: 'JP',
    sunrise: new Date(new Date().setHours(6, 0, 0, 0)),
    sunset: new Date(new Date().setHours(18, 0, 0, 0)),
    timestamp: new Date(),
  };
};
