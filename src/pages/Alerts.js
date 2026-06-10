import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Bell, Filter, PlusCircle } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import MobileNav from '../components/mobile/MobileNav';
import TabNavigation from '../components/mobile/TabNavigation';
import FloatingActionButton from '../components/mobile/FloatingActionButton';

// Firestoreユーティリティをインポート
import { 
  getUnresolvedAlerts,
  getAllHouses,
  resolveAlert,
  formatFirestoreData 
} from '../firestoreUtils';

// コンポーネントのインポート
import AlertsTable from '../components/alerts/AlertsTable';
import AlertsFilter from '../components/alerts/AlertsFilter';
import ViewAlertModal from '../components/alerts/ViewAlertModal';
import RespondAlertModal from '../components/alerts/RespondAlertModal';
import AlertSettings from '../components/alerts/settings/AlertSettings';

const Alerts = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  // Firestoreからデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // アラートとハウスの情報を取得
        const [alertsData, housesData] = await Promise.all([
          getUnresolvedAlerts(100), // より多くのアラートを取得
          getAllHouses()
        ]);
        
        // データをフォーマット
        if (alertsData && alertsData.length > 0) {
          const formattedAlerts = alertsData.map(alert => formatFirestoreData(alert));
          setAlerts(formattedAlerts);
        } else {
          // ダミーデータ（後ほど削除）
          const dummyAlerts = [
            { 
              id: 'alert1', 
              title: '温室ハウス1の温度が高すぎます', 
              description: '設定温度を28℃としていますが、31℃を超えています',
              type: 'temperature',
              severity: 'high',
              status: 'pending', 
              houseId: 'house1',
              houseName: '温室ハウス1',
              timestamp: new Date(2025, 3, 5, 9, 23),
              value: 31.5,
              threshold: 28,
              resolved: false
            },
            { 
              id: 'alert2', 
              title: '温室ハウス3の湿度が低すぎます', 
              description: '湿度が40%を下回っています。通常は60-70%を維持してください',
              type: 'humidity',
              severity: 'medium',
              status: 'in-progress', 
              houseId: 'house3',
              houseName: '温室ハウス3',
              timestamp: new Date(2025, 3, 5, 8, 45),
              value: 40,
              threshold: 60,
              resolved: false
            },
            { 
              id: 'alert3', 
              title: '温室ハウス5の土壌水分が低下しています', 
              description: '土壌水分が40%を下回っています。灌水が必要です',
              type: 'soil',
              severity: 'low',
              status: 'pending', 
              houseId: 'house5',
              houseName: '温室ハウス5',
              timestamp: new Date(2025, 3, 4, 22, 15),
              value: 35,
              threshold: 40,
              resolved: false
            }
          ];
          setAlerts(dummyAlerts);
        }
        
        // ハウスのデータをセット
        if (housesData && housesData.length > 0) {
          setHouses(housesData);
        }
      } catch (err) {
        console.error('データの取得中にエラーが発生しました:', err);
        setError('データの取得中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    // 初期データの取得
    fetchData();
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
  const handleStatusChange = async (alertId, newStatus) => {
    try {
      setLoading(true);
      
      // アラートが解決済みとしてマークされた場合
      if (newStatus === 'resolved') {
        await resolveAlert(alertId);
      } else {
        // 他のステータス更新処理（未実装）
      }
      
      // UIの更新
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId 
            ? { 
                ...alert, 
                status: newStatus,
                resolved: newStatus === 'resolved',
                resolvedAt: newStatus === 'resolved' ? new Date() : null
              } 
            : alert
        )
      );
      
    } catch (err) {
      console.error('アラートの更新中にエラーが発生しました:', err);
      setError('アラートの更新中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // アラートレスポンス送信ハンドラー
  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    
    try {
      setLoading(true);
      
      const now = new Date();
      const isResolved = responseData.status === 'resolved';
      
      // アラートの状態を更新
      const updatedAlert = {
        ...selectedAlert,
        status: responseData.status,
        response: responseData.response,
        responseAt: now,
        respondedBy: '管理者', // 実際にはログインユーザー名などを使用
        notes: responseData.notes,
        resolved: isResolved,
        resolvedAt: isResolved ? now : null
      };
      
      // アラートが解決済みとしてマークされた場合
      if (isResolved) {
        await resolveAlert(selectedAlert.id);
      } else {
        // 他のステータス更新処理（未実装）
      }
      
      // UIの更新
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === selectedAlert.id ? updatedAlert : alert
        )
      );
      
      // モーダルを閉じる
      setIsRespondModalOpen(false);
      
      // 成功メッセージ
      alert('アラートへの対応を記録しました');
    } catch (err) {
      console.error('アラートの更新中にエラーが発生しました:', err);
      setError('アラートの更新中にエラーが発生しました');
    } finally {
      setLoading(false);
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
                アラート設定
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
        <AlertSettings />
      )}

      {/* モバイル用フローティングアクションボタン */}
      {isMobile && activeView === 'current' && (
        <FloatingActionButton 
          actions={[
            { id: 'filter', label: 'フィルター', icon: <Filter size={20} /> },
            { id: 'settings', label: 'アラート設定', icon: <PlusCircle size={20} /> }
          ]}
          onAction={handleFabAction}
        />
      )}
    </div>
  );
};

export default Alerts;