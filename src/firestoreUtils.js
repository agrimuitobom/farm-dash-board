// firestoreUtils.js
// Firestoreからのデータ取得や操作を行うユーティリティ関数

/**
 * このファイルには、Firestoreとのデータのやり取りを行うためのユーティリティ関数が含まれています。
 * WebChannelエラー対策として、適切なエラーハンドリングと再試行ロジックを実装しています。
 */

import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';

// モックFirestoreユーティリティ関数をインポート
import { mockFirestoreUtils } from './mock/mockFirebase';

// 画像URL正規化ユーティリティをインポート
import { normalizeImageUrl } from './utils/imageUtils';

// モードの判定 (window.useMockFirebaseはfirebase.jsで設定)
const isMockMode = () => {
  return window.useMockFirebase === true;
};

/**
 * リトライ可能なFirestore操作を実行するユーティリティ関数
 * @param {Function} operation - 実行する非同期関数
 * @param {number} maxRetries - 最大再試行回数
 * @param {number} initialDelay - 再試行開始時間（ミリ秒）
 * @returns {Promise<any>} 操作の結果
 */
async function executeWithRetry(operation, maxRetries = 3, initialDelay = 300) {
  let lastError;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 操作を実行
      return await operation();
      
    } catch (error) {
      lastError = error;
      
      // WebChannelエラーまたはネットワーク関連エラーか確認
      const isWebChannelError = error.message && (
        error.message.includes('WebChannel') ||
        error.message.includes('network') ||
        error.message.includes('failed to fetch') ||
        error.code === 'unavailable'
      );
      
      // 再試行可能なエラーかチェック
      if (isWebChannelError && attempt < maxRetries) {
        console.warn(`Firestore操作に失敗しました。再試行します (${attempt + 1}/${maxRetries})...`, error);
        
        // 指数関数的に待機時間を増加（バックオフ）
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 待機時間を倍増
        continue;
      }
      
      // 再試行不可能なエラーまたは最大再試行回数に達した場合
      console.error('Firestore操作が失敗しました:', error);
      throw error;
    }
  }
  
  // すべての再試行が失敗した場合
  throw lastError;
}

// ============== ハウス関連の関数 ==============

/**
 * ハウスに新しい作物エリアを追加する
 * @param {string} houseId - ハウスID
 * @param {Object} cropAreaData - 作物エリアデータ 
 *   {
 *     name: string, // エリア名（「北西エリア」など）
 *     cropId: string, // 作物ID
 *     cropName: string, // 作物名
 *     plantDate: Date, // 植え付け日
 *     harvestAmount: number, // 収穫量
 *     status: string, // 状態
 *     notes: string // メモ
 *   }
 * @returns {Promise<string>} 追加された作物エリアのID
 */
export const addCropAreaToHouse = async (houseId, cropAreaData) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.addCropAreaToHouse && mockFirestoreUtils.addCropAreaToHouse(houseId, cropAreaData);
  }
  
  try {
    const houseRef = doc(db, 'houses', houseId);
    const houseDoc = await getDoc(houseRef);
    
    if (!houseDoc.exists()) {
      throw new Error(`ハウスID ${houseId} が見つかりません`);
    }
    
    const houseData = houseDoc.data();
    const areaId = Date.now().toString(); // ユニークなIDを生成
    
    // 日付フィールドをタイムスタンプに変換
    const formattedAreaData = {
      ...cropAreaData,
      id: areaId,
      plantDate: cropAreaData.plantDate ? Timestamp.fromDate(new Date(cropAreaData.plantDate)) : null,
      transplantDate: cropAreaData.transplantDate ? Timestamp.fromDate(new Date(cropAreaData.transplantDate)) : null,
      fertilizeDate: cropAreaData.fertilizeDate ? Timestamp.fromDate(new Date(cropAreaData.fertilizeDate)) : null,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    };
    
    // 既存の cropAreas 配列がない場合は空の配列を作成
    const cropAreas = houseData.cropAreas || [];
    
    // 新しいエリアを追加
    cropAreas.push(formattedAreaData);
    
    // ハウスドキュメントを更新
    await updateDoc(houseRef, {
      cropAreas: cropAreas,
      updatedAt: getServerTimestamp()
    });
    
    return areaId;
  } catch (error) {
    console.error(`ハウス ${houseId} への作物エリア追加中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * ハウスの作物エリアを更新する
 * @param {string} houseId - ハウスID
 * @param {string} areaId - 更新するエリアID
 * @param {Object} cropAreaData - 更新するデータ
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const updateCropArea = async (houseId, areaId, cropAreaData) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.updateCropArea && mockFirestoreUtils.updateCropArea(houseId, areaId, cropAreaData);
  }
  
  try {
    const houseRef = doc(db, 'houses', houseId);
    const houseDoc = await getDoc(houseRef);
    
    if (!houseDoc.exists()) {
      throw new Error(`ハウスID ${houseId} が見つかりません`);
    }
    
    const houseData = houseDoc.data();
    
    // cropAreas がない場合はエラー
    if (!houseData.cropAreas || !Array.isArray(houseData.cropAreas)) {
      throw new Error(`ハウス ${houseId} に作物エリアがありません`);
    }
    
    // 対象のエリアを探す
    const areaIndex = houseData.cropAreas.findIndex(area => area.id === areaId);
    
    if (areaIndex === -1) {
      throw new Error(`エリアID ${areaId} がハウス ${houseId} に見つかりません`);
    }
    
    // 日付フィールドをタイムスタンプに変換
    const formattedAreaData = {
      ...cropAreaData,
      plantDate: cropAreaData.plantDate ? Timestamp.fromDate(new Date(cropAreaData.plantDate)) : null,
      transplantDate: cropAreaData.transplantDate ? Timestamp.fromDate(new Date(cropAreaData.transplantDate)) : null,
      fertilizeDate: cropAreaData.fertilizeDate ? Timestamp.fromDate(new Date(cropAreaData.fertilizeDate)) : null,
      updatedAt: getServerTimestamp()
    };
    
    // 既存のデータとマージして更新
    const updatedAreas = [...houseData.cropAreas];
    updatedAreas[areaIndex] = {
      ...updatedAreas[areaIndex],
      ...formattedAreaData,
      id: areaId // IDは変更しないように保証
    };
    
    // ハウスドキュメントを更新
    await updateDoc(houseRef, {
      cropAreas: updatedAreas,
      updatedAt: getServerTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error(`ハウス ${houseId} の作物エリア更新中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * ハウスから作物エリアを削除する
 * @param {string} houseId - ハウスID
 * @param {string} areaId - 削除するエリアID
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const removeCropArea = async (houseId, areaId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.removeCropArea && mockFirestoreUtils.removeCropArea(houseId, areaId);
  }
  
  try {
    const houseRef = doc(db, 'houses', houseId);
    const houseDoc = await getDoc(houseRef);
    
    if (!houseDoc.exists()) {
      throw new Error(`ハウスID ${houseId} が見つかりません`);
    }
    
    const houseData = houseDoc.data();
    
    // cropAreas がない場合はエラー
    if (!houseData.cropAreas || !Array.isArray(houseData.cropAreas)) {
      throw new Error(`ハウス ${houseId} に作物エリアがありません`);
    }
    
    // 対象のエリアを除く新しい配列を作成
    const updatedAreas = houseData.cropAreas.filter(area => area.id !== areaId);
    
    if (updatedAreas.length === houseData.cropAreas.length) {
      throw new Error(`エリアID ${areaId} がハウス ${houseId} に見つかりません`);
    }
    
    // ハウスドキュメントを更新
    await updateDoc(houseRef, {
      cropAreas: updatedAreas,
      updatedAt: getServerTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error(`ハウス ${houseId} からの作物エリア削除中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * 当初のデータ構造から複数作物対応のデータ構造にマイグレーションする
 * 当初の currentCrop と currentCropId を使用して作物エリアを作成する
 * @param {string} houseId - ハウスID
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const migrateHouseToCropAreas = async (houseId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.migrateHouseToCropAreas && mockFirestoreUtils.migrateHouseToCropAreas(houseId);
  }
  
  try {
    const houseRef = doc(db, 'houses', houseId);
    const houseDoc = await getDoc(houseRef);
    
    if (!houseDoc.exists()) {
      throw new Error(`ハウスID ${houseId} が見つかりません`);
    }
    
    const houseData = houseDoc.data();
    
    // 既にcropAreasがある場合は何もしない
    if (houseData.cropAreas && Array.isArray(houseData.cropAreas) && houseData.cropAreas.length > 0) {
      return false;
    }
    
    // currentCropがcurrentCropIdが存在する場合のみマイグレーション
    if (houseData.currentCrop || houseData.currentCropId) {
      const cropAreaData = {
        id: Date.now().toString(),
        name: 'メインエリア',
        cropId: houseData.currentCropId || '',
        cropName: houseData.currentCrop || '',
        plantDate: houseData.plantDate || null,
        transplantDate: houseData.transplantDate || null,
        fertilizeDate: houseData.fertilizeDate || null,
        harvestAmount: houseData.harvestAmount || 0,
        status: houseData.status || '生育中',
        notes: houseData.notes || '',
        createdAt: getServerTimestamp(),
        updatedAt: getServerTimestamp()
      };
      
      // ハウスドキュメントを更新
      await updateDoc(houseRef, {
        cropAreas: [cropAreaData],
        updatedAt: getServerTimestamp(),
        // 古いフィールドを残しておく（後方互換性用）
        // 将来的には削除することも考えられる
      });
      
      return true;
    }
    
    // 空のcropAreasを追加
    await updateDoc(houseRef, {
      cropAreas: [],
      updatedAt: getServerTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error(`ハウス ${houseId} のマイグレーション中にエラーが発生しました:`, error);
    throw error;
  }
};

// ============== ハウス関連の関数 ==============

/**
 * すべてのハウス情報を取得する
 * @returns {Promise<Array>} ハウス情報の配列
 */
/**
 * ハウスの作物データを更新する
 * @param {string} houseId - ハウスID
 * @param {Array} crops - 作物データの配列
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const updateHouseCrops = async (houseId, crops) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.updateHouseCrops && mockFirestoreUtils.updateHouseCrops(houseId, crops);
  }
  
  try {
    const houseRef = doc(db, 'houses', houseId);
    
    // 日付フィールドをタイムスタンプに変換
    const formattedCrops = crops.map(crop => ({
      ...crop,
      startDate: crop.startDate ? Timestamp.fromDate(new Date(crop.startDate)) : null,
      endDate: crop.endDate ? Timestamp.fromDate(new Date(crop.endDate)) : null,
      updatedAt: getServerTimestamp()
    }));
    
    // ハウスドキュメントを更新
    await updateDoc(houseRef, {
      crops: formattedCrops,
      updatedAt: getServerTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error(`ハウス ${houseId} の作物データ更新中にエラーが発生しました:`, error);
    throw error;
  }
};

export const getAllHouses = async () => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getAllHouses();
  }
  
  return executeWithRetry(async () => {
    const housesQuery = query(
      collection(db, 'houses'),
      where('isActive', '==', true),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(housesQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  });
};

/**
 * ハウスの詳細情報を取得する
 * @param {string} houseId - ハウスID
 * @returns {Promise<Object>} ハウス情報
 */
export const getHouseById = async (houseId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getHouseById(houseId);
  }
  
  return executeWithRetry(async () => {
    const docRef = doc(db, 'houses', houseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...formatFirestoreData(docSnap.data())
      };
    } else {
      throw new Error(`ハウスID ${houseId} が見つかりません`);
    }
  });
};

/**
 * ハウスの変更をリアルタイムに監視する
 * @param {string} houseId - ハウスID
 * @param {Function} callback - データを受け取るコールバック関数
 * @returns {Function} 監視を解除するための関数
 */
export const subscribeToHouse = (houseId, callback) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.subscribeToHouse(houseId, callback);
  }
  
  const docRef = doc(db, 'houses', houseId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({
        id: docSnap.id,
        ...formatFirestoreData(docSnap.data())
      });
    } else {
      callback(null);
    }
  });
};

/**
 * すべてのハウスの変更をリアルタイムに監視する
 * @param {Function} callback - データを受け取るコールバック関数
 * @returns {Function} 監視を解除するための関数
 */
export const subscribeToHouses = (callback) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.subscribeToHouses(callback);
  }
  
  const housesQuery = query(
    collection(db, 'houses'),
    where('isActive', '==', true)
  );
  
  return onSnapshot(housesQuery, (querySnapshot) => {
    const houses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
    callback(houses);
  });
};

// ============== 環境データ関連の関数 ==============

/**
 * 最新の環境データを取得する
 * @param {string} location - 場所（'outdoor'または特定のハウスID）
 * @returns {Promise<Object>} 環境データ
 */
export const getLatestEnvironmentalData = async (location) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getLatestEnvironmentalData(location);
  }
  
  try {
    const envQuery = query(
      collection(db, 'environmental_data'),
      where('location', '==', location),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(envQuery);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...formatFirestoreData(doc.data())
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`環境データ(${location})の取得中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * 環境データの履歴を取得する
 * @param {string} location - 場所（'outdoor'または特定のハウスID）
 * @param {number} hours - 取得する履歴の時間数
 * @returns {Promise<Array>} 環境データの配列
 */
export const getEnvironmentalHistory = async (location, hours = 24) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getEnvironmentalHistory(location, hours);
  }
  
  try {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);
    
    const envQuery = query(
      collection(db, 'environmental_data'),
      where('location', '==', location),
      where('timestamp', '>=', Timestamp.fromDate(startTime)),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(envQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error(`環境データ履歴(${location})の取得中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * 環境データの変更をリアルタイムに監視する
 * @param {string} location - 場所（'outdoor'または特定のハウスID）
 * @param {Function} callback - データを受け取るコールバック関数
 * @returns {Function} 監視を解除するための関数
 */
export const subscribeToEnvironmentalData = (location, callback) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.subscribeToEnvironmentalData(location, callback);
  }
  
  const envQuery = query(
    collection(db, 'environmental_data'),
    where('location', '==', location),
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  
  return onSnapshot(envQuery, (querySnapshot) => {
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      callback({
        id: doc.id,
        ...formatFirestoreData(doc.data())
      });
    } else {
      callback(null);
    }
  });
};

// ============== タスク関連の関数 ==============

/**
 * タスクを追加する
 * @param {Object} taskData - タスクデータ
 * @returns {Promise<string>} タスクID
 */
export const addTask = async (taskData) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.addTask(taskData);
  }
  
  try {
    // 日付フィールドをタイムスタンプに変換
    const data = {
      ...taskData,
      dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
      completed: false
    };
    
    const docRef = await addDoc(collection(db, 'tasks'), data);
    return docRef.id;
  } catch (error) {
    console.error('タスクの追加中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * 保留中のタスクを取得する
 * @param {number} limit - 取得するタスクの最大数
 * @returns {Promise<Array>} タスク情報の配列
 */
export const getPendingTasks = async (limitCount = 10) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getPendingTasks(limitCount);
  }
  
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('completed', '==', false),
      orderBy('dueDate'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(tasksQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error('タスクの取得中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * 特定のハウスのタスクを取得する
 * @param {string} houseId - ハウスID
 * @returns {Promise<Array>} タスク情報の配列
 */
export const getTasksByHouse = async (houseId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getTasksByHouse(houseId);
  }
  
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('houseId', '==', houseId),
      where('completed', '==', false),
      orderBy('dueDate')
    );
    
    const querySnapshot = await getDocs(tasksQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error(`ハウス ${houseId} のタスク取得中にエラーが発生しました:`, error);
    throw error;
  }
};

// ============== アラート関連の関数 ==============

/**
 * 未解決のアラートを取得する
 * @param {number} limit - 取得するアラートの最大数
 * @returns {Promise<Array>} アラート情報の配列
 */
export const getUnresolvedAlerts = async (limitCount = 10) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getUnresolvedAlerts(limitCount);
  }
  
  try {
    const alertsQuery = query(
      collection(db, 'alerts'),
      where('resolved', '==', false),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(alertsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error('アラートの取得中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * 特定のハウスのアラートを取得する
 * @param {string} houseId - ハウスID
 * @returns {Promise<Array>} アラート情報の配列
 */
export const getAlertsByHouse = async (houseId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getAlertsByHouse(houseId);
  }
  
  try {
    const alertsQuery = query(
      collection(db, 'alerts'),
      where('houseId', '==', houseId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(alertsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error(`ハウス ${houseId} のアラート取得中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * アラートを解決済みにする
 * @param {string} alertId - アラートID
 * @param {Object} resolutionData - 解決情報
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const resolveAlert = async (alertId, resolutionData) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.resolveAlert(alertId, resolutionData);
  }
  
  try {
    const alertRef = doc(db, 'alerts', alertId);
    await updateDoc(alertRef, {
      resolved: true,
      resolvedAt: getServerTimestamp(),
      resolution: resolutionData.resolution || '',
      resolvedBy: resolutionData.resolvedBy || '',
      actionTaken: resolutionData.actionTaken || '',
      updatedAt: getServerTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`アラート ${alertId} の解決中にエラーが発生しました:`, error);
    throw error;
  }
};

// ============== 作物履歴関連の関数 ==============

/**
 * 作物の履歴を取得する
 * @param {string} houseId - ハウスID
 * @returns {Promise<Array>} 作物履歴データの配列
 */
export const getCropHistory = async (houseId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getCropHistory && mockFirestoreUtils.getCropHistory(houseId);
  }
  
  try {
    const historyQuery = query(
      collection(db, 'crop_history'),
      where('houseId', '==', houseId),
      orderBy('endDate', 'desc')
    );
    
    const querySnapshot = await getDocs(historyQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error(`ハウス ${houseId} の作物履歴取得中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * 作物を作物履歴に移動する
 * @param {string} houseId - ハウスID
 * @param {Object} cropData - 作物データ
 * @returns {Promise<string>} 履歴ID
 */
export const moveCropToHistory = async (houseId, cropData) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.moveCropToHistory && mockFirestoreUtils.moveCropToHistory(houseId, cropData);
  }
  
  try {
    // 日付フィールドをタイムスタンプに変換
    const historyData = {
      houseId,
      cropName: cropData.cropName,
      variety: cropData.variety || '',
      startDate: cropData.startDate ? Timestamp.fromDate(new Date(cropData.startDate)) : null,
      endDate: cropData.endDate ? Timestamp.fromDate(new Date(cropData.endDate)) : Timestamp.fromDate(new Date()),
      harvestAmount: cropData.harvestAmount || 0,
      notes: cropData.notes || '',
      harvestNotes: cropData.harvestNotes || '',
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    };
    
    // 履歴コレクションに追加
    const docRef = await addDoc(collection(db, 'crop_history'), historyData);
    
    return docRef.id;
  } catch (error) {
    console.error(`作物の履歴移動中にエラーが発生しました:`, error);
    throw error;
  }
};

// ============== 作物関連の関数 ==============

/**
 * すべての作物情報を取得する
 * @returns {Promise<Array>} 作物情報の配列
 */
export const getAllCrops = async () => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getAllCrops();
  }
  
  try {
    const cropsQuery = query(
      collection(db, 'crops'),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(cropsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error('作物一覧の取得中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * 特定の作物を栽培しているハウスを取得する
 * @param {string} cropId - 作物ID
 * @returns {Promise<Array>} ハウス情報の配列
 */
export const getHousesByCrop = async (cropId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getHousesByCrop(cropId);
  }
  
  try {
    // 新しい複数作物対応バージョン: cropAreasに含まれる作物を検索
    const housesQuery = query(
      collection(db, 'houses'),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(housesQuery);
    
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...formatFirestoreData(doc.data())
      }))
      .filter(house => {
        // cropAreasがある場合、その中に指定されたcropIdを持つエリアがあるか確認
        if (house.cropAreas && Array.isArray(house.cropAreas)) {
          return house.cropAreas.some(area => area.cropId === cropId);
        }
        // 従来のcurrentCropIdも確認（後方互換性用）
        return house.currentCropId === cropId;
      });
  } catch (error) {
    console.error(`作物 ${cropId} を栽培中のハウス取得中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * 作物を追加する
 * @param {Object} cropData - 作物データ
 * @returns {Promise<string>} 作物ID
 */
export const addCrop = async (cropData) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.addCrop(cropData);
  }
  
  try {
    const data = {
      ...cropData,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'crops'), data);
    return docRef.id;
  } catch (error) {
    console.error('作物の追加中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * 作物情報を更新する
 * @param {string} cropId - 作物ID
 * @param {Object} cropData - 作物データ
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const updateCrop = async (cropId, cropData) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.updateCrop(cropId, cropData);
  }
  
  try {
    const cropRef = doc(db, 'crops', cropId);
    await updateDoc(cropRef, {
      ...cropData,
      updatedAt: getServerTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`作物 ${cropId} の更新中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * 作物を削除する
 * @param {string} cropId - 作物ID
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const deleteCrop = async (cropId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.deleteCrop(cropId);
  }
  
  try {
    const cropRef = doc(db, 'crops', cropId);
    await deleteDoc(cropRef);
    return true;
  } catch (error) {
    console.error(`作物 ${cropId} の削除中にエラーが発生しました:`, error);
    throw error;
  }
};

// ============== シフト関連の関数 ==============

/**
 * シフト一覧を取得する
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @returns {Promise<Array>} シフト情報の配列
 */
export const getShiftList = async (startDate, endDate) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getShiftList(startDate, endDate);
  }
  
  try {
    const shiftQuery = query(
      collection(db, 'shifts'),
      where('start', '>=', Timestamp.fromDate(new Date(startDate))),
      where('start', '<=', Timestamp.fromDate(new Date(endDate))),
      orderBy('start')
    );
    
    const querySnapshot = await getDocs(shiftQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error('シフト一覧の取得中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * シフト情報を保存する（新規/更新）
 * @param {Object} shiftData - シフトデータ
 * @param {string} [shiftId] - シフトID（更新の場合）
 * @returns {Promise<string>} シフトID
 */
export const saveShift = async (shiftData, shiftId = null) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.saveShift(shiftData, shiftId);
  }
  
  try {
    // 日付フィールドをタイムスタンプに変換
    const data = {
      ...shiftData,
      start: shiftData.start ? Timestamp.fromDate(new Date(shiftData.start)) : null,
      end: shiftData.end ? Timestamp.fromDate(new Date(shiftData.end)) : null
    };
    
    if (shiftId) {
      // 既存シフトの更新
      const docRef = doc(db, 'shifts', shiftId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: getServerTimestamp()
      });
      return shiftId;
    } else {
      // 新規シフトの追加
      const docRef = await addDoc(collection(db, 'shifts'), {
        ...data,
        createdAt: getServerTimestamp(),
        updatedAt: getServerTimestamp()
      });
      return docRef.id;
    }
  } catch (error) {
    console.error('シフトの保存中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * シフトを削除する
 * @param {string} shiftId - シフトID
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const deleteShift = async (shiftId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.deleteShift(shiftId);
  }
  
  try {
    const docRef = doc(db, 'shifts', shiftId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`シフト ${shiftId} の削除中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * スタッフのシフト一覧を取得する
 * @param {string} staffId - スタッフID
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @returns {Promise<Array>} シフト情報の配列
 */
export const getStaffShifts = async (staffId, startDate, endDate) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getStaffShifts(staffId, startDate, endDate);
  }
  
  try {
    const shiftQuery = query(
      collection(db, 'shifts'),
      where('staffId', '==', staffId),
      where('start', '>=', Timestamp.fromDate(new Date(startDate))),
      where('start', '<=', Timestamp.fromDate(new Date(endDate))),
      orderBy('start')
    );
    
    const querySnapshot = await getDocs(shiftQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error(`スタッフ ${staffId} のシフト取得中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * シフト詳細を取得する
 * @param {string} shiftId - シフトID
 * @returns {Promise<Object>} シフト情報
 */
export const getShiftDetails = async (shiftId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getShiftDetails(shiftId);
  }
  
  try {
    const docRef = doc(db, 'shifts', shiftId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...formatFirestoreData(docSnap.data())
      };
    } else {
      throw new Error(`シフトID ${shiftId} が見つかりません`);
    }
  } catch (error) {
    console.error(`シフト ${shiftId} の取得中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * タスクを更新する
 * @param {string} taskId - タスクID
 * @param {Object} taskData - 更新するデータ
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const updateTask = async (taskId, taskData) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.updateTask && mockFirestoreUtils.updateTask(taskId, taskData);
  }
  
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...taskData,
      updatedAt: getServerTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`タスク ${taskId} の更新中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * タスク一覧を取得する
 * @param {number} limit - 取得するタスクの最大数
 * @returns {Promise<Array>} タスク情報の配列
 */
export const getTasks = async (limitCount = 100) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getTasks && mockFirestoreUtils.getTasks(limitCount);
  }
  
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      orderBy('dueDate'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(tasksQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error('タスク一覧の取得中にエラーが発生しました:', error);
    throw error;
  }
};

// モックモードでserverTimestamp関数を置き換え
const getServerTimestamp = () => {
  if (isMockMode()) {
    return mockFirestoreUtils.serverTimestamp();
  }
  return serverTimestamp();
};

// モックモードでArrayユーティリティ関数を置き換え
const getArrayUnion = (...items) => {
  if (isMockMode()) {
    return mockFirestoreUtils.arrayUnion(...items);
  }
  return arrayUnion(...items);
};

const getArrayRemove = (...items) => {
  if (isMockMode()) {
    return mockFirestoreUtils.arrayRemove(...items);
  }
  return arrayRemove(...items);
};

// ============== スタッフ関連の関数 ==============

/**
 * スタッフ一覧を取得する
 * @returns {Promise<Array>} スタッフ情報の配列
 */
export const getStaffList = async () => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getStaffList();
  }
  
  try {
    const staffQuery = query(
      collection(db, 'staff'),
      where('isActive', '==', true),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(staffQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error('スタッフ一覧の取得中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * スタッフ詳細を取得する
 * @param {string} staffId - スタッフのID
 * @returns {Promise<Object>} スタッフ情報
 */
export const getStaffDetails = async (staffId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getStaffDetails(staffId);
  }
  
  try {
    const docRef = doc(db, 'staff', staffId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...formatFirestoreData(docSnap.data())
      };
    } else {
      throw new Error(`スタッフID ${staffId} が見つかりません`);
    }
  } catch (error) {
    console.error(`スタッフ ${staffId} の取得中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * スタッフ情報を保存する（新規/更新）
 * @param {Object} staffData - スタッフデータ
 * @param {string} [staffId] - スタッフID（更新の場合）
 * @returns {Promise<string>} スタッフID
 */
export const saveStaffMember = async (staffData, staffId = null) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.saveStaffMember(staffData, staffId);
  }
  
  try {
    // 日付フィールドをタイムスタンプに変換
    const data = {
      ...staffData,
      certifications: staffData.certifications?.map(cert => ({
        ...cert,
        issueDate: cert.issueDate ? Timestamp.fromDate(new Date(cert.issueDate)) : null,
        expiryDate: cert.expiryDate ? Timestamp.fromDate(new Date(cert.expiryDate)) : null
      })) || []
    };
    
    if (staffId) {
      // 既存スタッフの更新
      const docRef = doc(db, 'staff', staffId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: getServerTimestamp()
      });
      return staffId;
    } else {
      // 新規スタッフの追加
      const docRef = await addDoc(collection(db, 'staff'), {
        ...data,
        isActive: true,
        assignedTasks: [],
        createdAt: getServerTimestamp(),
        updatedAt: getServerTimestamp()
      });
      return docRef.id;
    }
  } catch (error) {
    console.error('スタッフの保存中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * スタッフを削除する（論理削除）
 * @param {string} staffId - スタッフのID
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const deleteStaffMember = async (staffId) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.deleteStaffMember(staffId);
  }
  
  try {
    const docRef = doc(db, 'staff', staffId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: getServerTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`スタッフ ${staffId} の削除中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * スタッフにタスクを割り当てる
 * @param {string} staffId - スタッフのID
 * @param {string} taskId - タスクのID
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const assignTaskToStaff = async (staffId, taskId) => {
  try {
    // タスクのスタッフ割り当てフィールドを更新
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      assignedTo: staffId,
      updatedAt: getServerTimestamp()
    });
    
    // スタッフの割り当てタスク配列に追加
    const staffRef = doc(db, 'staff', staffId);
    await updateDoc(staffRef, {
      assignedTasks: getArrayUnion(taskId),
      updatedAt: getServerTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('タスクの割り当て中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * スタッフからタスクの割り当てを解除する
 * @param {string} staffId - スタッフのID
 * @param {string} taskId - タスクのID
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const unassignTaskFromStaff = async (staffId, taskId) => {
  try {
    // タスクのスタッフ割り当てフィールドをクリア
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      assignedTo: null,
      updatedAt: getServerTimestamp()
    });
    
    // スタッフの割り当てタスク配列から削除
    const staffRef = doc(db, 'staff', staffId);
    await updateDoc(staffRef, {
      assignedTasks: getArrayRemove(taskId),
      updatedAt: getServerTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('タスクの割り当て解除中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * スタッフに割り当てられたタスク一覧を取得する
 * @param {string} staffId - スタッフのID
 * @returns {Promise<Array>} タスク情報の配列
 */
export const getStaffTasks = async (staffId) => {
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', staffId),
      where('completed', '==', false),
      orderBy('dueDate')
    );
    
    const querySnapshot = await getDocs(tasksQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...formatFirestoreData(doc.data())
    }));
  } catch (error) {
    console.error(`スタッフ ${staffId} のタスク取得中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * スキル/資格のマスターリストを取得する
 * @returns {Promise<Object>} スキルと資格のリスト
 */
export const getSkillsMasterList = async () => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getSkillsMasterList();
  }
  
  try {
    const docRef = doc(db, 'settings', 'skillsMaster');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // デフォルト値を返す
      return { 
        skills: [], 
        certifications: [] 
      };
    }
  } catch (error) {
    console.error('スキル/資格マスターリストの取得中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * スキル/資格のマスターリストを更新する
 * @param {Object} data - スキルと資格データ
 * @returns {Promise<boolean>} 成功した場合はtrue
 */
export const updateSkillsMasterList = async (data) => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.updateSkillsMasterList(data);
  }
  
  try {
    const docRef = doc(db, 'settings', 'skillsMaster');
    await setDoc(docRef, {
      ...data,
      updatedAt: getServerTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('スキル/資格マスターリストの更新中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * シフト種類のマスターリストを取得する
 * @returns {Promise<Object>} シフト種類とステータスのリスト
 */
export const getShiftsMasterList = async () => {
  // モックモードの場合はモック実装を使用
  if (isMockMode()) {
    return mockFirestoreUtils.getShiftsMasterList();
  }
  
  try {
    const docRef = doc(db, 'settings', 'shiftsMaster');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // デフォルト値を返す
      return { 
        types: [], 
        statuses: [] 
      };
    }
  } catch (error) {
    console.error('シフトマスターリストの取得中にエラーが発生しました:', error);
    throw error;
  }
};

// ============== 汎用関数 ==============

/**
 * タイムスタンプをDate型に変換（Firestoreのタイムスタンプ対応）
 * @param {Timestamp|Date} timestamp - FirestoreのタイムスタンプまたはDate
 * @returns {Date} 変換後のDate
 */
export const convertTimestampToDate = (timestamp) => {
  if (!timestamp) return null;
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else if (timestamp.seconds && timestamp.nanoseconds) {
    // FirestoreのタイムスタンプのJSONオブジェクト
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
  }
  
  return null;
};

/**
 * FirestoreのデータをフォーマットしてUIに適したオブジェクトに変換
 * @param {Object} data - Firestoreから取得したデータ
 * @returns {Object} フォーマット済みデータ
 */
export const formatFirestoreData = (data) => {
  if (!data) return null;
  
  const formatted = { ...data };
  
  // タイムスタンプフィールドをDate型に変換
  const timestampFields = [
    'timestamp', 'createdAt', 'updatedAt', 'plantDate', 
    'transplantDate', 'fertilizeDate', 'dueDate', 'completedAt',
    'resolvedAt'
  ];
  
  timestampFields.forEach(field => {
    if (formatted[field]) {
      formatted[field] = convertTimestampToDate(formatted[field]);
    }
  });
  
  // 画像URLを正規化する（作物データの場合）
  if (formatted.imageUrl) {
    formatted.imageUrl = normalizeImageUrl(formatted.imageUrl, formatted.name || '');
  }

  // 画像URLを正規化する（ハウスデータなど image フィールドの場合）
  if (formatted.image) {
    formatted.image = normalizeImageUrl(formatted.image, formatted.name || formatted.currentCrop || '');
  }

  return formatted;
};