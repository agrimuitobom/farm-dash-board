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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ハウス概要 */}
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">ハウス概要</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">ハウスタイプ</h3>
              <p>{house.type || 'タイプ未設定'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700">面積</h3>
              <p>{house.area ? `${house.area} m²` : '面積未設定'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700">設置年</h3>
              <p>{house.installationYear || '設置年未設定'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700">備考</h3>
              <p>{house.notes || 'なし'}</p>
            </div>
          </div>
        </div>
        
        {/* 作物エリア */}
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">作物エリア</h2>
            <button
              onClick={() => {
                setEditingCropArea(null); // 編集モードをリセット
                setIsAddCropAreaModalOpen(true);
              }}
              className="flex items-center text-sm bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700"
            >
              <PlusCircle className="h-4 w-4 mr-1.5" />
              エリア追加
            </button>
          </div>
          
          {!house.cropAreas || house.cropAreas.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">作物エリアがまだ登録されていません</p>
              <p className="text-gray-500 text-sm mt-1">
                「エリア追加」ボタンから作物エリアを追加できます
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {house.cropAreas.map(cropArea => (
                <CropAreaCard
                  key={cropArea.id}
                  cropArea={cropArea}
                  onEdit={openEditCropAreaModal}
                  onRemove={handleRemoveCropArea}
                />
              ))}
            </div>
          )}
        </div>
      </div>