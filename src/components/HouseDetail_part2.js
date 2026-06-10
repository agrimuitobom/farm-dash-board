// 作物エリア追加/編集用のモーダル
const CropAreaFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = {}, 
  crops = [], 
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    cropId: '',
    cropName: '',
    plantDate: '',
    transplantDate: '',
    fertilizeDate: '',
    harvestAmount: 0,
    status: '生育中',
    notes: '',
    ...initialData
  });

  const [selectedCropId, setSelectedCropId] = useState(initialData.cropId || '');
  
  // 選択した作物IDが変更されたら、作物名も更新
  useEffect(() => {
    if (selectedCropId) {
      const selectedCrop = crops.find(crop => crop.id === selectedCropId);
      if (selectedCrop) {
        setFormData(prev => ({
          ...prev,
          cropId: selectedCropId,
          cropName: selectedCrop.name
        }));
      }
    }
  }, [selectedCropId, crops]);

  // モーダルが開くたびにフォームをリセット
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        cropId: '',
        cropName: '',
        plantDate: '',
        transplantDate: '',
        fertilizeDate: '',
        harvestAmount: 0,
        status: '生育中',
        notes: '',
        ...initialData
      });
      setSelectedCropId(initialData.cropId || '');
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCropChange = (e) => {
    setSelectedCropId(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    
    try {
      // Date型かTimeStamp型かをチェック
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('日付変換に失敗しました:', error);
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">
            {isEditing ? '作物エリアを編集' : '新しい作物エリアを追加'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              エリア名
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="例: 北エリア、中央列、モニタリングエリアなど"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作物
            </label>
            <select
              name="cropId"
              value={selectedCropId}
              onChange={handleCropChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">作物を選択してください</option>
              {crops.map(crop => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                種まき日
              </label>
              <input
                type="date"
                name="plantDate"
                value={formatDateForInput(formData.plantDate)}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                定植日
              </label>
              <input
                type="date"
                name="transplantDate"
                value={formatDateForInput(formData.transplantDate)}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                施肥日
              </label>
              <input
                type="date"
                name="fertilizeDate"
                value={formatDateForInput(formData.fertilizeDate)}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                収穫量 (kg)
              </label>
              <input
                type="number"
                name="harvestAmount"
                value={formData.harvestAmount}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="種まき">種まき</option>
              <option value="生育中">生育中</option>
              <option value="収穫中">収穫中</option>
              <option value="収穫完了">収穫完了</option>
              <option value="休耕中">休耕中</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border rounded"
              placeholder="特記事項があれば入力してください"
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
              {isEditing ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 作物履歴表示用のモーダル
const CropHistoryModal = ({ isOpen, onClose, areaName, history = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">
            {areaName}の作物履歴
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        <div className="p-4">
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">履歴データがありません</p>
          ) : (
            <div className="space-y-4">
              {history.map((record, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 bg-white shadow-sm hover:shadow transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-lg">{record.cropName}</h4>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {record.status}
                    </span>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">種まき日:</span>
                      <span>{record.plantDate ? new Date(record.plantDate).toLocaleDateString() : '未設定'}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">収穫量:</span>
                      <span>{record.harvestAmount || 0} kg</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">登録日:</span>
                      <span>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '不明'}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">最終更新:</span>
                      <span>{record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : '不明'}</span>
                    </div>
                  </div>
                  
                  {record.notes && (
                    <div className="mt-2 border-t pt-2">
                      <p className="text-gray-600 text-sm">{record.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};