// src/pages/AdminSettings.js
import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { handleSetupFirestore } from '../setupFirestore';
import { seedFirestore } from '../seedFirestore';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ success: false, message: '', error: null });

  const handleInitializeFirestore = async () => {
    if (!window.confirm('Firestoreデータベースを初期化しますか？既存のデータは削除されます。')) {
      return;
    }
    
    setLoading(true);
    setResult({ success: false, message: '', error: null });
    
    try {
      await handleSetupFirestore();
      setResult({
        success: true,
        message: 'Firestoreデータベースの初期化が完了しました。',
        error: null
      });
    } catch (error) {
      console.error('Firestoreの初期化中にエラーが発生しました:', error);
      setResult({
        success: false,
        message: '',
        error: `エラー: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSeedData = async () => {
    if (!window.confirm('サンプルデータをFirestoreに投入しますか？')) {
      return;
    }
    
    setLoading(true);
    setResult({ success: false, message: '', error: null });
    
    try {
      await seedFirestore();
      setResult({
        success: true,
        message: 'サンプルデータの投入が完了しました。',
        error: null
      });
    } catch (error) {
      console.error('サンプルデータ投入中にエラーが発生しました:', error);
      setResult({
        success: false,
        message: '',
        error: `エラー: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">管理者設定</h2>
        <p className="text-gray-600">データベース管理と初期設定</p>
      </div>
      
      {result.success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded flex items-start">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">成功</p>
            <p className="text-green-700">{result.message}</p>
          </div>
        </div>
      )}
      
      {result.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">エラー</p>
            <p className="text-red-700">{result.error}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Firestoreデータベース</h3>
          <p className="text-gray-600 mb-4">
            Firestoreデータベースの初期化と設定を行います。この操作はデータベースを新しい状態に初期化します。
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={handleInitializeFirestore}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '処理中...' : 'データベース初期化'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">サンプルデータ</h3>
          <p className="text-gray-600 mb-4">
            開発およびテスト用のサンプルデータをFirestoreに投入します。
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={handleSeedData}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '処理中...' : 'サンプルデータ投入'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Firestoreの構造</h3>
        <p className="text-gray-600 mb-4">
          このアプリケーションでは以下のコレクションを使用します：
        </p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">コレクション名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">説明</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">houses</td>
                <td className="px-6 py-4">温室ハウスの情報を格納するコレクション</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">environmental_data</td>
                <td className="px-6 py-4">環境データ（温度、湿度など）を格納するコレクション</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">tasks</td>
                <td className="px-6 py-4">作業タスクを格納するコレクション</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">alerts</td>
                <td className="px-6 py-4">アラート情報を格納するコレクション</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded border">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">注意事項</h3>
        <ul className="list-disc list-inside text-sm text-gray-600">
          <li>データベースの初期化は慎重に行ってください。既存のデータは全て削除されます。</li>
          <li>このページの機能は開発およびセットアップ時にのみ使用してください。</li>
          <li>本番環境では適切なセキュリティルールを設定することを忘れないでください。</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSettings;