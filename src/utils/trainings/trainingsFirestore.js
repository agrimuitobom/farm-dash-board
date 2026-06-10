import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';

// トレーニング記録コレクションの参照を取得
const trainingsCollectionRef = collection(db, 'trainings');

// トレーニング記録一覧を取得
export const getTrainings = async (userId) => {
  try {
    const q = query(
      trainingsCollectionRef,
      where('userId', '==', userId),
      orderBy('trainingDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('トレーニング記録の取得に失敗しました', error);
    toast.error('トレーニング記録の取得に失敗しました');
    return [];
  }
};

// トレーニング記録詳細を取得
export const getTrainingById = async (id) => {
  try {
    const docRef = doc(db, 'trainings', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      toast.error('指定されたトレーニング記録が見つかりません');
      return null;
    }
  } catch (error) {
    console.error('トレーニング記録の取得に失敗しました', error);
    toast.error('トレーニング記録の取得に失敗しました');
    return null;
  }
};

// トレーニング記録を追加
export const addTraining = async (trainingData) => {
  try {
    const newTrainingData = {
      ...trainingData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(trainingsCollectionRef, newTrainingData);
    toast.success('トレーニング記録を登録しました');
    return docRef.id;
  } catch (error) {
    console.error('トレーニング記録の登録に失敗しました', error);
    toast.error('トレーニング記録の登録に失敗しました');
    return null;
  }
};

// トレーニング記録を更新
export const updateTraining = async (id, trainingData) => {
  try {
    const docRef = doc(db, 'trainings', id);
    const updatedData = {
      ...trainingData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updatedData);
    toast.success('トレーニング記録を更新しました');
    return true;
  } catch (error) {
    console.error('トレーニング記録の更新に失敗しました', error);
    toast.error('トレーニング記録の更新に失敗しました');
    return false;
  }
};

// トレーニング記録を削除
export const deleteTraining = async (id) => {
  try {
    const docRef = doc(db, 'trainings', id);
    await deleteDoc(docRef);
    toast.success('トレーニング記録を削除しました');
    return true;
  } catch (error) {
    console.error('トレーニング記録の削除に失敗しました', error);
    toast.error('トレーニング記録の削除に失敗しました');
    return false;
  }
};