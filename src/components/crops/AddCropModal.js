import React from 'react';

const AddCropModal = ({ isOpen, onClose, formData, handleInputChange, handleSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">新規作物追加</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">作物名</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">シーズン</label>
              <input
                type="text"
                name="season"
                value={formData.season}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="春, 夏, 秋, 冬, または組み合わせ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">生育日数</label>
              <input
                type="number"
                name="growthDays"
                value={formData.growthDays}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">平均収量</label>
              <input
                type="text"
                name="avgYield"
                value={formData.avgYield}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="例: 10kg/㎡"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">適温範囲 (℃)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="optimalTemperature.min"
                  value={formData.optimalTemperature.min}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="最小"
                />
                <span className="mt-1 flex items-center">〜</span>
                <input
                  type="number"
                  name="optimalTemperature.max"
                  value={formData.optimalTemperature.max}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="最大"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">備考</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                rows="3"
              ></textarea>
            </div>
          </div>
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCropModal;