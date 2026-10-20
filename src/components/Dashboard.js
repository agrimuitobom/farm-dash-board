import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  CloudSun,
  RefreshCw,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import WeatherWidget from './WeatherWidget';
import { getCurrentWeather } from '../utils/weather/weatherApi';
import HouseCard from './HouseCard';

// Firestoreユーティリティ関数をインポート
import { 
  getAllHouses, 
  getEnvironmentalHistory,
  getPendingTasks,
  subscribeToUnresolvedAlerts,
  formatFirestoreData,
  subscribeToEnvironmentalData
} from '../firestoreUtils';
import { normalizeAlert } from '../utils/alerts';
import { normalizeTask, PRIORITY_LABELS, PRIORITY_CLASSES } from '../utils/tasks';

// 数値でない（センサーが計測していない）項目は '--' と表示する
const formatValue = (value, digits) =>
  typeof value === 'number' ? value.toFixed(digits) : '--';

// 外気センサー（location が outdoor）のデータがこの時間内にあればそれを使い、
// なければ Open-Meteo の西条市の気象データを外気として表示する（7インチ画面と同じ基準）
const OUTDOOR_SENSOR_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// Open-Meteo の再取得間隔（WeatherWidget と同じ）
const WEATHER_REFRESH_MS = 10 * 60 * 1000;
// 推移グラフの再取得間隔
const CHART_REFRESH_MS = 5 * 60 * 1000;

const isRecentOutdoorSensor = (data) =>
  data?.timestamp instanceof Date && Date.now() - data.timestamp.getTime() < OUTDOOR_SENSOR_MAX_AGE_MS;

const toOutdoorDisplay = (sensorData, weather) => {
  if (isRecentOutdoorSensor(sensorData)) {
    return {
      source: '外気センサー',
      temperature: formatValue(sensorData.temperature, 1),
      humidity: formatValue(sensorData.humidity, 0),
      soilMoisture: typeof sensorData.soilMoisture === 'number' ? formatValue(sensorData.soilMoisture, 0) : null,
      weather: null,
      lastUpdated: sensorData.timestamp.toLocaleTimeString('ja-JP')
    };
  }
  if (weather) {
    return {
      source: '西条市（Open-Meteo）',
      temperature: formatValue(weather.temp, 1),
      humidity: formatValue(weather.humidity, 0),
      soilMoisture: null,
      weather: weather.weather.description,
      lastUpdated: weather.timestamp.toLocaleTimeString('ja-JP')
    };
  }
  return { source: '', temperature: '--', humidity: '--', soilMoisture: null, weather: null, lastUpdated: '--' };
};

// グラフに描く点の最大数（データ間隔に関わらずこの数程度に間引く）
const MAX_CHART_POINTS = 12;

const Dashboard = () => {
  // 環境データの状態
  const [outdoorSensor, setOutdoorSensor] = useState(null);
  const [weather, setWeather] = useState(null);
  
  // フォールバック用のダミーデータ
  const dummyHouses = [
    {
      id: '温室ハウス1',
      currentCrop: 'R6ミニトマト',
      plantDate: new Date('2025-02-15'),
      transplantDate: new Date('2025-03-01'),
      fertilizeDate: new Date('2025-03-20'),
      fertilizeInfo: '有機肥料500g/株',
      harvestAmount: 15,
      status: '生育中',
      image: 'https://placehold.jp/150/FF6B6B/FFFFFF?text=トマト',
    },
    {
      id: '温室ハウス2',
      currentCrop: 'キュウリ',
      plantDate: new Date('2025-02-10'),
      transplantDate: new Date('2025-02-25'),
      fertilizeDate: new Date('2025-03-15'),
      fertilizeInfo: '液肥散布',
      harvestAmount: 23,
      status: '生育中',
      image: 'https://placehold.jp/150/56E39F/FFFFFF?text=キュウリ',
    },
    {
      id: '温室ハウス3',
      currentCrop: 'パプリカ',
      plantDate: new Date('2025-01-20'),
      transplantDate: new Date('2025-02-10'),
      fertilizeDate: new Date('2025-03-05'),
      fertilizeInfo: '複合肥料300g/株',
      harvestAmount: 12,
      status: '生育中',
      image: 'https://placehold.jp/150/FF9A3C/FFFFFF?text=パプリカ',
    },
    {
      id: '温室ハウス4',
      currentCrop: 'レタス',
      plantDate: new Date('2025-02-28'),
      transplantDate: new Date('2025-03-15'),
      fertilizeDate: new Date('2025-03-25'),
      fertilizeInfo: '有機肥料200g/株',
      harvestAmount: 8,
      status: '生育中',
      image: 'https://placehold.jp/150/59CE8F/FFFFFF?text=レタス',
    },
    {
      id: '温室ハウス5',
      currentCrop: 'ナス',
      plantDate: new Date('2025-02-05'),
      transplantDate: new Date('2025-02-20'),
      fertilizeDate: new Date('2025-03-10'),
      fertilizeInfo: '有機肥料450g/株',
      harvestAmount: 18,
      status: '生育中',
      image: 'https://placehold.jp/150/9F44D3/FFFFFF?text=ナス',
    }
  ];
  
  // 状態の初期化
  const [houses, setHouses] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingDummyData, setIsUsingDummyData] = useState(false);
  const [housesEnvironmentalData, setHousesEnvironmentalData] = useState({});
  const [chartLocation, setChartLocation] = useState('');
  
  // Firestoreからのデータ取得
  useEffect(() => {
    // 外気の環境データをリアルタイム監視（初回の値もこのコールバックで届く）
    // データがまだ無い状態で開いても、センサーが送信を始めれば自動で表示される
    const unsubscribeEnvironmental = subscribeToEnvironmentalData('outdoor', setOutdoorSensor);
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // ハウス情報を取得
        const housesData = await getAllHouses();
        if (housesData && housesData.length > 0) {
          // タイムスタンプをDate型に変換
          const formattedHouses = housesData.map(house => formatFirestoreData(house));
          setHouses(formattedHouses);
        } else {
          setHouses(dummyHouses);
          setIsUsingDummyData(true);
        }
        
        // タスク情報を取得
        try {
          const tasksData = await getPendingTasks(5);
          if (tasksData && tasksData.length > 0) {
            setTasks(tasksData.map(task => normalizeTask(formatFirestoreData(task))));
          }
        } catch (err) {
          console.error('タスク取得エラー:', err);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('ダッシュボードデータ取得エラー:', err);
        setError('データの取得中にエラーが発生しました。ダミーデータを使用します。');
        // ダミーデータで続行
        setHouses(dummyHouses);
        setIsUsingDummyData(true);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // クリーンアップ関数
    return () => unsubscribeEnvironmental();
  }, []);

  // 未解決のアラート（新しい順に5件）をリアルタイム監視
  useEffect(() => subscribeToUnresolvedAlerts(
    (alertsData) => setAlerts(alertsData.map(normalizeAlert)),
    5
  ), []);

  // 各ハウスの環境データをリアルタイム監視（location がハウスIDのデータ）
  const houseIdsKey = isUsingDummyData ? '' : houses.map(house => house.id).join('\n');
  useEffect(() => {
    if (!houseIdsKey) return undefined;
    
    const unsubscribes = houseIdsKey.split('\n').map(houseId =>
      subscribeToEnvironmentalData(houseId, (data) => {
        setHousesEnvironmentalData(prev => ({ ...prev, [houseId]: data }));
      })
    );
    
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [houseIdsKey]);

  // 外気センサーが無いときに使う Open-Meteo の気象データ（10分ごとに更新）
  const refreshWeather = async () => {
    const data = await getCurrentWeather();
    if (data) setWeather(data);
  };
  useEffect(() => {
    refreshWeather();
    const timer = setInterval(refreshWeather, WEATHER_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);
  const outdoor = toOutdoorDisplay(outdoorSensor, weather);

  // 推移グラフで表示するハウス（最初はハウス一覧の先頭）
  useEffect(() => {
    if (!chartLocation && !isUsingDummyData && houses.length > 0) {
      setChartLocation(houses[0].id);
    }
  }, [houses, chartLocation, isUsingDummyData]);

  // 選んだハウスの過去24時間の推移（5分ごとに再取得）
  useEffect(() => {
    if (!chartLocation) return undefined;
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const envHistory = await getEnvironmentalHistory(chartLocation, 24);
        // 新しい順で返ってくるので古い順に並べ替え、送信間隔に関わらず
        // MAX_CHART_POINTS 点程度に間引く
        const ordered = envHistory
          .map(formatFirestoreData)
          .filter(d => d.timestamp instanceof Date)
          .reverse();
        const step = Math.max(1, Math.ceil(ordered.length / MAX_CHART_POINTS));
        const sampledData = ordered
          .filter((_, i) => i % step === 0)
          .map(d => ({
            name: d.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            温度: d.temperature,
            湿度: d.humidity,
            土壌水分: d.soilMoisture
          }));
        if (!cancelled) setChartData(sampledData);
      } catch (err) {
        console.error('環境データ履歴取得エラー:', err);
        if (!cancelled) setChartData([]);
      }
    };

    loadHistory();
    const timer = setInterval(loadHistory, CHART_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [chartLocation]);

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">ダッシュボード</h2>
        <p className="text-gray-600">圃場の概要と最新の状況</p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-medium">エラー</p>
          <p>{error}</p>
        </div>
      )}
      
      {isUsingDummyData && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
          <p className="font-medium">注意</p>
          <p>Firestoreのデータを取得できなかったため、ダミーデータを表示しています。ネットワークとログイン状態を確認してください。</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {/* 環境データのサマリーカード */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 flex items-center dashboard-card">
              <div className="p-3 rounded-full bg-red-100 mr-4">
                <Thermometer className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">外気温</p>
                <h3 className="text-xl font-bold">{outdoor.temperature} °C</h3>
                {outdoor.source && <p className="text-xs text-gray-400">{outdoor.source}</p>}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex items-center dashboard-card">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <Droplets className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">外気の湿度</p>
                <h3 className="text-xl font-bold">{outdoor.humidity} %</h3>
                {outdoor.source && <p className="text-xs text-gray-400">{outdoor.source}</p>}
              </div>
            </div>
            
            {/* 外気センサーに土壌水分があればそれを、無ければ天気を表示する */}
            {outdoor.soilMoisture !== null ? (
              <div className="bg-white rounded-lg shadow p-4 flex items-center dashboard-card">
                <div className="p-3 rounded-full bg-green-100 mr-4">
                  <Wind className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">土壌水分</p>
                  <h3 className="text-xl font-bold">{outdoor.soilMoisture} %</h3>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-4 flex items-center dashboard-card">
                <div className="p-3 rounded-full bg-green-100 mr-4">
                  <CloudSun className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">天気</p>
                  <h3 className="text-xl font-bold">{outdoor.weather || '--'}</h3>
                  {outdoor.weather && <p className="text-xs text-gray-400">西条市（Open-Meteo）</p>}
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow p-4 flex items-center dashboard-card">
              <div className="p-3 rounded-full bg-yellow-100 mr-4">
                <Sun className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">最終更新</p>
                <h3 className="text-md font-bold flex items-center">
                  {outdoor.lastUpdated}
                  <button 
                    onClick={refreshWeather}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100"
                    title="外気データを更新"
                  >
                    <RefreshCw className="h-4 w-4 text-gray-400" />
                  </button>
                </h3>
              </div>
            </div>
          </div>
          
          {/* 天気と環境データのグラフ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">天気予報</h3>
              <WeatherWidget />
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
              <div className="flex justify-between items-center mb-4 gap-2">
                <h3 className="text-lg font-semibold">環境データ推移（過去24時間）</h3>
                {!isUsingDummyData && houses.length > 0 && (
                  <select
                    value={chartLocation}
                    onChange={(e) => setChartLocation(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    aria-label="表示するハウス"
                  >
                    {houses.map(house => (
                      <option key={house.id} value={house.id}>{house.name || house.id}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="温度" stroke="#ef4444" dot={false} />
                      <Line type="monotone" dataKey="湿度" stroke="#3b82f6" dot={false} />
                      {chartData.some(d => typeof d.土壌水分 === 'number') && (
                        <Line type="monotone" dataKey="土壌水分" stroke="#10b981" dot={false} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-500">
                    <p>過去24時間のデータがありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 温室ハウス一覧 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">温室ハウス状況</h3>
              <Link to="/houses" className="text-green-600 hover:text-green-800 text-sm font-medium">
                すべて表示 →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {houses.length > 0 ? (
                houses.map(house => (
                  <HouseCard
                    key={house.id}
                    house={house}
                    environmentalData={housesEnvironmentalData[house.id] || null}
                  />
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-gray-500">
                  <p>ハウス情報がありません</p>
                  <p className="text-sm mt-2">管理者設定ページからデータを初期化してください</p>
                </div>
              )}
            </div>
          </div>
          
          {/* 作業タスクとアラート */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">未完了の作業</h3>
                <Link to="/calendar" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1" /> カレンダーを表示
                </Link>
              </div>
              
              <div className="divide-y">
                {tasks.length > 0 ? (
                  tasks.map(task => {
                    // 期限の日が終わっていれば期限切れ
                    const overdue = task.dueDate && task.dueDate < new Date(new Date().setHours(0, 0, 0, 0));
                    return (
                      <div key={task.id} className="py-3 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className={`text-sm ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                            期限: {task.dueDate ? task.dueDate.toLocaleDateString('ja-JP') : '未設定'}
                            {overdue && '（期限切れ）'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_CLASSES[task.priority] || PRIORITY_CLASSES.medium}`}>
                          {PRIORITY_LABELS[task.priority] || '中'}優先
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-3 text-gray-500">未完了の作業はありません</p>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">最新アラート</h3>
                <Link to="/alerts" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" /> すべてのアラート
                </Link>
              </div>
              
              <div className="divide-y">
                {alerts.length > 0 ? (
                  alerts.map(alert => (
                    <div key={alert.id} className="py-3">
                      <div className="flex items-start">
                        <span className={`p-1 rounded-full mr-2 ${
                          alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></span>
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-gray-500">
                            {alert.timestamp instanceof Date ? alert.timestamp.toLocaleString('ja-JP') : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-3 text-gray-500">アラートはありません</p>
                )}
              </div>
            </div>
          </div>

          {/* デバッグ情報（開発時のみ表示） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded border">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">デバッグ情報</h3>
              <p className="text-xs text-gray-600">ハウス数: {houses.length}</p>
              <p className="text-xs text-gray-600">環境データ時系列: {chartData.length}</p>
              <p className="text-xs text-gray-600">タスク数: {tasks.length}</p>
              <p className="text-xs text-gray-600">アラート数: {alerts.length}</p>
              <p className="text-xs text-gray-600">ダミーデータ使用: {isUsingDummyData ? 'はい' : 'いいえ'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;