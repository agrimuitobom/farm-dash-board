import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ThermometerIcon, Droplets, Wind, Zap, AlertTriangle } from 'lucide-react';

import { 
  getLatestEnvironmentalData, 
  getUnresolvedAlerts, 
  getCropById, 
  getHouseById,
  subscribeToEnvironmentalData 
} from '../../firestoreUtils';

import { monitorAndAlertEnvironmental } from '../../utils/alertGenerator';

const HouseMonitor = ({ houseId }) => {
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [crop, setCrop] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 初期データ取得
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // ハウス情報を取得
        const houseData = await getHouseById(houseId);
        setHouse(houseData);
        
        // ハウスに関連する作物情報を取得
        if (houseData.currentCrop) {
          const cropData = await getCropById(houseData.currentCrop);
          setCrop(cropData);
        }
        
        // ハウスの未解決アラートを取得
        const alertsData = await getUnresolvedAlerts();
        const houseAlerts = alertsData.filter(alert => alert.houseId === houseId);
        setAlerts(houseAlerts);
        
        // 最新の環境データを取得
        const envData = await getLatestEnvironmentalData(houseId);
        setEnvironmentalData(envData);
        
      } catch (err) {
        console.error('モニター初期化中にエラーが発生しました:', err);
        setError('データの取得中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    if (houseId) {
      fetchInitialData();
    }
  }, [houseId]);
  
  // 環境データの監視
  useEffect(() => {
    if (!houseId) return;
    
    // リアルタイム環境データ監視を設定
    const unsubscribe = subscribeToEnvironmentalData(houseId, async (newData) => {
      if (newData) {
        setEnvironmentalData(newData);
        
        // 新しい環境データが取得されたら、アラート条件をチェック
        if (house) {
          try {
            // 環境データからアラートを生成し、既存のアラートと照合して登録
            const newAlertIds = await monitorAndAlertEnvironmental(
              newData, 
              house, 
              crop, 
              alerts
            );
            
            // 新しいアラートが生成された場合、アラートリストを更新
            if (newAlertIds.length > 0) {
              const updatedAlerts = await getUnresolvedAlerts();
              const houseAlerts = updatedAlerts.filter(alert => alert.houseId === houseId);
              setAlerts(houseAlerts);
            }
          } catch (err) {
            console.error('アラート生成中にエラーが発生しました:', err);
          }
        }
      }
    });
    
    // クリーンアップ関数
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [houseId, house, crop, alerts]);
  
  // アラートのステータスバッジを描画
  const renderAlertStatus = () => {
    if (!alerts || alerts.length === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          問題なし
        </span>
      );
    }
    
    const highPriorityCount = alerts.filter(a => a.severity === 'high').length;
    const mediumPriorityCount = alerts.filter(a => a.severity === 'medium').length;
    
    if (highPriorityCount > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          高重要度アラート {highPriorityCount}件
        </span>
      );
    } else if (mediumPriorityCount > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          中重要度アラート {mediumPriorityCount}件
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          低重要度アラート {alerts.length}件
        </span>
      );
    }
  };
  
  // 環境データを描画
  const renderEnvironmentalData = () => {
    if (!environmentalData) {
      return <p className="text-gray-500 text-sm">環境データが利用できません</p>;
    }
    
    const statusClass = (value, thresholds) => {
      if (!thresholds) return '';
      
      if (value > thresholds.max || value < thresholds.min) {
        return 'text-red-600 font-bold';
      } else if (value > thresholds.warningMax || value < thresholds.warningMin) {
        return 'text-orange-600 font-bold';
      }
      return 'text-green-600';
    };
    
    // 閾値の取得（優先順位: 作物 > ハウス > デフォルト）
    const getThresholds = (parameter) => {
      const defaultThresholds = {
        temperature: { min: 15, max: 35, warningMin: 18, warningMax: 32 },
        humidity: { min: 30, max: 90, warningMin: 40, warningMax: 85 },
        co2: { min: 400, max: 2000, warningMin: 600, warningMax: 1800 },
        light: { min: 1000, max: 100000, warningMin: 2000, warningMax: 80000 }
      };
      
      if (crop && crop.environmentalConditions && crop.environmentalConditions[parameter]) {
        return crop.environmentalConditions[parameter];
      } else if (house && house.thresholds && house.thresholds[parameter]) {
        return house.thresholds[parameter];
      } else {
        return defaultThresholds[parameter];
      }
    };
    
    return (
      <div className="flex flex-wrap gap-3">
        {environmentalData.temperature !== undefined && (
          <div className="flex items-center bg-white py-1 px-3 rounded-full shadow-sm">
            <ThermometerIcon className="w-4 h-4 text-orange-500 mr-1" />
            <span className={statusClass(environmentalData.temperature, getThresholds('temperature'))}>
              {environmentalData.temperature.toFixed(1)}°C
            </span>
          </div>
        )}
        
        {environmentalData.humidity !== undefined && (
          <div className="flex items-center bg-white py-1 px-3 rounded-full shadow-sm">
            <Droplets className="w-4 h-4 text-blue-500 mr-1" />
            <span className={statusClass(environmentalData.humidity, getThresholds('humidity'))}>
              {environmentalData.humidity.toFixed(1)}%
            </span>
          </div>
        )}
        
        {environmentalData.co2 !== undefined && (
          <div className="flex items-center bg-white py-1 px-3 rounded-full shadow-sm">
            <Wind className="w-4 h-4 text-purple-500 mr-1" />
            <span className={statusClass(environmentalData.co2, getThresholds('co2'))}>
              {environmentalData.co2.toFixed(0)}ppm
            </span>
          </div>
        )}
        
        {environmentalData.light !== undefined && (
          <div className="flex items-center bg-white py-1 px-3 rounded-full shadow-sm">
            <Zap className="w-4 h-4 text-yellow-500 mr-1" />
            <span className={statusClass(environmentalData.light, getThresholds('light'))}>
              {environmentalData.light.toFixed(0)}lux
            </span>
          </div>
        )}
      </div>
    );
  };
  
  // アラートバッジをクリックしたときの処理
  const handleAlertClick = () => {
    if (alerts && alerts.length > 0) {
      navigate('/alerts?houseId=' + houseId);
    }
  };
  
  return (
    <div className="bg-gray-50 border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-900">
          {house ? house.name : 'ハウスモニター'}
        </h3>
        <button 
          onClick={handleAlertClick}
          className={`flex items-center ${alerts && alerts.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {renderAlertStatus()}
        </button>
      </div>
      
      {/* 作物情報を表示 */}
      {crop && (
        <div className="text-sm text-gray-600 mb-3">
          現在の作物: {crop.name}
        </div>
      )}
      
      {/* 環境データ表示 */}
      <div className="mt-2">
        {loading ? (
          <p className="text-gray-500 text-sm">データを読み込み中...</p>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (
          renderEnvironmentalData()
        )}
      </div>
      
      {/* アラート概要 */}
      {alerts && alerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700 mb-1">
            <Bell className="w-4 h-4 mr-1 text-red-500" />
            <span>未解決アラート: {alerts.length}件</span>
          </div>
          
          {/* 最新の高重要度アラートを1件表示 */}
          {alerts.filter(a => a.severity === 'high').length > 0 && (
            <div className="text-xs text-red-600 font-medium truncate">
              {alerts.filter(a => a.severity === 'high')[0].title}
            </div>
          )}
          
          {/* アラート一覧へのリンク */}
          <button
            onClick={handleAlertClick}
            className="text-xs text-blue-600 hover:underline mt-1"
          >
            すべてのアラートを表示
          </button>
        </div>
      )}
    </div>
  );
};

export default HouseMonitor;