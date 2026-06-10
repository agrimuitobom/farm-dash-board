import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '../hooks/useMediaQuery';
import MobileNav from '../components/mobile/MobileNav';
import TabNavigation from '../components/mobile/TabNavigation';
import FloatingActionButton from '../components/mobile/FloatingActionButton';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';

// コンポーネントのインポート
import CropsTable from '../components/crops/CropsTable';
import CropsFilter from '../components/crops/CropsFilter';
import AddCropModal from '../components/crops/AddCropModal';
import EditCropModal from '../components/crops/EditCropModal';
import DeleteCropModal from '../components/crops/DeleteCropModal';
import ViewCropModal from '../components/crops/ViewCropModal';

// Firestoreユーティリティをインポート
import { 
  getAllCrops, 
  getHousesByCrop,
  addCrop,
  updateCrop,
  deleteCrop,
  formatFirestoreData 
} from '../firestoreUtils';

const Crops = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 状態の初期化
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [cropHouses, setCropHouses] = useState({});
  const [availableSeasons, setAvailableSeasons] = useState([]);
  
  // モーダル関連の状態
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    season: '',
    growthDays: 0,
    avgYield: '',
    optimalTemperature: { min: 18, max: 25 },
    optimalHumidity: { min: 50, max: 70 },
    optimalSoilMoisture: { min: 60, max: 80 },
    optimalLight: { min: 10000, max: 30000 },
    optimalCO2: { min: 800, max: 1200 },
    description: ''
  });

  // Firestoreからデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 作物情報を取得
        const cropsData = await getAllCrops();
        
        if (cropsData && cropsData.length > 0) {
          const formattedCrops = cropsData.map(crop => formatFirestoreData(crop));
          setCrops(formattedCrops);
          
          // 利用可能な栽培シーズンのリストを作成
          const seasons = [...new Set(formattedCrops.map(crop => crop.season))].filter(Boolean);
          setAvailableSeasons(seasons);
          
          // 各作物が栽培されているハウスを取得
          const housesData = {};
          
          await Promise.all(formattedCrops.map(async (crop) => {
            try {
              const houses = await getHousesByCrop(crop.id);
              housesData[crop.id] = houses.map(house => house.id);
            } catch (cropError) {
              console.error(`作物 ${crop.id} のハウスデータ取得エラー:`, cropError);
            }
          }));
          
          setCropHouses(housesData);
        } else {
          // データが存在しない場合はダミーデータを使用
          const dummyCrops = [
            { id: 1, name: '長期ミニトマト R6', season: '春-夏', growthDays: 90, avgYield: '15kg/㎡', currentHouses: ['温室ハウス1'] },
            { id: 2, name: '葉レタス サンチュ', season: '秋-冬', growthDays: 45, avgYield: '5kg/㎡', currentHouses: ['温室ハウス4'] },
            { id: 3, name: 'キュウリ 夏すずみ', season: '夏', growthDays: 60, avgYield: '10kg/㎡', currentHouses: ['温室ハウス2'] },
            { id: 4, name: 'パプリカ オレンジ', season: '春-夏', growthDays: 120, avgYield: '8kg/㎡', currentHouses: ['温室ハウス3'] },
            { id: 5, name: 'ナス 黒真珠', season: '夏', growthDays: 80, avgYield: '12kg/㎡', currentHouses: ['温室ハウス5'] },
            { id: 6, name: 'イチゴ あまおう', season: '冬-春', growthDays: 150, avgYield: '6kg/㎡', currentHouses: [] },
            { id: 7, name: 'メロン アンデス', season: '夏', growthDays: 100, avgYield: '4kg/㎡', currentHouses: [] },
            { id: 8, name: 'スイカ 夏小町', season: '夏', growthDays: 90, avgYield: '9kg/㎡', currentHouses: [] }
          ];
          setCrops(dummyCrops);
          
          // ダミーデータから栽培シーズンのリストを作成
          const seasons = [...new Set(dummyCrops.map(crop => crop.season))].filter(Boolean);
          setAvailableSeasons(seasons);
          
          // ダミーのハウスデータを作成
          const housesData = {};
          dummyCrops.forEach(crop => {
            housesData[crop.id] = crop.currentHouses || [];
          });
          setCropHouses(housesData);
        }
      } catch (err) {
        console.error('作物データの取得中にエラーが発生しました:', err);
        setError('データの取得中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    // 初期データの取得
    fetchData();
  }, []);

  // フィルタリングされた作物リストを計算
  const filteredCrops = crops.filter(crop => {
    // 名前でフィルタリング
    const nameMatch = crop.name.toLowerCase().includes(filterText.toLowerCase());
    
    // シーズンでフィルタリング
    const seasonMatch = !seasonFilter || crop.season === seasonFilter;
    
    return nameMatch && seasonMatch;
  });
  
  // フォームハンドラー
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // ネストされたプロパティの更新（適温など）
    if (name.includes('.')) {
      const [parentProp, childProp] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parentProp]: {
          ...prev[parentProp],
          [childProp]: Number(value)
        }
      }));
    } else if (name === 'growthDays') {
      // 数値型のフィールド
      setFormData(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    } else {
      // 通常のフィールド
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // モーダル操作ハンドラー
  const handleOpenAddModal = () => {
    // フォームデータをリセット
    setFormData({
      name: '',
      season: '',
      growthDays: 0,
      avgYield: '',
      optimalTemperature: { min: 18, max: 25 },
      optimalHumidity: { min: 50, max: 70 },
      optimalSoilMoisture: { min: 60, max: 80 },
      optimalLight: { min: 10000, max: 30000 },
      optimalCO2: { min: 800, max: 1200 },
      description: ''
    });
    setIsAddModalOpen(true);
  };
  
  const handleOpenEditModal = (crop) => {
    setSelectedCrop(crop);
    setFormData({
      name: crop.name,
      season: crop.season,
      growthDays: crop.growthDays,
      avgYield: crop.avgYield,
      optimalTemperature: crop.optimalTemperature || { min: 18, max: 25 },
      optimalHumidity: crop.optimalHumidity || { min: 50, max: 70 },
      optimalSoilMoisture: crop.optimalSoilMoisture || { min: 60, max: 80 },
      optimalLight: crop.optimalLight || { min: 10000, max: 30000 },
      optimalCO2: crop.optimalCO2 || { min: 800, max: 1200 },
      description: crop.description || ''
    });
    setIsEditModalOpen(true);
  };
  
  const handleOpenDeleteModal = (crop) => {
    setSelectedCrop(crop);
    setIsDeleteModalOpen(true);
  };
  
  const handleOpenViewModal = (crop) => {
    setSelectedCrop(crop);
    setIsViewModalOpen(true);
  };

  // データ操作ハンドラー
  const handleAddCrop = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addCrop(formData);
      setIsAddModalOpen(false);
      
      // データを再取得して表示を更新
      const newCropsData = await getAllCrops();
      const formattedCrops = newCropsData.map(crop => formatFirestoreData(crop));
      setCrops(formattedCrops);
      
      // 成功メッセージを表示
      alert('作物が追加されました');
    } catch (err) {
      console.error('作物の追加中にエラーが発生しました:', err);
      setError('作物の追加中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateCrop = async (e) => {
    e.preventDefault();
    if (!selectedCrop) return;
    
    try {
      setLoading(true);
      await updateCrop(selectedCrop.id, formData);
      setIsEditModalOpen(false);
      
      // データを再取得して表示を更新
      const newCropsData = await getAllCrops();
      const formattedCrops = newCropsData.map(crop => formatFirestoreData(crop));
      setCrops(formattedCrops);
      
      // 成功メッセージを表示
      alert('作物が更新されました');
    } catch (err) {
      console.error('作物の更新中にエラーが発生しました:', err);
      setError('作物の更新中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCrop = async () => {
    if (!selectedCrop) return;
    
    try {
      setLoading(true);
      await deleteCrop(selectedCrop.id);
      setIsDeleteModalOpen(false);
      
      // データを再取得して表示を更新
      const newCropsData = await getAllCrops();
      const formattedCrops = newCropsData.map(crop => formatFirestoreData(crop));
      setCrops(formattedCrops);
      
      // 成功メッセージを表示
      alert('作物が削除されました');
    } catch (err) {
      console.error('作物の削除中にエラーが発生しました:', err);
      setError('作物の削除中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // モバイル用のタブ定義
  const mobileTabs = [
    { id: '', label: 'すべて' },
    { id: '春-夏', label: '春-夏' },
    { id: '夏', label: '夏' },
    { id: '秋-冬', label: '秋-冬' },
    { id: '冬-春', label: '冬-春' }
  ];

  // モバイル用のFABアクションハンドラー
  const handleFabAction = (action) => {
    if (action.id === 'add-crop') {
      handleOpenAddModal();
    }
  };

  // モバイル用の作物カードレンダリング
  const renderMobileCropCard = (crop) => {
    return (
      <div 
        key={crop.id}
        className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-green-500"
        onClick={() => handleOpenViewModal(crop)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{crop.name}</h3>
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">{crop.season}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
          <div>
            <span className="font-medium">育成期間:</span> {crop.growthDays}日
          </div>
          <div>
            <span className="font-medium">平均収量:</span> {crop.avgYield}
          </div>
        </div>
        <div className="text-sm text-gray-500 mb-2 line-clamp-2">
          {crop.description || '説明はありません'}
        </div>
        {cropHouses[crop.id] && cropHouses[crop.id].length > 0 && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">栽培中:</span> {cropHouses[crop.id].join(', ')}
          </div>
        )}
      </div>
    );
  };

  // レンダリング部分
  return (
    <div className={`${isMobile ? 'pb-16' : 'container px-4 py-8 mx-auto'}`}>
      {isMobile && <MobileNav />}

      {isMobile ? (
        <div className="pt-16 px-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">作物管理</h2>
          <TabNavigation 
            tabs={mobileTabs.map(tab => ({ label: tab.label }))}
            activeTab={mobileTabs.findIndex(tab => tab.id === seasonFilter)}
            onTabChange={(index) => setSeasonFilter(mobileTabs[index].id)}
          />
        </div>
      ) : (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">作物管理</h1>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            新規作物追加
          </button>
        </div>
      )}
      
      {/* フィルター部分 - モバイルでは表示しない */}
      {!isMobile && (
        <CropsFilter 
          filterText={filterText}
          seasonFilter={seasonFilter}
          availableSeasons={availableSeasons}
          onFilterTextChange={setFilterText}
          onSeasonFilterChange={setSeasonFilter}
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
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          <span className="ml-2 text-gray-600">データを読み込み中...</span>
        </div>
      ) : (
        <>
          {/* テーブル表示 - モバイルではカード表示に切り替え */}
          {isMobile ? (
            <div className="px-4 py-4">
              {filteredCrops.map(crop => renderMobileCropCard(crop))}
              {filteredCrops.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">表示する作物がありません</p>
                </div>
              )}
            </div>
          ) : (
            <CropsTable 
              crops={filteredCrops}
              cropHouses={cropHouses}
              onView={handleOpenViewModal}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
            />
          )}
        </>
      )}
      
      {/* モーダルコンポーネント */}
      <AddCropModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleAddCrop}
      />
      
      <EditCropModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        crop={selectedCrop}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleUpdateCrop}
      />
      
      <DeleteCropModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        crop={selectedCrop}
        handleDelete={handleDeleteCrop}
      />
      
      <ViewCropModal 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        crop={selectedCrop}
        cropHouses={cropHouses}
      />
      
      {/* モバイル用フローティングアクションボタン */}
      {isMobile && (
        <FloatingActionButton 
          actions={[
            { id: 'add-crop', label: '作物を追加', icon: <PlusCircle size={20} /> }
          ]}
          onAction={handleFabAction}
        />
      )}
    </div>
  );
};

export default Crops;