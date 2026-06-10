  
  // 作物エリアを追加する
  const handleAddCropArea = async (cropAreaData) => {
    try {
      await addCropAreaToHouse(id, cropAreaData);
      // UIは購読しているsubscribeToHouseで更新されるため、ここで特に更新処理は不要
    } catch (err) {
      console.error('作物エリア追加エラー:', err);
      setError('作物エリアの追加に失敗しました: ' + err.message);
    }
  };
  
  // 作物エリアを編集する
  const handleEditCropArea = async (cropAreaData) => {
    try {
      if (!currentCropArea || !currentCropArea.id) {
        throw new Error('編集対象の作物エリアが見つかりません');
      }
      
      await updateCropArea(id, currentCropArea.id, cropAreaData);
      // UIは購読しているsubscribeToHouseで更新されるため、ここで特に更新処理は不要
    } catch (err) {
      console.error('作物エリア編集エラー:', err);
      setError('作物エリアの編集に失敗しました: ' + err.message);
    }
  };
  
  // 作物エリアを削除する
  const handleRemoveCropArea = async (areaId) => {
    if (window.confirm('この作物エリアを削除してもよろしいですか？この操作は元に戻せません。')) {
      try {
        await removeCropArea(id, areaId);
        // UIは購読しているsubscribeToHouseで更新されるため、ここで特に更新処理は不要
      } catch (err) {
        console.error('作物エリア削除エラー:', err);
        setError('作物エリアの削除に失敗しました: ' + err.message);
      }
    }
  };
  
  // 編集モーダルを開く
  const openEditModal = (cropArea) => {
    setCurrentCropArea(cropArea);
    setShowEditCropModal(true);
  };
  
  return (
    <div className="fade-in">
      {/* ヘッダー部分 */}
      <div className="mb-6">
        <Link to="/houses" className="inline-flex items-center text-green-600 hover:text-green-800 mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>ハウス一覧に戻る</span>
        </Link>
        
        {loading ? (
          <h2 className="text-2xl font-bold text-gray-800">読み込み中...</h2>
        ) : error ? (
          <h2 className="text-2xl font-bold text-gray-800">エラー</h2>
        ) : (
          <h2 className="text-2xl font-bold text-gray-800">{house?.id || 'ハウス詳細'}</h2>
        )}
      </div>
      
      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">エラー</p>
            <p className="text-red-700">{error}</p>
            <Link to="/houses" className="text-red-800 hover:underline font-medium mt-1 inline-block">
              ハウス一覧ページへ戻る
            </Link>
          </div>
        </div>
      )}
      
      {/* ローディング表示 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
          <p className="text-gray-600">ハウスデータを読み込み中...</p>
        </div>
      )}
