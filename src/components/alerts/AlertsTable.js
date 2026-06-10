import React from 'react';
import { 
  Eye, MessageSquare, CheckCircle, Clock, 
  ThermometerIcon, Droplets, Wind, Zap, 
  AlertTriangle, AlertOctagon
} from 'lucide-react';

const AlertsTable = ({ alerts, onView, onRespond, onStatusChange }) => {
  // 日付をフォーマット
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('ja-JP');
  };
  
  // 発生してからの経過時間を計算
  const getTimeAgo = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const alertDate = new Date(date);
    const diffInSeconds = Math.floor((now - alertDate) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}秒前`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}分前`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}時間前`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}日前`;
  };
  
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
  
  // 重要度に基づいた色を取得
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'medium':
        return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'low':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default:
        return 'text-blue-700 bg-blue-100 border-blue-300';
    }
  };
  
  // ステータスに基づいた色とテキストを取得
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Clock className="w-3 h-3 mr-1" />
            未対応
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <MessageSquare className="w-3 h-3 mr-1" />
            対応中
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            解決済み
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            不明
          </span>
        );
    }
  };
  
  // メッセージ表示
  if (alerts.length === 0) {
    return (
      <div className="p-6 text-center bg-white rounded-lg shadow">
        <p className="text-gray-600">条件に一致するアラートはありません。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                アラート
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ハウス
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                発生日時
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alerts.map((alert) => (
              <tr 
                key={alert.id}
                className={`hover:bg-gray-50 ${alert.status === 'pending' ? 'bg-red-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertTypeIcon(alert.type)}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {alert.title}
                        </div>
                        <div className={`ml-2 text-xs px-2 py-0.5 rounded border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {alert.description}
                      </div>
                      {alert.value && alert.threshold && (
                        <div className="text-xs text-gray-600 mt-1">
                          {alert.type === 'temperature' && `温度: ${alert.value}°C (閾値: ${alert.threshold}°C)`}
                          {alert.type === 'humidity' && `湿度: ${alert.value}% (閾値: ${alert.threshold}%)`}
                          {alert.type === 'co2' && `CO2: ${alert.value}ppm (閾値: ${alert.threshold}ppm)`}
                          {alert.type === 'light' && `光量: ${alert.value}lux (閾値: ${alert.threshold}lux)`}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{alert.houseName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(alert.status)}
                  {alert.response && (
                    <div className="text-xs text-gray-600 mt-1 max-w-xs truncate">
                      {alert.response}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(alert.timestamp)}</div>
                  <div className="text-xs text-gray-500 mt-1">{getTimeAgo(alert.timestamp)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onView(alert)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" /> 詳細
                    </button>
                    
                    {alert.status !== 'resolved' && (
                      <button
                        onClick={() => onRespond(alert)}
                        className="text-green-600 hover:text-green-900 flex items-center"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" /> 対応
                      </button>
                    )}
                    
                    {alert.status === 'in-progress' && (
                      <button
                        onClick={() => onStatusChange(alert.id, 'resolved')}
                        className="text-green-600 hover:text-green-900 flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> 解決
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsTable;