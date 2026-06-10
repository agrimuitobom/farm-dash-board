import React from 'react';
import { X, MessageSquare, ThermometerIcon, Droplets, Wind, Zap, AlertTriangle, AlertOctagon, Home, Clock, CheckCircle } from 'lucide-react';

const ViewAlertModal = ({ isOpen, onClose, alert, onRespond }) => {
  if (!isOpen || !alert) return null;
  
  // 日付をフォーマット
  const formatDate = (date) => {
    if (!date) return '---';
    const d = new Date(date);
    return d.toLocaleString('ja-JP');
  };
  
  // アラートタイプに基づいたアイコンと色を取得
  const getAlertTypeInfo = (type) => {
    switch (type) {
      case 'temperature':
        return { 
          icon: <ThermometerIcon className="w-5 h-5" />, 
          color: 'text-orange-500',
          label: '温度'
        };
      case 'humidity':
        return { 
          icon: <Droplets className="w-5 h-5" />, 
          color: 'text-blue-500',
          label: '湿度'
        };
      case 'co2':
        return { 
          icon: <Wind className="w-5 h-5" />, 
          color: 'text-purple-500',
          label: 'CO2濃度'
        };
      case 'light':
        return { 
          icon: <Zap className="w-5 h-5" />, 
          color: 'text-yellow-500',
          label: '光量'
        };
      case 'system':
        return { 
          icon: <AlertOctagon className="w-5 h-5" />, 
          color: 'text-gray-500',
          label: 'システム'
        };
      default:
        return { 
          icon: <AlertTriangle className="w-5 h-5" />, 
          color: 'text-gray-500',
          label: 'その他'
        };
    }
  };
  
  // 重要度に基づいた色とラベルを取得
  const getSeverityInfo = (severity) => {
    switch (severity) {
      case 'high':
        return { 
          color: 'bg-red-100 text-red-800 border-red-300', 
          label: '高'
        };
      case 'medium':
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-300', 
          label: '中'
        };
      case 'low':
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
          label: '低'
        };
      default:
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-300', 
          label: '標準'
        };
    }
  };
  
  // ステータスに基づいた情報を取得
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-5 h-5" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: '未対応'
        };
      case 'in-progress':
        return {
          icon: <MessageSquare className="w-5 h-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: '対応中'
        };
      case 'resolved':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: '解決済み'
        };
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: '不明'
        };
    }
  };
  
  const typeInfo = getAlertTypeInfo(alert.type);
  const severityInfo = getSeverityInfo(alert.severity);
  const statusInfo = getStatusInfo(alert.status);
  
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
            <span className={`rounded-full p-2 ${statusInfo.bgColor} ${statusInfo.color} mr-3`}>
              {statusInfo.icon}
            </span>
            <h2 className="text-xl font-bold text-gray-900">{alert.title}</h2>
            <span className={`ml-2 text-xs px-2 py-1 rounded border ${severityInfo.color}`}>
              重要度: {severityInfo.label}
            </span>
          </div>
          <p className="text-gray-600 mb-4">{alert.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* アラート情報 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">アラート情報</h3>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <span className={`mr-2 ${typeInfo.color}`}>{typeInfo.icon}</span>
                <span className="text-gray-600">タイプ:</span>
                <span className="ml-2 font-medium">{typeInfo.label}</span>
              </div>
              
              {alert.value && alert.threshold && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-600">測定値:</span>
                  <span className="ml-2 font-medium">
                    {alert.value}
                    {alert.type === 'temperature' && '°C'}
                    {alert.type === 'humidity' && '%'}
                    {alert.type === 'co2' && 'ppm'}
                    {alert.type === 'light' && 'lux'}
                  </span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="text-gray-600">閾値:</span>
                  <span className="ml-2 font-medium">
                    {alert.threshold}
                    {alert.type === 'temperature' && '°C'}
                    {alert.type === 'humidity' && '%'}
                    {alert.type === 'co2' && 'ppm'}
                    {alert.type === 'light' && 'lux'}
                  </span>
                </div>
              )}
              
              <div className="flex items-center text-sm">
                <Home className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-gray-600">ハウス:</span>
                <span className="ml-2 font-medium">{alert.houseName}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-gray-600">発生日時:</span>
                <span className="ml-2 font-medium">{formatDate(alert.timestamp)}</span>
              </div>
            </div>
          </div>
          
          {/* 対応状況 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">対応状況</h3>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <span className={`mr-2 ${statusInfo.color}`}>{statusInfo.icon}</span>
                <span className="text-gray-600">ステータス:</span>
                <span className="ml-2 font-medium">{statusInfo.label}</span>
              </div>
              
              {alert.respondedBy && alert.responseAt && (
                <div className="flex items-start text-sm">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-gray-600">対応者:</div>
                    <div className="font-medium">{alert.respondedBy}</div>
                    <div className="text-gray-500 text-xs">{formatDate(alert.responseAt)}</div>
                  </div>
                </div>
              )}
              
              {alert.resolvedAt && (
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  <span className="text-gray-600">解決日時:</span>
                  <span className="ml-2 font-medium">{formatDate(alert.resolvedAt)}</span>
                </div>
              )}
              
              {!alert.respondedBy && alert.status === 'pending' && (
                <p className="text-gray-500 text-sm italic">まだ対応されていません</p>
              )}
            </div>
          </div>
        </div>
        
        {/* 対応内容 */}
        {alert.response && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">対応内容</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <p>{alert.response}</p>
              
              {alert.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-1">メモ:</h4>
                  <p className="text-gray-600">{alert.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* アクションボタン */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            閉じる
          </button>
          
          {alert.status !== 'resolved' && (
            <button
              onClick={() => {
                onClose();
                onRespond(alert);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {alert.status === 'pending' ? '対応する' : '対応を更新'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAlertModal;