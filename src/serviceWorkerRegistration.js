// このファイルは、ユーザーがPWAをインストールできるようにサービスワーカーを登録する
// コードは create-react-app の PWA テンプレートから参考にしています

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] は IPv6 の localhost アドレス
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 は IPv4 の localhost
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    // URL コンストラクタは SW がサポートするブラウザで利用可能
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // PUBLIC_URL が別オリジンの場合は SW が機能しないため返す
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // localhost では、service worker がまだ存在するか確認する
        checkValidServiceWorker(swUrl, config);

        // デバッグに役立つ追加ログを記録
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'このウェブアプリはキャッシュされており、' +
              'オフラインでも利用可能です。'
          );
        });
      } else {
        // localhostではない場合、service worker を登録
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // このサイトの新しいコンテンツが利用可能な場合
              console.log(
                'コンテンツが更新されました。更新を反映するには、' +
                  'このページを再読み込みしてください。'
              );

              // コールバックを実行
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // 初めてキャッシュされた場合
              console.log('コンテンツがキャッシュされ、オフラインで利用可能です。');

              // コールバックを実行
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Service worker 登録中にエラーが発生しました:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Service worker がリロードされるか確認
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Service worker が見つかったが 404 や JS 以外の場合
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Service worker が見つからない場合、ページをリロード
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker が見つかった場合、通常通り処理
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('インターネット接続がありません。オフラインモードで実行中です。');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
