// ハウス詳細メインコンポーネント
const HouseDetail = () => {
  const { houseId } = useParams();
  const navigate = useNavigate();
  
  // 状態管理
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [envData, setEnvData] = useState(null);
  const [envHistory, setEnvHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [crops, setCrops] = useState([]);
  
  // モーダル状態管理
  const [isAddCropModalOpen, setIsAddCropModalOpen] = useState(false);
  const [isEditCropModalOpen, setIsEditCropModalOpen] = useState(false);
  const [selectedCropArea, setSelectedCropArea] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAreaHistory, setSelectedAreaHistory] = useState([]);
  const [selectedAreaName, setSelectedAreaName] = useState('');
  
  // 作物エリアデータ
  const [cropAreas, setCropAreas] = useState([]);
  
  // 初期データ読み込み
  useEffect(() => {
    let unsubscribeHouse = null;
    let unsubscribeEnv = null;
    
    const loadHouseData = async () => {
      try {
        setLoading(true);
        
        // ハウスデータのリアルタイム監視を設定
        unsubscribeHouse = subscribeToHouse(houseId, async (houseData) => {
          if (houseData) {
            setHouse(houseData);
            
            // 作物エリアデータがない場合は既存のデータを移行
            if (!houseData.cropAreas || houseData.cropAreas.length === 0) {
              console.log('作物エリアデータが見つからないため、マイグレーションを開始します');
              try {
                await migrateHouseToCropAreas(houseId);
                console.log('マイグレーション完了');
              } catch (error) {
                console.error('マイグレーション失敗:', error);
              }
            } else {
              // 作物エリアデータを設定
              setCropAreas(houseData.cropAreas || []);
            }
            
            // アラートとタスクを取得
            const alertsData = await getAlertsByHouse(houseId);
            setAlerts(alertsData);
            
            const tasksData = await getTasksByHouse(houseId);
            setTasks(tasksData);
          } else {
            setError('ハウスが見つかりません');
          }
          setLoading(false);
        });
        
        // 環境データのリアルタイム監視を設定
        unsubscribeEnv = subscribeToEnvironmentalData(houseId, (data) => {
          setEnvData(data);
        });
        
        // 環境データ履歴を取得
        const historyData = await getEnvironmentalHistory(houseId, 48);
        setEnvHistory(historyData);
        
        // 作物マスターデータを取得
        const cropsData = await getAllCrops();
        setCrops(cropsData);
        
      } catch (err) {
        console.error('データ取得中にエラーが発生しました:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadHouseData();
    
    // コンポーネントのアンマウント時にリスナーを解除
    return () => {
      if (unsubscribeHouse) unsubscribeHouse();
      if (unsubscribeEnv) unsubscribeEnv();
    };
  }, [houseId]);
  
  // 作物エリア追加処理
  const handleAddCropArea = async (formData) => {
    try {
      await addCropAreaToHouse(houseId, formData);
      setIsAddCropModalOpen(false);
    } catch (error) {
      console.error('作物エリア追加エラー:', error);
      alert(`作物エリアの追加に失敗しました: ${error.message}`);
    }
  };
  
  // 作物エリア編集処理
  const handleEditCropArea = async (formData) => {
    try {
      if (!selectedCropArea || !selectedCropArea.id) {
        throw new Error('選択されたエリアの情報が不完全です');
      }
      await updateCropArea(houseId, selectedCropArea.id, formData);
      setIsEditCropModalOpen(false);
      setSelectedCropArea(null);
    } catch (error) {
      console.error('作物エリア更新エラー:', error);
      alert(`作物エリアの更新に失敗しました: ${error.message}`);
    }
  };
  
  // 作物エリア削除処理
  const handleRemoveCropArea = async (areaId) => {
    try {
      if (window.confirm('このエリアを削除してもよろしいですか？この操作は元に戻せません。')) {
        await removeCropArea(houseId, areaId);
      }
    } catch (error) {
      console.error('作物エリア削除エラー:', error);
      alert(`作物エリアの削除に失敗しました: ${error.message}`);
    }
  };

  // 作物エリア編集モーダルを開く
  const openEditCropModal = (cropArea) => {
    setSelectedCropArea(cropArea);
    setIsEditCropModalOpen(true);
  };

  // 作物履歴モーダルを開く
  const openHistoryModal = (cropArea) => {
    // ここでは例として、選択したエリアの履歴データを設定します
    // 実際のアプリケーションでは、このエリアの過去の作付け履歴を取得し設定します
    setSelectedAreaName(cropArea.name);
    setSelectedAreaHistory([
      // 現在の作物データ
      { 
        ...cropArea,
        status: '現在の作物'
      },
      // 過去の作物データの例（実際には、データベースから取得します）
      {
        cropName: '過去の' + cropArea.cropName,
        plantDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        harvestAmount: Math.floor(Math.random() * 100) / 10,
        status: '収穫完了',
        createdAt: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        updatedAt: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        notes: '前回の作付けのメモ。収穫量は目標の90%でした。'
      }
    ]);
    setIsHistoryModalOpen(true);
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

  // ローディング表示
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
        <p className="mt-4 text-gray-600">ハウス情報を読み込んでいます...</p>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="mt-4 text-red-600">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </button>
      </div>
    );
  }

  // ハウスデータがない場合
  if (!house) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="h-10 w-10 text-yellow-500" />
        <p className="mt-4 text-gray-600">ハウス情報が見つかりません</p>
        <button
          onClick={() => navigate('/houses')}
          className="mt-4 flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          ハウス一覧に戻る
        </button>
      </div>
    );
  }