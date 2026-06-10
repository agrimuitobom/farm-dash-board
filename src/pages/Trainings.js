import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getAuth } from 'firebase/auth';
import { getTrainings, addTraining, updateTraining } from '../utils/trainings/trainingsFirestore';
import TrainingForm from '../components/trainings/TrainingForm';
import TrainingsList from '../components/trainings/TrainingsList';
import TrainingDetail from '../components/trainings/TrainingDetail';

const Trainings = () => {
  const auth = getAuth();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [viewingTraining, setViewingTraining] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // カテゴリーオプション
  const categoryOptions = [
    '安全教育',
    '作業技術',
    '品質管理',
    '衛生管理',
    '環境保全',
    '機械操作',
    '防災訓練',
    'その他'
  ];

  // トレーニングデータの取得
  const fetchTrainings = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    try {
      const trainingData = await getTrainings(currentUser.uid);
      setTrainings(trainingData);
      setError(null);
    } catch (err) {
      console.error('トレーニングデータの取得に失敗しました', err);
      setError('トレーニングデータの取得に失敗しました');
      toast.error('トレーニングデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み時にトレーニングデータを取得
  useEffect(() => {
    fetchTrainings();
    // authの状態変更を監視
    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchTrainings();
    });
    return () => unsubscribe();
  }, []);

  // トレーニングデータの保存処理
  const handleSaveTraining = async (trainingData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error('ログインが必要です');
      return;
    }

    try {
      const dataToSave = {
        ...trainingData,
        userId: currentUser.uid,
      };

      if (editingTraining) {
        // 既存のトレーニング情報を更新
        await updateTraining(editingTraining.id, dataToSave);
      } else {
        // 新規トレーニング情報を追加
        await addTraining(dataToSave);
      }

      // フォームを閉じてデータを再取得
      setShowForm(false);
      setEditingTraining(null);
      fetchTrainings();
    } catch (err) {
      console.error('トレーニング情報の保存に失敗しました', err);
      toast.error('トレーニング情報の保存に失敗しました');
    }
  };

  // 編集モードの開始
  const handleEdit = (training) => {
    setEditingTraining(training);
    setViewingTraining(null);
    setShowForm(true);
  };

  // 詳細表示
  const handleViewDetail = (training) => {
    setViewingTraining(training);
    setShowForm(false);
    setEditingTraining(null);
  };

  // フォームのキャンセル
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTraining(null);
  };

  // フィルタリングされたトレーニングリスト
  const filteredTrainings = trainings.filter(training => {
    // 検索語句によるフィルタリング
    const searchMatch = searchTerm === '' || 
      training.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // カテゴリーによるフィルタリング
    const categoryMatch = filterCategory === '' || training.category === filterCategory;
    
    // 日付によるフィルタリング
    let dateMatch = true;
    if (filterDate && training.trainingDate) {
      const trainingDateStr = format(training.trainingDate.toDate(), 'yyyy-MM-dd');
      dateMatch = trainingDateStr === filterDate;
    }
    
    return searchMatch && categoryMatch && dateMatch;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">教育・訓練記録</h1>
        <p className="text-gray-600">スタッフの教育・訓練記録を管理します</p>
      </div>

      {/* トレーニング詳細表示 */}
      {viewingTraining && (
        <div className="mb-6">
          <TrainingDetail
            training={viewingTraining}
            onEdit={handleEdit}
            onClose={() => setViewingTraining(null)}
          />
        </div>
      )}

      {/* トレーニングフォーム */}
      {showForm ? (
        <div className="mb-6">
          <TrainingForm
            training={editingTraining}
            onSave={handleSaveTraining}
            onCancel={handleCancelForm}
          />
        </div>
      ) : (
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            新規トレーニングを登録
          </button>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            {/* 検索ボックス */}
            <div className="relative">
              <input
                type="text"
                placeholder="検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>

            {/* カテゴリーフィルター */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="py-2 px-4 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full"
              >
                <option value="">カテゴリー: すべて</option>
                {categoryOptions.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* 日付フィルター */}
            <div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="py-2 px-4 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full"
              />
            </div>

            {/* フィルターリセットボタン */}
            {(searchTerm || filterCategory || filterDate) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterDate('');
                }}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                リセット
              </button>
            )}
          </div>
        </div>
      )}

      {/* トレーニング一覧 */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchTrainings}
            className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      ) : (
        <div>
          {!showForm && !viewingTraining && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <TrainingsList
                trainings={filteredTrainings}
                onEdit={handleEdit}
                onView={handleViewDetail}
                onRefresh={fetchTrainings}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Trainings;