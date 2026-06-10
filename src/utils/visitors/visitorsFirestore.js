import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';

// 訪問者コレクションの参照を取得
const visitorsCollectionRef = collection(db, 'visitors');

// 訪問者一覧を取得
export const getVisitors = async (userId) => {
  try {
    const q = query(
      visitorsCollectionRef,
      where('userId', '==', userId),
      orderBy('visitDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('訪問者情報の取得に失敗しました', error);
    toast.error('訪問者情報の取得に失敗しました');
    return [];
  }
};

// 訪問者詳細を取得
export const getVisitorById = async (id) => {
  try {
    const docRef = doc(db, 'visitors', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      toast.error('指定された訪問者情報が見つかりません');
      return null;
    }
  } catch (error) {
    console.error('訪問者情報の取得に失敗しました', error);
    toast.error('訪問者情報の取得に失敗しました');
    return null;
  }
};

// 訪問者情報を追加
export const addVisitor = async (visitorData) => {
  try {
    const newVisitorData = {
      ...visitorData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(visitorsCollectionRef, newVisitorData);
    toast.success('訪問者情報を登録しました');
    return docRef.id;
  } catch (error) {
    console.error('訪問者情報の登録に失敗しました', error);
    toast.error('訪問者情報の登録に失敗しました');
    return null;
  }
};

// 訪問者情報を更新
export const updateVisitor = async (id, visitorData) => {
  try {
    const docRef = doc(db, 'visitors', id);
    const updatedData = {
      ...visitorData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updatedData);
    toast.success('訪問者情報を更新しました');
    return true;
  } catch (error) {
    console.error('訪問者情報の更新に失敗しました', error);
    toast.error('訪問者情報の更新に失敗しました');
    return false;
  }
};

// 訪問者情報を削除
export const deleteVisitor = async (id) => {
  try {
    const docRef = doc(db, 'visitors', id);
    await deleteDoc(docRef);
    toast.success('訪問者情報を削除しました');
    return true;
  } catch (error) {
    console.error('訪問者情報の削除に失敗しました', error);
    toast.error('訪問者情報の削除に失敗しました');
    return false;
  }
};