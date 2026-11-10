// まとめページ（/summary）
//
// 人と AI アシスタント（Muse）が読むための、URL と表の形が変わらないページ。
// - 時刻はすべて日本時間。各ハウスの値は「いつ測った値か」を必ず出す
// - データが取れないときは見本の値を出さず、取れなかったことを出す
// - 同じ内容をページの最後に JSON（id="summary-json"）でも出す
// - ページ全体の読み込み状態は data-status（loading / ready / partial）と「状態」の行で分かる

import React, { useState, useEffect } from 'react';
import {
  getAllHouses,
  subscribeToEnvironmentalData,
  subscribeToUnresolvedAlerts,
  getEnvironmentalReadingsBetween
} from '../firestoreUtils';
import { getHouseThresholds } from '../utils/environmentalRanges';
import { calcHumidityDeficit, judgeHumidityDeficit } from '../utils/humidityDeficit';
import { normalizeAlert } from '../utils/alerts';
import { hasSoilSensor, withoutUnusedSoil } from '../utils/soilSensor';
import { toJstIso, formatJst, startOfJstDay, summarizeReadings } from '../utils/summary';
import { getCurrentWeather, getDailyForecast } from '../utils/weather/weatherApi';

// これより古いデータは「通信なし」（7インチ画面と同じ）
const OFFLINE_AFTER_MS = 10 * 60 * 1000;
// 今日のまとめと天気を取り直す間隔（開いたままにしたとき）
const REFRESH_MS = 60 * 60 * 1000;

const SEVERITY_LABELS = { high: '高', medium: '中', low: '低' };

const fmt = (value, digits) => (typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-');
const num = (value, digits) => (typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(digits)) : null);

const judgeReading = (house, reading) => {
  const t = getHouseThresholds(house);
  const notes = [];
  if (typeof reading.temperature === 'number') {
    if (reading.temperature > t.temperature.max) notes.push('高温');
    if (reading.temperature < t.temperature.min) notes.push('低温');
  }
  if (typeof reading.humidity === 'number') {
    if (reading.humidity > t.humidity.max) notes.push('多湿');
    if (reading.humidity < t.humidity.min) notes.push('乾燥');
  }
  return notes;
};

// ハウス1棟分の最新値の状態
const describeLatest = (house, reading, now) => {
  if (reading === undefined) return { status: '読み込み中' };
  if (reading === null || !(reading.timestamp instanceof Date)) return { status: 'データなし' };
  const ageMinutes = Math.floor((now - reading.timestamp.getTime()) / 60000);
  const deficit = calcHumidityDeficit(reading.temperature, reading.humidity);
  return {
    status: now - reading.timestamp.getTime() > OFFLINE_AFTER_MS ? '通信なし' : '受信中',
    measuredAt: reading.timestamp,
    ageMinutes,
    temperature: num(reading.temperature, 1),
    humidity: num(reading.humidity, 1),
    humidityDeficit: deficit,
    humidityDeficitState: judgeHumidityDeficit(deficit).label || null,
    soilMoisture: num(reading.soilMoisture, 1),
    co2: num(reading.co2, 0),
    notes: judgeReading(house, reading)
  };
};

const Cell = ({ children, className = '' }) => (
  <td className={`border border-gray-300 px-2 py-1 ${className}`}>{children}</td>
);
const Head = ({ children }) => (
  <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-left font-semibold">{children}</th>
);

const Summary = () => {
  const [now, setNow] = useState(Date.now());
  const [houses, setHouses] = useState(null);
  const [housesError, setHousesError] = useState(null);
  const [latest, setLatest] = useState({});
  const [alerts, setAlerts] = useState(null);
  const [today, setToday] = useState(null);
  const [todayError, setTodayError] = useState(null);
  const [weather, setWeather] = useState(undefined);
  const [forecast, setForecast] = useState(undefined);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  // ハウスの一覧（取れなければ見本を出さずにエラーを出す）
  useEffect(() => {
    getAllHouses()
      .then(list => setHouses(list || []))
      .catch((err) => {
        console.error('まとめページ: ハウスの取得に失敗しました:', err);
        setHousesError(formatJst(new Date()));
        setHouses([]);
      });
  }, []);

  // 各ハウスの最新値（リアルタイム）
  const houseIdsKey = (houses || []).map(h => h.id).join('\n');
  useEffect(() => {
    if (!houseIdsKey) return undefined;
    const unsubscribes = houseIdsKey.split('\n').map(id =>
      subscribeToEnvironmentalData(id, data => setLatest(prev => ({ ...prev, [id]: data })))
    );
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [houseIdsKey]);

  // 未解決のアラート
  useEffect(() => subscribeToUnresolvedAlerts(list => setAlerts(list.map(normalizeAlert)), 20), []);

  // 今日（日本時間0時から今まで）のまとめ。1時間ごとのまとめから読むので、ハウスあたり25件以下
  useEffect(() => {
    if (!houseIdsKey) return undefined;
    let cancelled = false;
    const load = async () => {
      try {
        const end = new Date();
        const start = startOfJstDay(end);
        const result = {};
        for (const id of houseIdsKey.split('\n')) {
          const { readings } = await getEnvironmentalReadingsBetween(id, start, end);
          result[id] = summarizeReadings(readings);
        }
        if (!cancelled) {
          setToday({ from: start, to: end, houses: result });
          setTodayError(null);
        }
      } catch (err) {
        console.error('まとめページ: 今日のまとめの取得に失敗しました:', err);
        if (!cancelled) setTodayError(formatJst(new Date()));
      }
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [houseIdsKey]);

  // 西条市の天気（Open-Meteo）
  useEffect(() => {
    const load = async () => {
      setWeather(await getCurrentWeather());
      setForecast(await getDailyForecast());
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const houseList = houses || [];
  const rows = houseList.map(house => ({ house, ...describeLatest(house, withoutUnusedSoil(house, latest[house.id]), now) }));
  // 今日のまとめも、土壌水分センサーの無いハウスは土壌水分を出さない
  const todayOf = (house) => {
    const s = today?.houses?.[house.id];
    return s && !hasSoilSensor(house) ? { ...s, soilMoisture: null } : s;
  };

  const latestLoaded = houses !== null && rows.every(r => r.status !== '読み込み中');
  const todayLoaded = houseList.length === 0 || today !== null || todayError !== null;
  const loaded = latestLoaded && alerts !== null && todayLoaded;
  const hasError = Boolean(housesError || todayError);
  const status = !loaded ? 'loading' : hasError ? 'partial' : 'ready';
  const statusText = { loading: '読み込み中', ready: '読み込み完了', partial: '読み込み完了（一部取得できませんでした）' }[status];

  const json = {
    page: 'farm-dashboard summary',
    status,
    generated_at: toJstIso(new Date(now)),
    offline_after_minutes: OFFLINE_AFTER_MS / 60000,
    errors: [
      ...(housesError ? [`ハウスの一覧を取得できませんでした（${housesError}）`] : []),
      ...(todayError ? [`今日のまとめを取得できませんでした（${todayError}）`] : [])
    ],
    houses: rows.map(r => ({
      id: r.house.id,
      name: r.house.name || r.house.id,
      crop: r.house.currentCrop || null,
      status: r.status,
      measured_at: toJstIso(r.measuredAt),
      age_minutes: r.ageMinutes ?? null,
      temperature: r.temperature ?? null,
      humidity: r.humidity ?? null,
      humidity_deficit: r.humidityDeficit ?? null,
      humidity_deficit_state: r.humidityDeficitState ?? null,
      soil_moisture: r.soilMoisture ?? null,
      co2: r.co2 ?? null,
      notes: r.notes || [],
      today: todayOf(r.house) ?? null
    })),
    today_range: today ? { from: toJstIso(today.from), to: toJstIso(today.to) } : null,
    alerts: (alerts || []).map(a => ({
      house: a.houseName,
      title: a.title || '',
      severity: a.severity,
      occurred_at: toJstIso(a.timestamp instanceof Date ? a.timestamp : null)
    })),
    weather: weather ? {
      source: 'Open-Meteo（西条市）',
      observed_at: toJstIso(weather.observedAt),
      description: weather.weather.description,
      temperature: weather.temp,
      humidity: weather.humidity
    } : null,
    forecast: (forecast || []).slice(0, 3).map(day => ({
      date: toJstIso(day.date)?.slice(0, 10) || null,
      description: day.description,
      max: day.max,
      min: day.min,
      precipitation_probability: day.precipitationProbability
    }))
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 max-w-6xl mx-auto text-sm" data-status={status}>
      <h1 className="text-xl font-bold">圃場データまとめ</h1>
      <p>ページの時刻: {formatJst(new Date(now))}（日本時間）</p>
      <p>状態: <strong id="summary-status">{statusText}</strong></p>
      {json.errors.map(message => (
        <p key={message} className="text-red-700 font-semibold">取得エラー: {message}</p>
      ))}

      <h2 className="text-lg font-bold mt-6 mb-2">各ハウスの最新値</h2>
      <p className="text-xs text-gray-600 mb-1">
        測定時刻はセンサーが値を送った時刻。{OFFLINE_AFTER_MS / 60000}分以上新しい値が無いハウスは「通信なし」。
      </p>
      {houses === null ? <p>読み込み中</p> : houseList.length === 0 ? <p>ハウスがありません</p> : (
        <div className="overflow-x-auto">
          <table id="summary-latest" className="border-collapse w-full">
            <thead>
              <tr>
                <Head>ハウス</Head><Head>作物</Head><Head>測定時刻</Head><Head>経過</Head><Head>状態</Head>
                <Head>温度(℃)</Head><Head>湿度(%)</Head><Head>飽差(g/m³)</Head><Head>土壌水分(%)</Head>
                <Head>CO2(ppm)</Head><Head>判定</Head>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.house.id}>
                  <Cell>{r.house.name || r.house.id}</Cell>
                  <Cell>{r.house.currentCrop || '-'}</Cell>
                  <Cell>{r.measuredAt ? formatJst(r.measuredAt) : '-'}</Cell>
                  <Cell>{typeof r.ageMinutes === 'number' ? `${r.ageMinutes}分前` : '-'}</Cell>
                  <Cell className={r.status === '受信中' ? '' : 'text-red-700 font-semibold'}>{r.status}</Cell>
                  <Cell>{fmt(r.temperature, 1)}</Cell>
                  <Cell>{fmt(r.humidity, 1)}</Cell>
                  <Cell>{fmt(r.humidityDeficit, 1)}{r.humidityDeficitState ? `（${r.humidityDeficitState}）` : ''}</Cell>
                  <Cell>{fmt(r.soilMoisture, 1)}</Cell>
                  <Cell>{fmt(r.co2, 0)}</Cell>
                  <Cell>{r.notes && r.notes.length > 0 ? r.notes.join('・') : (r.measuredAt ? '正常' : '-')}</Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-lg font-bold mt-6 mb-2">今日のまとめ</h2>
      <p className="text-xs text-gray-600 mb-1">
        {today ? `${formatJst(today.from)} 〜 ${formatJst(today.to)}（日本時間）の 平均 / 最高 / 最低` : ''}
      </p>
      {todayError ? <p className="text-red-700 font-semibold">今日のまとめを取得できませんでした（{todayError}）</p>
        : !today ? <p>{houseList.length === 0 && houses !== null ? 'ハウスがありません' : '読み込み中'}</p> : (
          <div className="overflow-x-auto">
            <table id="summary-today" className="border-collapse w-full">
              <thead>
                <tr>
                  <Head>ハウス</Head><Head>データ数</Head><Head>温度(℃)</Head><Head>湿度(%)</Head>
                  <Head>飽差(g/m³)</Head><Head>土壌水分(%)</Head><Head>CO2(ppm)</Head>
                </tr>
              </thead>
              <tbody>
                {houseList.map(house => {
                  const s = todayOf(house);
                  const range = (m, digits) => (s && s[m] ? `${fmt(s[m].avg, digits)} / ${fmt(s[m].max, digits)} / ${fmt(s[m].min, digits)}` : '-');
                  return (
                    <tr key={house.id}>
                      <Cell>{house.name || house.id}</Cell>
                      <Cell>{s ? s.count : 0}</Cell>
                      <Cell>{range('temperature', 1)}</Cell>
                      <Cell>{range('humidity', 1)}</Cell>
                      <Cell>{range('humidityDeficit', 1)}</Cell>
                      <Cell>{range('soilMoisture', 1)}</Cell>
                      <Cell>{range('co2', 0)}</Cell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      <h2 className="text-lg font-bold mt-6 mb-2">未解決のアラート</h2>
      {alerts === null ? <p>読み込み中</p> : alerts.length === 0 ? <p>未解決のアラートはありません</p> : (
        <table id="summary-alerts" className="border-collapse w-full">
          <thead>
            <tr><Head>発生時刻</Head><Head>ハウス</Head><Head>内容</Head><Head>重要度</Head></tr>
          </thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.id}>
                <Cell>{a.timestamp instanceof Date ? formatJst(a.timestamp) : '-'}</Cell>
                <Cell>{a.houseName || '-'}</Cell>
                <Cell>{a.title || a.description || '-'}</Cell>
                <Cell>{SEVERITY_LABELS[a.severity] || a.severity}</Cell>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="text-lg font-bold mt-6 mb-2">天気（西条市・Open-Meteo）</h2>
      {weather === undefined ? <p>読み込み中</p> : weather === null ? <p className="text-red-700">現在の天気を取得できませんでした</p> : (
        <p>
          {formatJst(weather.observedAt)} 時点: {weather.weather.description}・気温 {fmt(weather.temp, 1)}℃・湿度 {fmt(weather.humidity, 0)}%
        </p>
      )}
      {forecast === undefined ? null : forecast === null ? <p className="text-red-700">天気予報を取得できませんでした</p> : (
        <table id="summary-forecast" className="border-collapse mt-2">
          <thead>
            <tr><Head>日付</Head><Head>天気</Head><Head>最高(℃)</Head><Head>最低(℃)</Head><Head>降水確率(%)</Head></tr>
          </thead>
          <tbody>
            {json.forecast.map(day => (
              <tr key={day.date}>
                <Cell>{day.date}</Cell><Cell>{day.description}</Cell><Cell>{fmt(day.max, 0)}</Cell>
                <Cell>{fmt(day.min, 0)}</Cell><Cell>{day.precipitation_probability ?? '-'}</Cell>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="text-lg font-bold mt-6 mb-2">データ（JSON）</h2>
      <pre id="summary-json" className="bg-gray-50 border border-gray-300 p-2 text-xs overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(json, null, 2)}
      </pre>
    </div>
  );
};

export default Summary;
