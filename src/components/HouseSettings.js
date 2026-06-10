import React, { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';

const HouseSettings = ({ house }) => {
  const [formData, setFormData] = useState({
    name: house.id,
    description: house.description,
    area: house.specs.area,
    height: house.specs.height,
    material: house.specs.material,
    ventilation: house.specs.ventilation,
    irrigation: house.specs.irrigation,
    buildYear: house.specs.buildYear,
    tempMin: house.thresholds?.tempMin || 18,
    tempMax: house.thresholds?.tempMax || 28,
    humidityMin: house.thresholds?.humidityMin || 60,
    humidityMax: house.thresholds?.humidityMax || 80,
    soilMoistureMin: house.thresholds?.soilMoistureMin || 65,
    soilMoistureMax: house.thresholds?.soilMoistureMax || 85,
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 実際の実装では、ここでFirebaseにデータを保存します
    alert('設定を保存しました');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">ハウス設定</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                ハウス名
              </label>
              <input
                type="text"
                id="name"
                className="w-full p-2 border rounded-md"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                id="description"
                rows="4"
                className="w-full p-2 border rounded-md"
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                  面積
                </label>
                <input
                  type="text"
                  id="area"
                  className="w-full p-2 border rounded-md"
                  value={formData.area}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                  高さ
                </label>
                <input
                  type="text"
                  id="height"
                  className="w-full p-2 border rounded-md"
                  value={formData.height}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1">
                  被覆材
                </label>
                <input
                  type="text"
                  id="material"
                  className="w-full p-2 border rounded-md"
                  value={formData.material}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="buildYear" className="block text-sm font-medium text-gray-700 mb-1">
                  建設年
                </label>
                <input
                  type="text"
                  id="buildYear"
                  className="w-full p-2 border rounded-md"
                  value={formData.buildYear}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="ventilation" className="block text-sm font-medium text-gray-700 mb-1">
                換気システム
              </label>
              <input
                type="text"
                id="ventilation"
                className="w-full p-2 border rounded-md"
                value={formData.ventilation}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="irrigation" className="block text-sm font-medium text-gray-700 mb-1">
                灌水システム
              </label>
              <input
                type="text"
                id="irrigation"
                className="w-full p-2 border rounded-md"
                value={formData.irrigation}
                onChange={handleChange}
              />
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                type="button"
                className="mr-2 py-2 px-4 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </button>
              <button
                type="submit"
                className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">アラート設定</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              温度のしきい値（°C）
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tempMin" className="block text-xs text-gray-500 mb-1">
                  最小値
                </label>
                <input
                  type="number"
                  id="tempMin"
                  className="w-full p-2 border rounded-md"
                  value={formData.tempMin}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="tempMax" className="block text-xs text-gray-500 mb-1">
                  最大値
                </label>
                <input
                  type="number"
                  id="tempMax"
                  className="w-full p-2 border rounded-md"
                  value={formData.tempMax}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              湿度のしきい値（%）
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="humidityMin" className="block text-xs text-gray-500 mb-1">
                  最小値
                </label>
                <input
                  type="number"
                  id="humidityMin"
                  className="w-full p-2 border rounded-md"
                  value={formData.humidityMin}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="humidityMax" className="block text-xs text-gray-500 mb-1">
                  最大値
                </label>
                <input
                  type="number"
                  id="humidityMax"
                  className="w-full p-2 border rounded-md"
                  value={formData.humidityMax}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              土壌水分のしきい値（%）
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="soilMoistureMin" className="block text-xs text-gray-500 mb-1">
                  最小値
                </label>
                <input
                  type="number"
                  id="soilMoistureMin"
                  className="w-full p-2 border rounded-md"
                  value={formData.soilMoistureMin}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="soilMoistureMax" className="block text-xs text-gray-500 mb-1">
                  最大値
                </label>
                <input
                  type="number"
                  id="soilMoistureMax"
                  className="w-full p-2 border rounded-md"
                  value={formData.soilMoistureMax}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-green-600"
                defaultChecked={true}
              />
              <span className="ml-2 text-sm text-gray-700">アラート通知を有効にする</span>
            </label>
          </div>
          
          <div className="mt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-green-600"
                defaultChecked={true}
              />
              <span className="ml-2 text-sm text-gray-700">メール通知を有効にする</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseSettings;