import React from 'react';
import { Link } from 'react-router-dom';
import { Thermometer, Droplets, Wind, AlertTriangle, Calendar, ArrowRightCircle } from 'lucide-react';

// 各作物タイプのBase64エンコードされた単色SVG画像（軽量）
const coloredBackgrounds = {
  'トマト': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0ZGNkI2QiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPuODiOODnuODiDwvdGV4dD48L3N2Zz4=',
  'キュウリ': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzU2RTM5RiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPuOCreODpeOCpuODqjwvdGV4dD48L3N2Zz4=',
  'パプリカ': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0ZGOUEzQyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPuODkeODl+ODquOCqTwvdGV4dD48L3N2Zz4=',
  'レタス': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzU5Q0U4RiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPuODrOOCv+OCuTwvdGV4dD48L3N2Zz4=',
  'ナス': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzlGNDREMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPuODiuOCuTwvdGV4dD48L3N2Zz4=',
  'default': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzZDQjRFRSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPua4oOWgtDwvdGV4dD48L3N2Zz4='
};

// 環境データの正常範囲の設定
const environmentalRanges = {
  temperature: { min: 18, max: 30, unit: '°C' },
  humidity: { min: 50, max: 80, unit: '%' },
  soilMoisture: { min: 60, max: 85, unit: '%' }
};

const HouseCard = ({ house, environmentalData, alertCount = 0 }) => {
  // 作物タイプに基づいて背景画像を選択
  const getBackgroundImage = () => {
    if (!house.currentCrop) return coloredBackgrounds.default;
    
    for (const [key, value] of Object.entries(coloredBackgrounds)) {
      if (house.currentCrop.includes(key)) {
        return value;
      }
    }
    return coloredBackgrounds.default;
  };

  // 値が正常範囲内かチェック
  const getValueColor = (type, value) => {
    if (!value || !environmentalRanges[type]) return 'text-gray-600';
    
    const { min, max } = environmentalRanges[type];
    if (value < min) return 'text-blue-600';
    if (value > max) return 'text-red-600';
    return 'text-green-600';
  };

  // 植え付けからの経過日数を計算
  const getDaysSincePlanting = () => {
    if (!house.plantDate) return null;
    
    const now = new Date();
    const plantDate = new Date(house.plantDate);
    const diffTime = Math.abs(now - plantDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const plantingDays = getDaysSincePlanting();

  return (
    <Link to={`/house/${house.id}`} className="block group">
      <div className="bg-white rounded-lg shadow overflow-hidden house-card transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-1">
        {/* ハウス画像 */}
        <div className="h-32 bg-gray-200 relative">
          <img 
            src={house.image || getBackgroundImage()}
            alt={house.id} 
            className="w-full h-full object-cover"
          />
          
          {/* アラートバッジ */}
          {alertCount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
              <span className="text-xs">{alertCount}</span>
            </div>
          )}
          
          {/* 栽培日数バッジ */}
          {plantingDays && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white rounded px-2 py-1 flex items-center text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              <span>栽培{plantingDays}日目</span>
            </div>
          )}
        </div>
        
        {/* ハウス情報 */}
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-800">{house.id}</h3>
              <p className="text-sm text-gray-600 mb-2">{house.currentCrop || '作物なし'}</p>
            </div>
            <ArrowRightCircle className="h-5 w-5 text-gray-300 group-hover:text-green-500 transition-colors" />
          </div>
          
          {/* ステータスバッジ */}
          <div className="mb-3">
            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
              {house.status || '生育中'}
            </span>
            {house.harvestAmount > 0 && (
              <span className="inline-block ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                収穫量: {house.harvestAmount}kg
              </span>
            )}
          </div>
          
          {/* 環境データ */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center">
              <Thermometer className="h-3 w-3 mr-1 text-red-500" />
              <span className={getValueColor('temperature', environmentalData?.temperature)}>
                {environmentalData?.temperature?.toFixed(1) || '--'}°C
              </span>
            </div>
            <div className="flex items-center">
              <Droplets className="h-3 w-3 mr-1 text-blue-500" />
              <span className={getValueColor('humidity', environmentalData?.humidity)}>
                {environmentalData?.humidity ? Math.round(environmentalData.humidity) : '--'}%
              </span>
            </div>
            <div className="flex items-center">
              <Wind className="h-3 w-3 mr-1 text-green-500" />
              <span className={getValueColor('soilMoisture', environmentalData?.soilMoisture)}>
                {environmentalData?.soilMoisture ? Math.round(environmentalData.soilMoisture) : '--'}%
              </span>
            </div>
          </div>
        </div>
        
        {/* アラート表示 */}
        {alertCount > 0 ? (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-xs text-red-700">{alertCount}件のアラートがあります</span>
          </div>
        ) : environmentalData ? (
          <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex items-center">
            <span className="text-xs text-green-700">最終更新: {environmentalData.timestamp?.toLocaleTimeString() || '--'}</span>
          </div>
        ) : (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center">
            <span className="text-xs text-gray-500">環境データがありません</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default HouseCard;