import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createHouse, updateHouse, deleteHouse } from '../../firestoreUtils';
import { getHouseThresholds } from '../../utils/environmentalRanges';

const STATUS_OPTIONS = ['生育中', '収穫中', '準備中', '休止中'];

const fieldClass = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500';
const inputClass = `mt-1 ${fieldClass}`;

const toFormValues = (house) => ({
  id: house?.id || '',
  name: house?.name || house?.id || '',
  currentCrop: house?.currentCrop || house?.crop || '',
  status: house?.status || '生育中',
  plantDate: house?.plantDate instanceof Date ? format(house.plantDate, 'yyyy-MM-dd') : '',
  area: house?.area ?? '',
  notes: house?.notes || '',
  // 未設定のハウスは既定値を初期値として表示する
  thresholds: (() => {
    const t = getHouseThresholds(house);
    return {
      temperature: { min: String(t.temperature.min), max: String(t.temperature.max) },
      humidity: { min: String(t.humidity.min), max: String(t.humidity.max) }
    };
  })()
});

const THRESHOLD_FIELDS = [
  { key: 'temperature', label: '気温', unit: '°C', step: '0.1' },
  { key: 'humidity', label: '湿度', unit: '%', step: '1' }
];

// 閾値の入力チェック。問題があればメッセージを返す
const validateThresholds = (thresholds) => {
  for (const { key, label } of THRESHOLD_FIELDS) {
    const { min, max } = thresholds[key];
    if (min === '' || max === '' || Number.isNaN(Number(min)) || Number.isNaN(Number(max))) {
      return `${label}の下限と上限を数値で入力してください`;
    }
    if (Number(min) >= Number(max)) {
      return `${label}の下限は上限より小さくしてください`;
    }
  }
  if (Number(thresholds.humidity.min) < 0 || Number(thresholds.humidity.max) > 100) {
    return '湿度は 0〜100% の範囲で入力してください';
  }
  return null;
};

// ハウスIDは Firestore のドキュメントIDとセンサーの location に使うため制限する
const validateHouseId = (houseId) => {
  if (!houseId) return 'ハウスIDを入力してください';
  if (houseId.includes('/')) return 'ハウスIDに「/」は使えません';
  if (houseId.startsWith('_')) return 'ハウスIDを「_」で始めることはできません';
  if (houseId === 'outdoor') return '「outdoor」は外気センサー用のため使えません';
  return null;
};

/**
 * ハウスの登録・編集モーダル
 * house を渡すと編集モード、渡さないと新規登録モードになる
 */
const HouseFormModal = ({ isOpen, onClose, house = null, onSaved, onDeleted }) => {
  const isEdit = Boolean(house);
  // 栽培作物が登録されているハウスは、作物名と定植日をそこから自動で決める
  const cropsManaged = Array.isArray(house?.crops) && house.crops.length > 0;
  const [formData, setFormData] = useState(toFormValues(house));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(toFormValues(house));
      setError(null);
    }
  }, [isOpen, house]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThresholdChange = (key, bound, value) => {
    setFormData(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]: { ...prev.thresholds[key], [bound]: value }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const houseId = formData.id.trim();
    if (!isEdit) {
      const idError = validateHouseId(houseId);
      if (idError) {
        setError(idError);
        return;
      }
    }
    if (!formData.name.trim()) {
      setError('表示名を入力してください');
      return;
    }
    const thresholdError = validateThresholds(formData.thresholds);
    if (thresholdError) {
      setError(thresholdError);
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateHouse(house.id, formData);
        toast.success('ハウス情報を更新しました');
      } else {
        await createHouse(houseId, formData);
        toast.success(`「${formData.name.trim()}」を登録しました`);
      }
      onSaved && onSaved(isEdit ? house.id : houseId);
      onClose();
    } catch (err) {
      console.error('ハウスの保存中にエラーが発生しました:', err);
      setError(err.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`「${house.name || house.id}」を削除しますか？\nセンサーの環境データは削除されません。`)) {
      return;
    }

    setSaving(true);
    try {
      await deleteHouse(house.id);
      toast.success('ハウスを削除しました');
      onClose();
      onDeleted && onDeleted(house.id);
    } catch (err) {
      console.error('ハウスの削除中にエラーが発生しました:', err);
      setError(err.message || '削除に失敗しました');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium">{isEdit ? 'ハウス情報の編集' : 'ハウスの登録'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">ハウスID</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                className={`${inputClass} ${isEdit ? 'bg-gray-100 text-gray-500' : ''}`}
                placeholder="例: 温室ハウス1"
                disabled={isEdit}
                required={!isEdit}
              />
              <p className="mt-1 text-xs text-gray-500">
                {isEdit
                  ? 'ハウスIDは変更できません。'
                  : 'Raspberry Pi の LOCATION に同じ値を設定すると、このハウスのセンサーデータとして表示されます。登録後は変更できません。'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">表示名</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="例: 温室ハウス1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">現在の作物</label>
              <input
                type="text"
                name="currentCrop"
                value={formData.currentCrop}
                onChange={handleInputChange}
                className={`${inputClass} ${cropsManaged ? 'bg-gray-100 text-gray-600' : ''}`}
                placeholder="例: ミニトマト"
                readOnly={cropsManaged}
              />
              {cropsManaged && (
                <p className="mt-1 text-xs text-gray-500">
                  作物と定植日は、ハウス詳細の「栽培作物」に登録した内容から自動で設定されます
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">状態</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={inputClass}
                >
                  {!STATUS_OPTIONS.includes(formData.status) && formData.status && (
                    <option value={formData.status}>{formData.status}</option>
                  )}
                  {STATUS_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">定植日</label>
                <input
                  type="date"
                  name="plantDate"
                  value={formData.plantDate}
                  onChange={handleInputChange}
                  className={`${inputClass} ${cropsManaged ? 'bg-gray-100 text-gray-600' : ''}`}
                  readOnly={cropsManaged}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">面積 (m²)</label>
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className={inputClass}
                min="0"
                step="any"
              />
            </div>

            <fieldset className="border border-gray-200 rounded-md p-3">
              <legend className="px-1 text-sm font-medium text-gray-700">アラートの閾値（この範囲を外れたら通知）</legend>
              <div className="space-y-3">
                {THRESHOLD_FIELDS.map(({ key, label, unit, step }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-10 flex-shrink-0 whitespace-nowrap text-sm text-gray-700">{label}</span>
                    <input
                      type="number"
                      step={step}
                      aria-label={`${label}の下限`}
                      value={formData.thresholds[key].min}
                      onChange={(e) => handleThresholdChange(key, 'min', e.target.value)}
                      className={fieldClass}
                    />
                    <span className="text-gray-500">〜</span>
                    <input
                      type="number"
                      step={step}
                      aria-label={`${label}の上限`}
                      value={formData.thresholds[key].max}
                      onChange={(e) => handleThresholdChange(key, 'max', e.target.value)}
                      className={fieldClass}
                    />
                    <span className="w-6 flex-shrink-0 text-sm text-gray-500">{unit}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                ダッシュボードと7インチ画面の表示、自動アラートの判定に使います。
              </p>
            </fieldset>

            <div>
              <label className="block text-sm font-medium text-gray-700">備考</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className={inputClass}
                rows="3"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div>
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  削除
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {isEdit ? '保存' : '登録'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HouseFormModal;
