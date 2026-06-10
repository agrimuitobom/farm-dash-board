// src/components/ProtectedRoute.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  console.log('ProtectedRoute: currentUser =', currentUser);
  console.log('ProtectedRoute: loading =', loading);
  
  // 一時的な開発用フラグ - Firebase認証設定完了後にfalseに変更
  const SKIP_AUTH_FOR_DEVELOPMENT = false;
  
  if (SKIP_AUTH_FOR_DEVELOPMENT) {
    console.log('開発モード: 認証をスキップしています');
    return children;
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }
  
  return currentUser ? children : <Login />;
};

export default ProtectedRoute;