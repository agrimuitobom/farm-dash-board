          
          {/* 環境データ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 flex items-center">
              <div className="p-3 rounded-full bg-red-100 mr-4">
                <Thermometer className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">温度</p>
                <h3 className="text-xl font-bold">
                  {environmentalData?.temperature?.toFixed(1) || '--'} °C
                </h3>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <Droplets className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">湿度</p>
                <h3 className="text-xl font-bold">
                  {environmentalData?.humidity ? Math.round(environmentalData.humidity) : '--'} %
                </h3>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-4">
                <Wind className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">土壌水分</p>
                <h3 className="text-xl font-bold">
                  {environmentalData?.soilMoisture ? Math.round(environmentalData.soilMoisture) : '--'} %
                </h3>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 mr-4">
                <Sun className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">光量</p>
                <h3 className="text-xl font-bold">
                  {environmentalData?.light ? Math.round(environmentalData.light) : '--'} lux
                </h3>
              </div>
            </div>
          </div>