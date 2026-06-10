import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  Calendar, 
  ArrowLeft, 
  Loader2,
  AlertTriangle,
  RefreshCw,
  ListPlus,
  Clipboard,
  PlusCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 環境データグラフコンポーネントをインポート
import EnvironmentalChart from './EnvironmentalChart';

// Firestoreユーティリティをインポート
import { 
  getHouseById, 
  getEnvironmentalHistory, 
  getAlertsByHouse,
  getTasksByHouse,
  formatFirestoreData,
  subscribeToHouse,
  subscribeToEnvironmentalData,
  addCropAreaToHouse,
  updateCropArea,
  removeCropArea,
  migrateHouseToCropAreas,
  getAllCrops
} from '../firestoreUtils';

// 各作物タイプのBase64エンコードされた単色SVG画像（軽量）
const coloredBackgrounds = {
  'トマト': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0ZGNkI2QiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPuODiOODnuODiDwvdGV4dD48L3N2Zz4=',
  'キュウリ': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzU2RTM5RiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPuOCreODpeOCpuODqjwvdGV4dD48L3N2Zz4=',
  'パプリカ': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0ZGOUEzQyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPuODkeODl+ODquOCqTwvdGV4dD48L3N2Zz4=',
  'レタス': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzU5Q0U4RiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPuODrOOCv+OCuTwvdGV4dD48L3N2Zz4=',
  'ナス': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzlGNDREMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPuODiuOCuTwvdGV4dD48L3N2Zz4=',
  'default': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzZDQjRFRSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNGRkZGRkYiPua4oOWgtDwvdGV4dD48L3N2Zz4='
};

// 作物エリア用のコンポーネント
const CropAreaCard = ({ cropArea, onEdit, onRemove }) => {
  // 作物タイプに基づいて背景画像を選択
  const getBackgroundImage = (cropName) => {
    if (!cropName) return coloredBackgrounds.default;
    
    for (const [key, value] of Object.entries(coloredBackgrounds)) {
      if (cropName.includes(key)) {
        return value;
      }
    }
    return coloredBackgrounds.default;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="h-40 relative">
        <img 
          src={getBackgroundImage(cropArea.cropName)}
          alt={cropArea.cropName} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex space-x-2">
          <button 
            onClick={() => onEdit(cropArea)}
            className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          <button 
            onClick={() => onRemove(cropArea.id)}
            className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
          >
            <Trash2 className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold">{cropArea.name || 'エリア'}</h4>
            <p className="text-gray-700">{cropArea.cropName || '作物未設定'}</p>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            {cropArea.status || '生育中'}
          </span>
        </div>
        
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">種まき日:</span>
            <span className="font-medium">{cropArea.plantDate ? new Date(cropArea.plantDate).toLocaleDateString() : '未設定'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">収穫量:</span>
            <span className="font-medium">{cropArea.harvestAmount || 0} kg</span>
          </div>
        </div>
      </div>
    </div>
  );
};
