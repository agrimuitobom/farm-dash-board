// メインコンポーネント
const HouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // ステート定義
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [envData, setEnvData] = useState(null);
  const [envHistory, setEnvHistory] = useState([]);
  const [envLoading, setEnvLoading] = useState(true);
  
  const [alerts, setAlerts] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // 作物エリア追加・編集関連の状態
  const [isAddCropAreaModalOpen, setIsAddCropAreaModalOpen] = useState(false);
  const [editingCropArea, setEditingCropArea] = useState(null);
  
  // 初回マウント時にデータを読み込み
  useEffect(() => {
    const fetchHouseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ハウス情報を取得
        const houseData = await getHouseById(id);
        
        // データ構造のマイグレーション: 従来の単一作物からエリア制の複数作物対応への変換
        if (!houseData.cropAreas || !Array.isArray(houseData.cropAreas)) {
          await migrateHouseToCropAreas(id);
          // マイグレーション後のデータを再取得
          const updatedHouseData = await getHouseById(id);
          setHouse(updatedHouseData);
        } else {
          setHouse(houseData);
        }
        
        // アラートとタスクを取得
        const alertsList = await getAlertsByHouse(id);
        setAlerts(alertsList);
        
        const tasksList = await getTasksByHouse(id);
        setTasks(tasksList);
        
      } catch (err) {
        console.error('ハウスデータの取得エラー:', err);
        setError('ハウスデータの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchEnvironmentalData = async () => {
      try {
        setEnvLoading(true);
        
        // 環境データの履歴を取得（24時間分）
        const history = await getEnvironmentalHistory(id, 24);
        setEnvHistory(history);
        
        // 最新の環境データがあればセット
        if (history.length > 0) {
          setEnvData(history[0]);
        }
      } catch (err) {
        console.error('環境データの取得エラー:', err);
      } finally {
        setEnvLoading(false);
      }
    };
    
    // データ読み込み実行
    fetchHouseData();
    fetchEnvironmentalData();
    
    // リアルタイム監視の設定
    const unsubscribeHouse = subscribeToHouse(id, (updatedHouse) => {
      if (updatedHouse) {
        setHouse(updatedHouse);
      }
    });
    
    const unsubscribeEnv = subscribeToEnvironmentalData(id, (latestEnvData) => {
      if (latestEnvData) {
        setEnvData(latestEnvData);
        setEnvHistory(prevHistory => {
          // 同じデータが既にある場合は追加しない
          const exists = prevHistory.some(item => item.id === latestEnvData.id);
          if (exists) return prevHistory;
          
          // 最新のデータを先頭に追加
          return [latestEnvData, ...prevHistory];
        });
      }
    });
    
    // コンポーネントのアンマウント時に監視を解除
    return () => {
      unsubscribeHouse();
      unsubscribeEnv();
    };
  }, [id]);
  
  // 作物エリア追加処理
  const handleAddCropArea = async (cropAreaData) => {
    try {
      await addCropAreaToHouse(id, cropAreaData);
      // ハウスデータは自動的に更新されるため、ここでは何もしない
    } catch (err) {
      console.error('作物エリア追加エラー:', err);
      alert('作物エリアの追加に失敗しました');
    }
  };
  
  // 作物エリア編集処理
  const handleEditCropArea = async (cropAreaData) => {
    try {
      await updateCropArea(id, editingCropArea.id, cropAreaData);
      setEditingCropArea(null);
    } catch (err) {
      console.error('作物エリア更新エラー:', err);
      alert('作物エリアの更新に失敗しました');
    }
  };
  
  // 作物エリア削除処理
  const handleRemoveCropArea = async (areaId) => {
    if (!window.confirm('この作物エリアを削除してもよろしいですか？')) {
      return;
    }
    
    try {
      await removeCropArea(id, areaId);
      // ハウスデータは自動的に更新されるため、ここでは何もしない
    } catch (err) {
      console.error('作物エリア削除エラー:', err);
      alert('作物エリアの削除に失敗しました');
    }
  };
  
  // 作物エリア編集モーダルを開く
  const openEditCropAreaModal = (cropArea) => {
    setEditingCropArea(cropArea);
    setIsAddCropAreaModalOpen(true);
  };
  
  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">ハウス情報を読み込み中...</p>
      </div>
    );
  }
  
  // エラー表示
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
        <h2 className="text-xl font-bold text-red-600 mb-2">エラーが発生しました</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/houses')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          ハウス一覧に戻る
        </button>
      </div>
    );
  }
  
  // ハウスが見つからない場合
  if (!house) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="h-12 w-12 text-yellow-600 mb-4" />
        <h2 className="text-xl font-bold text-yellow-600 mb-2">ハウスが見つかりません</h2>
        <p className="text-gray-600 mb-4">指定されたIDのハウスは存在しないか、アクセス権がありません。</p>
        <button
          onClick={() => navigate('/houses')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          ハウス一覧に戻る
        </button>
      </div>
    );
  }