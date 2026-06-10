import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '../hooks/useMediaQuery';
import MobileNav from '../components/mobile/MobileNav';
import TabNavigation from '../components/mobile/TabNavigation';
import FloatingActionButton from '../components/mobile/FloatingActionButton';
import { 
  PlusCircle, 
  Loader2, 
  AlertCircle, 
  InfoIcon 
} from 'lucide-react';
import HouseCard from '../components/HouseCard';

// Firestoreユーティリティをインポート
import { 
  getAllHouses, 
  getUnresolvedAlerts, 
  getLatestEnvironmentalData,
  formatFirestoreData,
  subscribeToHouses
} from '../firestoreUtils';

const Houses = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 状態の初期化
  const [houses, setHouses] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [housesEnvironmentalData, setHousesEnvironmentalData] = useState({});
  const [housesAlerts, setHousesAlerts] = useState({});
  const [availableCrops, setAvailableCrops] = useState([]);
  const [availableStatuses, setAvailableStatuses] = useState([]);

  // Firestoreからデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // ハウス情報を取得
        const housesData = await getAllHouses();
        
        if (housesData && housesData.length > 0) {
          const formattedHouses = housesData
            .filter(house => !house.id.startsWith('_')) // 特殊なドキュメントを除外
            .map(house => formatFirestoreData(house));
          
          setHouses(formattedHouses);
          
          // 利用可能な作物とステータスのリストを作成
          const crops = [...new Set(formattedHouses.map(house => house.currentCrop))].filter(Boolean);
          setAvailableCrops(crops);
          
          const statuses = [...new Set(formattedHouses.map(house => house.status))].filter(Boolean);
          setAvailableStatuses(statuses);
          
          // 各ハウスの最新環境データを取得
          const envData = {};
          const alertsData = {};
          
          // ハウスごとの環境データとアラートを取得
          await Promise.all(formattedHouses.map(async (house) => {
            try {
              // 環境データの取得
              const latestEnv = await getLatestEnvironmentalData(house.id);
              if (latestEnv) {
                envData[house.id] = formatFirestoreData(latestEnv);
              }
              
              // アラートの取得
              const alerts = await getUnresolvedAlerts(10);
              const houseAlerts = alerts.filter(alert => alert.houseId === house.id);
              alertsData[house.id] = houseAlerts.length;
            } catch (envError) {
              console.error(`ハウス ${house.id} のデータ取得エラー:`, envError);
            }
          }));
          
          setHousesEnvironmentalData(envData);
          setHousesAlerts(alertsData);
        } else {
          setError('ハウスデータが見つかりませんでした。設定ページからデータベースの初期化を行ってください。');
        }
      } catch (err) {
        console.error('ハウスデータの取得中にエラーが発生しました:', err);
        setError('データの取得中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    // 初期データの取得
    fetchData();
    
    // ハウスデータのリアルタイム更新をセットアップ
    const unsubscribe = subscribeToHouses((updatedHouses) => {
      if (updatedHouses && updatedHouses.length > 0) {
        const formattedHouses = updatedHouses
          .filter(house => !house.id.startsWith('_'))
          .map(house => formatFirestoreData(house));
        
        setHouses(formattedHouses);
      }
    });
    
    // クリーンアップ関数
    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  // フィルタリングロジック
  const filteredHouses = houses.filter(house => {
    // テキスト検索
    const textMatch = !filterText || 
      house.id.toLowerCase().includes(filterText.toLowerCase()) ||
      (house.currentCrop && house.currentCrop.toLowerCase().includes(filterText.toLowerCase())) ||
      (house.status && house.status.toLowerCase().includes(filterText.toLowerCase()));
    
    // ステータスフィルター
    const statusMatch = !statusFilter || house.status === statusFilter;
    
    // 作物フィルター
    const cropMatch = !cropFilter || house.currentCrop === cropFilter;
    
    return textMatch && statusMatch && cropMatch;
  });

  // モバイル用のタブ定義
  const mobileTabs = [
    { id: 'all', label: 'すべて' },
    { id: 'active', label: '稼働中' },
    { id: 'maintenance', label: 'メンテナンス中' },
    { id: 'inactive', label: '休止中' }
  ];

  // モバイル用のFABアクションハンドラー
  const handleFabAction = (action) => {
    if (action.id === 'add-house') {
      navigate('/settings');
    }
  };

  // モバイル用のヘッダー部分
  const renderMobileHeader = () => (
    <div className="pt-16 px-4">
      <h2 className="text-xl font-bold text-gray-800">温室ハウス一覧</h2>
      <TabNavigation 
        tabs={mobileTabs} 
        activeTab={statusFilter || 'all'} 
        onTabChange={(tabId) => setStatusFilter(mobileTabs[tabId].id)}
      />
    </div>
  );

  // デスクトップ用のヘッダー部分
  const renderDesktopHeader = () => (
    <div className="mb-6 flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">温室ハウス一覧</h2>
        <p className="text-gray-600">現在稼働中の温室ハウスの一覧と状況を確認できます</p>
      </div>
      <Link 
        to="/settings" 
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
      >
        <PlusCircle className="h-5 w-5 mr-2" />
        <span>管理者設定</span>
      </Link>
    </div>
  );

  // エラー表示
  const renderError = () => error && (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
      <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-red-800">エラー</p>
        <p className="text-red-700">{error}</p>
        <Link to="/settings" className="text-red-800 hover:underline font-medium mt-1 inline-block">
          管理者設定ページへ移動
        </Link>
      </div>
    </div>
  );

  // フィルタリング部分
  const renderFilters = () => !isMobile && (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-full md:w-1/3">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">ハウス検索</label>
          <input
            type="text"
            id="search"
            placeholder="ハウス名、作物名など..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className="w-full md:w-1/3">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">ステータスフィルター</label>
          <select
            id="status-filter"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">すべて表示</option>
            {availableStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-1/3">
          <label htmlFor="crop-filter" className="block text-sm font-medium text-gray-700 mb-1">作物フィルター</label>
          <select
            id="crop-filter"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
          >
            <option value="">すべて表示</option>
            {availableCrops.map(crop => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  // ローディング表示
  const renderLoading = () => loading && (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
      <p className="text-gray-600">ハウスデータを読み込み中...</p>
    </div>
  );

  // ハウス一覧表示
  const renderHousesList = () => !loading && (
    <>
      <div className={`${isMobile ? 'px-4 py-2 space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}`}>
        {filteredHouses.map(house => (
          <HouseCard 
            key={house.id} 
            house={house}
            environmentalData={housesEnvironmentalData[house.id] || null}
            alertCount={housesAlerts[house.id] || 0}
          />
        ))}
      </div>

      {filteredHouses.length === 0 && !loading && (
        <div className="text-center py-8 bg-gray-50 rounded-lg mt-4 flex flex-col items-center">
          <InfoIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium">該当するハウスが見つかりません</p>
          {filterText || statusFilter || cropFilter ? (
            <p className="text-gray-500 mt-1">検索条件を変更してみてください</p>
          ) : (
            <div className="mt-4">
              <Link 
                to="/settings" 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition-colors inline-flex"
              >
                データベースを初期化する
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );

  // モバイル用FAB
  const renderFloatingActionButton = () => isMobile && (
    <FloatingActionButton 
      actions={[
        { id: 'add-house', label: 'ハウスを追加', icon: <PlusCircle size={20} /> }
      ]}
      onAction={handleFabAction}
    />
  );

  return (
    <div className={`${isMobile ? 'pb-16' : 'fade-in'}`}>
      {isMobile && <MobileNav />}
      
      {isMobile ? renderMobileHeader() : renderDesktopHeader()}
      
      {renderError()}
      
      {renderFilters()}
      
      {renderLoading()}
      
      {renderHousesList()}
      
      {renderFloatingActionButton()}
    </div>
  );
};

export default Houses;