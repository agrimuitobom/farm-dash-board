
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
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {editingCropArea ? '作物エリアを編集' : '作物エリアを追加'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              エリア名
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="北側エリア"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作物
            </label>
            <select
              name="cropId"
              value={formData.cropId}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">作物を選択してください</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              種まき日
            </label>
            <input
              type="date"
              name="plantDate"
              value={formData.plantDate}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                収穫量 (kg)
              </label>
              <input
                type="number"
                name="harvestAmount"
                value={formData.harvestAmount}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状態
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="生育中">生育中</option>
                <option value="収穫中">収穫中</option>
                <option value="終了">終了</option>
                <option value="休耕中">休耕中</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="特記事項などを入力"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              キャンセル
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md border border-transparent shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
            >
              {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              {editingCropArea ? '更新する' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
