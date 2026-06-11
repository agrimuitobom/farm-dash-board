// seedFirestore.js
// このスクリプトはFirestoreにサンプルデータを投入するためのものです
// 開発環境での利用を想定しています

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  setDoc,
  doc,
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';

// 日付ヘルパー関数
const getTimestamp = (daysAgo = 0, hoursAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return Timestamp.fromDate(date);
};

// ハウスのサンプルデータ
const housesData = [
  {
    id: '温室ハウス1',
    currentCrop: 'R6ミニトマト',
    plantDate: getTimestamp(45),  // 45日前
    transplantDate: getTimestamp(30),  // 30日前
    fertilizeDate: getTimestamp(10),  // 10日前
    fertilizeInfo: '有機肥料500g/株',
    harvestAmount: 15,
    status: '生育中',
    image: 'https://placehold.jp/150',
  },
  {
    id: '温室ハウス2',
    currentCrop: 'キュウリ',
    plantDate: getTimestamp(50),
    transplantDate: getTimestamp(35),
    fertilizeDate: getTimestamp(15),
    fertilizeInfo: '液肥散布',
    harvestAmount: 23,
    status: '生育中',
    image: 'https://placehold.jp/150',
  },
  {
    id: '温室ハウス3',
    currentCrop: 'パプリカ',
    plantDate: getTimestamp(70),
    transplantDate: getTimestamp(50),
    fertilizeDate: getTimestamp(25),
    fertilizeInfo: '複合肥料300g/株',
    harvestAmount: 12,
    status: '生育中',
    image: 'https://placehold.jp/150',
  },
  {
    id: '温室ハウス4',
    currentCrop: 'レタス',
    plantDate: getTimestamp(30),
    transplantDate: getTimestamp(15),
    fertilizeDate: getTimestamp(5),
    fertilizeInfo: '有機肥料200g/株',
    harvestAmount: 8,
    status: '生育中',
    image: 'https://placehold.jp/150',
  },
  {
    id: '温室ハウス5',
    currentCrop: 'ナス',
    plantDate: getTimestamp(55),
    transplantDate: getTimestamp(40),
    fertilizeDate: getTimestamp(20),
    fertilizeInfo: '有機肥料450g/株',
    harvestAmount: 18,
    status: '生育中',
    image: 'https://placehold.jp/150',
  }
];

// 環境データのサンプルデータ生成関数
const generateEnvironmentalData = () => {
  const data = [];
  const now = new Date();
  
  // 各ハウスについて24時間分のデータを2時間おきに生成
  housesData.forEach(house => {
    for (let hour = 0; hour <= 24; hour += 2) {
      const timestamp = new Date(now);
      timestamp.setHours(now.getHours() - hour);
      
      // 時間帯によって値が変わるよう調整
      const timeCoef = Math.sin((timestamp.getHours() / 24) * Math.PI) * 0.5 + 0.5;
      
      data.push({
        houseId: house.id,
        timestamp: Timestamp.fromDate(timestamp),
        temperature: 20 + timeCoef * 10, // 20-30°C
        humidity: 60 + timeCoef * 20,    // 60-80%
        soilMoisture: 70 + timeCoef * 15, // 70-85%
        light: 5000 + timeCoef * 30000,   // 5000-35000 lux
        co2: 400 + timeCoef * 200         // 400-600 ppm
      });
    }
  });
  
  // 屋外環境データも追加
  for (let hour = 0; hour <= 24; hour += 2) {
    const timestamp = new Date(now);
    timestamp.setHours(now.getHours() - hour);
    
    const timeCoef = Math.sin((timestamp.getHours() / 24) * Math.PI) * 0.5 + 0.5;
    
    data.push({
      houseId: 'outdoor', // 屋外用の特別なID
      timestamp: Timestamp.fromDate(timestamp),
      temperature: 18 + timeCoef * 12, // 18-30°C
      humidity: 50 + timeCoef * 30,    // 50-80%
      soilMoisture: 65 + timeCoef * 15, // 65-80%
      light: 8000 + timeCoef * 40000,   // 8000-48000 lux
      co2: 350 + timeCoef * 30          // 350-380 ppm
    });
  }
  
  return data;
};

// タスクのサンプルデータ
const tasksData = [
  {
    title: '温室ハウス2の水やり',
    houseId: '温室ハウス2',
    description: '水やりを行い、土壌水分を80%以上に保つようにする',
    dueDate: getTimestamp(0, -5), // 5時間後
    priority: '高',
    status: '未完了',
    assignedTo: '山田',
    completed: false,
    completedAt: null
  },
  {
    title: 'トマトの収穫',
    houseId: '温室ハウス1',
    description: '収穫適期のトマトを全て収穫する。見逃しがないようにする。',
    dueDate: getTimestamp(-1), // 明日
    priority: '中',
    status: '未完了',
    assignedTo: '佐藤',
    completed: false,
    completedAt: null
  },
  {
    title: '温室ハウス4の追肥',
    houseId: '温室ハウス4',
    description: '有機肥料を施肥する。株ごとに100gを目安に。',
    dueDate: getTimestamp(-2), // 明後日
    priority: '中',
    status: '未完了',
    assignedTo: '鈴木',
    completed: false,
    completedAt: null
  },
  {
    title: '温室ハウス1の害虫防除',
    houseId: '温室ハウス1',
    description: 'アブラムシ発生のため、有機農薬を散布する。',
    dueDate: getTimestamp(-3), // 3日後
    priority: '高',
    status: '未完了',
    assignedTo: '山田',
    completed: false,
    completedAt: null
  },
  {
    title: '温室ハウス3の誘引作業',
    houseId: '温室ハウス3',
    description: 'パプリカの支柱誘引を実施する。',
    dueDate: getTimestamp(-1), // 明日
    priority: '低',
    status: '未完了',
    assignedTo: '田中',
    completed: false,
    completedAt: null
  }
];

// アラートのサンプルデータ
const alertsData = [
  {
    houseId: '温室ハウス1',
    title: '温室ハウス1の温度が高すぎます',
    message: '温度が30°Cを超えています。換気を検討してください。',
    severity: '警告',
    timestamp: getTimestamp(0, 2), // 2時間前
    resolved: false,
    resolvedAt: null,
    type: '温度',
    value: 31.2,
    threshold: 30
  },
  {
    houseId: '温室ハウス3',
    title: '温室ハウス3の湿度が低すぎます',
    message: '湿度が50%を下回っています。加湿を検討してください。',
    severity: '注意',
    timestamp: getTimestamp(0, 3), // 3時間前
    resolved: false,
    resolvedAt: null,
    type: '湿度',
    value: 48.5,
    threshold: 50
  },
  {
    houseId: '温室ハウス5',
    title: '温室ハウス5の土壌水分が低下しています',
    message: '土壌水分が65%を下回っています。水やりを検討してください。',
    severity: '警告',
    timestamp: getTimestamp(0, 12), // 12時間前
    resolved: false,
    resolvedAt: null,
    type: '土壌水分',
    value: 63.8,
    threshold: 65
  },
  {
    houseId: '温室ハウス2',
    title: '温室ハウス2のCO2濃度が高すぎます',
    message: 'CO2濃度が800ppmを超えています。換気を検討してください。',
    severity: '注意',
    timestamp: getTimestamp(0, 6), // 6時間前
    resolved: true,
    resolvedAt: getTimestamp(0, 1), // 1時間前
    type: 'CO2',
    value: 823,
    threshold: 800
  }
];

// データをFirestoreに投入する関数
const seedFirestore = async () => {
  try {
    // トランザクションなどを使った方が良いですが、簡易実装として逐次処理
    console.log('Firestoreへのデータ投入を開始します...');
    
    // ハウスデータの投入
    console.log('ハウスデータを投入中...');
    for (const house of housesData) {
      const houseId = house.id;
      await setDoc(doc(db, 'houses', houseId), house);
    }
    console.log('ハウスデータの投入が完了しました。');
    
    // 環境データの投入
    console.log('環境データを投入中...');
    const environmentalData = generateEnvironmentalData();
    for (const data of environmentalData) {
      await addDoc(collection(db, 'environmental_data'), data);
    }
    console.log('環境データの投入が完了しました。');
    
    // タスクデータの投入
    console.log('タスクデータを投入中...');
    for (const task of tasksData) {
      await addDoc(collection(db, 'tasks'), task);
    }
    console.log('タスクデータの投入が完了しました。');
    
    // アラートデータの投入
    console.log('アラートデータを投入中...');
    for (const alert of alertsData) {
      await addDoc(collection(db, 'alerts'), alert);
    }
    console.log('アラートデータの投入が完了しました。');
    
    console.log('全てのデータ投入が完了しました。');
  } catch (error) {
    console.error('データ投入中にエラーが発生しました:', error);
  }
};

export { seedFirestore };