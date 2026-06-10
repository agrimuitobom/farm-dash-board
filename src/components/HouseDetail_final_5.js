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