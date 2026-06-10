import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2, AlertCircle, Calendar, List } from 'lucide-react';

// コンポーネントのインポート
import TasksCalendar from '../components/tasks/TasksCalendar';
import EnhancedTasksCalendar from '../components/tasks/EnhancedTasksCalendar';
import TasksTable from '../components/tasks/TasksTable';
import TasksFilter from '../components/tasks/TasksFilter';
import AddTaskModal from '../components/tasks/AddTaskModal';
import EditTaskModal from '../components/tasks/EditTaskModal';
import ViewTaskModal from '../components/tasks/ViewTaskModal';

// Firestoreユーティリティをインポート
import { 
  getPendingTasks,
  addTask,
  updateTask,
  // deleteTaskはまだ実装されていないようなので一時的にコメントアウト
  // deleteTask,
  getAllHouses,
  getAllCrops,
  formatFirestoreData 
} from '../firestoreUtils';

const Tasks = () => {
  // 状態の初期化
  const [tasks, setTasks] = useState([]);
  const [houses, setHouses] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // フィルター状態
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, in-progress, completed
  const [houseFilter, setHouseFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: null, end: null });
  
  // 表示モード（リスト/カレンダー）
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [calendarView, setCalendarView] = useState('simple'); // 'simple' or 'enhanced'
  
  // モーダル関連の状態
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // タスクフォームの初期値
  const initialFormData = {
    title: '',
    description: '',
    status: 'pending', // pending, in-progress, completed
    priority: 'medium', // low, medium, high
    dueDate: new Date(),
    houseId: '',
    cropId: '',
    assignedTo: '',
    repeatType: 'none', // none, daily, weekly, monthly, yearly
    repeatEndDate: null,
    reminderTime: '60' // 分単位
  };
  
  const [formData, setFormData] = useState(initialFormData);

  // Firestoreからデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // タスク、ハウス、作物の情報を取得
        const [tasksData, housesData, cropsData] = await Promise.all([
          getPendingTasks(100), // より多くのタスクを取得
          getAllHouses(),
          getAllCrops()
        ]);
        
        // データをフォーマット
        if (tasksData && tasksData.length > 0) {
          const formattedTasks = tasksData.map(task => formatFirestoreData(task));
          setTasks(formattedTasks);
        } else {
          // ダミーデータ（後ほど削除）
          const dummyTasks = [
            { 
              id: 1, 
              title: '温度センサーの校正', 
              description: 'ハウス1の温度センサーを校正する',
              status: 'pending', 
              priority: 'high',
              dueDate: new Date(2025, 3, 3), 
              houseId: 'house1',
              houseName: '温室ハウス1',
              cropId: 'crop1',
              cropName: '長期ミニトマト R6',
              assignedTo: '農場長'
            },
            { 
              id: 2, 
              title: '水耕栽培システムのメンテナンス', 
              description: 'ポンプの清掃と水質検査を実施',
              status: 'in-progress', 
              priority: 'medium',
              dueDate: new Date(2025, 3, 5), 
              houseId: 'house2',
              houseName: '温室ハウス2',
              cropId: 'crop3',
              cropName: 'キュウリ 夏すずみ',
              assignedTo: '設備担当'
            },
            { 
              id: 3, 
              title: '害虫点検', 
              description: '週次の害虫点検を実施',
              status: 'completed', 
              priority: 'low',
              dueDate: new Date(2025, 3, 1), 
              houseId: 'house3',
              houseName: '温室ハウス3',
              cropId: 'crop4',
              cropName: 'パプリカ オレンジ',
              assignedTo: '栽培担当'
            }
          ];
          setTasks(dummyTasks);
        }
        
        // ハウスと作物のデータをセット
        if (housesData && housesData.length > 0) {
          setHouses(housesData);
        }
        
        if (cropsData && cropsData.length > 0) {
          setCrops(cropsData);
        }
      } catch (err) {
        console.error('データの取得中にエラーが発生しました:', err);
        setError('データの取得中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    // 初期データの取得
    fetchData();
  }, []);

  // フィルタリングされたタスクリストを計算
  const filteredTasks = tasks.filter(task => {
    // テキストでフィルタリング（タイトルと説明）
    const textMatch = 
      task.title.toLowerCase().includes(filterText.toLowerCase()) || 
      (task.description && task.description.toLowerCase().includes(filterText.toLowerCase()));
    
    // ステータスでフィルタリング
    const statusMatch = 
      statusFilter === 'all' || 
      (statusFilter === 'pending' && task.status === 'pending') ||
      (statusFilter === 'in-progress' && task.status === 'in-progress') ||
      (statusFilter === 'completed' && task.status === 'completed');
    
    // ハウスでフィルタリング
    const houseMatch = houseFilter === '' || task.houseId === houseFilter;
    
    // 作物でフィルタリング
    const cropMatch = cropFilter === '' || task.cropId === cropFilter;
    
    // 日付範囲でフィルタリング
    let dateMatch = true;
    if (dateRangeFilter.start && dateRangeFilter.end) {
      const taskDate = new Date(task.dueDate);
      dateMatch = 
        taskDate >= new Date(dateRangeFilter.start) && 
        taskDate <= new Date(dateRangeFilter.end);
    }
    
    return textMatch && statusMatch && houseMatch && cropMatch && dateMatch;
  });
  
  // タスクの編集・追加ハンドラー
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 日付入力ハンドラー
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dueDate: date
    }));
  };
  
  // フィルター操作ハンドラー
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'filterText':
        setFilterText(value);
        break;
      case 'statusFilter':
        setStatusFilter(value);
        break;
      case 'houseFilter':
        setHouseFilter(value);
        break;
      case 'cropFilter':
        setCropFilter(value);
        break;
      default:
        break;
    }
  };
  
  // 日付範囲フィルターハンドラー
  const handleDateRangeChange = (range) => {
    setDateRangeFilter(range);
  };
  
  // 表示モード切替ハンドラー
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };
  
  // モーダル操作ハンドラー
  const handleOpenAddModal = () => {
    setFormData(initialFormData);
    setIsAddModalOpen(true);
  };
  
  const handleOpenEditModal = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: new Date(task.dueDate),
      houseId: task.houseId || '',
      cropId: task.cropId || '',
      assignedTo: task.assignedTo || '',
      repeatType: task.repeatType || 'none',
      repeatEndDate: task.repeatEndDate ? new Date(task.repeatEndDate) : null,
      reminderTime: task.reminderTime || '60'
    });
    setIsEditModalOpen(true);
  };
  
  const handleOpenViewModal = (task) => {
    setSelectedTask(task);
    setIsViewModalOpen(true);
  };
  
  // タスクのステータス変更ハンドラー
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setLoading(true);
      await updateTask(taskId, { status: newStatus });
      
      // UIの更新
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
    } catch (err) {
      console.error('タスクの更新中にエラーが発生しました:', err);
      setError('タスクの更新中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // タスク追加ハンドラー
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
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
      
      // タスクの追加
      const taskData = {
        ...formData,
        houseName,
        cropName,
        completed: formData.status === 'completed',
        createdAt: new Date()
      };
      
      const newTaskId = await addTask(taskData);
      
      // モーダルを閉じる
      setIsAddModalOpen(false);
      
      // タスクリストを更新
      const newTask = {
        id: newTaskId,
        ...taskData
      };
      
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      // 成功メッセージ
      alert('タスクを追加しました');
    } catch (err) {
      console.error('タスクの追加中にエラーが発生しました:', err);
      setError('タスクの追加中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // タスク更新ハンドラー
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    
    try {
      setLoading(true);
      
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
      
      // タスクの更新
      const taskData = {
        ...formData,
        houseName,
        cropName,
        completed: formData.status === 'completed'
      };
      
      await updateTask(selectedTask.id, taskData);
      
      // モーダルを閉じる
      setIsEditModalOpen(false);
      
      // タスクリストを更新
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === selectedTask.id ? { ...task, ...taskData } : task
        )
      );
      
      // 成功メッセージ
      alert('タスクを更新しました');
    } catch (err) {
      console.error('タスクの更新中にエラーが発生しました:', err);
      setError('タスクの更新中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // タスク削除ハンドラー
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('このタスクを削除してもよろしいですか？')) return;
    
    try {
      setLoading(true);
      // deleteTask関数がまだ実装されていないため、一時的にコメントアウト
      // await deleteTask(taskId);
      
      // 代わりにupdateTaskを使用してタスクに削除フラグを立てる
      await updateTask(taskId, { deleted: true });
      
      // タスクリストを更新
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // モーダルを閉じる（表示中なら）
      if (isViewModalOpen && selectedTask && selectedTask.id === taskId) {
        setIsViewModalOpen(false);
      }
      
      // 成功メッセージ
      alert('タスクを削除しました');
    } catch (err) {
      console.error('タスクの削除中にエラーが発生しました:', err);
      setError('タスクの削除中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // タスクドラッグ&ドロップ更新ハンドラー
  const handleTaskDateUpdate = async (updatedTask) => {
    try {
      setLoading(true);
      
      // 形式を整える
      const formattedDate = updatedTask.dueDate instanceof Date 
        ? updatedTask.dueDate 
        : new Date(updatedTask.dueDate);
      
      // Firestoreへの更新
      await updateTask(updatedTask.id, { dueDate: formattedDate });
      
      // UI更新
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === updatedTask.id 
            ? { ...task, dueDate: formattedDate } 
            : task
        )
      );
      
    } catch (err) {
      console.error('タスクの日付更新中にエラーが発生しました:', err);
      setError('タスクの日付更新中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // カレンダービュー切替ハンドラー
  const toggleCalendarView = () => {
    setCalendarView(prev => prev === 'simple' ? 'enhanced' : 'simple');
  };

  // レンダリング部分
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">タスク管理</h1>
        <div className="flex items-center space-x-4">
          {/* 表示切り替えボタン */}
          <div className="bg-gray-200 rounded-lg p-1 flex">
            <button
              onClick={() => toggleViewMode('list')}
              className={`flex items-center px-3 py-1 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="w-4 h-4 mr-1" />
              リスト
            </button>
            <button
              onClick={() => toggleViewMode('calendar')}
              className={`flex items-center px-3 py-1 rounded-md ${viewMode === 'calendar' ? 'bg-white shadow-sm' : ''}`}
            >
              <Calendar className="w-4 h-4 mr-1" />
              カレンダー
            </button>
          </div>
          
          {/* カレンダータイプ切替ボタン - カレンダー表示時のみ */}
          {viewMode === 'calendar' && (
            <button
              onClick={toggleCalendarView}
              className="ml-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              {calendarView === 'simple' ? '拡張カレンダーに切替' : 'シンプルカレンダーに切替'}
            </button>
          )}
          
          {/* タスク追加ボタン */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            新規タスク追加
          </button>
        </div>
      </div>
      
      {/* フィルター部分 */}
      <TasksFilter 
        filterText={filterText}
        statusFilter={statusFilter}
        houseFilter={houseFilter}
        cropFilter={cropFilter}
        dateRangeFilter={dateRangeFilter}
        houses={houses}
        crops={crops}
        onFilterChange={handleFilterChange}
        onDateRangeChange={handleDateRangeChange}
      />
      
      {/* エラー表示 */}
      {error && (
        <div className="p-4 mb-6 bg-red-100 border-l-4 border-red-500 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 mr-2 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* 読み込み中表示 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">データを読み込み中...</span>
        </div>
      ) : (
        <>
          {/* リスト表示 */}
          {viewMode === 'list' && (
            <TasksTable 
              tasks={filteredTasks}
              onView={handleOpenViewModal}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          )}
          
          {/* カレンダー表示 */}
          {viewMode === 'calendar' && (
            <div>
              {calendarView === 'simple' ? (
                <TasksCalendar tasks={filteredTasks} onTaskClick={handleOpenViewModal} />
              ) : (
                <EnhancedTasksCalendar 
                  tasks={filteredTasks} 
                  onTaskClick={handleOpenViewModal}
                  onTaskUpdate={handleTaskDateUpdate}
                />
              )}
            </div>
          )}
        </>
      )}
      
      {/* モーダルコンポーネント */}
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
      
      <EditTaskModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={selectedTask}
        formData={formData}
        houses={houses}
        crops={crops}
        handleInputChange={handleInputChange}
        handleDateChange={handleDateChange}
        handleSubmit={handleUpdateTask}
      />
      
      <ViewTaskModal 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        task={selectedTask}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteTask}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default Tasks;