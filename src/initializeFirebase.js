import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Firebaseの必要なコレクションを初期化する
 */
export const initializeFirebase = async () => {
  console.log('Firebaseの初期化を開始します...');
  
  try {
    // 'staff' コレクションが存在するか確認
    const staffRef = collection(db, 'staff');
    const staffSnap = await getDocs(staffRef);
    
    // 'settings' コレクションが存在するか確認
    const settingsRef = doc(db, 'settings', 'skillsMaster');
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      // スキルマスター設定を作成
      await setDoc(settingsRef, {
        skills: ['農業技術', 'トラクター運転', 'IT知識', '英語', '簿記'],
        certifications: ['普通自動車免許', '大型特殊免許', '危険物取扱者', '簿記検定'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('スキルマスター設定を作成しました');
    }
    
    // 初期スタッフを作成（テスト用）
    if (staffSnap.empty) {
      const testStaffRef = doc(collection(db, 'staff'));
      await setDoc(testStaffRef, {
        name: 'テスト 太郎',
        role: '教諭',
        email: 'test@example.com',
        phone: '090-1234-5678',
        skills: ['農業技術', 'IT知識'],
        certifications: [
          { 
            name: '普通自動車免許', 
            issueDate: new Date('2020-01-01'), 
            expiryDate: new Date('2030-01-01') 
          }
        ],
        isActive: true,
        assignedTasks: [],
        notes: 'テスト用スタッフです',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('テスト用スタッフを作成しました');
    }
    
    console.log('Firebaseの初期化が完了しました');
    return true;
  } catch (error) {
    console.error('Firebaseの初期化中にエラーが発生しました:', error);
    return false;
  }
};

export default initializeFirebase;
