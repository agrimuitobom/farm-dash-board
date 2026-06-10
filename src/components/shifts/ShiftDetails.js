import React, { useState, useEffect } from 'react';
import { getShiftDetails, getStaffDetails, deleteShift, getShiftsMasterList } from '../../firestoreUtils';

/**
 * シフト詳細表示コンポーネント
 */
const ShiftDetails = ({ shiftId, onClose, onEdit, onDelete }) => {
  const [shift, setShift] = useState(null);
  const [staff, setStaff] = useState(null);
  const [shiftsMaster, setShiftsMaster] = useState({ types: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // シフト情報とスタッフ情報を取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [shiftData, masterData] = await Promise.all([
          getShiftDetails(shiftId),
          getShiftsMasterList()
        ]);
        
        setShift(shiftData);
        setShiftsMaster(masterData);
        
        // スタッフ情報を取得
        if (shiftData.staffId) {
          const staffData = await getStaffDetails(shiftData.staffId);
          setStaff(staffData);
        }
        
        setError(null);
      } catch (err) {
        console.error('シフト詳細の取得に失敗しました:', err);
        setError('シフト情報を取得できませんでした');
      } finally {
        setLoading(false);
      }
    };

    if (shiftId) {
      fetchData();
    }
  }, [shiftId]);

  // シフト削除処理
  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    
    setLoading(true);
    try {
      await deleteShift(shiftId);
      onDelete && onDelete();
    } catch (err) {
      console.error('シフトの削除に失敗しました:', err);
      setError('シフトを削除できませんでした');
      setLoading(false);
    }
  };

  // シフト種類の名前を取得
  const getTypeName = (typeId) => {
    const type = shiftsMaster.types.find(t => t.id === typeId);
    return type ? type.name : typeId;
  };

  // ステータスの名前を取得
  const getStatusName = (statusId) => {
    const status = shiftsMaster.statuses.find(s => s.id === statusId);
    return status ? status.name : statusId;
  };

  // ステータスの色を取得
  const getStatusColor = (statusId) => {
    const status = shiftsMaster.statuses.find(s => s.id === statusId);
    return status ? status.color : '#a0aec0';
  };

  // シフトタイプの色を取得
  const getTypeColor = (typeId) => {
    const type = shiftsMaster.types.find(t => t.id === typeId);
    return type ? type.color : '#4299e1';
  };

  // 日付のフォーマット
  const formatDate = (date, format = 'YYYY/MM/DD HH:mm') => {
    if (!date) return '';
    const d = new Date(date);
    
    // 年、月、日、時、分、秒を取得
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    // 曜日の配列
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[d.getDay()];
    
    // フォーマット文字列を置換
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('dd', weekday);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded">
        <h3 className="font-bold mb-2">エラー</h3>
        <p>{error}</p>
        <div className="mt-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="text-center p-4">
        <p>シフト情報が見つかりません</p>
        <div className="mt-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{shift.title}</h2>
            {staff && (
              <p className="text-gray-600">
                担当: {staff.name} ({staff.role})
              </p>
            )}
          </div>
          <div>
            <span 
              className="inline-block px-3 py-1 rounded text-sm font-medium text-white" 
              style={{ backgroundColor: getStatusColor(shift.status) }}
            >
              {getStatusName(shift.status)}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">シフト時間</h3>
            <p className="mt-1">
              {formatDate(shift.start, 'YYYY年MM月DD日(dd) HH:mm')} 〜 {formatDate(shift.end, 'HH:mm')}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">シフト種類</h3>
            <p className="mt-1 flex items-center">
              <span 
                className="inline-block w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: getTypeColor(shift.type) }}
              ></span>
              {getTypeName(shift.type)}
            </p>
          </div>
        </div>
        
        {shift.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">備考</h3>
            <div className="bg-gray-50 p-3 rounded whitespace-pre-wrap">
              {shift.notes}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            作成: {formatDate(shift.createdAt, 'YYYY/MM/DD')}
            {shift.updatedAt && shift.updatedAt !== shift.createdAt && (
              <>, 更新: {formatDate(shift.updatedAt, 'YYYY/MM/DD')}</>  
            )}
          </div>
          
          <div className="flex space-x-2">
            {deleteConfirm ? (
              <>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                  disabled={loading}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-600 rounded text-white hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? '削除中...' : '削除確定'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                >
                  閉じる
                </button>
                <button
                  onClick={() => onEdit && onEdit(shiftId)}
                  className="px-3 py-1 bg-blue-600 rounded text-white hover:bg-blue-700"
                >
                  編集
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-gray-600 rounded text-white hover:bg-gray-700"
                >
                  削除
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftDetails;