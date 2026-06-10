import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// 開発環境でモックFirebaseを初期化
if (window.useMockFirebase) {
  import('./mock/mockFirebase')
    .then(({ initializeMockFirebase }) => {
      console.log('モックFirebaseを初期化しています...');
      initializeMockFirebase();
      console.log('モックFirebaseの初期化が完了しました');
    })
    .catch(error => {
      console.error('モックFirebaseの初期化に失敗しました:', error);
    });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// パフォーマンス測定が必要な場合はreportWebVitals()を呼び出す
reportWebVitals();

// Service Workerを登録してPWA機能を有効化する
serviceWorkerRegistration.register();