import React, { useState, useEffect } from 'react';
import { getStaffList, getShiftDetails, saveShift, getShiftsMasterList } from '../../firestoreUtils';

/**
 * シフト登録・編集フォームコンポーネント
 */
const ShiftForm = ({ shiftId, defaultStart, defaultEnd, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    staffId: '',
    start: defaultStart ? new Date(defaultStart).toISOString().slice(0, 16) : '',
    end: defaultEnd ? new Date(defaultEnd).toISOString().slice(0, 16) : '',
    type: 'regular',
    status: 'scheduled',
    notes: ''
  });
  
  const [staffList, setStaffList] = useState([]);
  const [shiftsMaster, setShiftsMaster] = useState({ types: [], statuses: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // スタッフ一覧とシフト種類マスターの取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // スタッフ一覧取得
        const staff = await getStaffList();
        setStaffList(staff);

        // シフト種類マスター取得
        const master = await getShiftsMasterList();
        setShiftsMaster(master);
        
        // 既存シフトの編集の場合
        if (shiftId) {
          const shiftData = await getShiftDetails(shiftId);
          
          // 日付をフォーム用にフォーマット
          const formattedStart = shiftData.start instanceof Date 
            ? shiftData.start.toISOString().slice(0, 16)
            : new Date(shiftData.start).toISOString().slice(0, 16);
            
          const formattedEnd = shiftData.end instanceof Date 
            ? shiftData.end.toISOString().slice(0, 16)
            : new Date(shiftData.end).toISOString().slice(0, 16);
          
          setFormData({
            title: shiftData.title || '',
            staffId: shiftData.staffId || '',
            start: formattedStart,
            end: formattedEnd,
            type: shiftData.type || 'regular',
            status: shiftData.status || 'scheduled',
            notes: shiftData.notes || ''
          });
        } else if (defaultStart && defaultEnd) {
          // 新規作成時にデフォルト値がある場合
          setFormData(prev => ({
            ...prev,
            start: new Date(defaultStart).toISOString().slice(0, 16),
            end: new Date(defaultEnd).toISOString().slice(0, 16)
          }));
        }
        
        setError(null);
      } catch (err) {
        console.error('データの取得に失敗しました:', err);
        setError('必要なデータを取得できませんでした');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shiftId, defaultStart, defaultEnd]);

  // フォーム入力時の処理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // フォーム送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.staffId) {
      setError('スタッフを選択してください');
      return;
    }
    
    if (!formData.start || !formData.end) {
      setError('開始時間と終了時間を設定してください');
      return;
    }
    
    // 開始時間が終了時間より後の場合
    if (new Date(formData.start) >= new Date(formData.end)) {
      setError('終了時間は開始時間より後に設定してください');
      return;
    }
    
    setLoading(true);
    
    try {
      // フォームデータをAPIフォーマットに変換
      const shiftData = {
        title: formData.title,
        staffId: formData.staffId,
        start: new Date(formData.start),
        end: new Date(formData.end),
        type: formData.type,
        status: formData.status,
        notes: formData.notes
      };
      
      const savedId = await saveShift(shiftData, shiftId);
      
      if (onSubmit) {
        onSubmit(savedId);
      }
    } catch (err) {
      console.error('シフトの保存に失敗しました:', err);
      setError('シフトを保存できませんでした: ' + (err.message || '不明なエラー'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">
        {shiftId ? 'シフト編集' : 'シフト登録'}
      </h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              タイトル
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="シフトタイトル"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="staffId">
              担当スタッフ
            </label>
            <select
              id="staffId"
              name="staffId"
              value={formData.staffId}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">-- スタッフを選択 --</option>
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.role})
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="start">
                開始日時
              </label>
              <input
                id="start"
                name="start"
                type="datetime-local"
                value={formData.start}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end">
                終了日時
              </label>
              <input
                id="end"
                name="end"
                type="datetime-local"
                value={formData.end}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                シフト種類
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                {shiftsMaster.types.length > 0 ? (
                  shiftsMaster.types.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="regular">通常シフト</option>
                    <option value="field">圃場管理</option>
                    <option value="maintenance">設備保全</option>
                    <option value="teaching">指導・教育</option>
                    <option value="other">その他</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                ステータス
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                {shiftsMaster.statuses.length > 0 ? (
                  shiftsMaster.statuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="draft">下書き</option>
                    <option value="scheduled">予定</option>
                    <option value="confirmed">確定</option>
                    <option value="in-progress">実行中</option>
                    <option value="completed">完了</option>
                    <option value="cancelled">キャンセル</option>
                  </>
                )}
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
              備考
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              placeholder="備考やメモ..."
            />
          </div>
          
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              キャンセル
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ShiftForm;