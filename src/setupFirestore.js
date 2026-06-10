// setupFirestore.js
// Firestoreデータベースのセットアップと初期データ投入を行うスクリプト

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  setDoc,
  doc,
  getDocs,
  deleteDoc,
  serverTimestamp, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';

// 既存のseedFirestore.jsからインポート（既に実装済み）
import { seedFirestore } from './seedFirestore';

/**
 * Firestoreデータベースのセットアップを行う関数
 * データベースの初期化、必要なインデックスの設定、サンプルデータの投入を行います
 */
export const setupFirestore = async () => {
  try {
    console.log('Firestoreデータベースのセットアップを開始します...');
    
    // ステップ1: 既存データの削除（クリーンな状態からスタート）
    await clearExistingData();
    
    // ステップ2: 必要なコレクションの作成
    await createCollections();
    
    // ステップ3: サンプルデータの投入（seedFirestore.jsに実装済み）
    await seedFirestore();
    
    console.log('Firestoreデータベースのセットアップが完了しました。');
    return true;
  } catch (error) {
    console.error('Firestoreデータベースのセットアップ中にエラーが発生しました:', error);
    return false;
  }
};

/**
 * 既存のデータを削除する関数
 * 開発環境での初期化やデータのリセットに使用します
 */
const clearExistingData = async () => {
  console.log('既存のデータをクリアしています...');
  
  const collections = ['houses', 'environmental_data', 'tasks', 'alerts'];
  
  try {
    // 各コレクションを反復処理
    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      // バッチ処理で効率的に削除
      const batchSize = snapshot.size;
      if (batchSize === 0) {
        console.log(`コレクション ${collectionName} は空です。`);
        continue;
      }
      
      console.log(`コレクション ${collectionName} から ${batchSize} 件のドキュメントを削除します...`);
      
      // Firestoreのバッチサイズ制限に対応（500件まで）
      if (batchSize <= 500) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } else {
        // 500件以上の場合は複数回に分けて削除
        let i = 0;
        for (const document of snapshot.docs) {
          await deleteDoc(document.ref);
          i++;
          if (i % 100 === 0) {
            console.log(`${i}件処理しました...`);
          }
        }
      }
      
      console.log(`コレクション ${collectionName} のクリアが完了しました。`);
    }
    console.log('全てのコレクションがクリアされました。');
  } catch (error) {
    console.error('データクリア中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * 必要なコレクションの構造を作成する関数
 * 各コレクションの最初のドキュメントを作成し、コレクション構造を確立します
 */
const createCollections = async () => {
  console.log('コレクションの構造を作成しています...');
  
  try {
    // housesコレクションの作成（実際のデータはseedFirestore.jsで投入するため、単純な構造確認用）
    const housesDocRef = doc(db, 'houses', '_structure_');
    await setDoc(housesDocRef, {
      _description: 'ハウス情報コレクション',
      _fields: {
        id: 'String - ハウスID',
        currentCrop: 'String - 現在栽培している作物',
        plantDate: 'Timestamp - 種まき日',
        transplantDate: 'Timestamp - 定植日',
        fertilizeDate: 'Timestamp - 最終施肥日',
        fertilizeInfo: 'String - 施肥情報',
        harvestAmount: 'Number - 収穫量',
        status: 'String - ハウスの状態',
        image: 'String - 画像URL'
      },
      _created: serverTimestamp()
    });
    
    // environmental_dataコレクションの作成
    const envDataDocRef = doc(db, 'environmental_data', '_structure_');
    await setDoc(envDataDocRef, {
      _description: '環境データコレクション',
      _fields: {
        houseId: 'String - ハウスID（outdoorを含む）',
        timestamp: 'Timestamp - 測定時刻',
        temperature: 'Number - 温度（℃）',
        humidity: 'Number - 湿度（%）',
        soilMoisture: 'Number - 土壌水分（%）',
        light: 'Number - 光量（lux）',
        co2: 'Number - CO2濃度（ppm）'
      },
      _indexes: [
        'houseId + timestamp (DESC) - 特定ハウスの時系列データ取得用'
      ],
      _created: serverTimestamp()
    });
    
    // tasksコレクションの作成
    const tasksDocRef = doc(db, 'tasks', '_structure_');
    await setDoc(tasksDocRef, {
      _description: '作業タスクコレクション',
      _fields: {
        title: 'String - タスクのタイトル',
        houseId: 'String - 関連するハウスID',
        description: 'String - タスクの詳細',
        dueDate: 'Timestamp - 期限日',
        priority: 'String - 優先度（高/中/低）',
        status: 'String - ステータス（未完了/完了）',
        assignedTo: 'String - 担当者名',
        completed: 'Boolean - 完了フラグ',
        completedAt: 'Timestamp - 完了日時'
      },
      _indexes: [
        'completed + dueDate (ASC) - 未完了のタスクを期限順に取得',
        'houseId + dueDate (ASC) - 特定ハウスのタスクを期限順に取得'
      ],
      _created: serverTimestamp()
    });
    
    // alertsコレクションの作成
    const alertsDocRef = doc(db, 'alerts', '_structure_');
    await setDoc(alertsDocRef, {
      _description: 'アラート情報コレクション',
      _fields: {
        houseId: 'String - 関連するハウスID',
        title: 'String - アラートのタイトル',
        message: 'String - アラートの詳細メッセージ',
        severity: 'String - 重要度（警告/注意/情報）',
        timestamp: 'Timestamp - 発生時刻',
        resolved: 'Boolean - 解決済みフラグ',
        resolvedAt: 'Timestamp - 解決日時',
        type: 'String - アラートの種類（温度/湿度など）',
        value: 'Number - 測定値',
        threshold: 'Number - しきい値'
      },
      _indexes: [
        'resolved + timestamp (DESC) - 未解決のアラートを最新順に取得',
        'houseId + timestamp (DESC) - 特定ハウスのアラートを最新順に取得'
      ],
      _created: serverTimestamp()
    });
    
    console.log('コレクション構造の作成が完了しました。');
  } catch (error) {
    console.error('コレクション構造作成中にエラーが発生しました:', error);
    throw error;
  }
};

// 実行用関数（ボタンクリックなどから呼び出す）
export const handleSetupFirestore = async () => {
  try {
    const success = await setupFirestore();
    if (success) {
      alert('Firestoreデータベースのセットアップが完了しました。');
    } else {
      alert('Firestoreデータベースのセットアップに失敗しました。コンソールを確認してください。');
    }
  } catch (error) {
    console.error('エラー:', error);
    alert(`エラーが発生しました: ${error.message}`);
  }
};