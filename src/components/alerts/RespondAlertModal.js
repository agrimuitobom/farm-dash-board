import React from 'react';
import { X, MessageSquare, ThermometerIcon, Droplets, Wind, Zap, AlertTriangle, AlertOctagon } from 'lucide-react';

const RespondAlertModal = ({ isOpen, onClose, alert, responseData, handleInputChange, handleSubmit }) => {
  if (!isOpen || !alert) return null;
  
  // アラートタイプに基づいたアイコンを取得
  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'temperature':
        return <ThermometerIcon className="w-5 h-5 text-orange-500" />;
      case 'humidity':
        return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'co2':
        return <Wind className="w-5 h-5 text-purple-500" />;
      case 'light':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'system':
        return <AlertOctagon className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex">
      <div className="relative p-6 bg-white rounded-lg w-full max-w-2xl m-auto">
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <span className="mr-2">{getAlertTypeIcon(alert.type)}</span>
            <h2 className="text-xl font-bold text-gray-900">アラート対応: {alert.title}</h2>
          </div>
          <p className="text-gray-600">{alert.description}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* 対応内容 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="response">
              対応内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="response"
              name="response"
              value={responseData.response}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="実施した対応内容を入力してください"
            />
          </div>
          
          {/* ステータス */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
              ステータス
            </label>
            <select
              id="status"
              name="status"
              value={responseData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {/* 初期状態が未対応なら対応中を選ばせる */}
              {alert.status === 'pending' ? (
                <>
                  <option value="in-progress">対応中</option>
                  <option value="resolved">解決済み</option>
                </>
              ) : (
                <>
                  <option value="in-progress">対応中</option>
                  <option value="resolved">解決済み</option>
                </>
              )}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {responseData.status === 'resolved' ? 
                'アラートを解決済みとしてマークします' : 
                '解決に至っていない場合は対応中を選択してください'}
            </p>
          </div>
          
          {/* メモ（任意） */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
              メモ（任意）
            </label>
            <textarea
              id="notes"
              name="notes"
              value={responseData.notes}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="備考や追加情報があれば入力してください"
            />
          </div>
          
          {/* アクションボタン */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {alert.status === 'pending' ? '対応を記録' : '対応を更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RespondAlertModal;