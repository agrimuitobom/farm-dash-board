// 常時表示用ディスプレイ（キオスク）向けの自動再読み込み
//
// URL に ?kiosk=1 を付けて開くと有効になる（例: https://farm-dashboard-95875.web.app/?kiosk=1）。
// 画面内で別ページへ移動しても有効なままにするため、sessionStorage に記録する。
//   - 一定間隔（既定60分、?kiosk=30 のように分を指定可）でページを再読み込みする
//   - ネットワークが切れて復帰したら再読み込みする
// どちらもオフライン中は行わない（エラー画面のまま止まらないようにするため）。

const STORAGE_KEY = 'kioskReloadMinutes';
const DEFAULT_MINUTES = 60;

const readSetting = () => {
  const param = new URLSearchParams(window.location.search).get('kiosk');
  try {
    if (param !== null) {
      const minutes = Number(param) > 1 ? Number(param) : DEFAULT_MINUTES;
      sessionStorage.setItem(STORAGE_KEY, String(minutes));
      return minutes;
    }
    const saved = Number(sessionStorage.getItem(STORAGE_KEY));
    return saved > 0 ? saved : null;
  } catch (e) {
    return param !== null ? DEFAULT_MINUTES : null;
  }
};

export const startKioskMode = () => {
  const minutes = readSetting();
  if (!minutes) return;

  const reloadIfOnline = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  setInterval(reloadIfOnline, minutes * 60 * 1000);

  // 復帰直後は回線が安定しないことがあるので少し待つ
  window.addEventListener('online', () => {
    setTimeout(reloadIfOnline, 10 * 1000);
  });
};

// キオスク表示中か（?kiosk= 付きで開かれたか）
export const isKioskMode = () => readSetting() !== null;
