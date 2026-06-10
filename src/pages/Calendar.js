import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, List, Grid } from 'lucide-react';
import AddTaskModal from '../components/tasks/AddTaskModal';
import EditTaskModal from '../components/tasks/EditTaskModal';
import TaskListView from '../components/TaskListView';
import { getAllHouses, getAllCrops, addTask, updateTask, getTasks } from '../firestoreUtils';

const Calendar = () => {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [houses, setHouses] = useState([]);
  const [crops, setCrops] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date(),
    houseId: '',
    cropId: '',
    assignedTo: '',
    repeatType: 'none',
    repeatEndDate: null,
    reminderTime: '60'
  });
  
  // ダミーの作業データ
  const taskEvents = [
    { date: '2025-06-01', title: '温室ハウス2の水やり', priority: '高', assignedTo: '山田' },
    { date: '2025-06-02', title: 'トマトの収穫', priority: '中', assignedTo: '佐藤' },
    { date: '2025-06-03', title: '温室ハウス4の追肥', priority: '中', assignedTo: '鈴木' },
    { date: '2025-06-04', title: '温室ハウス1の害虫防除', priority: '高', assignedTo: '山田' },
    { date: '2025-06-05', title: '温室ハウス3の誘引作業', priority: '低', assignedTo: '田中' },
    { date: '2025-06-10', title: 'レタスの定植', priority: '中', assignedTo: '佐藤' },
    { date: '2025-06-15', title: 'ナスの剪定', priority: '低', assignedTo: '鈴木' },
    { date: '2025-06-15', title: 'キュウリの害虫防除', priority: '高', assignedTo: '山田' },
    { date: '2025-06-20', title: 'パプリカの収穫', priority: '中', assignedTo: '田中' },
    { date: '2025-06-25', title: '土壌分析', priority: '中', assignedTo: '佐藤' },
    { date: '2025-06-28', title: '灌水システムの点検', priority: '高', assignedTo: '山田' }
  ];

  // タスクデータの取得
  useEffect(() => {
    loadTasksAndOptions();
  }, []);
  
  // タスクとオプションデータを取得する関数
  const loadTasksAndOptions = async () => {
    try {
      // 実際のAPIから取得する場合（コメントアウトを解除）
      // const tasksData = await getTasks();
      // setTasks(tasksData);
      
      // ダミーデータを使用（本番環境では削除）
      setTasks(taskEvents.map(task => ({
        id: `task_${Math.random().toString(36).substr(2, 9)}`,
        title: task.title,
        priority: task.priority,
        assignedTo: task.assignedTo,
        dueDate: task.date, // 文字列として保存
        status: 'pending',
        description: ''
      })));
      
      // ハウスと作物のデータを取得
      const [housesData, cropsData] = await Promise.all([
        getAllHouses(),
        getAllCrops()
      ]);
      
      if (housesData) setHouses(housesData);
      if (cropsData) setCrops(cropsData);
    } catch (error) {
      console.error('データ取得エラー:', error);
    }
  };

  // 月の日数を取得
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // 月の初日の曜日を取得（0=日曜、1=月曜...）
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // 前月のボタンハンドラ
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  };

  // 翌月のボタンハンドラ
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  };

  // 今日に戻るボタンハンドラ
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // 日付クリックハンドラ
  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  // カレンダーのヘッダー（曜日）
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  // カレンダーの日付を生成
  const generateDates = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const dates = [];

    // 前月の日数（前月の最終日）
    const prevMonthDays = getDaysInMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    // 前月の日付を埋める
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      dates.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }

    // 当月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push({
        day: i,
        isCurrentMonth: true,
        isPrevMonth: false,
        isNextMonth: false
      });
    }

    // 翌月の日付を埋める（最大で6週間分表示）
    const remainingDays = 42 - dates.length; // 6週間 = 42日
    for (let i = 1; i <= remainingDays; i++) {
      dates.push({
        day: i,
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true
      });
    }

    return dates;
  };

  // 指定された日付の作業を取得
  const getTasksForDate = (year, month, day) => {
    const targetDate = new Date(year, month - 1, day);
    const targetDateStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const targetDateEnd = new Date(new Date(year, month - 1, day).setHours(23, 59, 59, 999));
    
    if (tasks.length > 0) {
      // 実際のタスクデータからフィルタリング
      return tasks.filter(task => {
        const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        return taskDate >= targetDateStart && taskDate <= targetDateEnd;
      });
    } else {
      // ダミーデータからフィルタリング
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return taskEvents.filter(event => event.date === dateStr);
    }
  };

  // 選択された日付を文字列形式に変換
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  
  // 選択された日付の作業
  const selectedDateTasks = tasks.length > 0 ?
    tasks.filter(task => {
      const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      return (
        taskDate.getFullYear() === selectedDate.getFullYear() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getDate() === selectedDate.getDate()
      );
    }) :
    taskEvents.filter(event => event.date === selectedDateStr);

  // タスク編集モーダルを開く
  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };
  
  // タスク更新処理
  const handleUpdateTask = async (updatedTaskData) => {
    try {
      // 実際のFirestoreに更新する場合はコメントアウトを解除
      // await updateTask(updatedTaskData.id, updatedTaskData);
      
      // メモリ上で更新（デモ用）
      const updatedTasks = tasks.map(task => 
        task.id === updatedTaskData.id ? updatedTaskData : task
      );
      setTasks(updatedTasks);
      
      // モーダルを閉じる
      setIsEditModalOpen(false);
      setEditingTask(null);
      
      // 成功メッセージ
      alert('作業が更新されました');
      
    } catch (err) {
      console.error('作業更新エラー:', err);
      alert('作業の更新中にエラーが発生しました');
    }
  };
  
  // 日本語の月名
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  // タスク追加モーダルを開く
  const handleOpenAddModal = () => {
    // 選択日を設定
    setFormData(prev => ({
      ...prev,
      dueDate: selectedDate
    }));
    
    // データがなければ取得する
    if (houses.length === 0 || crops.length === 0) {
      Promise.all([
        getAllHouses(),
        getAllCrops()
      ])
      .then(([housesData, cropsData]) => {
        if (housesData) setHouses(housesData);
        if (cropsData) setCrops(cropsData);
      })
      .catch(err => {
        console.error('データ取得エラー:', err);
      });
    }
    
    setIsAddModalOpen(true);
  };
  
  // 入力値変更ハンドラー
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 日付変更ハンドラー
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dueDate: date
    }));
  };
  
  // タスク追加ハンドラー
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      // ハウスとクロップの名前を取得
      let houseName = '';
      let cropName = '';
      
      if (formData.houseId) {
        const house = houses.find(h => h.id === formData.houseId);
        if (house) houseName = house.name;
      }
      
      if (formData.cropId) {
        const crop = crops.find(c => c.id === formData.cropId);
        if (crop) cropName = crop.name;
      }
      
      // タスクデータを作成
      const taskData = {
        ...formData,
        houseName,
        cropName,
        completed: formData.status === 'completed',
        createdAt: new Date()
      };
      
      // Firestoreにタスク追加
      await addTask(taskData);
      
      // モーダルを閉じる
      setIsAddModalOpen(false);
      
      // フォームリセット
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: selectedDate,
        houseId: '',
        cropId: '',
        assignedTo: '',
        repeatType: 'none',
        repeatEndDate: null,
        reminderTime: '60'
      });
      
      // 成功メッセージ
      alert('作業が追加されました');
      
      // リロードして更新（実際の実装では状態を直接更新するか、Firestoreサブスクリプションを使うとよい）
      window.location.reload();
      
    } catch (err) {
      console.error('作業追加エラー:', err);
      alert('作業の追加中にエラーが発生しました');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">作業カレンダー</h2>
            <p className="text-gray-600">農作業の計画と管理</p>
          </div>
          
          {/* 表示切り替えボタン */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="h-4 w-4 mr-2" />
              カレンダー表示
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4 mr-2" />
              リスト表示
            </button>
          </div>
        </div>
      </div>

      {/* 表示切り替え */}
      {viewMode === 'list' ? (
        <TaskListView 
          tasks={tasks}
          onEditTask={handleOpenEditModal}
          onCompleteTask={(task) => {
            // タスク完了処理
            const updatedTask = { ...task, status: 'completed' };
            handleUpdateTask(updatedTask);
          }}
        />
      ) : (
        // 既存のカレンダー表示
        <div className="flex flex-col lg:flex-row gap-6">
          {/* カレンダー部分 */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* カレンダーヘッダー */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center">
                  <h3 className="text-xl font-bold">
                    {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
                  </h3>
                  <button
                    onClick={handleToday}
                    className="ml-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    今日
                  </button>
                </div>
                <div className="flex">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 rounded-l border border-gray-300 hover:bg-gray-100"
                  >
                    ＜
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-r border border-gray-300 border-l-0 hover:bg-gray-100"
                  >
                    ＞
                  </button>
                </div>
              </div>

              {/* カレンダー本体 */}
              <div className="bg-white">
                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {weekdays.map((day, index) => (
                    <div
                      key={index}
                      className={`text-center py-2 ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-800'}`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 日付グリッド */}
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {generateDates().map((dateObj, index) => {
                    // 前月、当月、翌月でセルの色を変える
                    let bgColor = dateObj.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400';
                    
                    // 選択中の日付
                    if (
                      dateObj.isCurrentMonth &&
                      selectedDate.getDate() === dateObj.day &&
                      selectedDate.getMonth() === currentMonth.getMonth() &&
                      selectedDate.getFullYear() === currentMonth.getFullYear()
                    ) {
                      bgColor = 'bg-blue-50 border-2 border-blue-400';
                    }

                    // 今日の日付
                    const today = new Date();
                    if (
                      dateObj.isCurrentMonth &&
                      today.getDate() === dateObj.day &&
                      today.getMonth() === currentMonth.getMonth() &&
                      today.getFullYear() === currentMonth.getFullYear()
                    ) {
                      bgColor = 'bg-yellow-50';
                    }

                    // この日の作業を取得
                    let month = currentMonth.getMonth() + 1;
                    let year = currentMonth.getFullYear();
                    
                    if (dateObj.isPrevMonth) {
                      month = month - 1;
                      if (month === 0) {
                        month = 12;
                        year = year - 1;
                      }
                    } else if (dateObj.isNextMonth) {
                      month = month + 1;
                      if (month === 13) {
                        month = 1;
                        year = year + 1;
                      }
                    }
                    
                    const tasksForDate = getTasksForDate(year, month, dateObj.day);

                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] p-1 cursor-pointer ${bgColor} ${
                          index % 7 === 0 ? 'text-red-500' : index % 7 === 6 ? 'text-blue-500' : ''
                        }`}
                        onClick={() => handleDateClick(dateObj.day)}
                      >
                        <div className="text-right font-medium p-1">{dateObj.day}</div>
                        <div className="mt-1">
                          {tasksForDate.slice(0, 2).map((task, idx) => (
                            <div
                              key={idx}
                              className={`text-xs p-1 mb-1 rounded truncate ${
                                task.priority === '高'
                                  ? 'bg-red-100 text-red-800'
                                  : task.priority === '中'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {task.title}
                            </div>
                          ))}
                          {tasksForDate.length > 2 && (
                            <div className="text-xs text-gray-500 px-1">
                              +{tasksForDate.length - 2}件
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 選択日の作業リスト */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-lg shadow h-full">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">{selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日の作業</h3>
              </div>
              <div className="p-4">
                {selectedDateTasks.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateTasks.map((task, index) => (
                      <div key={index} className="border-b pb-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{task.title}</h4>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              task.priority === '高' || task.priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : task.priority === '中' || task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {task.priority}優先
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          担当者: {task.assignedTo}
                        </p>
                        <div className="flex justify-end space-x-2">
                          <button 
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                            onClick={() => handleOpenEditModal(task)}
                          >
                            編集
                          </button>
                          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                            完了
                          </button>
                        </div>
                      </div>
                    ))}                
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    この日に予定されている作業はありません
                  </div>
                )}
                
                {/* 作業追加ボタン */}
                <div className="mt-6">
                  <button 
                    onClick={handleOpenAddModal}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    作業を追加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* タスク追加モーダル */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        formData={formData}
        houses={houses}
        crops={crops}
        handleInputChange={handleInputChange}
        handleDateChange={handleDateChange}
        handleSubmit={handleAddTask}
      />
      
      {/* タスク編集モーダル */}
      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={editingTask}
        houses={houses}
        crops={crops}
        onUpdate={handleUpdateTask}
      />
    </div>
  );
};

export default Calendar;