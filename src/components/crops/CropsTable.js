import React from 'react';
import { Info, Edit, Trash2 } from 'lucide-react';

const CropsTable = ({ crops, cropHouses, onView, onEdit, onDelete }) => {
  if (!crops || crops.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        表示できるデータがありません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作物名</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">シーズン</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">生育日数</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均収量</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">現在のハウス</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {crops.map((crop) => (
            <tr key={crop.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">{crop.name}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {crop.season}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {crop.growthDays} 日
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {crop.avgYield}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {cropHouses[crop.id] && cropHouses[crop.id].length > 0 ? (
                  <span>{cropHouses[crop.id].join(', ')}</span>
                ) : (
                  <span className="text-gray-400">なし</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => onView(crop)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="詳細を表示"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onEdit(crop)}
                    className="p-1 text-yellow-600 hover:text-yellow-800 transition-colors"
                    title="編集"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(crop)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CropsTable;