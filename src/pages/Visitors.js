import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getAuth } from 'firebase/auth';
import { getVisitors, addVisitor, updateVisitor } from '../utils/visitors/visitorsFirestore';
import VisitorForm from '../components/visitors/VisitorForm';
import VisitorsList from '../components/visitors/VisitorsList';
import VisitorDetail from '../components/visitors/VisitorDetail';

const Visitors = () => {
  const auth = getAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [viewingVisitor, setViewingVisitor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // 訪問者データの取得
  const fetchVisitors = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    try {
      const visitorData = await getVisitors(currentUser.uid);
      setVisitors(visitorData);
      setError(null);
    } catch (err) {
      console.error('訪問者データの取得に失敗しました', err);
      setError('訪問者データの取得に失敗しました');
      toast.error('訪問者データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み時に訪問者データを取得
  useEffect(() => {
    fetchVisitors();
    // authの状態変更を監視
    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchVisitors();
    });
    return () => unsubscribe();
  }, []);

  // 訪問者データの保存処理
  const handleSaveVisitor = async (visitorData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error('ログインが必要です');
      return;
    }

    try {
      const dataToSave = {
        ...visitorData,
        userId: currentUser.uid,
      };

      if (editingVisitor) {
        // 既存の訪問者情報を更新
        await updateVisitor(editingVisitor.id, dataToSave);
      } else {
        // 新規訪問者情報を追加
        await addVisitor(dataToSave);
      }

      // フォームを閉じてデータを再取得
      setShowForm(false);
      setEditingVisitor(null);
      fetchVisitors();
    } catch (err) {
      console.error('訪問者情報の保存に失敗しました', err);
      toast.error('訪問者情報の保存に失敗しました');
    }
  };

  // 編集モードの開始
  const handleEdit = (visitor) => {
    setEditingVisitor(visitor);
    setViewingVisitor(null);
    setShowForm(true);
  };

  // 詳細表示
  const handleViewDetail = (visitor) => {
    setViewingVisitor(visitor);
    setShowForm(false);
    setEditingVisitor(null);
  };

  // フォームのキャンセル
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingVisitor(null);
  };

  // フィルタリングされた訪問者リスト
  const filteredVisitors = visitors.filter(visitor => {
    // 検索語句によるフィルタリング
    const searchMatch = searchTerm === '' || 
      visitor.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.host?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 日付によるフィルタリング
    let dateMatch = true;
    if (filterDate && visitor.visitDate) {
      const visitDateStr = format(visitor.visitDate.toDate(), 'yyyy-MM-dd');
      dateMatch = visitDateStr === filterDate;
    }
    
    return searchMatch && dateMatch;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">訪問者記録</h1>
        <p className="text-gray-600">訪問者情報の登録・管理を行います</p>
      </div>

      {/* 訪問者詳細表示 */}
      {viewingVisitor && (
        <div className="mb-6">
          <VisitorDetail
            visitor={viewingVisitor}
            onEdit={handleEdit}
            onClose={() => setViewingVisitor(null)}
          />
        </div>
      )}

      {/* 訪問者フォーム */}
      {showForm ? (
        <div className="mb-6">
          <VisitorForm
            visitor={editingVisitor}
            onSave={handleSaveVisitor}
            onCancel={handleCancelForm}
          />
        </div>
      ) : (
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            新規訪問者を登録
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
            {(searchTerm || filterDate) && (
              <button
                onClick={() => {
                  setSearchTerm('');
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

      {/* 訪問者一覧 */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchVisitors}
            className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      ) : (
        <div>
          {!showForm && !viewingVisitor && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <VisitorsList
                visitors={filteredVisitors}
                onEdit={handleEdit}
                onView={handleViewDetail}
                onRefresh={fetchVisitors}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Visitors;