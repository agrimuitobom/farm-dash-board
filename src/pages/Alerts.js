import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, Loader2, Bell, Filter, PlusCircle, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMediaQuery } from '../hooks/useMediaQuery';
import MobileNav from '../components/mobile/MobileNav';
import TabNavigation from '../components/mobile/TabNavigation';
import FloatingActionButton from '../components/mobile/FloatingActionButton';

// Firestoreユーティリティをインポート
import { 
  subscribeToUnresolvedAlerts,
  subscribeToHouses,
  resolveAlert,
  resolveAlerts,
  updateAlertResponse
} from '../firestoreUtils';
import { normalizeAlert } from '../utils/alerts';
import { useAuth } from '../contexts/AuthContext';

// コンポーネントのインポート
import AlertsTable from '../components/alerts/AlertsTable';
import AlertsFilter from '../components/alerts/AlertsFilter';
import ViewAlertModal from '../components/alerts/ViewAlertModal';
import RespondAlertModal from '../components/alerts/RespondAlertModal';
import AlertThresholdOverview from '../components/alerts/AlertThresholdOverview';

const Alerts = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const userName = currentUser?.displayName || currentUser?.email || '';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const queryParams = new URLSearchParams(location.search);
  const alertIdFromUrl = queryParams.get('id');

  // 状態の初期化
  const [activeView, setActiveView] = useState('current'); // current, settings
  const [alerts, setAlerts] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // フィルター状態
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, in-progress, resolved
  const [typeFilter, setTypeFilter] = useState('all'); // all, temperature, humidity, etc.
  const [houseFilter, setHouseFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: null, end: null });
  
  // モーダル関連の状態
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  // レスポンスフォームの初期値
  const initialResponseData = {
    response: '',
    status: 'in-progress', // pending, in-progress, resolved
    notes: ''
  };
  
  const [responseData, setResponseData] = useState(initialResponseData);

  // 未解決のアラートとハウス一覧をリアルタイムに監視
  // （Raspberry Pi の見張りプログラムが追加・自動解決したアラートもすぐ反映される）
  useEffect(() => {
    const unsubscribeAlerts = subscribeToUnresolvedAlerts((alertsData) => {
      setAlerts(alertsData.map(normalizeAlert));
      setLoading(false);
    });
    const unsubscribeHouses = subscribeToHouses(setHouses);
    return () => {
      unsubscribeAlerts();
      unsubscribeHouses();
    };
  }, []);

  // クエリパラメータからアラートIDを取得した場合、対応するアラートを自動的に表示
  useEffect(() => {
    if (alertIdFromUrl && alerts.length > 0) {
      const matchingAlert = alerts.find(alert => String(alert.id) === alertIdFromUrl);
      if (matchingAlert) {
        setSelectedAlert(matchingAlert);
        setIsViewModalOpen(true);
      }
    }
  }, [alertIdFromUrl, alerts]);

  // フィルタリングされたアラートリストを計算
  const filteredAlerts = alerts.filter(alert => {
    // テキストでフィルタリング（タイトルと説明）
    const textMatch = 
      alert.title.toLowerCase().includes(filterText.toLowerCase()) || 
      (alert.description && alert.description.toLowerCase().includes(filterText.toLowerCase()));
    
    // ステータスでフィルタリング
    const statusMatch = 
      statusFilter === 'all' || 
      (statusFilter === 'pending' && alert.status === 'pending') ||
      (statusFilter === 'in-progress' && alert.status === 'in-progress') ||
      (statusFilter === 'resolved' && alert.status === 'resolved');
    
    // アラートタイプでフィルタリング
    const typeMatch = typeFilter === 'all' || alert.type === typeFilter;
    
    // ハウスでフィルタリング
    const houseMatch = houseFilter === '' || alert.houseId === houseFilter;
    
    // 日付範囲でフィルタリング
    let dateMatch = true;
    if (dateRangeFilter.start && dateRangeFilter.end) {
      const alertDate = new Date(alert.timestamp);
      dateMatch = 
        alertDate >= new Date(dateRangeFilter.start) && 
        alertDate <= new Date(dateRangeFilter.end);
    }
    
    return textMatch && statusMatch && typeMatch && houseMatch && dateMatch;
  });
  
  // フィルター操作ハンドラー
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'filterText':
        setFilterText(value);
        break;
      case 'statusFilter':
        setStatusFilter(value);
        break;
      case 'typeFilter':
        setTypeFilter(value);
        break;
      case 'houseFilter':
        setHouseFilter(value);
        break;
      default:
        break;
    }
  };
  
  // 日付範囲フィルターハンドラー
  const handleDateRangeChange = (range) => {
    setDateRangeFilter(range);
  };
  
  // モーダル操作ハンドラー
  const handleOpenViewModal = (alert) => {
    setSelectedAlert(alert);
    setIsViewModalOpen(true);
  };
  
  const handleOpenRespondModal = (alert) => {
    setSelectedAlert(alert);
    setResponseData({
      ...initialResponseData,
      status: alert.status === 'pending' ? 'in-progress' : alert.status
    });
    setIsRespondModalOpen(true);
  };
  
  // レスポンス入力ハンドラー
  const handleResponseChange = (e) => {
    const { name, value } = e.target;
    setResponseData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // アラートのステータス変更ハンドラー
  // 一覧はリアルタイム監視しているので、保存すれば画面にも反映される
  const handleStatusChange = async (alertId, newStatus) => {
    try {
      if (newStatus === 'resolved') {
        await resolveAlert(alertId, { resolvedBy: userName });
      } else {
        await updateAlertResponse(alertId, { status: newStatus, respondedBy: userName });
      }
    } catch (err) {
      console.error('アラートの更新中にエラーが発生しました:', err);
      setError('アラートの更新中にエラーが発生しました');
    }
  };
  
  // アラートレスポンス送信ハンドラー
  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    
    try {
      if (responseData.status === 'resolved') {
        await resolveAlert(selectedAlert.id, {
          resolution: responseData.response,
          actionTaken: responseData.notes,
          resolvedBy: userName
        });
      } else {
        await updateAlertResponse(selectedAlert.id, { ...responseData, respondedBy: userName });
      }
      setIsRespondModalOpen(false);
      toast.success('アラートへの対応を記録しました');
    } catch (err) {
      console.error('アラートの更新中にエラーが発生しました:', err);
      setError('アラートの更新中にエラーが発生しました');
    }
  };

  // 表示中の未解決アラートをまとめて解決済みにする（以前のサンプルデータの片付けなど）
  const unresolvedVisible = filteredAlerts.filter(alert => alert.status !== 'resolved');
  const handleResolveAll = async () => {
    if (unresolvedVisible.length === 0) return;
    if (!window.confirm(`表示中の ${unresolvedVisible.length} 件のアラートをすべて解決済みにしますか？`)) {
      return;
    }
    try {
      await resolveAlerts(
        unresolvedVisible.map(alert => alert.id),
        { resolution: '一括で解決済みにしました', resolvedBy: userName }
      );
      toast.success(`${unresolvedVisible.length} 件のアラートを解決済みにしました`);
    } catch (err) {
      console.error('アラートの一括解決中にエラーが発生しました:', err);
      setError('アラートの一括解決中にエラーが発生しました');
    }
  };

  // モバイル用のタブ定義
  const mobileTabs = [
    { id: 'all', label: 'すべて' },
    { id: 'pending', label: '未対応' },
    { id: 'in-progress', label: '対応中' },
    { id: 'resolved', label: '解決済み' }
  ];

  // モバイル用FABアクションハンドラー
  const handleFabAction = (action) => {
    if (action.id === 'settings') {
      setActiveView('settings');
    } else if (action.id === 'resolve-all') {
      handleResolveAll();
    } else if (action.id === 'filter') {
      // モバイル用フィルター表示（実装は省略）
    }
  };

  // モバイル用のアラートカードレンダリング
  const renderMobileAlertCard = (alert) => {
    // アラートの重要度に応じた色を設定
    const severityColor = {
      'high': 'border-red-500 bg-red-50',
      'medium': 'border-orange-500 bg-orange-50',
      'low': 'border-yellow-500 bg-yellow-50'
    }[alert.severity] || 'border-gray-500 bg-gray-50';

    // アラートステータスに応じたバッジを設定
    const statusBadge = {
      'pending': 'bg-red-100 text-red-800',
      'in-progress': 'bg-orange-100 text-orange-800',
      'resolved': 'bg-green-100 text-green-800'
    }[alert.status] || 'bg-gray-100 text-gray-800';

    // アラートタイプに応じたアイコンを設定
    const typeIcon = {
      'temperature': '🌡️',
      'humidity': '💧',
      'soil': '🌱',
      'light': '☀️',
      'co2': '☁️'
    }[alert.type] || '⚠️';

    return (
      <div 
        key={alert.id}
        className={`p-4 mb-4 rounded-lg shadow-md border-l-4 ${severityColor}`}
        onClick={() => handleOpenViewModal(alert)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <span className="mr-2 text-lg">{typeIcon}</span>
            <h3 className="text-base font-medium text-gray-900">{alert.title}</h3>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${statusBadge}`}>
            {alert.status === 'pending' ? '未対応' : alert.status === 'in-progress' ? '対応中' : '解決済み'}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {alert.description}
        </p>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>場所: {alert.houseName}</span>
          <span>
            {alert.timestamp instanceof Date 
              ? `${alert.timestamp.getMonth()+1}/${alert.timestamp.getDate()} ${String(alert.timestamp.getHours()).padStart(2, '0')}:${String(alert.timestamp.getMinutes()).padStart(2, '0')}`
              : '日時不明'}
          </span>
        </div>
      </div>
    );
  };

  // レンダリング部分
  return (
    <div className={`${isMobile ? 'pb-16' : 'container px-4 py-8 mx-auto'}`}>
      {isMobile && <MobileNav />}

      {isMobile ? (
        <div className="pt-16 px-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">アラート管理</h2>
          <TabNavigation 
            tabs={mobileTabs.map(tab => ({ label: tab.label }))}
            activeTab={mobileTabs.findIndex(tab => tab.id === statusFilter)}
            onTabChange={(index) => setStatusFilter(mobileTabs[index].id)}
          />
        </div>
      ) : (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">アラート管理</h1>
          
          <div className="flex items-center">
            {activeView === 'current' && (
              <div className="flex items-center space-x-2 mr-6">
                <span className="text-sm text-gray-600">
                  合計: {filteredAlerts.length} アラート
                </span>
                <span className="mx-2 text-gray-400">|</span>
                <span className="text-sm text-red-600">
                  未対応: {alerts.filter(a => a.status === 'pending').length} アラート
                </span>
                <button
                  onClick={handleResolveAll}
                  disabled={unresolvedVisible.length === 0}
                  className="ml-4 px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 flex items-center"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  表示中をすべて解決済みにする
                </button>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveView('current')}
                className={`px-3 py-1 text-sm rounded-md ${activeView === 'current' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                現在のアラート
              </button>
              <button
                onClick={() => setActiveView('settings')}
                className={`px-3 py-1 text-sm rounded-md ${activeView === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                閾値の設定
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeView === 'current' ? (
        <>
          {/* フィルター部分 - モバイルでは非表示 */}
          {!isMobile && (
            <AlertsFilter 
              filterText={filterText}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              houseFilter={houseFilter}
              dateRangeFilter={dateRangeFilter}
              houses={houses}
              onFilterChange={handleFilterChange}
              onDateRangeChange={handleDateRangeChange}
            />
          )}
          
          {/* エラー表示 */}
          {error && (
            <div className="p-4 mb-6 bg-red-100 border-l-4 border-red-500 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 mr-2 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {/* 読み込み中表示 */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">データを読み込み中...</span>
            </div>
          ) : (
            <>
              {/* アラートがない場合のメッセージ */}
              {filteredAlerts.length === 0 ? (
                <div className={`${isMobile ? 'mt-4 mx-4' : ''} bg-white rounded-lg shadow-md p-10 text-center`}>
                  <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">アラートはありません</h3>
                  <p className="text-gray-600">
                    現在、選択された条件に一致するアラートはありません。
                  </p>
                </div>
              ) : (
                <>
                  {isMobile ? (
                    <div className="px-4 py-4">
                      {filteredAlerts.map(alert => renderMobileAlertCard(alert))}
                    </div>
                  ) : (
                    <AlertsTable 
                      alerts={filteredAlerts}
                      onView={handleOpenViewModal}
                      onRespond={handleOpenRespondModal}
                      onStatusChange={handleStatusChange}
                    />
                  )}
                </>
              )}
              
              {/* モーダルコンポーネント */}
              <ViewAlertModal 
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                alert={selectedAlert}
                onRespond={handleOpenRespondModal}
              />
              
              <RespondAlertModal 
                isOpen={isRespondModalOpen}
                onClose={() => setIsRespondModalOpen(false)}
                alert={selectedAlert}
                responseData={responseData}
                handleInputChange={handleResponseChange}
                handleSubmit={handleSubmitResponse}
              />
            </>
          )}
        </>
      ) : (
        <AlertThresholdOverview houses={houses} />
      )}

      {/* モバイル用フローティングアクションボタン */}
      {isMobile && activeView === 'current' && (
        <FloatingActionButton 
          actions={[
            { id: 'filter', label: 'フィルター', icon: <Filter size={20} /> },
            { id: 'resolve-all', label: 'すべて解決済みにする', icon: <CheckCheck size={20} /> },
            { id: 'settings', label: '閾値の設定', icon: <PlusCircle size={20} /> }
          ]}
          onAction={handleFabAction}
        />
      )}
    </div>
  );
};

export default Alerts;