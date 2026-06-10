import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Clock } from 'lucide-react';
import { getStaffTasks, updateTask, unassignTaskFromStaff } from '../../firestoreUtils';

/**
 * スタッフに割り当てられたタスク表示コンポーネント
 */
const StaffTasksView = ({ staffId, staffName }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // タスク取得
  useEffect(() => {
    const fetchTasks = async () => {
      if (!staffId) return;
      
      setLoading(true);
      try {
        const staffTasks = await getStaffTasks(staffId);
        setTasks(staffTasks);
        setError(null);
      } catch (err) {
        console.error('タスクの取得に失敗しました:', err);
        setError('タスクの読み込み中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [staffId]);

  // タスク完了処理
  const handleCompleteTask = async (taskId) => {
    setActionLoading(taskId);
    try {
      await updateTask(taskId, { completed: true });
      // タスク一覧を更新
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('タスク完了の更新に失敗しました:', err);
      setError('タスク完了の処理中にエラーが発生しました');
    } finally {
      setActionLoading(null);
    }
  };

  // タスク割り当て解除
  const handleUnassignTask = async (taskId) => {
    setActionLoading(taskId);
    try {
      await unassignTaskFromStaff(staffId, taskId);
      // タスク一覧を更新
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('タスク割り当て解除に失敗しました:', err);
      setError('タスク割り当て解除の処理中にエラーが発生しました');
    } finally {
      setActionLoading(null);
    }
  };

  // 日付フォーマット関数
  const formatDate = (date) => {
    if (!date) return '-';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleDateString('ja-JP');
  };

  // 期限切れかどうかを判定
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    
    const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
    if (isNaN(due.getTime())) return false;
    
    return due < new Date();
  };

  // 今日が期限かどうかを判定
  const isDueToday = (dueDate) => {
    if (!dueDate) return false;
    
    const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
    if (isNaN(due.getTime())) return false;
    
    const today = new Date();
    return due.getFullYear() === today.getFullYear() &&
           due.getMonth() === today.getMonth() &&
           due.getDate() === today.getDate();
  };

  if (!staffId) {
    return (
      <div className="text-center py-6">
        <p>スタッフが選択されていません</p>
      </div>
    );
  }

  return (
    <div className="staff-tasks-container">
      <h3 className="text-lg font-semibold mb-4">
        {staffName ? `${staffName}のタスク` : 'スタッフのタスク'}
      </h3>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-6 bg-base-200 rounded-lg">
          <p className="text-gray-500">未完了のタスクはありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className={`card card-compact ${
                isOverdue(task.dueDate) ? 'bg-red-50 border-red-200' : 
                isDueToday(task.dueDate) ? 'bg-yellow-50 border-yellow-200' : 
                'bg-base-100'
              } border shadow-sm`}
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium">
                    {task.title}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {isOverdue(task.dueDate) && (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                    {isDueToday(task.dueDate) && (
                      <Clock size={16} className="text-yellow-500" />
                    )}
                    <span className={`badge ${
                      isOverdue(task.dueDate) ? 'badge-error' : 
                      isDueToday(task.dueDate) ? 'badge-warning' : 
                      'badge-primary'
                    }`}>
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
                
                {task.description && (
                  <p className="text-sm text-gray-600">{task.description}</p>
                )}
                
                {task.houseId && (
                  <div className="text-xs text-gray-500 mt-1">
                    ハウスID: {task.houseId}
                  </div>
                )}
                
                <div className="card-actions justify-end mt-2">
                  <button
                    className="btn btn-sm btn-outline btn-error"
                    onClick={() => handleUnassignTask(task.id)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === task.id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <X size={14} />
                        割り当て解除
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === task.id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <Check size={14} />
                        完了
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffTasksView;
