// 常時表示用ディスプレイ（7インチ 1024×600 横置き）専用の画面
//
// サイドバーやメニューは出さず、外気と各ハウスの温度・湿度を大きく1画面に収める（スクロールなし）。
// タイルをタッチすると、その場所の24時間の推移を表示する。
import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  WifiOff,
  Wifi,
  HelpCircle,
  X,
  Thermometer,
  Droplets
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  subscribeToHouses,
  subscribeToEnvironmentalData,
  getEnvironmentalHistory
} from '../firestoreUtils';
import { getHouseThresholds } from '../utils/environmentalRanges';
import { isKioskMode } from '../utils/kioskMode';

// この時間データが来なければ「通信なし」とする（センサーは1分ごとに送信）
const STALE_MS = 10 * 60 * 1000;
// 外気のデータがこの時間届いていなければ、外気センサーは置かれていないとみなして外気欄を出さない
// （outdoor に送るセンサーを置けば、自動で表示される）
const OUTDOOR_HIDE_MS = 24 * 60 * 60 * 1000;
// 推移グラフを開いたまま放置したら自動で閉じる
const DETAIL_TIMEOUT_MS = 60 * 1000;
// 推移グラフの最大点数（Raspberry Pi で描画を軽くするため間引く）
const MAX_HISTORY_POINTS = 150;

// 状態の色は予約色（正常/注意/警告/危険）。色だけに頼らず必ずアイコンと文字を添える
const STATUS_STYLES = {
  good: { color: '#0ca30c', Icon: CheckCircle2 },
  warning: { color: '#fab219', Icon: AlertTriangle },
  serious: { color: '#ec835a', Icon: AlertTriangle },
  critical: { color: '#d03b3b', Icon: AlertOctagon },
  stale: { color: '#9ca3af', Icon: WifiOff },
  none: { color: '#d1d5db', Icon: HelpCircle }
};

// thresholds はハウスごとの閾値（getHouseThresholds の戻り値）
const getStatus = (data, now, thresholds) => {
  if (!data || !(data.timestamp instanceof Date)) {
    return { key: 'none', label: 'データなし' };
  }
  if (now - data.timestamp.getTime() > STALE_MS) {
    return { key: 'stale', label: '通信なし' };
  }

  const { temperature: t, humidity: h } = thresholds;
  const issues = [];
  if (typeof data.temperature === 'number') {
    if (data.temperature > t.max) issues.push({ key: 'critical', label: '高温' });
    if (data.temperature < t.min) issues.push({ key: 'serious', label: '低温' });
  }
  if (typeof data.humidity === 'number') {
    if (data.humidity > h.max) issues.push({ key: 'warning', label: '多湿' });
    if (data.humidity < h.min) issues.push({ key: 'warning', label: '乾燥' });
  }
  if (issues.length === 0) {
    return { key: 'good', label: '正常' };
  }
  // 最も重い状態の色を使い、ラベルはすべて並べる
  const order = ['critical', 'serious', 'warning'];
  const worst = order.find(key => issues.some(issue => issue.key === key));
  return { key: worst, label: issues.map(issue => issue.label).join('・') };
};

const formatAgo = (date, now) => {
  if (!(date instanceof Date)) return '';
  const minutes = Math.floor((now - date.getTime()) / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
};

const formatNumber = (value, digits) =>
  typeof value === 'number' ? value.toFixed(digits) : '--';

const StatusBadge = ({ status, large = false }) => {
  const { color, Icon } = STATUS_STYLES[status.key];
  return (
    <span className={`inline-flex items-center font-medium text-gray-800 whitespace-nowrap ${large ? 'text-lg' : 'text-base'}`}>
      <Icon className={`${large ? 'h-6 w-6' : 'h-5 w-5'} mr-1.5 flex-shrink-0`} style={{ color }} aria-hidden="true" />
      {status.label}
    </span>
  );
};

// ハウスの数に合わせて並べ方と文字の大きさを決める（1024×600 に収まるように）
const getGridLayout = (count) => {
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
  const rows = Math.max(1, Math.ceil(count / cols));
  const size = rows <= 2 ? 'lg' : rows === 3 ? 'md' : 'sm';
  return { cols, rows, size };
};

// compact: 3段以上のときは作物名を省き、湿度を気温の横に並べて高さを詰める
const TILE_TEXT = {
  lg: { pad: 'p-4', name: 'text-xl', temp: 'text-5xl', hum: 'text-2xl', compact: false },
  md: { pad: 'p-3', name: 'text-lg', temp: 'text-4xl', hum: 'text-xl', compact: true },
  sm: { pad: 'p-2.5', name: 'text-base', temp: 'text-3xl', hum: 'text-lg', compact: true }
};

const HouseTile = ({ house, data, now, size, onSelect }) => {
  const status = getStatus(data, now, getHouseThresholds(house));
  const text = TILE_TEXT[size];
  return (
    <button
      type="button"
      onClick={() => onSelect({ id: house.id, name: house.name || house.id })}
      className={`bg-white rounded-xl shadow-sm ${text.pad} flex flex-col text-left min-h-0 min-w-0 overflow-hidden border-l-8 active:bg-gray-50`}
      style={{ borderLeftColor: STATUS_STYLES[status.key].color }}
    >
      <div className="min-w-0">
        <p className={`${text.name} font-bold text-gray-900 truncate`}>{house.name || house.id}</p>
        {!text.compact && (
          <p className="text-sm text-gray-500 truncate">{house.currentCrop || '作物未登録'}</p>
        )}
      </div>
      <div className={`flex-1 min-h-0 flex justify-center ${text.compact ? 'flex-row items-baseline flex-wrap gap-x-3' : 'flex-col'}`}>
        <p className={`${text.temp} font-semibold text-gray-900 leading-none whitespace-nowrap`}>
          {formatNumber(data?.temperature, 1)}
          <span className={`${text.compact ? 'text-lg' : 'text-2xl'} font-normal text-gray-500 ml-1`}>°C</span>
        </p>
        <p className={`${text.hum} text-gray-700 whitespace-nowrap ${text.compact ? '' : 'mt-2'}`}>
          <Droplets className="inline h-5 w-5 text-gray-400 mr-1 align-[-2px]" aria-hidden="true" />
          {formatNumber(data?.humidity, 0)}
          <span className="text-base text-gray-500 ml-0.5">%</span>
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="min-w-0 truncate"><StatusBadge status={status} /></span>
        {/* 狭いタイルでは状態の表示を優先する（古いデータは「通信なし」で分かる） */}
        {!text.compact && (
          <span className="text-sm text-gray-500 whitespace-nowrap">{formatAgo(data?.timestamp, now)}</span>
        )}
      </div>
    </button>
  );
};

const OutdoorPanel = ({ data, now, onSelect }) => {
  // 外気はハウスではないので既定の範囲で判定する
  const status = getStatus(data, now, getHouseThresholds(null));
  return (
    <button
      type="button"
      onClick={() => onSelect({ id: 'outdoor', name: '外気' })}
      className="w-[300px] flex-shrink-0 bg-white rounded-xl shadow-sm p-5 flex flex-col text-left border-l-8 active:bg-gray-50"
      style={{ borderLeftColor: STATUS_STYLES[status.key].color }}
    >
      <p className="text-2xl font-bold text-gray-900">外気</p>
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-sm text-gray-500 flex items-center">
          <Thermometer className="h-4 w-4 mr-1" aria-hidden="true" />気温
        </p>
        <p className="text-7xl font-semibold text-gray-900 leading-none mt-1">
          {formatNumber(data?.temperature, 1)}
          <span className="text-3xl font-normal text-gray-500 ml-1">°C</span>
        </p>
        <p className="text-sm text-gray-500 flex items-center mt-6">
          <Droplets className="h-4 w-4 mr-1" aria-hidden="true" />湿度
        </p>
        <p className="text-4xl font-semibold text-gray-900 leading-none mt-1">
          {formatNumber(data?.humidity, 0)}
          <span className="text-xl font-normal text-gray-500 ml-1">%</span>
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={status} large />
        <span className="text-base text-gray-500 whitespace-nowrap">{formatAgo(data?.timestamp, now)}</span>
      </div>
    </button>
  );
};

const HistoryChart = ({ title, unit, dataKey, color, data }) => (
  <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col min-h-0 min-w-0">
    <p className="text-lg font-semibold text-gray-900 mb-2">{title}（{unit}）</p>
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="time" tick={{ fontSize: 14, fill: '#6b7280' }} minTickGap={40} stroke="#d1d5db" />
          <YAxis
            tick={{ fontSize: 14, fill: '#6b7280' }}
            width={44}
            domain={['auto', 'auto']}
            stroke="#d1d5db"
          />
          <Tooltip
            formatter={(value) => [`${value} ${unit}`, title]}
            labelStyle={{ color: '#374151' }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DetailOverlay = ({ target, onClose }) => {
  const [history, setHistory] = useState(null);
  const timerRef = useRef(null);

  // 触っていない状態が続いたら自動で一覧に戻る
  const resetTimer = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onClose, DETAIL_TIMEOUT_MS);
  };

  useEffect(() => {
    resetTimer();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    getEnvironmentalHistory(target.id, 24)
      .then((records) => {
        if (cancelled) return;
        const ordered = records
          .filter(r => r.timestamp instanceof Date)
          .sort((a, b) => a.timestamp - b.timestamp);
        const step = Math.max(1, Math.ceil(ordered.length / MAX_HISTORY_POINTS));
        setHistory(
          ordered
            .filter((_, i) => i % step === 0)
            .map(r => ({
              time: r.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
              temperature: typeof r.temperature === 'number' ? Number(r.temperature.toFixed(1)) : null,
              humidity: typeof r.humidity === 'number' ? Number(r.humidity.toFixed(1)) : null
            }))
        );
      })
      .catch((err) => {
        console.error('推移データの取得に失敗しました:', err);
        if (!cancelled) setHistory([]);
      });
    return () => { cancelled = true; };
  }, [target.id]);

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col" onPointerDown={resetTimer}>
      <div className="h-16 flex-shrink-0 bg-green-800 text-white flex items-center justify-between px-5">
        <p className="text-2xl font-bold">{target.name}　過去24時間の推移</p>
        <button
          type="button"
          onClick={onClose}
          className="h-12 px-5 rounded-lg bg-white text-green-900 text-lg font-bold flex items-center active:bg-gray-200"
        >
          <X className="h-6 w-6 mr-1" aria-hidden="true" />
          閉じる
        </button>
      </div>
      <div className="flex-1 min-h-0 p-3">
        {history === null ? (
          <div className="h-full flex items-center justify-center text-xl text-gray-500">読み込み中…</div>
        ) : history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xl text-gray-500">過去24時間のデータがありません</div>
        ) : (
          <div className="h-full grid grid-rows-2 gap-3">
            <HistoryChart title="気温" unit="°C" dataKey="temperature" color="#ef4444" data={history} />
            <HistoryChart title="湿度" unit="%" dataKey="humidity" color="#3b82f6" data={history} />
          </div>
        )}
      </div>
    </div>
  );
};

const Display = () => {
  const [houses, setHouses] = useState(null);
  const [envData, setEnvData] = useState({});
  const [now, setNow] = useState(Date.now());
  const [online, setOnline] = useState(navigator.onLine);
  const [selected, setSelected] = useState(null);

  // 時計と「○分前」の更新
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => subscribeToHouses(setHouses), []);

  // 外気と各ハウスの最新データをリアルタイム監視
  const locationsKey = ['outdoor', ...(houses || []).map(house => house.id)].join('\n');
  useEffect(() => {
    const unsubscribes = locationsKey.split('\n').map(location =>
      subscribeToEnvironmentalData(location, (data) => {
        setEnvData(prev => ({ ...prev, [location]: data }));
      })
    );
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [locationsKey]);

  const houseList = houses || [];
  const outdoor = envData.outdoor;
  const showOutdoor = outdoor?.timestamp instanceof Date && now - outdoor.timestamp.getTime() < OUTDOOR_HIDE_MS;
  const layout = getGridLayout(houseList.length);
  const nowDate = new Date(now);

  return (
    <div className={`h-screen w-screen overflow-hidden bg-gray-100 flex flex-col select-none ${isKioskMode() ? 'cursor-none' : ''}`}>
      <header className="h-14 flex-shrink-0 bg-green-800 text-white flex items-center justify-between px-5">
        <p className="text-2xl font-bold">西農圃場データ</p>
        <div className="flex items-center gap-5">
          <span className="flex items-center text-base">
            {online
              ? <Wifi className="h-5 w-5 mr-1" aria-hidden="true" />
              : <WifiOff className="h-5 w-5 mr-1 text-yellow-300" aria-hidden="true" />}
            {online ? 'オンライン' : 'オフライン'}
          </span>
          <span className="text-lg">
            {nowDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </span>
          <span className="text-3xl font-semibold">
            {nowDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex gap-3 p-3">
        {showOutdoor && <OutdoorPanel data={outdoor} now={now} onSelect={setSelected} />}

        {houses === null ? (
          <div className="flex-1 flex items-center justify-center text-xl text-gray-500">読み込み中…</div>
        ) : houseList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xl text-gray-500">ハウスが登録されていません</div>
        ) : (
          <section
            className="flex-1 min-w-0 grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`
            }}
          >
            {houseList.map(house => (
              <HouseTile
                key={house.id}
                house={house}
                data={envData[house.id]}
                now={now}
                size={layout.size}
                onSelect={setSelected}
              />
            ))}
          </section>
        )}
      </main>

      {selected && <DetailOverlay target={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default Display;
