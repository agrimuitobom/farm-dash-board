import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  RefreshCw,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import WeatherWidget from './WeatherWidget';
import HouseCard from './HouseCard';

// Firestoreユーティリティ関数をインポート
import { 
  getAllHouses, 
  getLatestEnvironmentalData, 
  getEnvironmentalHistory,
  getPendingTasks,
  getUnresolvedAlerts,
  formatFirestoreData,
  subscribeToEnvironmentalData
} from '../firestoreUtils';

// 数値でない（センサーが計測していない）項目は '--' と表示する
const formatValue = (value, digits) =>
  typeof value === 'number' ? value.toFixed(digits) : '--';

const toEnvironmentDisplay = (data) => ({
  temperature: formatValue(data?.temperature, 1),
  humidity: formatValue(data?.humidity, 0),
  soilMoisture: formatValue(data?.soilMoisture, 0),
  lastUpdated: data?.timestamp instanceof Date ? data.timestamp.toLocaleTimeString() : '--'
});

// グラフに描く点の最大数（データ間隔に関わらずこの数程度に間引く）
const MAX_CHART_POINTS = 12;

const Dashboard = () => {
  // 環境データの状態
  const [environmentData, setEnvironmentData] = useState(toEnvironmentDisplay(null));
  
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
  
  // Firestoreからのデータ取得
  useEffect(() => {
    // 外気の環境データをリアルタイム監視（初回の値もこのコールバックで届く）
    // データがまだ無い状態で開いても、センサーが送信を始めれば自動で表示される
    const unsubscribeEnvironmental = subscribeToEnvironmentalData('outdoor', (data) => {
      if (data) {
        setEnvironmentData(toEnvironmentDisplay(data));
      }
    });
    
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
        
        // 環境データの履歴を取得して、グラフ用に加工
        try {
          const envHistory = await getEnvironmentalHistory('outdoor', 24);
          if (envHistory && envHistory.length > 0) {
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
                name: d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                温度: d.temperature,
                湿度: d.humidity,
                土壌水分: d.soilMoisture
              }));
            setChartData(sampledData);
          } else {
            // ダミーのチャートデータを設定
            setChartData([
              { name: '06:00', 温度: 18, 湿度: 72, 土壌水分: 79 },
              { name: '08:00', 温度: 20, 湿度: 68, 土壌水分: 78 },
              { name: '10:00', 温度: 22, 湿度: 65, 土壌水分: 77 },
              { name: '12:00', 温度: 24, 湿度: 60, 土壌水分: 75 },
              { name: '14:00', 温度: 26, 湿度: 62, 土壌水分: 74 },
              { name: '16:00', 温度: 25, 湿度: 65, 土壌水分: 76 },
              { name: '18:00', 温度: 23, 湿度: 67, 土壌水分: 78 },
              { name: '20:00', 温度: 21, 湿度: 70, 土壌水分: 79 },
            ]);
          }
        } catch (err) {
          console.error('環境データ履歴取得エラー:', err);
          // ダミーデータで続行
          setChartData([
            { name: '06:00', 温度: 18, 湿度: 72, 土壌水分: 79 },
            { name: '08:00', 温度: 20, 湿度: 68, 土壌水分: 78 },
            { name: '10:00', 温度: 22, 湿度: 65, 土壌水分: 77 },
            { name: '12:00', 温度: 24, 湿度: 60, 土壌水分: 75 },
            { name: '14:00', 温度: 26, 湿度: 62, 土壌水分: 74 },
            { name: '16:00', 温度: 25, 湿度: 65, 土壌水分: 76 },
            { name: '18:00', 温度: 23, 湿度: 67, 土壌水分: 78 },
            { name: '20:00', 温度: 21, 湿度: 70, 土壌水分: 79 },
          ]);
        }
        
        // タスク情報を取得
        try {
          const tasksData = await getPendingTasks(5);
          if (tasksData && tasksData.length > 0) {
            const formattedTasks = tasksData.map(task => {
              const formattedTask = formatFirestoreData(task);
              return {
                id: formattedTask.id,
                title: formattedTask.title,
                dueDate: formattedTask.dueDate ? formattedTask.dueDate.toLocaleDateString() : '未設定',
                priority: formattedTask.priority || '中'
              };
            });
            setTasks(formattedTasks);
          } else {
            // ダミーのタスクデータを設定
            setTasks([
              { id: 1, title: '温室ハウス2の水やり', dueDate: '2025-03-31', priority: '高' },
              { id: 2, title: 'トマトの収穫', dueDate: '2025-04-01', priority: '中' },
              { id: 3, title: '温室ハウス4の追肥', dueDate: '2025-04-02', priority: '中' },
              { id: 4, title: '温室ハウス1の害虫防除', dueDate: '2025-04-03', priority: '高' },
            ]);
          }
        } catch (err) {
          console.error('タスク取得エラー:', err);
          // ダミーデータで続行
          setTasks([
            { id: 1, title: '温室ハウス2の水やり', dueDate: '2025-03-31', priority: '高' },
            { id: 2, title: 'トマトの収穫', dueDate: '2025-04-01', priority: '中' },
            { id: 3, title: '温室ハウス4の追肥', dueDate: '2025-04-02', priority: '中' },
            { id: 4, title: '温室ハウス1の害虫防除', dueDate: '2025-04-03', priority: '高' },
          ]);
        }
        
        // アラート情報を取得
        try {
          const alertsData = await getUnresolvedAlerts(5);
          if (alertsData && alertsData.length > 0) {
            const formattedAlerts = alertsData.map(alert => {
              const formattedAlert = formatFirestoreData(alert);
              return {
                id: formattedAlert.id,
                title: formattedAlert.title,
                timestamp: formattedAlert.timestamp ? formattedAlert.timestamp.toLocaleString() : '不明',
                severity: formattedAlert.severity || '注意'
              };
            });
            setAlerts(formattedAlerts);
          } else {
            // ダミーのアラートデータを設定
            setAlerts([
              { id: 1, title: '温室ハウス1の温度が高すぎます', timestamp: '2025-03-31 09:23', severity: '警告' },
              { id: 2, title: '温室ハウス3の湿度が低すぎます', timestamp: '2025-03-31 08:45', severity: '注意' },
              { id: 3, title: '温室ハウス5の土壌水分が低下しています', timestamp: '2025-03-30 22:15', severity: '警告' },
            ]);
          }
        } catch (err) {
          console.error('アラート取得エラー:', err);
          // ダミーデータで続行
          setAlerts([
            { id: 1, title: '温室ハウス1の温度が高すぎます', timestamp: '2025-03-31 09:23', severity: '警告' },
            { id: 2, title: '温室ハウス3の湿度が低すぎます', timestamp: '2025-03-31 08:45', severity: '注意' },
            { id: 3, title: '温室ハウス5の土壌水分が低下しています', timestamp: '2025-03-30 22:15', severity: '警告' },
          ]);
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

  // 手動更新ボタン用関数
  const refreshData = async () => {
    try {
      const outdoorData = await getLatestEnvironmentalData('outdoor');
      if (outdoorData) {
        setEnvironmentData(toEnvironmentDisplay(formatFirestoreData(outdoorData)));
      }
    } catch (error) {
      console.error('最新データの取得中にエラーが発生しました:', error);
    }
  };

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
          <p>Firestoreデータが見つからないため、ダミーデータを表示しています。設定ページからデータベースの初期化を行ってください。</p>
          <Link to="/settings" className="mt-2 inline-block text-sm text-yellow-800 hover:underline">
            管理者設定ページに移動する →
          </Link>
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
                <h3 className="text-xl font-bold">{environmentData.temperature} °C</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex items-center dashboard-card">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <Droplets className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">湿度</p>
                <h3 className="text-xl font-bold">{environmentData.humidity} %</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex items-center dashboard-card">
              <div className="p-3 rounded-full bg-green-100 mr-4">
                <Wind className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">土壌水分</p>
                <h3 className="text-xl font-bold">{environmentData.soilMoisture} %</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex items-center dashboard-card">
              <div className="p-3 rounded-full bg-yellow-100 mr-4">
                <Sun className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">最終更新</p>
                <h3 className="text-md font-bold flex items-center">
                  {environmentData.lastUpdated}
                  <button 
                    onClick={refreshData}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100"
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
              <h3 className="text-lg font-semibold mb-4">環境データ推移</h3>
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
                  <div className="flex justify-center items-center h-full">
                    <p>データがありません</p>
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
                <h3 className="text-lg font-semibold">今日の作業</h3>
                <Link to="/calendar" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1" /> カレンダーを表示
                </Link>
              </div>
              
              <div className="divide-y">
                {tasks.length > 0 ? (
                  tasks.map(task => (
                    <div key={task.id} className="py-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-gray-500">期限: {task.dueDate}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.priority === '高' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.priority}優先
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-3 text-gray-500">予定されている作業はありません</p>
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
                          alert.severity === '警告' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></span>
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-gray-500">{alert.timestamp}</p>
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