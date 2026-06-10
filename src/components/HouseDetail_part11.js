          
          {/* 作物エリアセクション */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-lg font-medium">作物エリア</h3>
              <button 
                onClick={() => setShowAddCropModal(true)}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                <span>エリア追加</span>
              </button>
            </div>
            
            <div className="p-4">
              {house.cropAreas && house.cropAreas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {house.cropAreas.map((cropArea) => (
                    <CropAreaCard 
                      key={cropArea.id} 
                      cropArea={cropArea} 
                      onEdit={openEditModal}
                      onRemove={handleRemoveCropArea}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">作物エリアが登録されていません</p>
                  <button 
                    onClick={() => setShowAddCropModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 inline-flex items-center"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    <span>新しい作物エリアを追加</span>
                  </button>
                </div>
              )}
            </div>
          </div>