import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  Calendar, 
  ArrowLeft, 
  Loader2,
  AlertTriangle,
  RefreshCw,
  ListPlus,
  Clipboard,
  PlusCircle,
  Edit,
  Trash2,
  History
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 環境データグラフコンポーネントをインポート
import EnvironmentalChart from './EnvironmentalChart';

// Firestoreユーティリティをインポート
import { 
  getHouseById, 
  getEnvironmentalHistory, 
  getAlertsByHouse,
  getTasksByHouse,
  formatFirestoreData,
  subscribeToHouse,
  subscribeToEnvironmentalData,
  addCropAreaToHouse,
  updateCropArea,
  removeCropArea,
  migrateHouseToCropAreas,
  getAllCrops,
  updateHouseCrops,
  getCropHistory,
  moveCropToHistory
} from '../firestoreUtils';

// 作物登録用のモーダル
const CropRegistrationModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
  const [formData, setFormData] = useState({
    cropName: '',
    variety: '',
    startDate: '',
    endDate: '',
    notes: '',
    ...initialData
  });
  
  // モーダルが開くたびにフォームをリセット
  useEffect(() => {
    if (isOpen) {
      setFormData({
        cropName: '',
        variety: '',
        startDate: '',
        endDate: '',
        notes: '',
        ...initialData
      });
    }
  }, [isOpen, initialData]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">栽培作物の登録</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作物名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cropName"
              value={formData.cropName}
              onChange={handleInputChange}
              placeholder="例: トマト、キュウリ、ナスなど"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              品種名
            </label>
            <input
              type="text"
              name="variety"
              value={formData.variety}
              onChange={handleInputChange}
              placeholder="例: 桃太郎、四葉など"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                栽培開始日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                栽培終了日（予定）
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考（病害虫などの特記事項）
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border rounded"
              placeholder="病害虫の発生状況や特記事項があれば入力してください"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded shadow hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
            >
              登録
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 作物履歴表示用のコンポーネント
const CropHistorySection = ({ houseId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const historyData = await getCropHistory(houseId);
        setHistory(historyData);
      } catch (err) {
        console.error('作物履歴の取得に失敗しました:', err);
        setError('作物履歴の取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [houseId]);
  
  if (loading) {
    return <div className="text-center py-4">履歴を読み込み中...</div>;
  }
  
  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }
  
  if (history.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">過去の作物履歴はありません</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {history.map(item => (
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

// 作物表示用のカード
const CropCard = ({ crop, onEdit, onDelete, onComplete }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between">
        <div>
          <h4 className="font-semibold text-lg">{crop.cropName}</h4>
          {crop.variety && <p className="text-gray-600 text-sm">品種: {crop.variety}</p>}
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(crop)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="編集"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(crop.id)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="削除"
          >
            <Trash2 className="h-4 w-4 text-gray-600" />
          </button>
          {onComplete && (
            <button
              onClick={() => onComplete(crop)}
              className="p-1 rounded-full hover:bg-gray-100"
              title="栽培完了"
            >
              <History className="h-4 w-4 text-gray-600" />
            </button>
          )}
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
  );
};

// 収穫情報入力用のモーダル
const HarvestInfoModal = ({ isOpen, onClose, onConfirm, cropName }) => {
  const [formData, setFormData] = useState({
    amount: '',
    notes: ''
  });
  
  // モーダルが開くたびにフォームをリセット
  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: '',
        notes: ''
      });
    }
  }, [isOpen]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">【{cropName}】の収穫情報</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              収穫量 (kg)<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="例: 150"
              className="w-full p-2 border rounded"
              required
              step="0.1"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              収穫メモ（品質、特記事項など）
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border rounded"
              placeholder="収穫時の状況や品質に関するメモを入力してください"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded shadow hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
            >
              完了
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// HouseDetail component - Updated with crop registration
const HouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [envData, setEnvData] = useState(null);
  const [envHistory, setEnvHistory] = useState([]);
  const [crops, setCrops] = useState([]);
  
  // モーダル状態
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [isHarvestModalOpen, setHarvestModalOpen] = useState(false);
  const [completingCrop, setCompletingCrop] = useState(null);

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

  // 作物登録処理
  const handleSaveCrop = async (cropData) => {
    try {
      let updatedCrops = [];
      
      if (editingCrop) {
        // 編集の場合
        updatedCrops = crops.map(crop => 
          crop.id === editingCrop.id ? { ...cropData, id: crop.id } : crop
        );
      } else {
        // 新規追加の場合
        const newCrop = {
          ...cropData,
          id: `crop_${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        updatedCrops = [...crops, newCrop];
      }
      
      // Firestoreに保存
      await saveCropsToFirestore(id, updatedCrops);
      
      // ローカル状態を更新
      setCrops(updatedCrops);
      
      // モーダルを閉じる
      setIsCropModalOpen(false);
      setEditingCrop(null);
      
    } catch (error) {
      console.error('作物データの保存に失敗しました:', error);
      alert('作物データの保存中にエラーが発生しました');
    }
  };
  
  // 作物編集処理
  const handleEditCrop = (crop) => {
    setEditingCrop(crop);
    setIsCropModalOpen(true);
  };
  
  // 作物削除処理
  const handleDeleteCrop = async (cropId) => {
    if (window.confirm('この作物データを削除してもよろしいですか？この操作は元に戻せません。')) {
      try {
        const updatedCrops = crops.filter(crop => crop.id !== cropId);
        
        // Firestoreに保存
        await saveCropsToFirestore(id, updatedCrops);
        
        // ローカル状態を更新
        setCrops(updatedCrops);
      } catch (error) {
        console.error('作物データの削除に失敗しました:', error);
        alert('作物データの削除中にエラーが発生しました');
      }
    }
  };
  
  // 作物栽培完了処理
  const handleCompleteCrop = async (crop) => {
    if (window.confirm(`「${crop.cropName}」の栽培を完了して履歴に移動しますか？`)) {
      try {
        // 作物データに収穫量などの情報を追加するためのモーダルを表示
        setCompletingCrop(crop);
        setHarvestModalOpen(true);
      } catch (error) {
        console.error('作物栽培完了処理中にエラーが発生しました:', error);
        alert('作物栽培完了処理中にエラーが発生しました');
      }
    }
  };
  
  // 収穫情報入力後の処理
  const handleConfirmHarvest = async (harvestData) => {
    try {
      const cropToComplete = completingCrop;
      
      // 作物を履歴に移動
      await moveCropToHistory(id, {
        ...cropToComplete,
        endDate: new Date(),
        harvestAmount: parseFloat(harvestData.amount),
        harvestNotes: harvestData.notes
      });
      
      // 現在の作物リストから削除
      const updatedCrops = crops.filter(c => c.id !== cropToComplete.id);
      
      // Firestoreに保存
      await saveCropsToFirestore(id, updatedCrops);
      
      // ローカル状態を更新
      setCrops(updatedCrops);
      
      // モーダルを閉じる
      setHarvestModalOpen(false);
      setCompletingCrop(null);
      
      // 成功メッセージ
      alert('作物の栽培を完了し、履歴に追加しました');
    } catch (error) {
      console.error('作物栽培完了処理中にエラーが発生しました:', error);
      alert('作物栽培完了処理中にエラーが発生しました');
    }
  };
  
  // ローカル関数名の衝突を避けるため、インポートした関数を呼び出す関数に変更
  const saveCropsToFirestore = async (houseId, cropsData) => {
    try {
      await updateHouseCrops(houseId, cropsData);
    } catch (error) {
      console.error('Firestoreの更新に失敗しました:', error);
      throw error;
    }
  };

  // 環境データ情報のレンダリング
  const renderEnvironmentalData = () => {
    if (!envData) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
          環境データが読み込まれていません
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

  // 環境データグラフのレンダリング
  const renderEnvironmentalChart = () => {
    if (envHistory.length === 0) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
          環境データの履歴が読み込まれていません
        </div>
      );
    }

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">環境データの推移</h3>
        <div className="h-80">
          <EnvironmentalChart data={envHistory} />
        </div>
      </div>
    );
  };

  // 作物データのレンダリング
  const renderCrops = () => {
    return (
      <div>
        {crops.length === 0 ? (
          <div className="p-6 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-500 mb-4">登録されている作物はありません</p>
            <button
              onClick={() => {
                setEditingCrop(null);
                setIsCropModalOpen(true);
              }}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md mx-auto hover:bg-green-700"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              <span>作物を登録する</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crops.map(crop => (
              <CropCard
                key={crop.id}
                crop={crop}
                onEdit={handleEditCrop}
                onDelete={handleDeleteCrop}
                onComplete={handleCompleteCrop}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/houses')}
            className="mr-4 p-1 rounded-full hover:bg-gray-200"
            aria-label="戻る"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{house.name}</h1>
          {house.status && (
            <span className={`ml-3 px-3 py-1 text-sm rounded-full ${
              house.status === '稼働中' ? 'bg-green-100 text-green-800' : 
              house.status === '休止中' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {house.status}
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>更新</span>
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">温室情報</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500 text-sm">面積</p>
              <p className="font-medium">{house.area || '--'} m²</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">栽培作物</p>
              <p className="font-medium">{house.crop || '--'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">建設日</p>
              <p className="font-medium">
                {house.constructionDate 
                  ? new Date(house.constructionDate).toLocaleDateString() 
                  : '--'
                }
              </p>
            </div>
          </div>
          
          {house.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-gray-500 text-sm">備考</p>
              <p className="text-gray-700">{house.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">現在の環境</h2>
        {renderEnvironmentalData()}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">環境データの推移</h2>
        {renderEnvironmentalChart()}
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">栽培作物</h2>
          <button
            onClick={() => {
              setEditingCrop(null);
              setIsCropModalOpen(true);
            }}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <PlusCircle className="w-4 h-4 mr-1" />
            <span>作物登録</span>
          </button>
        </div>
        {renderCrops()}
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">過去の栽培履歴</h2>
        <CropHistorySection houseId={id} />
      </div>
      
      {/* 作物登録モーダル */}
      <CropRegistrationModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setEditingCrop(null);
        }}
        onSave={handleSaveCrop}
        initialData={editingCrop}
      />
      
      {/* 収穫情報入力モーダル */}
      <HarvestInfoModal
        isOpen={isHarvestModalOpen}
        onClose={() => {
          setHarvestModalOpen(false);
          setCompletingCrop(null);
        }}
        onConfirm={handleConfirmHarvest}
        cropName={completingCrop ? completingCrop.cropName : ''}
      />
    </div>
  );
};

export default HouseDetail;
