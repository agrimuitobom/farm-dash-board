// 作物エリア追加/編集用のモーダル
const CropAreaFormModal = ({ isOpen, onClose, onSubmit, editingCropArea = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    cropName: '',
    cropId: '',
    plantDate: '',
    harvestAmount: 0,
    status: '生育中',
    notes: ''
  });
  
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // 作物一覧を取得
    const fetchCrops = async () => {
      try {
        // 実際にFirestoreから作物一覧を取得
        const cropList = await getAllCrops();
        setCrops(cropList);
      } catch (err) {
        console.error('作物一覧の取得エラー:', err);
        setError('作物リストの読み込みに失敗しました');
      }
    };
    
    if (isOpen) {
      fetchCrops();
      
      // 編集モードの場合は既存データをセット
      if (editingCropArea) {
        setFormData({
          name: editingCropArea.name || '',
          cropName: editingCropArea.cropName || '',
          cropId: editingCropArea.cropId || '',
          plantDate: editingCropArea.plantDate ? new Date(editingCropArea.plantDate).toISOString().split('T')[0] : '',
          harvestAmount: editingCropArea.harvestAmount || 0,
          status: editingCropArea.status || '生育中',
          notes: editingCropArea.notes || ''
        });
      } else {
        // 新規の場合はフォームをリセット
        setFormData({
          name: '',
          cropName: '',
          cropId: '',
          plantDate: '',
          harvestAmount: 0,
          status: '生育中',
          notes: ''
        });
      }
    }
  }, [isOpen, editingCropArea]);
  
  // 入力変更時の処理
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 作物選択時に作物名も自動設定
    if (name === 'cropId') {
      const selectedCrop = crops.find(crop => crop.id === value);
      if (selectedCrop) {
        setFormData({
          ...formData,
          cropId: value,
          cropName: selectedCrop.name
        });
      } else {
        setFormData({
          ...formData,
          cropId: value
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // フォーム送信
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 日付型変換
      const formattedData = {
        ...formData,
        plantDate: formData.plantDate ? new Date(formData.plantDate) : null,
        harvestAmount: parseFloat(formData.harvestAmount) || 0
      };
      
      onSubmit(formattedData);
      onClose();
    } catch (err) {
      setError('データの保存に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };