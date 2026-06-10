// 作物エリア用のコンポーネント
const CropAreaCard = ({ cropArea, onEdit, onRemove }) => {
  // 作物タイプに基づいて背景画像を選択
  const getBackgroundImage = (cropName) => {
    if (!cropName) return coloredBackgrounds.default;
    
    for (const [key, value] of Object.entries(coloredBackgrounds)) {
      if (cropName.includes(key)) {
        return value;
      }
    }
    return coloredBackgrounds.default;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="h-40 relative">
        <img 
          src={getBackgroundImage(cropArea.cropName)}
          alt={cropArea.cropName} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex space-x-2">
          <button 
            onClick={() => onEdit(cropArea)}
            className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          <button 
            onClick={() => onRemove(cropArea.id)}
            className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
          >
            <Trash2 className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold">{cropArea.name || 'エリア'}</h4>
            <p className="text-gray-700">{cropArea.cropName || '作物未設定'}</p>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            {cropArea.status || '生育中'}
          </span>
        </div>
        
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">種まき日:</span>
            <span className="font-medium">{cropArea.plantDate ? new Date(cropArea.plantDate).toLocaleDateString() : '未設定'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">収穫量:</span>
            <span className="font-medium">{cropArea.harvestAmount || 0} kg</span>
          </div>
        </div>
      </div>
    </div>
  );
};