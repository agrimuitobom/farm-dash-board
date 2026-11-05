import React, { useState } from 'react';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEnvironmentalReadingsBetween } from '../../firestoreUtils';
import { CSV_INTERVALS, buildEnvironmentalCsv, toCsvText } from '../../utils/environmentalCsv';

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500';

// 一度にダウンロードできる期間（日）。1時間ごとのまとめから読むので、3か月・4ハウスでも約8,800件
const MAX_DAYS = 92;
const DAY_MS = 24 * 60 * 60 * 1000;

const toDay = (value, endOfDay) => {
  const [y, m, d] = value.split('-').map(Number);
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d);
};

/**
 * 環境データ（温度・湿度・飽差・土壌水分・CO2）の CSV ダウンロード
 * データは1時間ごとのまとめ（environmental_hourly）から読む
 */
const EnvironmentalCsvExport = ({ houses }) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    houseId: '',
    start: format(new Date(Date.now() - 6 * DAY_MS), 'yyyy-MM-dd'),
    end: today,
    interval: '10min'
  });
  const [progress, setProgress] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const targets = form.houseId ? houses.filter(h => h.id === form.houseId) : houses;
  const start = form.start ? toDay(form.start, false) : null;
  const end = form.end ? toDay(form.end, true) : null;
  // 開始日の0時〜終了日の23:59 なので、同じ日なら1日
  const days = start && end ? Math.round((end - start) / DAY_MS) : 0;
  let error = null;
  if (!start || !end) error = '期間を入力してください';
  else if (end < start) error = '終了日は開始日より後にしてください';
  else if (days > MAX_DAYS) error = `一度にダウンロードできるのは${MAX_DAYS}日までです`;
  else if (targets.length === 0) error = 'ハウスが登録されていません';
  // 読み取り件数の目安（1時間ごとのまとめを、ハウスごとに期間の時間数＋1件）
  const estimatedReads = error ? 0 : targets.length * (days * 24 + 1);

  const handleDownload = async () => {
    if (error) return;
    try {
      const houseData = [];
      for (let i = 0; i < targets.length; i++) {
        const house = targets[i];
        setProgress(`${house.name || house.id} を読み込み中（${i + 1}/${targets.length}）`);
        const { readings } = await getEnvironmentalReadingsBetween(house.id, start, end);
        houseData.push({ houseName: house.name || house.id, readings });
      }
      const csv = buildEnvironmentalCsv(houseData, form.interval);
      if (csv.rows.length === 0) {
        toast.error('この期間のデータがありません');
        return;
      }
      const blob = new Blob([toCsvText(csv)], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `環境データ_${form.start.replace(/-/g, '')}-${form.end.replace(/-/g, '')}_${form.interval}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`${csv.rows.length.toLocaleString()} 行の CSV をダウンロードしました`);
    } catch (err) {
      console.error('環境データの CSV 作成中にエラーが発生しました:', err);
      toast.error('環境データの読み込みに失敗しました');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b flex items-center">
        <Download className="w-5 h-5 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold">環境データのダウンロード（CSV）</h3>
        <span className="ml-3 text-sm text-gray-500">温度・湿度・飽差・土壌水分・CO2</span>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="csv-house">ハウス</label>
          <select id="csv-house" name="houseId" value={form.houseId} onChange={handleChange} className={inputClass}>
            <option value="">すべてのハウス</option>
            {houses.map(house => (
              <option key={house.id} value={house.id}>{house.name || house.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="csv-start">開始日</label>
          <input id="csv-start" type="date" name="start" value={form.start} max={today} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="csv-end">終了日</label>
          <input id="csv-end" type="date" name="end" value={form.end} max={today} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="csv-interval">間隔</label>
          <select id="csv-interval" name="interval" value={form.interval} onChange={handleChange} className={inputClass}>
            {CSV_INTERVALS.map(interval => (
              <option key={interval.id} value={interval.id}>{interval.label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={Boolean(error) || Boolean(progress)}
          className="h-10 inline-flex items-center justify-center px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {progress ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
          ダウンロード
        </button>
      </div>

      <div className="px-4 pb-4 text-sm text-gray-600 space-y-1">
        {progress ? (
          <p>{progress}</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p>
            {targets.length}ハウス・{days}日分　Firestore の読み取り 約{estimatedReads.toLocaleString()}件
            （平均の間隔を変えても読み取り件数は同じ。変わるのは CSV の行数だけ）
          </p>
        )}
        <p className="text-xs text-gray-500">
          1時間ごとのまとめから読みます。まとめを作り始める前の期間（Raspberry Pi の見張りプログラムを更新する前）は含まれません。
          最大{MAX_DAYS}日まで。
        </p>
      </div>
    </div>
  );
};

export default EnvironmentalCsvExport;
