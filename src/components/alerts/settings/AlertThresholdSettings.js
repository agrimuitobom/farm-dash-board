import React, { useState, useEffect } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  AlertTriangle, 
  Save, 
  Plus, 
  Trash2,
  Edit2
} from 'lucide-react';

// センサータイプとそのアイコンのマッピング
const sensorTypeIcons = {
  temperature: <Thermometer className="w-5 h-5 text-orange-500" />,
  humidity: <Droplets className="w-5 h-5 text-blue-500" />,
  co2: <Wind className="w-5 h-5 text-gray-500" />,
  light: <Sun className="w-5 h-5 text-yellow-500" />,
  soil_moisture: <Droplets className="w-5 h-5 text-green-500" />
};

// センサータイプのユニット
const sensorUnits = {
  temperature: '°C',
  humidity: '%',
  co2: 'ppm',
  light: 'lux',
  soil_moisture: '%'
};

const AlertThresholdSettings = ({ houses, thresholds, onSave, loading }) => {
  const [editMode, setEditMode] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState('');
  const [thresholdSettings, setThresholdSettings] = useState([]);
  const [newThreshold, setNewThreshold] = useState({
    type: 'temperature',
    condition: 'greater_than',
    value: '',
    severity: 'medium'
  });

  // 選択されたハウスが変更されたら、そのハウス用の閾値設定を取得
  useEffect(() => {
    if (selectedHouse && thresholds) {
      const houseThresholds = thresholds.filter(t => t.houseId === selectedHouse);
      setThresholdSettings(houseThresholds);
    } else {
      setThresholdSettings([]);
    }
  }, [selectedHouse, thresholds]);

  // 新しい閾値の入力をハンドリング
  const handleNewThresholdChange = (e) => {
    const { name, value } = e.target;
    setNewThreshold(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 既存の閾値の変更をハンドリング
  const handleThresholdChange = (index, field, value) => {
    const updatedSettings = [...thresholdSettings];
    updatedSettings[index] = {
      ...updatedSettings[index],
      [field]: value
    };
    setThresholdSettings(updatedSettings);
  };

  // 新しい閾値を追加
  const handleAddThreshold = () => {
    if (!selectedHouse || !newThreshold.value) return;
    
    const threshold = {
      ...newThreshold,
      houseId: selectedHouse,
      houseName: houses.find(h => h.id === selectedHouse)?.name || 'Unknown House',
      id: `new-${Date.now()}` // 仮のID（Firestoreに保存時に更新される）
    };
    
    setThresholdSettings(prev => [...prev, threshold]);
    setNewThreshold({
      type: 'temperature',
      condition: 'greater_than',
      value: '',
      severity: 'medium'
    });
  };

  // 閾値を削除
  const handleRemoveThreshold = (index) => {
    const updatedSettings = [...thresholdSettings];
    updatedSettings.splice(index, 1);
    setThresholdSettings(updatedSettings);
  };

  // 変更を保存
  const handleSave = () => {
    onSave(thresholdSettings);
    setEditMode(false);
  };

  // センサータイプに基づいて適切なアイコンを取得
  const getTypeIcon = (type) => {
    return sensorTypeIcons[type] || <AlertTriangle className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">アラート閾値設定</h2>
        {selectedHouse && (
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
          >
            {editMode ? '閲覧モード' : '編集モード'}
          </button>
        )}
      </div>

      {/* ハウス選択 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ハウスを選択:
        </label>
        <select
          value={selectedHouse}
          onChange={(e) => setSelectedHouse(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- ハウスを選択 --</option>
          {houses.map((house) => (
            <option key={house.id} value={house.id}>
              {house.name}
            </option>
          ))}
        </select>
      </div>

      {selectedHouse ? (
        <>
          {/* 閾値一覧 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              現在の閾値設定
            </h3>
            {thresholdSettings.length === 0 ? (
              <p className="text-gray-500 italic">
                設定されている閾値はありません
              </p>
            ) : (
              <div className="space-y-4">
                {thresholdSettings.map((threshold, index) => (
                  <div 
                    key={threshold.id || index} 
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        {getTypeIcon(threshold.type)}
                        <div className="ml-3">
                          {editMode ? (
                            <div className="flex flex-col space-y-2">
                              <div className="grid grid-cols-2 gap-3">
                                <select
                                  value={threshold.type}
                                  onChange={(e) => handleThresholdChange(index, 'type', e.target.value)}
                                  className="p-1 text-sm border border-gray-300 rounded"
                                >
                                  <option value="temperature">温度</option>
                                  <option value="humidity">湿度</option>
                                  <option value="co2">CO2濃度</option>
                                  <option value="light">光量</option>
                                  <option value="soil_moisture">土壌水分</option>
                                </select>
                                <select
                                  value={threshold.condition}
                                  onChange={(e) => handleThresholdChange(index, 'condition', e.target.value)}
                                  className="p-1 text-sm border border-gray-300 rounded"
                                >
                                  <option value="greater_than">以上</option>
                                  <option value="less_than">以下</option>
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    value={threshold.value}
                                    onChange={(e) => handleThresholdChange(index, 'value', e.target.value)}
                                    className="p-1 text-sm border border-gray-300 rounded w-full"
                                  />
                                  <span className="ml-1 text-gray-600">{sensorUnits[threshold.type] || ''}</span>
                                </div>
                                <select
                                  value={threshold.severity}
                                  onChange={(e) => handleThresholdChange(index, 'severity', e.target.value)}
                                  className="p-1 text-sm border border-gray-300 rounded"
                                >
                                  <option value="low">低</option>
                                  <option value="medium">中</option>
                                  <option value="high">高</option>
                                </select>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center">
                                <span className="font-medium">
                                  {threshold.type === 'temperature' && '温度'} 
                                  {threshold.type === 'humidity' && '湿度'}
                                  {threshold.type === 'co2' && 'CO2濃度'}
                                  {threshold.type === 'light' && '光量'}
                                  {threshold.type === 'soil_moisture' && '土壌水分'}
                                </span>
                                <span className="mx-1">が</span>
                                <span className="font-medium">
                                  {threshold.value}{sensorUnits[threshold.type] || ''}
                                </span>
                                <span className="mx-1">
                                  {threshold.condition === 'greater_than' ? '以上' : '以下'}
                                </span>
                                <span className="ml-2 px-2 py-0.5 text-xs rounded" 
                                  style={{ 
                                    backgroundColor: 
                                      threshold.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : 
                                      threshold.severity === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 
                                      'rgba(16, 185, 129, 0.1)',
                                    color:
                                      threshold.severity === 'high' ? 'rgb(185, 28, 28)' : 
                                      threshold.severity === 'medium' ? 'rgb(194, 120, 3)' : 
                                      'rgb(6, 95, 70)' 
                                  }}
                                >
                                  {threshold.severity === 'high' ? '高' : 
                                   threshold.severity === 'medium' ? '中' : '低'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {editMode && (
                        <button
                          onClick={() => handleRemoveThreshold(index)}
                          className="text-red-500 hover:text-red-700"
                          title="削除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 新しい閾値を追加（編集モード時のみ） */}
          {editMode && (
            <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-lg">
              <h3 className="text-md font-medium text-gray-800 mb-3">
                新しい閾値を追加
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">センサータイプ</label>
                  <select
                    name="type"
                    value={newThreshold.type}
                    onChange={handleNewThresholdChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="temperature">温度</option>
                    <option value="humidity">湿度</option>
                    <option value="co2">CO2濃度</option>
                    <option value="light">光量</option>
                    <option value="soil_moisture">土壌水分</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">条件</label>
                  <select
                    name="condition"
                    value={newThreshold.condition}
                    onChange={handleNewThresholdChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="greater_than">以上</option>
                    <option value="less_than">以下</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">値</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="value"
                      value={newThreshold.value}
                      onChange={handleNewThresholdChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder={`例: 30 ${sensorUnits[newThreshold.type] || ''}`}
                    />
                    <span className="ml-2 text-gray-600">{sensorUnits[newThreshold.type] || ''}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">重要度</label>
                  <select
                    name="severity"
                    value={newThreshold.severity}
                    onChange={handleNewThresholdChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleAddThreshold}
                  disabled={!newThreshold.value}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  閾値を追加
                </button>
              </div>
            </div>
          )}

          {/* 保存ボタン（編集モード時のみ） */}
          {editMode && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⊙</span>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    変更を保存
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">ハウスを選択して閾値設定を確認・編集してください</p>
        </div>
      )}
    </div>
  );
};

export default AlertThresholdSettings;