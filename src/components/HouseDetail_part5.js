  
  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">ハウス情報を読み込み中...</p>
      </div>
    );
  }
  
  // エラー表示
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
        <h2 className="text-xl font-bold text-red-600 mb-2">エラーが発生しました</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/houses')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          ハウス一覧に戻る
        </button>
      </div>
    );
  }
  
  // ハウスが見つからない場合
  if (!house) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="h-12 w-12 text-yellow-600 mb-4" />
        <h2 className="text-xl font-bold text-yellow-600 mb-2">ハウスが見つかりません</h2>
        <p className="text-gray-600 mb-4">指定されたIDのハウスは存在しないか、アクセス権がありません。</p>
        <button
          onClick={() => navigate('/houses')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          ハウス一覧に戻る
        </button>
      </div>
    );
  }