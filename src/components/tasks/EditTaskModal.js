import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, BellRing, Repeat } from 'lucide-react';

const EditTaskModal = ({
  isOpen,
  onClose,
  task,
  houses,
  crops,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date(),
    houseId: '',
    cropId: '',
    assignedTo: '',
    repeatType: 'none',
    repeatEndDate: null,
    reminderTime: '60'
  });
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  
  // タスクデータが変更されたら、フォームデータを更新
  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        // dueDate形式の修正が必要な場合の対応
        dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)
      });
      
      // 繰り返し設定とリマインダー設定の表示状態を更新
      if (task.repeatType && task.repeatType !== 'none') {
        setShowRepeatOptions(true);
      }
      
      if (task.reminderTime) {
        setShowReminderOptions(true);
      }
    }
  }, [task]);
  
  if (!isOpen) return null;
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: new Date(value)
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };
  
  // 表示用の日付フォーマット
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return ''; // 無効な日付の場合
    
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">作業の編集</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タスク名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状態
              </label>
              <select
                name="status"
                value={formData.status || 'pending'}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="pending">未着手</option>
                <option value="in-progress">進行中</option>
                <option value="completed">完了</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                優先度
              </label>
              <select
                name="priority"
                value={formData.priority || 'medium'}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              期日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dueDate"
              value={formatDateForInput(formData.dueDate)}
              onChange={handleDateChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ハウス
              </label>
              <select
                name="houseId"
                value={formData.houseId || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">選択してください</option>
                {houses && houses.map(house => (
                  <option key={house.id} value={house.id}>
                    {house.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作物
              </label>
              <select
                name="cropId"
                value={formData.cropId || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">選択してください</option>
                {crops && crops.map(crop => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              担当者
            </label>
            <input
              type="text"
              name="assignedTo"
              value={formData.assignedTo || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md h-24"
            />
          </div>
          
          {/* 繰り返し設定 */}
          <div className="mb-4">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => setShowRepeatOptions(!showRepeatOptions)}
            >
              <Repeat className="w-4 h-4 text-gray-600 mr-2" />
              <label className="text-sm font-medium text-gray-700 cursor-pointer">
                繰り返し設定
              </label>
              <div className="ml-auto">
                {showRepeatOptions ? (
                  <X className="w-4 h-4 text-gray-600" />
                ) : (
                  <Check className="w-4 h-4 text-gray-600" />
                )}
              </div>
            </div>
            
            {showRepeatOptions && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      繰り返しタイプ
                    </label>
                    <select
                      name="repeatType"
                      className="w-full p-2 text-sm border border-gray-300 rounded-md"
                      value={formData.repeatType || 'none'}
                      onChange={handleInputChange}
                    >
                      <option value="none">繰り返しなし</option>
                      <option value="daily">毎日</option>
                      <option value="weekly">毎週</option>
                      <option value="monthly">毎月</option>
                      <option value="yearly">毎年</option>
                    </select>
                  </div>
                  
                  {formData.repeatType && formData.repeatType !== 'none' && (
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">
                        繰り返し終了
                      </label>
                      <input
                        type="date"
                        name="repeatEndDate"
                        value={formatDateForInput(formData.repeatEndDate)}
                        onChange={handleDateChange}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                </div>
                
                {formData.repeatType && formData.repeatType !== 'none' && (
                  <div className="mt-2 text-xs flex items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mr-1 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-600">
                      繰り返し設定をすると、タスクが完了するたびに次の期日が自動設定されます。
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* リマインダー設定 */}
          <div className="mb-4">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => setShowReminderOptions(!showReminderOptions)}
            >
              <BellRing className="w-4 h-4 text-gray-600 mr-2" />
              <label className="text-sm font-medium text-gray-700 cursor-pointer">
                リマインダー設定
              </label>
              <div className="ml-auto">
                {showReminderOptions ? (
                  <X className="w-4 h-4 text-gray-600" />
                ) : (
                  <Check className="w-4 h-4 text-gray-600" />
                )}
              </div>
            </div>
            
            {showReminderOptions && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">
                    リマインド時間
                  </label>
                  <select
                    name="reminderTime"
                    className="w-full p-2 text-sm border border-gray-300 rounded-md"
                    value={formData.reminderTime || '60'}
                    onChange={handleInputChange}
                  >
                    <option value="15">15分前</option>
                    <option value="30">30分前</option>
                    <option value="60">1時間前</option>
                    <option value="120">2時間前</option>
                    <option value="1440">1日前</option>
                    <option value="4320">3日前</option>
                  </select>
                </div>
                
                <div className="mt-2 text-xs flex items-start">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mr-1 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-600">
                    リマインダーはダッシュボードの通知とアラートタブに表示されます。
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
            >
              更新
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;