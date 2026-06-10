      
      {/* メインコンテンツ */}
      {!loading && !error && house && (
        <div className="space-y-6">
          {/* ハウス概要 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-48 bg-gray-200 relative">
              <img 
                src={house.image || getBackgroundImage(house.currentCrop)}
                alt={house.id} 
                className="w-full h-full object-cover"
              />
              
              {/* 栽培日数バッジ */}
              {house.plantDate && (
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white rounded px-3 py-1.5 flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>栽培開始: {house.plantDate.toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{house.id}</h2>
                  <p className="text-lg text-gray-600">{house.currentCrop || '複数作物栽培'}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {house.status || '生育中'}
                </span>
              </div>
            </div>
          </div>