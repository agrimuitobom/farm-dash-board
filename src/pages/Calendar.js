import React, { useState, useEffect } from 'react';
import { List, Grid } from 'lucide-react';
import toast from 'react-hot-toast';
import AddTaskModal from '../components/tasks/AddTaskModal';
import EditTaskModal from '../components/tasks/EditTaskModal';
import TaskListView from '../components/TaskListView';
import { getAllHouses, getAllCrops, addTask, updateTask, getTasks, deleteTask, deleteTasks } from '../firestoreUtils';
import {
  normalizeTask,
  isTaskDone,
  toTaskUpdate,
  PRIORITY_LABELS,
  PRIORITY_CLASSES
} from '../utils/tasks';

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
  
  // タスクデータの取得
  useEffect(() => {
    loadTasksAndOptions();
  }, []);
  
  // 作業（Firestore の tasks）と、ハウス・作物の選択肢を取得する
  const loadTasks = async () => {
    const tasksData = await getTasks();
    setTasks((tasksData || []).map(normalizeTask));
  };
  
  const loadTasksAndOptions = async () => {
    try {
      const [, housesData, cropsData] = await Promise.all([
        loadTasks(),
        getAllHouses(),
        getAllCrops()
      ]);
      
      if (housesData) setHouses(housesData);
      if (cropsData) setCrops(cropsData);
    } catch (error) {
      console.error('データ取得エラー:', error);
      toast.error('作業の読み込みに失敗しました');
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
  // 月末（31日など）から移動したときに月が飛ばないよう、1日を基準にする
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // 翌月のボタンハンドラ
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
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

  const isSameDay = (date, year, monthIndex, day) =>
    date instanceof Date &&
    date.getFullYear() === year &&
    date.getMonth() === monthIndex &&
    date.getDate() === day;
  
  // 指定された日付（month は 1〜12）の作業を取得
  const getTasksForDate = (year, month, day) =>
    tasks.filter(task => isSameDay(task.dueDate, year, month - 1, day));
  
  // 選択された日付の作業
  const selectedDateTasks = tasks.filter(task =>
    isSameDay(task.dueDate, selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
  );

  // タスク編集モーダルを開く
  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };
  
  // タスク更新処理（編集画面から）
  const handleUpdateTask = async (updatedTaskData) => {
    try {
      await updateTask(updatedTaskData.id, toTaskUpdate(updatedTaskData));
      setTasks(prev => prev.map(task =>
        task.id === updatedTaskData.id ? normalizeTask(updatedTaskData) : task
      ));
      setIsEditModalOpen(false);
      setEditingTask(null);
      toast.success('作業を更新しました');
    } catch (err) {
      console.error('作業更新エラー:', err);
      toast.error('作業の更新中にエラーが発生しました');
    }
  };
  
  // 完了 ⇔ 未完了の切り替え
  const handleToggleComplete = async (task) => {
    const done = !isTaskDone(task);
    const changes = {
      status: done ? 'completed' : 'pending',
      completed: done,
      completedAt: done ? new Date() : null
    };
    try {
      await updateTask(task.id, changes);
      setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, ...changes } : t)));
      toast.success(done ? '作業を完了にしました' : '作業を未完了に戻しました');
    } catch (err) {
      console.error('作業更新エラー:', err);
      toast.error('作業の更新中にエラーが発生しました');
    }
  };
  
  // 削除（1件）
  const handleDeleteTask = async (task) => {
    if (!window.confirm(`「${task.title}」を削除しますか？この操作は元に戻せません。`)) return;
    try {
      await deleteTask(task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
      toast.success('作業を削除しました');
    } catch (err) {
      console.error('作業削除エラー:', err);
      toast.error('作業の削除中にエラーが発生しました');
    }
  };
  
  // 削除（まとめて。リスト表示で選択したもの）
  const handleDeleteTasks = async (taskIds) => {
    if (taskIds.length === 0) return false;
    if (!window.confirm(`選択した ${taskIds.length} 件の作業を削除しますか？この操作は元に戻せません。`)) return false;
    try {
      await deleteTasks(taskIds);
      setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
      toast.success(`${taskIds.length} 件の作業を削除しました`);
      return true;
    } catch (err) {
      console.error('作業削除エラー:', err);
      toast.error('作業の削除中にエラーが発生しました');
      return false;
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
      
      toast.success('作業を追加しました');
      await loadTasks();
    } catch (err) {
      console.error('作業追加エラー:', err);
      toast.error('作業の追加中にエラーが発生しました');
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
          onToggleComplete={handleToggleComplete}
          onDeleteTask={handleDeleteTask}
          onDeleteTasks={handleDeleteTasks}
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
                          {tasksForDate.slice(0, 2).map((task) => (
                            <div
                              key={task.id}
                              className={`text-xs p-1 mb-1 rounded truncate ${
                                isTaskDone(task)
                                  ? 'bg-gray-100 text-gray-400 line-through'
                                  : PRIORITY_CLASSES[task.priority] || PRIORITY_CLASSES.medium
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
                    {selectedDateTasks.map((task) => (
                      <div key={task.id} className="border-b pb-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className={`font-medium ${isTaskDone(task) ? 'line-through text-gray-400' : ''}`}>{task.title}</h4>
                          {isTaskDone(task) ? (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">完了</span>
                          ) : (
                            <span className={`px-2 py-1 text-xs font-medium rounded ${PRIORITY_CLASSES[task.priority] || PRIORITY_CLASSES.medium}`}>
                              {PRIORITY_LABELS[task.priority] || '中'}優先
                            </span>
                          )}
                        </div>
                        {task.assignedTo && (
                          <p className="text-sm text-gray-600 mb-2">
                            担当者: {task.assignedTo}
                          </p>
                        )}
                        <div className="flex justify-end space-x-2">
                          <button 
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                            onClick={() => handleOpenEditModal(task)}
                          >
                            編集
                          </button>
                          <button
                            className={`px-3 py-1 text-sm rounded ${isTaskDone(task) ? 'border border-gray-300 hover:bg-gray-50' : 'bg-green-500 text-white hover:bg-green-600'}`}
                            onClick={() => handleToggleComplete(task)}
                          >
                            {isTaskDone(task) ? '未完了に戻す' : '完了'}
                          </button>
                          <button
                            className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50"
                            onClick={() => handleDeleteTask(task)}
                          >
                            削除
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