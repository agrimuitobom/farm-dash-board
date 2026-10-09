import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createHouse, updateHouse, deleteHouse } from '../../firestoreUtils';

const STATUS_OPTIONS = ['生育中', '収穫中', '準備中', '休止中'];

const inputClass = 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500';

const toFormValues = (house) => ({
  id: house?.id || '',
  name: house?.name || house?.id || '',
  currentCrop: house?.currentCrop || house?.crop || '',
  status: house?.status || '生育中',
  plantDate: house?.plantDate instanceof Date ? format(house.plantDate, 'yyyy-MM-dd') : '',
  area: house?.area ?? '',
  notes: house?.notes || ''
});

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
                className={inputClass}
                placeholder="例: ミニトマト"
              />
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
                  className={inputClass}
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
