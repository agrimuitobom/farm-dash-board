import React, { useState, useEffect } from 'react';
import {
  SunMedium,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Umbrella,
  Snowflake
} from 'lucide-react';
import {
  getDailyForecast,
  getWeatherType,
  getForecastDayLabel,
  FORECAST_REFRESH_MS,
  LOW_TEMP_WARNING
} from '../utils/weather/weatherApi';

const ICONS = {
  clear: [SunMedium, 'text-yellow-500'],
  partly_cloudy: [CloudSun, 'text-gray-500'],
  clouds: [Cloud, 'text-gray-500'],
  drizzle: [CloudRain, 'text-blue-500'],
  rain: [CloudRain, 'text-blue-500'],
  snow: [CloudSnow, 'text-blue-300'],
  thunderstorm: [CloudLightning, 'text-purple-500'],
  atmosphere: [CloudFog, 'text-gray-400']
};

const WeatherIcon = ({ code, className }) => {
  const [Icon, color] = ICONS[getWeatherType(code)] || [Cloud, 'text-gray-500'];
  return <Icon className={`${className} ${color} flex-shrink-0`} aria-hidden="true" />;
};

const formatTemp = (value) => (typeof value === 'number' ? Math.round(value) : '--');

const STYLES = {
  // ダッシュボード（PC・スマホ）
  normal: {
    row: 'py-1.5 text-sm',
    day: 'w-20',
    icon: 'h-5 w-5',
    desc: 'flex-1 min-w-0 truncate text-gray-600 ml-2',
    temp: 'w-20 text-right',
    rain: 'w-14 text-right',
    showDescription: true
  },
  // 7インチ画面（幅 300px の外気パネルの下）
  kiosk: {
    row: 'py-1 text-lg',
    day: 'w-[96px]',
    icon: 'h-6 w-6',
    desc: '',
    temp: 'flex-1 text-right',
    rain: 'w-[64px] text-right',
    showDescription: false
  }
};

/**
 * 西条市の今日から5日後までの天気予報（Open-Meteo、1時間ごとに取り直す）
 * @param {'normal'|'kiosk'} variant 表示する画面
 */
const DailyForecast = ({ variant = 'normal' }) => {
  const [forecast, setForecast] = useState(null);
  const [failed, setFailed] = useState(false);
  const style = STYLES[variant];

  useEffect(() => {
    const refresh = async () => {
      const data = await getDailyForecast();
      if (data) {
        setForecast(data);
        setFailed(false);
      } else {
        // 取得に失敗しても、前に取れた予報があればそのまま表示しておく
        setFailed(true);
      }
    };
    refresh();
    const timer = setInterval(refresh, FORECAST_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  if (!forecast) {
    return (
      <p className="text-sm text-gray-500 py-2">
        {failed ? '天気予報を取得できませんでした' : '天気予報を読み込み中…'}
      </p>
    );
  }

  const now = new Date();
  return (
    <div>
      <ul className="divide-y divide-gray-100">
        {forecast.map(day => (
          <li key={day.date.getTime()} className={`flex items-center ${style.row}`}>
            <span className={`${style.day} font-medium text-gray-800 whitespace-nowrap`}>
              {getForecastDayLabel(day.date, now)}
            </span>
            <span title={day.description} className="flex items-center min-w-0 flex-1">
              <WeatherIcon code={day.code} className={style.icon} />
              {style.showDescription && <span className={style.desc}>{day.description}</span>}
            </span>
            <span className={`${style.temp} whitespace-nowrap`}>
              <span className="text-red-600 font-semibold">{formatTemp(day.max)}°</span>
              <span className="text-gray-400 mx-0.5">/</span>
              <span
                className={day.lowTemp ? 'text-blue-700 font-bold' : 'text-blue-600'}
                title={day.lowTemp ? `最低気温 ${LOW_TEMP_WARNING}℃以下（低温注意）` : undefined}
              >
                {day.lowTemp && <Snowflake className="inline h-3.5 w-3.5 mr-0.5 align-[-1px]" aria-label="低温注意" />}
                {formatTemp(day.min)}°
              </span>
            </span>
            <span
              className={`${style.rain} whitespace-nowrap ${day.rainy ? 'text-blue-700 font-bold' : 'text-gray-500'}`}
              title="降水確率"
            >
              <Umbrella className="inline h-3.5 w-3.5 mr-0.5 align-[-1px]" aria-hidden="true" />
              {day.precipitationProbability !== null ? `${day.precipitationProbability}%` : '--'}
            </span>
          </li>
        ))}
      </ul>
      {variant === 'normal' && (
        <p className="mt-2 text-xs text-gray-400">
          西条市・最高/最低気温と降水確率
          <Snowflake className="inline h-3 w-3 mx-0.5 text-blue-700 align-[-1px]" aria-hidden="true" />
          は最低気温{LOW_TEMP_WARNING}℃以下（Open-Meteo、1時間ごとに更新）
        </p>
      )}
    </div>
  );
};

export default DailyForecast;
