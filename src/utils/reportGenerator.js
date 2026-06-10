// reportGenerator.js
// レポートデータを生成するユーティリティ関数

import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { formatFirestoreData } from '../firestoreUtils';

/**
 * 作物別の生産量データを取得する
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @param {string} houseId - ハウスID (オプション)
 * @returns {Promise<Array>} 生産量データの配列
 */
export const getProductionReport = async (startDate, endDate, houseId = null) => {
  try {
    // Firestoreのクエリを構築
    let harvestsQuery;
    
    if (houseId) {
      harvestsQuery = query(
        collection(db, 'harvests'),
        where('harvestDate', '>=', Timestamp.fromDate(startDate)),
        where('harvestDate', '<=', Timestamp.fromDate(endDate)),
        where('houseId', '==', houseId),
        orderBy('harvestDate', 'asc')
      );
    } else {
      harvestsQuery = query(
        collection(db, 'harvests'),
        where('harvestDate', '>=', Timestamp.fromDate(startDate)),
        where('harvestDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('harvestDate', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(harvestsQuery);
    
    // データをフォーマット
    const harvestsData = querySnapshot.docs.map(doc => formatFirestoreData({
      id: doc.id,
      ...doc.data()
    }));
    
    if (harvestsData.length === 0) {
      return generateDummyProductionData();
    }
    
    // 作物ごとの集計
    const cropSummary = {};
    
    harvestsData.forEach(harvest => {
      const { cropName, quantity, previousMonthQuantity, previousYearQuantity } = harvest;
      
      if (!cropSummary[cropName]) {
        cropSummary[cropName] = {
          name: cropName,
          当月: 0,
          前月: 0,
          前年同月: 0
        };
      }
      
      cropSummary[cropName].当月 += quantity || 0;
      cropSummary[cropName].前月 += previousMonthQuantity || 0;
      cropSummary[cropName].前年同月 += previousYearQuantity || 0;
    });
    
    return Object.values(cropSummary);
  } catch (error) {
    console.error('生産量レポートの取得中にエラーが発生しました:', error);
    return generateDummyProductionData();
  }
};

/**
 * ハウスごとの生産性を比較するデータを取得する
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @param {string} cropId - 作物ID (オプション)
 * @returns {Promise<Array>} 生産性データの配列
 */
export const getProductivityReport = async (startDate, endDate, cropId = null) => {
  try {
    // Firestoreのクエリを構築
    let harvestsQuery;
    
    if (cropId) {
      harvestsQuery = query(
        collection(db, 'harvests'),
        where('harvestDate', '>=', Timestamp.fromDate(startDate)),
        where('harvestDate', '<=', Timestamp.fromDate(endDate)),
        where('cropId', '==', cropId),
        orderBy('harvestDate', 'asc')
      );
    } else {
      harvestsQuery = query(
        collection(db, 'harvests'),
        where('harvestDate', '>=', Timestamp.fromDate(startDate)),
        where('harvestDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('harvestDate', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(harvestsQuery);
    
    // データをフォーマット
    const harvestsData = querySnapshot.docs.map(doc => formatFirestoreData({
      id: doc.id,
      ...doc.data()
    }));
    
    if (harvestsData.length === 0) {
      return generateDummyProductivityData();
    }
    
    // ハウスごとの集計
    const houseSummary = {};
    
    harvestsData.forEach(harvest => {
      const { houseName, quantity, area } = harvest;
      
      if (!houseSummary[houseName]) {
        houseSummary[houseName] = {
          name: houseName,
          totalQuantity: 0,
          totalArea: 0,
          productivity: 0
        };
      }
      
      houseSummary[houseName].totalQuantity += quantity || 0;
      
      // 面積は最新のものを使用
      if (area) {
        houseSummary[houseName].totalArea = area;
      }
    });
    
    // 生産性を計算（単位面積あたりの収穫量）
    Object.values(houseSummary).forEach(house => {
      if (house.totalArea > 0) {
        house.productivity = house.totalQuantity / house.totalArea;
      }
    });
    
    return Object.values(houseSummary);
  } catch (error) {
    console.error('生産性レポートの取得中にエラーが発生しました:', error);
    return generateDummyProductivityData();
  }
};

/**
 * 作物ごとの収穫量推移データを取得する
 * @param {number} months - 何ヶ月分のデータを取得するか
 * @param {string} cropId - 作物ID (オプション)
 * @returns {Promise<Array>} 月別の収穫量データの配列
 */
export const getCropTrendsReport = async (months = 12, cropId = null) => {
  try {
    // 現在から指定月数前までのタイムスタンプを計算
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    
    // Firestoreのクエリを構築
    let harvestsQuery;
    
    if (cropId) {
      harvestsQuery = query(
        collection(db, 'harvests'),
        where('harvestDate', '>=', Timestamp.fromDate(startDate)),
        where('cropId', '==', cropId),
        orderBy('harvestDate', 'asc')
      );
    } else {
      harvestsQuery = query(
        collection(db, 'harvests'),
        where('harvestDate', '>=', Timestamp.fromDate(startDate)),
        orderBy('harvestDate', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(harvestsQuery);
    
    // データをフォーマット
    const harvestsData = querySnapshot.docs.map(doc => formatFirestoreData({
      id: doc.id,
      ...doc.data()
    }));
    
    if (harvestsData.length === 0) {
      return generateDummyCropTrendsData(months);
    }
    
    // 月ごと、作物ごとの集計
    const monthCropSummary = {};
    
    harvestsData.forEach(harvest => {
      const { cropName, harvestDate, quantity } = harvest;
      
      if (!harvestDate) return;
      
      // 月のキーを作成 (例: "2023-01")
      const monthKey = `${harvestDate.getFullYear()}-${String(harvestDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthCropSummary[monthKey]) {
        monthCropSummary[monthKey] = {
          month: monthKey
        };
      }
      
      if (!monthCropSummary[monthKey][cropName]) {
        monthCropSummary[monthKey][cropName] = 0;
      }
      
      monthCropSummary[monthKey][cropName] += quantity || 0;
    });
    
    // 月の順にソート
    return Object.values(monthCropSummary).sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    console.error('収穫量推移レポートの取得中にエラーが発生しました:', error);
    return generateDummyCropTrendsData(months);
  }
};

/**
 * 収穫データをCSV形式に変換する
 * @param {Array} data - 収穫データの配列
 * @param {string} reportType - レポートの種類
 * @returns {string} CSV形式のデータ
 */
export const convertToCSV = (data, reportType) => {
  if (!data || data.length === 0) return '';
  
  // ヘッダー行を作成
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');
  
  // データ行を作成
  const rows = data.map(item => {
    return headers.map(header => {
      // 数値は単位を削除
      if (typeof item[header] === 'number') {
        return item[header];
      }
      // 文字列の場合、カンマを含む場合はダブルクォートで囲む
      return typeof item[header] === 'string' && item[header].includes(',')
        ? `"${item[header]}"`
        : item[header];
    }).join(',');
  });
  
  // ヘッダー行とデータ行を結合
  return [headerRow, ...rows].join('\n');
};

// ===== ダミーデータ生成関数 =====

/**
 * 生産量レポートのダミーデータを生成する
 * @returns {Array} ダミーデータ
 */
const generateDummyProductionData = () => {
  return [
    { name: 'トマト', 当月: 123, 前月: 110, 前年同月: 95 },
    { name: 'キュウリ', 当月: 85, 前月: 79, 前年同月: 70 },
    { name: 'パプリカ', 当月: 65, 前月: 59, 前年同月: 50 },
    { name: 'レタス', 当月: 40, 前月: 43, 前年同月: 35 },
    { name: 'ナス', 当月: 75, 前月: 68, 前年同月: 60 },
  ];
};

/**
 * 生産性レポートのダミーデータを生成する
 * @returns {Array} ダミーデータ
 */
const generateDummyProductivityData = () => {
  return [
    { name: '第1ハウス', totalQuantity: 450, totalArea: 100, productivity: 4.5 },
    { name: '第2ハウス', totalQuantity: 380, totalArea: 80, productivity: 4.75 },
    { name: '第3ハウス', totalQuantity: 520, totalArea: 120, productivity: 4.33 },
    { name: '第4ハウス', totalQuantity: 320, totalArea: 80, productivity: 4.0 },
    { name: '第5ハウス', totalQuantity: 280, totalArea: 60, productivity: 4.67 },
  ];
};

/**
 * 収穫量推移レポートのダミーデータを生成する
 * @param {number} months - 生成する月数
 * @returns {Array} ダミーデータ
 */
const generateDummyCropTrendsData = (months = 12) => {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    data.unshift({
      month: monthKey,
      'トマト': Math.floor(80 + Math.random() * 40),
      'キュウリ': Math.floor(50 + Math.random() * 30),
      'パプリカ': Math.floor(40 + Math.random() * 20),
      'レタス': Math.floor(30 + Math.random() * 15),
      'ナス': Math.floor(50 + Math.random() * 25)
    });
  }
  
  return data;
};
