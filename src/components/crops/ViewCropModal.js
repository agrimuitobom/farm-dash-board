import React from 'react';

const ViewCropModal = ({ isOpen, onClose, crop, cropHouses }) => {
  if (!isOpen || !crop) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">{crop.name}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">シーズン</h4>
            <p className="mt-1">{crop.season || 'なし'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">生育日数</h4>
            <p className="mt-1">{crop.growthDays} 日</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">平均収量</h4>
            <p className="mt-1">{crop.avgYield || 'なし'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">現在の栽培ハウス</h4>
            <p className="mt-1">
              {cropHouses && cropHouses[crop.id] && cropHouses[crop.id].length > 0 
                ? cropHouses[crop.id].join(', ')
                : 'なし'}
            </p>
          </div>
          {crop.optimalTemperature && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">適温範囲</h4>
              <p className="mt-1">{crop.optimalTemperature.min}°C 〜 {crop.optimalTemperature.max}°C</p>
            </div>
          )}
          {crop.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">備考</h4>
              <p className="mt-1 whitespace-pre-line">{crop.description}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCropModal;