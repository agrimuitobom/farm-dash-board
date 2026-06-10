import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Info, Check } from 'lucide-react';

// コンポーネントのインポート
import AlertThresholdSettings from './AlertThresholdSettings';
import NotificationSettings from './NotificationSettings';
import AlertHistoryView from './AlertHistoryView';

const AlertSettings = () => {
  const [activeTab, setActiveTab] = useState('thresholds');
  const [loading, setLoading] = useState(true);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // データの状態
  const [houses, setHouses] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);
  
  // 初期データの読み込み
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ダミーデータ
        const dummyHouses = [
          { id: 'house1', name: '温室ハウス1', type: 'greenhouse' },
          { id: 'house2', name: '温室ハウス2', type: 'greenhouse' },
          { id: 'house3', name: '育苗ハウス', type: 'nursery' }
        ];
        
        const dummyThresholds = [
          { 
            id: 'threshold1', 
            houseId: 'house1', 
            houseName: '温室ハウス1',
            type: 'temperature', 
            condition: 'greater_than', 
            value: 35, 
            severity: 'high' 
          },
          { 
            id: 'threshold2', 
            houseId: 'house1', 
            houseName: '温室ハウス1',
            type: 'humidity', 
            condition: 'less_than', 
            value: 40, 
            severity: 'medium' 
          },
          { 
            id: 'threshold3', 
            houseId: 'house2', 
            houseName: '温室ハウス2',
            type: 'co2', 
            condition: 'less_than', 
            value: 800, 
            severity: 'low' 
          }
        ];
        
        const dummyHistory = [
          { 
            id: 'alert1', 
            title: '温度警告', 
            description: '温室ハウス1の温度が35℃を超えています',
            type: 'temperature',
            severity: 'high',
            status: 'resolved', 
            houseId: 'house1',
            houseName: '温室ハウス1',
            timestamp: new Date(2025, 3, 2, 14, 30),
            value: 36.5,
            threshold: 35,
            resolved: true,
            resolvedAt: new Date(2025, 3, 2, 15, 30)
          },
          { 
            id: 'alert2', 
            title: '湿度警告', 
            description: '温室ハウス2の湿度が30%を下回っています',
            type: 'humidity',
            severity: 'medium',
            status: 'in-progress', 
            houseId: 'house2',
            houseName: '温室ハウス2',
            timestamp: new Date(2025, 3, 3, 10, 15),
            value: 25,
            threshold: 30,
            resolved: false,
            response: '換気システムの調整中',
            responseAt: new Date(2025, 3, 3, 10, 45),
            respondedBy: '設備担当'
          }
        ];
        
        // データの設定
        setHouses(dummyHouses);
        setThresholds(dummyThresholds);
        setAlertHistory(dummyHistory);
        
      } catch (err) {
        console.error('データの取得中にエラーが発生しました:', err);
        setError('データの読み込み中にエラーが発生しました。ページを更新して再試行してください。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // 閾値設定の保存
  const handleSaveThresholds = async (updatedThresholds) => {
    try {
      setSavingThresholds(true);
      setError(null);
      
      // Firestoreに保存（実際の実装では saveAlertThresholds() を使用）
      // await saveAlertThresholds(updatedThresholds);
      
      // UI更新
      setThresholds(updatedThresholds);
      
      // 成功メッセージ
      setSuccess('閾値設定が保存されました');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('閾値設定の保存中にエラーが発生しました:', err);
      setError('閾値設定の保存中にエラーが発生しました。再試行してください。');
    } finally {
      setSavingThresholds(false);
    }
  };
  
  // 通知設定の保存
  const handleSaveNotifications = async (updatedSettings) => {
    try {
      setSavingNotifications(true);
      setError(null);
      
      // Firestoreに保存（実際の実装では saveNotificationSettings() を使用）
      // await saveNotificationSettings(updatedSettings);
      
      // UI更新
      setNotificationSettings(updatedSettings);
      
      // 成功メッセージ
      setSuccess('通知設定が保存されました');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('通知設定の保存中にエラーが発生しました:', err);
      setError('通知設定の保存中にエラーが発生しました。再試行してください。');
    } finally {
      setSavingNotifications(false);
    }
  };
  
  // アラート履歴のエクスポート
  const handleExportAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // CSVにエクスポート（実際の実装では exportAlertsToCsv() を使用）
      // await exportAlertsToCsv(alertHistory);
      
      // ダミー実装
      console.log('アラート履歴をエクスポート:', alertHistory);
      
      // 成功メッセージ
      setSuccess('アラート履歴がエクスポートされました');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('アラート履歴のエクスポート中にエラーが発生しました:', err);
      setError('アラート履歴のエクスポート中にエラーが発生しました。再試行してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">アラート設定</h1>
        <div className="flex items-center">
          <Bell className="w-5 h-5 text-blue-500 mr-2" />
          <span className="text-sm text-gray-600">
            設定済み閾値: {thresholds.length} | アラート履歴: {alertHistory.length}件
          </span>
        </div>
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="p-4 mb-6 bg-red-100 border-l-4 border-red-500 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* 成功メッセージ */}
      {success && (
        <div className="p-4 mb-6 bg-green-100 border-l-4 border-green-500 rounded-md">
          <div className="flex items-center">
            <Check className="w-5 h-5 mr-2 text-green-500" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}
      
      {/* ローディングインジケーター */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">データを読み込み中...</span>
        </div>
      )}
      
      {!loading && (
        <div className="space-y-6">
          {/* タブナビゲーション */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('thresholds')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'thresholds' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                閾値設定
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'notifications' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                通知設定
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                履歴表示
              </button>
            </nav>
          </div>
          
          {/* タブ内容 */}
          {activeTab === 'thresholds' && (
            <AlertThresholdSettings 
              houses={houses}
              thresholds={thresholds}
              onSave={handleSaveThresholds}
              loading={savingThresholds}
            />
          )}
          
          {activeTab === 'notifications' && (
            <NotificationSettings 
              settings={notificationSettings}
              onSave={handleSaveNotifications}
              loading={savingNotifications}
            />
          )}
          
          {activeTab === 'history' && (
            <AlertHistoryView 
              alertHistory={alertHistory}
              loading={loading}
              exportAlerts={handleExportAlerts}
            />
          )}
          
          {/* 情報注釈 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">アラート機能について</h3>
                <p className="text-sm text-blue-700 mt-1">
                  アラート機能は環境データの閾値超過を検知し、通知を行います。
                  各ハウスごとに温度や湿度などの閾値を設定し、超過時の通知方法を選択できます。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertSettings;