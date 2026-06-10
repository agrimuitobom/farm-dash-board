          
          {/* アラートとタスク */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* アラート一覧 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 flex justify-between items-center border-b border-gray-100">
                <h3 className="text-lg font-medium">アラート</h3>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {alerts.length}件
                </span>
              </div>
              
              <div className="divide-y divide-gray-100">
                {alerts.length > 0 ? (
                  alerts.slice(0, 5).map((alert, index) => (
                    <div key={alert.id || index} className="p-4">
                      <div className="flex items-start">
                        <span className={`p-1.5 rounded-full mr-3 flex-shrink-0 ${
                          alert.severity === '警告' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></span>
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-gray-500">{alert.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {alert.timestamp?.toLocaleString() || ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">アラートはありません</p>
                  </div>
                )}
              </div>
            </div>