# Firebase モック実装解説

## 背景

ローカル開発環境において以下の問題が発生していました：

1. **Firebase接続の問題**:
   * ローカル環境では保存機能が正常に動作していない
   * Firebaseに接続できないケースがある

2. **開発の効率化**:
   * 開発中は実際のFirebaseへの接続なしで開発を行いたい
   * テストデータで開発を円滑に進めたい

## 実装概要

ローカル環境での開発を容易にするため、「Firebase モック」と呼ばれる仕組みを実装しました。主な特徴は以下の通りです：

1. **モードの選択**:
   * 環境変数 `REACT_APP_USE_MOCK` で、Firebase への実接続か、モックモードかを切り替え可能
   * デフォルトはモックモード（`true`）

2. **モックデータ**:
   * スタッフ情報やスキルマスターなどのテストデータを事前に用意
   * アプリ初期化時にメモリに読み込み

3. **Firebase API モック**:
   * Firestore の API（`getDoc`, `updateDoc` など）をすべてモック実装
   * 実際の Firebase API と同じインターフェースで使用可能

4. **UI への影響なし**:
   * UI コンポーネントは実装を変更する必要なし
   * `firestoreUtils.js` 内で自動的にモード判定して処理を切り替え

## ファイル構成

1. **`/src/mock/mockFirebase.js`**:
   * モックデータ定義
   * モック Firebase クラスの実装
   * モック用ユーティリティ関数

2. **`/src/firebase.js`**:
   * Firebase 初期化
   * モードの判定とフラグ設定

3. **`/src/firestoreUtils.js`**:
   * 各 API 関数内でモード判定
   * モックモード時はモック関数を呼び出し

4. **`/src/index.js`**:
   * アプリ起動時にモック Firebase を初期化

5. **`.env.development.local`**:
   * 環境変数設定
   * モード切替用フラグ

## 使用方法

### 開発モードの切替

`.env.development.local` ファイルで以下の変数を設定することで、モードを切り替えることができます：

```
# モック Firebase を使用 (オフラインモード)
REACT_APP_USE_MOCK=true

# Firebase エミュレータを使用 (エミュレータを起動する必要あり)
# REACT_APP_USE_MOCK=false
# REACT_APP_USE_FIRESTORE_EMULATOR=true

# 本番 Firebase に直接接続
# REACT_APP_USE_MOCK=false
# REACT_APP_USE_FIRESTORE_EMULATOR=false
```

### モックデータのカスタマイズ

初期データを変更したい場合は、`/src/mock/mockFirebase.js` 内の `mockDatabase` オブジェクトを編集してください。

```javascript
const mockDatabase = {
  staff: [
    // スタッフデータ...
  ],
  settings: {
    // 設定データ...
  }
  // 他のコレクション...
};
```

### 新しいコレクションのモック実装

新しいコレクションをモック対応するには、以下のステップで実装してください：

1. `mockDatabase` に新しいコレクションのモックデータを追加
2. `MockFirestore` クラスに新しいコレクション用の操作メソッドを追加 
3. `mockFirestoreUtils` オブジェクトに対応するメソッドを追加
4. `firestoreUtils.js` 内で対応する関数をモード判定対応に修正


## 注意点

* モックモードでは、実際のデータベースに変更が反映されません
* ページリロードするとモックデータが初期状態に戻ります（永続化されない）
* 複雑なクエリや特殊な Firestore 機能は完全にはモック化されていない場合があります

## 今後の改善点

* モックデータの永続化（LocalStorage による保存）
* より詳細なログ表示
* ユーザー認証のモック対応
* UI からのモード切替機能