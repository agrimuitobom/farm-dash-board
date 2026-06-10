      {/* 環境データ */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">環境データ</h2>
          <div className="flex items-center text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            {envData && envData.timestamp 
              ? `最終更新: ${new Date(envData.timestamp).toLocaleString()}` 
              : '更新情報なし'}
          </div>
        </div>
        
        {envLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
          </div>
        ) : envData ? (
          <div>
            {/* 現在の環境データ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                <Thermometer className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">温度</p>
                  <p className="text-xl font-bold">{envData.temperature?.toFixed(1) || '-'} °C</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                <Droplets className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">湿度</p>
                  <p className="text-xl font-bold">{envData.humidity?.toFixed(1) || '-'} %</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                <Sun className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">光量</p>
                  <p className="text-xl font-bold">{envData.lightLevel?.toFixed(1) || '-'} lux</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                <Wind className="h-8 w-8 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">CO₂濃度</p>
                  <p className="text-xl font-bold">{envData.co2Level?.toFixed(0) || '-'} ppm</p>
                </div>
              </div>
            </div>
            
            {/* 履歴グラフ */}
            <div className="mt-6">
              <h3 className="font-bold mb-3">環境データ履歴（24時間）</h3>
              <div className="h-80">
                <EnvironmentalChart data={envHistory} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">環境データがありません</p>
          </div>
        )}
      </div>