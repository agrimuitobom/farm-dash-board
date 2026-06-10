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
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold">
            {editingCropArea ? '作物エリアを編集' : '新しい作物エリアを追加'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {/* エリア名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                エリア名
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="北エリア、温室1など"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            
            {/* 作物選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作物
              </label>
              <select
                name="cropId"
                value={formData.cropId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">作物を選択...</option>
                {crops.map(crop => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 種まき日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                種まき日
              </label>
              <input
                type="date"
                name="plantDate"
                value={formData.plantDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            {/* 収穫量 */}
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
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            {/* 状態 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状態
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="生育中">生育中</option>
                <option value="収穫中">収穫中</option>
                <option value="休耕中">休耕中</option>
                <option value="準備中">準備中</option>
              </select>
            </div>
            
            {/* メモ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メモ
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="特記事項があればこちらに記入"
              ></textarea>
            </div>
          </div>
          
          <div className="p-4 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  処理中...
                </span>
              ) : (
                editingCropArea ? '更新する' : '追加する'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};