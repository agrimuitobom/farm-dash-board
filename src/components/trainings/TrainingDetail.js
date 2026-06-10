import React from 'react';
import { format } from 'date-fns';

const TrainingDetail = ({ training, onEdit, onClose }) => {
  if (!training) return null;

  // 日付のフォーマット表示
  const formatDate = (timestamp) => {
    if (!timestamp) return '未設定';
    try {
      return format(timestamp.toDate(), 'yyyy/MM/dd');
    } catch (error) {
      return '日付エラー';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-gray-800">トレーニング詳細情報</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">タイトル</h3>
          <p className="mt-1 text-base text-gray-900">{training.title}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">カテゴリー</h3>
          <p className="mt-1 text-base text-gray-900">{training.category || '-'}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">実施日</h3>
          <p className="mt-1 text-base text-gray-900">{formatDate(training.trainingDate)}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">講師/担当者</h3>
          <p className="mt-1 text-base text-gray-900">{training.instructor || '-'}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">所要時間</h3>
          <p className="mt-1 text-base text-gray-900">{training.duration || '-'}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">実施場所</h3>
          <p className="mt-1 text-base text-gray-900">{training.location || '-'}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">参加者</h3>
          <p className="mt-1 text-base text-gray-900">{training.participants || '-'}</p>
        </div>
      </div>

      {training.content && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500">内容</h3>
          <p className="mt-1 text-base text-gray-900 whitespace-pre-line">{training.content}</p>
        </div>
      )}

      {training.notes && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500">備考</h3>
          <p className="mt-1 text-base text-gray-900 whitespace-pre-line">{training.notes}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => onEdit(training)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          編集
        </button>
      </div>
    </div>
  );
};

export default TrainingDetail;