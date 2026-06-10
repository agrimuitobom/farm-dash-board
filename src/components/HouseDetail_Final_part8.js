
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
            
            {/* タスク一覧 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 flex justify-between items-center border-b border-gray-100">
                <h3 className="text-lg font-medium">作業タスク</h3>
                <button className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center">
                  <ListPlus className="h-4 w-4 mr-1" />
                  <span>タスク追加</span>
                </button>
              </div>
              
              <div className="divide-y divide-gray-100">
                {tasks.length > 0 ? (
                  tasks.slice(0, 5).map((task, index) => (
                    <div key={task.id || index} className="p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>期限: {task.dueDate?.toLocaleDateString() || '未設定'}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === '高' ? 'bg-red-100 text-red-800' : 
                        task.priority === '中' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority || '中'}優先
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">タスクはありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
