import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import TouchDatePicker from '../components/mobile/TouchDatePicker';
import TaskList from '../components/mobile/TaskList';
import TabNavigation from '../components/mobile/TabNavigation';
import FloatingActionButton from '../components/mobile/FloatingActionButton';
import AddTaskModal from '../components/tasks/AddTaskModal';
import EditTaskModal from '../components/tasks/EditTaskModal';
import { Calendar, List, BarChart2 } from 'lucide-react';
import { getAllHouses, getAllCrops, addTask, updateTask, getTasks } from '../firestoreUtils';

/**
 * モバイル向けに最適化したカレンダーページ
 */
const MobileCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [houses, setHouses] = useState([]);
  const [crops, setCrops] = useState([]);
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
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // タブ定義
  const tabs = [
    { label: 'カレンダー', icon: <Calendar size={16} /> },
    { label: 'タスク一覧', icon: <List size={16} /> },
    { label: '統計', icon: <BarChart2 size={16} /> }
  ];

  // タスクデータの取得
  useEffect(() => {
    loadTasksAndOptions();
  }, []);

  // タスクとオプションデータを取得する関数
  const loadTasksAndOptions = async () => {
    try {
      // 実際のAPIから取得する場合
      const tasksData = await getTasks();
      setTasks(tasksData || []);
      
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

  // 選択された日付のタスクを取得
  const getSelectedDateTasks = () => {
    return tasks.filter(task => {
      const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      return (
        taskDate.getFullYear() === selectedDate.getFullYear() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getDate() === selectedDate.getDate()
      );
    });
  };

  // すべてのタスクを取得（ソート済み）
  const getAllTasksSorted = () => {
    return [...tasks].sort((a, b) => {
      const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
      const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
      return dateA - dateB;
    });
  };

  // FABアクション定義
  const fabActions = [
    { id: 'add-task', label: '作業を追加', icon: <Calendar size={20} /> }
  ];

  // FABアクションハンドラ
  const handleFabAction = (action) => {
    if (action.id === 'add-task') {
      // 選択日を設定
      setFormData(prev => ({
        ...prev,
        dueDate: selectedDate
      }));
      setIsAddModalOpen(true);
    }
  };

  // 日付変更ハンドラー
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // タスク編集モーダルを開く
  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  // タスク更新処理
  const handleUpdateTask = async (updatedTaskData) => {
    try {
      await updateTask(updatedTaskData.id, updatedTaskData);
      
      // メモリ上でも更新
      const updatedTasks = tasks.map(task => 
        task.id === updatedTaskData.id ? updatedTaskData : task
      );
      setTasks(updatedTasks);
      
      // モーダルを閉じる
      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error('作業更新エラー:', err);
      alert('作業の更新中にエラーが発生しました');
    }
  };

  // タスク完了処理
  const handleCompleteTask = async (task) => {
    try {
      const updatedTask = {
        ...task,
        status: 'completed',
        completed: true,
        completedAt: new Date()
      };
      
      await updateTask(task.id, updatedTask);
      
      // メモリ上でも更新
      const updatedTasks = tasks.map(t => 
        t.id === task.id ? updatedTask : t
      );
      setTasks(updatedTasks);
    } catch (err) {
      console.error('作業完了エラー:', err);
      alert('作業の完了処理中にエラーが発生しました');
    }
  };

  // 入力値変更ハンドラー
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const newTaskId = await addTask(taskData);
      
      // メモリ上にも追加
      const newTask = {
        ...taskData,
        id: newTaskId
      };
      setTasks([...tasks, newTask]);
      
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
    } catch (err) {
      console.error('作業追加エラー:', err);
      alert('作業の追加中にエラーが発生しました');
    }
  };

  // タブによってレンダリングするコンテンツを変更
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // カレンダー
        return (
          <div className="mt-4 space-y-4">
            <TouchDatePicker 
              selectedDate={selectedDate} 
              onDateChange={handleDateChange} 
            />
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">
                {selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}の作業
              </h3>
              <TaskList 
                tasks={getSelectedDateTasks()} 
                onEdit={handleOpenEditModal} 
                onComplete={handleCompleteTask} 
              />
            </div>
          </div>
        );
      case 1: // タスク一覧
        return (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-4">すべての作業</h3>
            <TaskList 
              tasks={getAllTasksSorted()} 
              onEdit={handleOpenEditModal} 
              onComplete={handleCompleteTask} 
            />
          </div>
        );
      case 2: // 統計
        return (
          <div className="mt-4 p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">作業統計</h3>
            <p className="text-center text-gray-500 py-10">統計データは準備中です</p>
          </div>
        );
      default:
        return null;
    }
  };

  // デスクトップ版の表示はオリジナルのCalendarコンポーネントに任せる
  if (isDesktop) return null;

  return (
    <div className="pb-20">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">作業カレンダー</h2>
        <p className="text-gray-600">農作業の計画と管理</p>
      </div>

      <TabNavigation 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {renderTabContent()}

      <FloatingActionButton 
        actions={fabActions} 
        onAction={handleFabAction} 
      />

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

export default MobileCalendar;