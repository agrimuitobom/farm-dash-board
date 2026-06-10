/* eslint-disable */
/* global self, clients */
// This is the service worker for the Farm Dashboard application
// It provides offline support and optimizes asset loading

// Workbox が使用する precache マニフェスト
// このコメントは編集しないでください
self.__WB_MANIFEST;

const CACHE_NAME = 'farm-dashboard-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/manifest.json'
];

// インストール時に静的アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Static assets cached for offline use');
        return cache.addAll(STATIC_ASSETS);
      })
  );
  // 新しいサービスワーカーをすぐにアクティブにする
  self.skipWaiting();
});

// アクティベーション時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // すぐに制御を取得
  return self.clients.claim();
});

// ネットワークファーストの戦略でリクエストを処理
// APIリクエストはキャッシュせず、静的アセットのみキャッシュする
self.addEventListener('fetch', (event) => {
  // Firebase API呼び出しはキャッシュしない
  if (event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功したレスポンスのクローンを作成してキャッシュに保存
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            // HTMLやJSなどの静的アセットのみをキャッシュ
            if (
              event.request.url.match(/\.(html|js|css|png|jpg|jpeg|svg|ico)$/) ||
              event.request.url.endsWith('/') ||
              event.request.mode === 'navigate'
            ) {
              cache.put(event.request, responseClone);
            }
          });
        return response;
      })
      .catch(() => {
        // ネットワークが利用できない場合はキャッシュから取得を試みる
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // バックグラウンド同期のためにリクエストを保存する処理などをここに追加
          });
      })
  );
});

// プッシュ通知のサポート
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 通知クリック時の動作
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
    .then((clientList) => {
      // すでに開いているウィンドウがあればそれをフォーカス
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // なければ新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});