      // 過去の作物データの例（実際には、データベースから取得します）
      {
        cropName: '過去の' + cropArea.cropName,
        plantDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        harvestAmount: Math.floor(Math.random() * 100) / 10,
        status: '収穫完了',
        createdAt: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        updatedAt: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        notes: '前回の作付けのメモ。収穫量は目標の90%でした。'
      }
    ]);
    setIsHistoryModalOpen(true);
  };

  // 環境データ情報のレンダリング
  const renderEnvironmentalData = () => {
    if (!envData) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
          環境データが読み込まれていません
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Thermometer className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-gray-700 text-sm">温度</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{envData.temperature?.toFixed(1) || '--'}</span>
            <span className="text-gray-500 ml-1">°C</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Droplets className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-gray-700 text-sm">湿度</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{envData.humidity?.toFixed(1) || '--'}</span>
            <span className="text-gray-500 ml-1">%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Sun className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-gray-700 text-sm">光量</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{envData.lightLevel?.toFixed(0) || '--'}</span>
            <span className="text-gray-500 ml-1">lux</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Wind className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-gray-700 text-sm">CO₂</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{envData.co2Level?.toFixed(0) || '--'}</span>
            <span className="text-gray-500 ml-1">ppm</span>
          </div>
        </div>
      </div>
    );
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
        <p className="mt-4 text-gray-600">ハウス情報を読み込んでいます...</p>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="mt-4 text-red-600">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </button>
      </div>
    );
  }

  // ハウスデータがない場合
  if (!house) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="h-10 w-10 text-yellow-500" />
        <p className="mt-4 text-gray-600">ハウス情報が見つかりません</p>
        <button
          onClick={() => navigate('/houses')}
          className="mt-4 flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          ハウス一覧に戻る
        </button>
      </div>
    );
  }

  // メインレンダリング
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">{house.name}</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsAddCropModalOpen(true)}
              className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              <span>作物エリア追加</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 mt-1">{house.location}</p>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ハウス概要と作物エリア */}
        <div className="lg:col-span-2 space-y-6">
          {/* ハウス概要 */}
          <div className="bg-white p-5 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">ハウス概要</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">規模</p>
                <p>{house.size || '--'} m²</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">設備</p>
                <p>{house.facilities?.join(', ') || '--'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">ステータス</p>
                <p>{house.status || '--'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">最終点検日</p>
                <p>{house.lastInspection ? new Date(house.lastInspection).toLocaleDateString() : '--'}</p>
              </div>
            </div>
          </div>

          {/* 作物エリア */}
          <div className="bg-white p-5 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">作物エリア</h2>
              <button
                onClick={() => setIsAddCropModalOpen(true)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <PlusCircle className="h-5 w-5 text-green-600" />
              </button>
            </div>
            
            {cropAreas.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">作物エリアが登録されていません</p>
                <button
                  onClick={() => setIsAddCropModalOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  作物エリアを追加
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cropAreas.map(area => (
                  <CropAreaCard
                    key={area.id}
                    cropArea={area}
                    onEdit={openEditCropModal}
                    onRemove={handleRemoveCropArea}
                    showHistory={openHistoryModal}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 環境データとアラート・タスク */}
        <div className="space-y-6">
          {/* 環境データ */}
          <div className="bg-white p-5 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">環境データ</h2>
              <button
                className="p-1 hover:bg-gray-100 rounded"
                title="データ更新"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            {renderEnvironmentalData()}
            
            <div className="mt-6">
              <h3 className="text-md font-medium mb-2">温度推移(48時間)</h3>
              <div className="h-64 w-full">
                {envHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={envHistory.slice(0, 24)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => {
                          if (!value) return '';
                          const date = new Date(value);
                          return `${date.getHours()}:00`;
                        }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value}°C`, '温度']}
                        labelFormatter={(value) => {
                          if (!value) return '';
                          const date = new Date(value);
                          return `${date.toLocaleDateString()} ${date.getHours()}:00`;
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        name="温度" 
                        stroke="#FF4500" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                    <p className="text-gray-500">環境データ履歴がありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* アラート */}
          <div className="bg-white p-5 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">最近のアラート</h2>
            {alerts.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded">
                <p className="text-gray-500">アラートはありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
                    <AlertTriangle className={`h-5 w-5 mr-3 ${alert.severity === 'high' ? 'text-red-500' : alert.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'}`} />
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span>{alert.timestamp ? new Date(alert.timestamp).toLocaleString() : '--'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {alerts.length > 3 && (
                  <div className="text-center pt-2">
                    <button className="text-blue-600 hover:underline text-sm">
                      すべてのアラートを表示
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* タスク */}
          <div className="bg-white p-5 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">タスク</h2>
              <button className="p-1 hover:bg-gray-100 rounded">
                <ListPlus className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            {tasks.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded">
                <p className="text-gray-500">タスクはありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                    <Clipboard className="h-5 w-5 mr-3 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '--'}</span>
                        <span className="ml-2">{task.assignedTo || '未割り当て'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.length > 3 && (
                  <div className="text-center pt-2">
                    <button className="text-blue-600 hover:underline text-sm">
                      すべてのタスクを表示
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* モーダル */}
      <CropAreaFormModal 
        isOpen={isAddCropModalOpen} 
        onClose={() => setIsAddCropModalOpen(false)}
        onSave={handleAddCropArea}
        crops={crops}
      />
      
      <CropAreaFormModal 
        isOpen={isEditCropModalOpen} 
        onClose={() => {
          setIsEditCropModalOpen(false);
          setSelectedCropArea(null);
        }}
        onSave={handleEditCropArea}
        initialData={selectedCropArea}
        crops={crops}
        isEditing={true}
      />
      
      <CropHistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        areaName={selectedAreaName}
        history={selectedAreaHistory}
      />
    </div>
  );
};

export default HouseDetail;