  // メインのレンダリング
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Link 
            to="/houses" 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            戻る
          </Link>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-3 h-3 rounded-full ${house.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className="text-sm text-gray-500">
              {house.isActive ? 'アクティブ' : '非アクティブ'}
            </span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold">{house.name}</h1>
        <p className="text-gray-600">{house.location || '場所未設定'}</p>
      </div>
      
      {/* メインコンテンツ */}
      <div className="grid grid-cols-1