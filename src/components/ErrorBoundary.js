import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * 画面の一部で例外が起きても、アプリ全体が真っ白にならないようにする
 *
 * - resetKey が変わると（ページを移動すると）エラー表示を解除して描き直す
 * - autoReloadSeconds を渡すと、その秒数後に自動で再読み込みする
 *   （常時表示用ディスプレイなど、誰も操作しない画面用）
 */
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('画面の表示中にエラーが発生しました:', error, info?.componentStack);
    const { autoReloadSeconds } = this.props;
    if (autoReloadSeconds > 0) {
      this.reloadTimer = setTimeout(() => window.location.reload(), autoReloadSeconds * 1000);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      clearTimeout(this.reloadTimer);
      this.setState({ error: null });
    }
  }

  componentWillUnmount() {
    clearTimeout(this.reloadTimer);
  }

  handleRetry = () => {
    clearTimeout(this.reloadTimer);
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { autoReloadSeconds, fullScreen } = this.props;
    return (
      <div
        role="alert"
        className={`flex items-center justify-center p-4 ${fullScreen ? 'min-h-screen bg-gray-100' : 'py-12'}`}
      >
        <div className="bg-white rounded-lg shadow p-6 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">この画面を表示できませんでした</h2>
          <p className="text-sm text-gray-600 mb-4">
            {autoReloadSeconds > 0
              ? `${autoReloadSeconds}秒後に自動で読み込み直します。`
              : 'もう一度試すか、ページを読み込み直してください。ほかのページはそのまま使えます。'}
          </p>
          <p className="text-xs text-gray-400 mb-4 break-words">{String(error?.message || error)}</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              もう一度試す
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              読み込み直す
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
