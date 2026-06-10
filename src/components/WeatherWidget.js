import React, { useState, useEffect } from 'react';
import { 
  SunMedium, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudFog,
  Wind,
  Droplets,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { getCurrentWeather, getWeatherType, getWindDirection, getWeatherIconUrl } from '../utils/weather/weatherApi';

/**
 * 天気情報を表示するウィジェットコンポーネント
 */
const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    // コンポーネントマウント時に天気データを取得
    fetchWeatherData();
    
    // 10分ごとに天気データを更新
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    
    return () => clearInterval(interval); // クリーンアップ
  }, []);

  // 天気データを取得する関数
  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const data = await getCurrentWeather();
      
      if (data) {
        setWeatherData(data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('天気データを取得できませんでした');
      }
    } catch (err) {
      console.error('天気データの取得中にエラーが発生しました:', err);
      setError('天気データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 天気タイプに基づいてアイコンを取得
  const getWeatherIcon = (weatherId) => {
    const type = getWeatherType(weatherId);
    
    switch (type) {
      case 'clear':
        return <SunMedium className="h-6 w-6 text-yellow-500" />;
      case 'clouds':
        return weatherId === 801 || weatherId === 802 
          ? <CloudSun className="h-6 w-6 text-gray-500" /> 
          : <Cloud className="h-6 w-6 text-gray-500" />;
      case 'rain':
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'snow':
        return <CloudSnow className="h-6 w-6 text-blue-200" />;
      case 'thunderstorm':
        return <CloudLightning className="h-6 w-6 text-purple-500" />;
      case 'atmosphere':
        return <CloudFog className="h-6 w-6 text-gray-400" />;
      default:
        return <Cloud className="h-6 w-6 text-gray-500" />;
    }
  };

  // 更新時間を整形する関数
  const formatUpdateTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // 手動更新をトリガーする関数
  const handleRefresh = () => {
    fetchWeatherData();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 flex items-center">
      {loading ? (
        <div className="flex items-center space-x-2 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>読み込み中...</span>
        </div>
      ) : error ? (
        <div className="flex items-center space-x-2 text-red-500">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      ) : weatherData ? (
        <>
          <div className="flex items-center mr-3">
            {getWeatherIcon(weatherData.weather.id)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-xl font-semibold mr-1">
                {Math.round(weatherData.temp)}°C
              </span>
              <span className="text-xs text-gray-500">
                （体感 {Math.round(weatherData.feels_like)}°C）
              </span>
            </div>
            <div className="text-sm text-gray-600 flex items-center space-x-2">
              <span>{weatherData.weather.description}</span>
              <span className="text-gray-400">|</span>
              <span className="flex items-center">
                <Droplets className="h-3 w-3 mr-1" />
                {weatherData.humidity}%
              </span>
              <span className="flex items-center">
                <Wind className="h-3 w-3 mr-1" />
                {weatherData.wind_speed}m/s
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs font-medium text-gray-600">西条市</div>
            <div className="text-xs text-gray-400 flex items-center justify-end">
              <span>{formatUpdateTime(lastUpdated)}</span>
              <button 
                onClick={handleRefresh} 
                className="ml-1 p-1 rounded-full hover:bg-gray-100 transition-colors"
                title="更新"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-gray-400 text-sm">天気データがありません</div>
      )}
    </div>
  );
};

export default WeatherWidget;