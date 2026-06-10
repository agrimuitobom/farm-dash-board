import React from 'react';
import { Thermometer, Droplets, Wind, AlertTriangle, Camera } from 'lucide-react';

const HouseOverview = ({ house }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左側: 概要情報 */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">ハウス情報</h3>
          <p className="text-gray-700 mb-4">{house.description}</p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">面積</p>
              <p className="font-medium">{house.specs.area}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">高さ</p>
              <p className="font-medium">{house.specs.height}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">被覆材</p>
              <p className="font-medium">{house.specs.material}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">換気システム</p>
              <p className="font-medium">{house.specs.ventilation}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">灌水システム</p>
              <p className="font-medium">{house.specs.irrigation}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">建設年</p>
              <p className="font-medium">{house.specs.buildYear}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">現在の栽培状況</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">現在の作物</p>
                <p className="text-xl font-bold">{house.currentCrop}</p>
              </div>
              
              <div className="space-y-3">
                <div className="crop-event pl-6">
                  <p className="font-medium">播種</p>
                  <p className="text-gray-600 text-sm">{house.plantDate}</p>
                </div>
                <div className="crop-event pl-6">
                  <p className="font-medium">定植</p>
                  <p className="text-gray-600 text-sm">{house.transplantDate}</p>
                </div>
                <div className="crop-event pl-6">
                  <p className="font-medium">追肥</p>
                  <p className="text-gray-600 text-sm">{house.fertilizeDate}</p>
                  <p className="text-gray-600 text-sm">{house.fertilizeInfo}</p>
                </div>
                <div className="crop-event pl-6">
                  <p className="font-medium">収穫量</p>
                  <p className="text-gray-600 text-sm">{house.harvestAmount}</p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">作物の様子</p>
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-3">
                <img 
                  src={house.image} 
                  alt={`${house.currentCrop}の様子`} 
                  className="w-full h-40 object-cover"
                />
              </div>
              <div className="flex justify-end">
                <button className="text-green-600 text-sm flex items-center">
                  <Camera className="h-4 w-4 mr-1" />
                  写真を追加
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 右側: 環境データサマリー */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">現在の環境</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 mr-4">
                <Thermometer className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">温度</p>
                <p className="text-xl font-bold">{house.temperature} °C</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <Droplets className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">湿度</p>
                <p className="text-xl font-bold">{house.humidity} %</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-4">
                <Wind className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">土壌水分</p>
                <p className="text-xl font-bold">{house.soilMoisture} %</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">アラート</h3>
          
          {house.alerts && house.alerts.length > 0 ? (
            <div className="space-y-3">
              {house.alerts.map(alert => (
                <div key={alert.id} className="flex items-start p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-gray-600 text-sm">{alert.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">現在アラートはありません</p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">次回作業予定</h3>
          
          <div className="border-l-2 border-green-500 pl-4">
            <p className="font-medium">収穫</p>
            <p className="text-gray-600 text-sm">2025-04-05</p>
            <p className="text-gray-600 text-sm mt-1">生育状況に応じて初期の収穫を行います。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseOverview;