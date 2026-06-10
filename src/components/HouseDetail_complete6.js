      {/* アラートとタスク */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* アラート */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">アラート</h2>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {alerts.filter(alert => !alert.resolved).length} 件未解決
            </span>
          </div>
          
          {alerts.length === 0 ? (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">アラートはありません</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-md ${alert.resolved ? 'bg-gray-50' : 'bg-red-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-bold ${alert.resolved ? 'text-gray-500' : 'text-red-600'}`}>
                        {alert.title}
                      </h4>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${alert.resolved ? 'bg-gray-200 text-gray-600' : 'bg-red-200 text-red-800'}`}>
                      {alert.resolved ? '解決済み' : '未解決'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* タスク */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">タスク</h2>
            <Link 
              to={`/tasks/add?houseId=${id}`}
              className="flex items-center text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
            >
              <ListPlus className="h-4 w-4 mr-1.5" />
              タスク追加
            </Link>
          </div>
          
          {tasks.length === 0 ? (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">タスクはありません</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  className="p-3 border rounded-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold">{task.title}</h4>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === '高' ? 'bg-red-100 text-red-800' : task.priority === '中' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {task.priority || '未設定'}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-xs text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '期限なし'}
                    </div>
                    <Link 
                      to={`/tasks/${task.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      詳細
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>