// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  connectFirestoreEmulator,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Firebaseコンソールから取得した構成情報
const firebaseConfig = {
  apiKey: "AIzaSyAHduV83j0eSdJQIvUGRqmmyN6sH0b4L0k",
  authDomain: "farm-dashboard-95875.firebaseapp.com",
  projectId: "farm-dashboard-95875",
  storageBucket: "farm-dashboard-95875.firebasestorage.app",
  messagingSenderId: "507957938975",
  appId: "1:507957938975:web:cbc8d00dcfb870dc26be2a",
  measurementId: "G-NJ273N51QZ"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// Firestoreの初期化 - パフォーマンス最適化設定で初期化
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

const auth = getAuth(app);

// Firebase初期化処理
const initializeFirebaseApp = async () => {
  try {
    // 開発用エミュレータまたはモック接続
    // これはローカル開発環境で使用されます
    if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
      // 環境変数によりモード切替
      const useEmulator = process.env.REACT_APP_USE_FIRESTORE_EMULATOR === 'true';
      const useMock = process.env.REACT_APP_USE_MOCK === 'true';
      
      if (useEmulator) {
        console.log('開発環境で実行中です - Firestoreエミュレータを使用します');
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
      } else if (useMock) {
        console.log('開発環境で実行中です - モックFirebaseを使用します（Firestoreのみ）');
        window.useMockFirebase = true;
        // モックFirebaseの初期化はindex.jsで行います
        // 認証は実際のFirebaseを使用
      } else {
        console.log('開発環境で実行中です - 本番Firebaseに接続します');
      }
    }

  } catch (e) {
    console.error('Firebase設定中にエラーが発生しました:', e);
    
    // エラーの詳細を記録
    if (e.code) {
      console.error(`エラーコード: ${e.code}`);
    }
    
    if (e.message && e.message.includes('WebChannel')) {
      console.error('WebChannelエラーが発生しました - 接続を再試行します');
      // WebChannelエラーの詳細なハンドリングをここに追加できます
    }
  }
};

// 初期化処理を実行
initializeFirebaseApp();

export { app, db, auth };