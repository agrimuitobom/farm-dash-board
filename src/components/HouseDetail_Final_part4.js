
// メインコンポーネント
const HouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 状態変数
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [environmentalHistory, setEnvironmentalHistory] = useState([]);
  const [chartTimeRange, setChartTimeRange] = useState(24); // 24時間表示をデフォルト
  
  const [alerts, setAlerts] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // 複数作物エリア管理用の状態
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [showEditCropModal, setShowEditCropModal] = useState(false);
  const [currentCropArea, setCurrentCropArea] = useState(null);
  
  // 背景画像取得関数
  const getBackgroundImage = (cropName) => {
    if (!cropName) return coloredBackgrounds.default;
    
    for (const [key, value] of Object.entries(coloredBackgrounds)) {
      if (cropName && cropName.includes(key)) {
        return value;
      }
    }
    return coloredBackgrounds.default;
  };
  
  useEffect(() => {
    // ハウス情報を取得
    const fetchHouseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ハウス情報を取得
        const houseData = await getHouseById(id);
        
        // 既存データを複数作物対応にマイグレーション
        if (!houseData.cropAreas || !Array.isArray(houseData.cropAreas)) {
          await migrateHouseToCropAreas(id);
          // マイグレーション後のデータを取得
          const updatedHouseData = await getHouseById(id);
          setHouse(updatedHouseData);
        } else {
          setHouse(houseData);
        }
        
        // アラート一覧を取得
        const alertsData = await getAlertsByHouse(id);
        setAlerts(alertsData);
        
        // タスク一覧を取得
        const tasksData = await getTasksByHouse(id);
        setTasks(tasksData);
        
        // 環境データの履歴を取得
        const historyData = await getEnvironmentalHistory(id, chartTimeRange);
        if (historyData && historyData.length > 0) {
          const formattedHistory = historyData.map(data => formatFirestoreData(data));
          
          // グラフ表示用にデータを加工
          const processedData = formattedHistory.map(data => ({
            time: data.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '',
            temperature: data.temperature,
            humidity: data.humidity,
            soilMoisture: data.soilMoisture,
            light: data.light,
            co2: data.co2
          }));
          
          setEnvironmentalHistory(processedData);
        }
      } catch (err) {
        console.error('ハウスデータの取得エラー:', err);
        setError('ハウスデータの読み込みに失敗しました。' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHouseData();
    
    // リアルタイム更新のセットアップ
    let unsubscribeHouse = null;
    let unsubscribeEnvironmental = null;
    
    const setupRealTimeUpdates = async () => {
      // ハウスデータのリアルタイム更新
      unsubscribeHouse = subscribeToHouse(id, (updatedHouseData) => {
        if (updatedHouseData) {
          setHouse(updatedHouseData);
        }
      });
      
      // 環境データのリアルタイム更新
      unsubscribeEnvironmental = subscribeToEnvironmentalData(id, (updatedEnvData) => {
        if (updatedEnvData) {
          setEnvironmentalData(updatedEnvData);
        }
      });
    };
    
    setupRealTimeUpdates();
    
    // クリーンアップ関数
    return () => {
      if (unsubscribeHouse) unsubscribeHouse();
      if (unsubscribeEnvironmental) unsubscribeEnvironmental();
    };
  }, [id, chartTimeRange]);
