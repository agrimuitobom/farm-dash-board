import React, { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { deleteTraining } from '../../utils/trainings/trainingsFirestore';

const TrainingsList = ({ trainings, onEdit, onView, onRefresh }) => {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  // トレーニング削除の確認モーダルを表示
  const handleDeleteClick = (training) => {
    setConfirmDelete(training);
  };

  // トレーニング削除の実行
  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    
    setLoading(true);
    try {
      const success = await deleteTraining(confirmDelete.id);
      if (success) {
        setConfirmDelete(null);
        onRefresh(); // 親コンポーネントにリスト更新を通知
      }
    } catch (error) {
      console.error('トレーニングの削除中にエラーが発生しました', error);
      toast.error('トレーニングの削除中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 日付のフォーマット表示
  const formatDate = (timestamp) => {
    if (!timestamp) return '未設定';
    try {
      return format(timestamp.toDate(), 'yyyy/MM/dd');
    } catch (error) {
      return '日付エラー';
    }
  };

  // 一覧がない場合
  if (!trainings || trainings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">トレーニング記録がありません</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* 削除確認モーダル */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">トレーニング記録の削除確認</h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-bold">{confirmDelete.title}</span> のトレーニング記録を削除します。この操作は元に戻せません。
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setConfirmDelete(null)}
                disabled={loading}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                onClick={handleDeleteConfirm}
                disabled={loading}
              >
                {loading ? '処理中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* トレーニング一覧テーブル */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              タイトル
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              カテゴリー
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              実施日
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              講師/担当者
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              参加者
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              アクション
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {trainings.map((training) => (
            <tr key={training.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{training.title}</div>
                {training.duration && (
                  <div className="text-xs text-gray-500">所要時間: {training.duration}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{training.category || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatDate(training.trainingDate)}</div>
                {training.location && (
                  <div className="text-xs text-gray-500">場所: {training.location}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{training.instructor || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{training.participants || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onView(training)}
                  className="text-blue-600 hover:text-blue-900 mr-2"
                >
                  詳細
                </button>
                <button
                  onClick={() => onEdit(training)}
                  className="text-indigo-600 hover:text-indigo-900 mr-2"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDeleteClick(training)}
                  className="text-red-600 hover:text-red-900"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrainingsList;