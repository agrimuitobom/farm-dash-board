import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  ArrowLeft, 
  Loader2,
  AlertTriangle,
  PlusCircle,
  Edit,
  Trash2,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import TabNavigation from './TabNavigation';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import EnvironmentalChart from '../EnvironmentalChart';
import FloatingActionButton from './FloatingActionButton';

import { 
  getHouseById, 
  getEnvironmentalHistory, 
  getAlertsByHouse,
  subscribeToHouse,
  subscribeToEnvironmentalData,
  updateHouseCrops,
  getCropHistory,
  moveCropToHistory
} from '../../firestoreUtils';

/**
 * モバイル向けに最適化した温室詳細画面
 */
const MobileHouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [envData, setEnvData] = useState(null);
  const [envHistory, setEnvHistory] = useState([]);
  const [crops, setCrops] = useState([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [cropHistoryData, setCropHistoryData] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // タブ定義
  const tabs = [
    { label: '環境データ' },
    { label: '作物情報' },
    { label: '履歴' }
  ];

  // FABアクション定義
  const fabActions = [
    { id: 'add-crop', label: '作物登録', icon: <PlusCircle size={20} /> },
    { id: 'add-task', label: '作業追加', icon: <PlusCircle size={20} /> }
  ];

  useEffect(() => {
    let unsubscribeHouse = null;
    let unsubscribeEnv = null;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // ハウスデータのリアルタイム監視を設定
        unsubscribeHouse = subscribeToHouse(id, (houseData) => {
          if (houseData) {
            setHouse(houseData);
            
            // 作物データを設定
            if (houseData.crops && Array.isArray(houseData.crops)) {
              setCrops(houseData.crops);
            }
          } else {
            setError('温室が見つかりませんでした');
          }
        });
        
        // 環境データのリアルタイム監視を設定
        unsubscribeEnv = subscribeToEnvironmentalData(id, (data) => {
          setEnvData(data);
        });
        
        // 環境データ履歴を取得
        const historyData = await getEnvironmentalHistory(id, 48);
        setEnvHistory(historyData);
        
        // 作物履歴を取得
        const cropHistory = await getCropHistory(id);
        setCropHistoryData(cropHistory);
        
      } catch (err) {
        console.error('温室データの取得に失敗しました:', err);
        setError('温室データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // コンポーネントのアンマウント時にリスナーを解除
    return () => {
      if (unsubscribeHouse) unsubscribeHouse();
      if (unsubscribeEnv) unsubscribeEnv();
    };
  }, [id]);

  // FABアクションハンドラ
  const handleFabAction = (action) => {
    if (action.id === 'add-crop') {
      // 作物追加モーダルを開く処理
      // 実際の実装ではここでモーダルを開くロジックを記述
    } else if (action.id === 'add-task') {
      // このハウスに対するタスク追加画面に遷移
      navigate(`/calendar?houseId=${id}`);
    }
  };

  // デスクトップ版の表示はオリジナルのHouseDetailコンポーネントに任せる
  if (isDesktop) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-lg">温室データを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">エラーが発生しました</h2>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => navigate('/houses')}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          温室一覧に戻る
        </button>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">温室が見つかりません</h2>
        <p className="text-gray-600">指定されたIDの温室は存在しません</p>
        <button
          onClick={() => navigate('/houses')}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          温室一覧に戻る
        </button>
      </div>
    );
  }

  // 環境データカード
  const renderEnvironmentalData = () => {
    if (!envData) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
          環境データが読み込まれていません
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Thermometer className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-gray-700 text-sm">温度</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{envData.temperature?.toFixed(1) || '--'}</span>
            <span className="text-gray-500 ml-1">°C</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Droplets className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-gray-700 text-sm">湿度</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{envData.humidity?.toFixed(1) || '--'}</span>
            <span className="text-gray-500 ml-1">%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Sun className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-gray-700 text-sm">光量</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{envData.lightLevel?.toFixed(0) || '--'}</span>
            <span className="text-gray-500 ml-1">lux</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Wind className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-gray-700 text-sm">CO₂</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{envData.co2Level?.toFixed(0) || '--'}</span>
            <span className="text-gray-500 ml-1">ppm</span>
          </div>
        </div>
      </div>
    );
  };

  // 作物一覧
  const renderCrops = () => {
    if (crops.length === 0) {
      return (
        <div className="p-6 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500 mb-4">登録されている作物はありません</p>
          <button
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md mx-auto hover:bg-green-700"
          >
            <PlusCircle className="w-4 h-4 mr-1" />
            <span>作物を登録する</span>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {crops.map(crop => (
          <div key={crop.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between">
              <div>
                <h4 className="font-semibold text-lg">{crop.cropName}</h4>
                {crop.variety && <p className="text-gray-600 text-sm">品種: {crop.variety}</p>}
              </div>
              <div className="flex space-x-1">
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="編集"
                >
                  <Edit className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="栽培完了"
                >
                  <History className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">栽培開始日:</span>
                <span>{new Date(crop.startDate).toLocaleDateString()}</span>
              </div>
              {crop.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">栽培終了日:</span>
                  <span>{new Date(crop.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {crop.notes && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <p className="text-gray-600 text-sm">{crop.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // 栽培履歴
  const renderCropHistory = () => {
    if (cropHistoryData.length === 0) {
      return (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">過去の作物履歴はありません</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {cropHistoryData.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">{item.cropName}</h4>
                {item.variety && <p className="text-gray-600 text-sm">品種: {item.variety}</p>}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(item.startDate).toLocaleDateString()} ころ 〜 {new Date(item.endDate).toLocaleDateString()}
              </div>
            </div>
            
            {item.harvestAmount > 0 && (
              <div className="mt-2">
                <span className="text-sm font-medium">収穫量: </span>
                <span className="text-sm">{item.harvestAmount} kg</span>
              </div>
            )}
            
            {item.notes && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-gray-600 text-sm">{item.notes}</p>
              </div>
            )}
            
            {item.harvestNotes && (
              <div className="mt-2">
                <p className="text-gray-600 text-sm italic">収穫メモ: {item.harvestNotes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // タブごとのコンテンツをレンダリング
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // 環境データ
        return (
          <div className="space-y-6 mt-4">
            <h3 className="text-lg font-semibold">現在の環境</h3>
            {renderEnvironmentalData()}
            
            <h3 className="text-lg font-semibold mt-6">環境データの推移</h3>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="h-64">
                <EnvironmentalChart data={envHistory} />
              </div>
            </div>
          </div>
        );
      case 1: // 作物情報
        return (
          <div className="space-y-6 mt-4">
            <h3 className="text-lg font-semibold">栽培作物</h3>
            {renderCrops()}
          </div>
        );
      case 2: // 履歴
        return (
          <div className="space-y-6 mt-4">
            <h3 className="text-lg font-semibold">過去の栽培履歴</h3>
            {renderCropHistory()}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-20">
      <div className="mb-4 flex items-center">
        <button
          onClick={() => navigate('/houses')}
          className="mr-3 p-2 rounded-full hover:bg-gray-200"
          aria-label="戻る"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{house.name}</h2>
          {house.status && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              house.status === '稼働中' ? 'bg-green-100 text-green-800' : 
              house.status === '休止中' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {house.status}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">面積</p>
            <p className="font-medium">{house.area || '--'} m²</p>
          </div>
          <div>
            <p className="text-gray-500">建設日</p>
            <p className="font-medium">
              {house.constructionDate 
                ? new Date(house.constructionDate).toLocaleDateString() 
                : '--'
              }
            </p>
          </div>
        </div>
        
        {house.notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-gray-500 text-sm">備考</p>
            <p className="text-gray-700 text-sm">{house.notes}</p>
          </div>
        )}
      </div>

      <TabNavigation 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {renderTabContent()}

      <FloatingActionButton 
        actions={fabActions} 
        onAction={handleFabAction} 
      />
    </div>
  );
};

export default MobileHouseDetail;