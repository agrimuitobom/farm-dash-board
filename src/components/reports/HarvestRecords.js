import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Sprout, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { addHarvest, deleteHarvest } from '../../firestoreUtils';
import { getHarvests } from '../../utils/reportGenerator';

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500';

const emptyForm = () => ({
  harvestDate: format(new Date(), 'yyyy-MM-dd'),
  houseId: '',
  cropName: '',
  quantity: '',
  notes: ''
});

/**
 * 収穫記録の入力と一覧（レポートで選んでいる期間の記録を表示）
 * 記録を追加・削除したら onChanged を呼び、レポートを集計し直してもらう
 */
const HarvestRecords = ({ houses, crops, startDate, endDate, onChanged }) => {
  const [form, setForm] = useState(emptyForm);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const harvests = await getHarvests(startDate, endDate);
      setRecords([...harvests].reverse()); // 新しい順
    } catch (err) {
      console.error('収穫記録の取得中にエラーが発生しました:', err);
      toast.error('収穫記録の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // 作物名の候補（作物マスタと、各ハウスの現在の作物）
  const cropSuggestions = [...new Set([
    ...crops.map(crop => crop.name),
    ...houses.map(house => house.currentCrop)
  ].filter(Boolean))];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // ハウスを選んだら、そのハウスの今の作物を入れておく
      if (name === 'houseId' && !prev.cropName) {
        next.cropName = houses.find(house => house.id === value)?.currentCrop || '';
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const quantity = Number(form.quantity);
    if (!form.houseId || !form.cropName.trim() || !(quantity > 0)) {
      toast.error('ハウス・作物・収穫量（0より大きい数）を入力してください');
      return;
    }
    const house = houses.find(item => item.id === form.houseId);
    const cropName = form.cropName.trim();
    const crop = crops.find(item => item.name === cropName);
    try {
      setSaving(true);
      await addHarvest({
        harvestDate: new Date(`${form.harvestDate}T12:00:00`),
        houseId: form.houseId,
        houseName: house?.name || form.houseId,
        cropId: crop?.id || '',
        cropName,
        quantity,
        notes: form.notes.trim()
      });
      toast.success('収穫を記録しました');
      // 同じハウス・作物で続けて入力しやすいよう、量とメモだけ空にする
      setForm(prev => ({ ...prev, quantity: '', notes: '' }));
      await loadRecords();
      onChanged && onChanged();
    } catch (err) {
      console.error('収穫記録の保存中にエラーが発生しました:', err);
      toast.error('収穫記録の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const label = `${record.harvestDate instanceof Date ? record.harvestDate.toLocaleDateString('ja-JP') : ''} ${record.cropName} ${record.quantity}kg`;
    if (!window.confirm(`収穫記録「${label}」を削除しますか？`)) return;
    try {
      await deleteHarvest(record.id);
      setRecords(prev => prev.filter(item => item.id !== record.id));
      toast.success('収穫記録を削除しました');
      onChanged && onChanged();
    } catch (err) {
      console.error('収穫記録の削除中にエラーが発生しました:', err);
      toast.error('収穫記録の削除に失敗しました');
    }
  };

  const total = records.reduce((sum, record) => sum + (Number(record.quantity) || 0), 0);

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b flex items-center">
        <Sprout className="w-5 h-5 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold">収穫記録</h3>
        <span className="ml-3 text-sm text-gray-500">ここで記録した収穫量がレポートに集計されます</span>
      </div>

      <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end border-b">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="harvest-date">収穫日</label>
          <input id="harvest-date" type="date" name="harvestDate" value={form.harvestDate} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="harvest-house">ハウス</label>
          <select id="harvest-house" name="houseId" value={form.houseId} onChange={handleChange} className={inputClass} required>
            <option value="">選択してください</option>
            {houses.map(house => (
              <option key={house.id} value={house.id}>{house.name || house.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="harvest-crop">作物</label>
          <input id="harvest-crop" name="cropName" value={form.cropName} onChange={handleChange} list="harvest-crop-list" className={inputClass} placeholder="例: ミニトマト" required />
          <datalist id="harvest-crop-list">
            {cropSuggestions.map(name => <option key={name} value={name} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="harvest-quantity">収穫量 (kg)</label>
          <input id="harvest-quantity" type="number" name="quantity" value={form.quantity} onChange={handleChange} min="0" step="0.1" className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="harvest-notes">メモ</label>
          <input id="harvest-notes" name="notes" value={form.notes} onChange={handleChange} className={inputClass} placeholder="任意" />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="h-10 inline-flex items-center justify-center px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          記録する
        </button>
      </form>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-600">
            選択中の期間（{startDate.toLocaleDateString('ja-JP')} 〜 {endDate.toLocaleDateString('ja-JP')}）の記録
          </p>
          <p className="text-sm text-gray-600">{records.length} 件・合計 {Math.round(total * 10) / 10} kg</p>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500 py-4 text-center">読み込み中...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">この期間の収穫記録はありません</p>
        ) : (
          <div className="max-h-64 overflow-y-auto border rounded">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">収穫日</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">ハウス</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">作物</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">収穫量</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">メモ</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map(record => (
                  <tr key={record.id}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {record.harvestDate instanceof Date ? record.harvestDate.toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{record.houseName || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{record.cropName || '-'}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">{record.quantity} kg</td>
                    <td className="px-4 py-2 text-gray-600">{record.notes}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(record)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        aria-label="この収穫記録を削除"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HarvestRecords;
