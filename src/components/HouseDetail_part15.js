            
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