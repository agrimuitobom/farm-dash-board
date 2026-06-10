import React, { useState, useEffect } from 'react';
import { Home, AlertTriangle, Loader2 } from 'lucide-react';

import { getAllHouses, getUnresolvedAlerts } from '../../firestoreUtils';
import HouseMonitor from './HouseMonitor';

const HousesList = () => {
  const [houses, setHouses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 初期データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // ハウスとアラートの情報を取得
        const [housesData, alertsData] = await Promise.all([
          getAllHouses(),
          getUnresolvedAlerts()
        ]);
        
        setHouses(housesData);
        setAlerts(alertsData);
      } catch (err) {
        console.error('データの取得中にエラーが発生しました:', err);
        setError('データの取得中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // ハウスごとのアラート数を計算
  const getAlertCountForHouse = (houseId) => {
    return alerts.filter(alert => alert.houseId === houseId).length;
  };
  
  // アラートの重要度に基づいて、ハウスを並び替え
  const sortedHouses = [...houses].sort((a, b) => {
    const aAlerts = alerts.filter(alert => alert.houseId === a.id);
    const bAlerts = alerts.filter(alert => alert.houseId === b.id);
    
    // 高重要度アラートの数で比較
    const aHighCount = aAlerts.filter(alert => alert.severity === 'high').length;
    const bHighCount = bAlerts.filter(alert => alert.severity === 'high').length;
    
    if (aHighCount !== bHighCount) {
      return bHighCount - aHighCount; // 高重要度が多い順
    }
    
    // 中重要度アラートの数で比較
    const aMediumCount = aAlerts.filter(alert => alert.severity === 'medium').length;
    const bMediumCount = bAlerts.filter(alert => alert.severity === 'medium').length;
    
    if (aMediumCount !== bMediumCount) {
      return bMediumCount - aMediumCount; // 中重要度が多い順
    }
    
    // アラート総数で比較
    if (aAlerts.length !== bAlerts.length) {
      return bAlerts.length - aAlerts.length; // アラートが多い順
    }
    
    // それ以外はハウス名でソート
    return a.name.localeCompare(b.name);
  });
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">ハウスモニター</h2>
        
        {/* アラート概要 */}
        {!loading && alerts.length > 0 && (
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-sm font-medium">
              未解決アラート: {alerts.length}件
            </span>
          </div>
        )}
      </div>
      
      {/* 読み込み中表示 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">データを読み込み中...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-600">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedHouses.map(house => (
            <div key={house.id} className="col-span-1">
              <HouseMonitor houseId={house.id} />
            </div>
          ))}
          
          {sortedHouses.length === 0 && (
            <div className="col-span-full p-8 bg-white rounded-lg shadow text-center">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">ハウスが登録されていません</h3>
              <p className="text-gray-600">
                ハウス管理セクションからハウスを追加してください。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HousesList;