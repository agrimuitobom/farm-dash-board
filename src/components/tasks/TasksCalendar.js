import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TasksCalendar = ({ tasks, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [tasksByDay, setTasksByDay] = useState({});

  // カレンダーの年月表示
  const calendarHeaderDate = currentDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long'
  });

  // 前月に移動
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  };

  // 次月に移動
  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + 1);
      return newDate;
    });
  };

  // カレンダーのデータを生成
  useEffect(() => {
    generateCalendarDays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  // タスクをグルーピングしてカレンダーに表示
  useEffect(() => {
    organizeTasksByDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, calendarDays]);

  // カレンダーの日付配列を生成
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 月の初日
    const firstDayOfMonth = new Date(year, month, 1);
    // 月の末日
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // 月の初日の曜日（0:日曜日, 1:月曜日, ..., 6:土曜日）
    const firstDayOfWeek = firstDayOfMonth.getDay();

    // カレンダーに表示する日数（前月の末尾 + 当月の日数 + 次月の先頭）
    const daysToShow = 42; // 7日 x 6週間分（最大）

    // カレンダーの全日程
    const days = [];

    // 前月の末尾日を追加
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = new Date(year, month, -firstDayOfWeek + i + 1);
      days.push({
        date: day,
        isCurrentMonth: false,
        day: day.getDate()
      });
    }

    // 当月の日を追加
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const day = new Date(year, month, i);
      days.push({
        date: day,
        isCurrentMonth: true,
        day: i
      });
    }

    // 残りを次月の先頭日で埋める
    const remainingDays = daysToShow - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({
        date: day,
        isCurrentMonth: false,
        day: day.getDate()
      });
    }

    setCalendarDays(days);
  };

  // 日付ごとのタスクを整理
  const organizeTasksByDay = () => {
    const taskMap = {};

    // 日付ごとにタスクをグループ化
    tasks.forEach(task => {
      const taskDate = new Date(task.dueDate);
      const dateKey = taskDate.toISOString().split('T')[0]; // YYYY-MM-DD形式

      if (!taskMap[dateKey]) {
        taskMap[dateKey] = [];
      }

      taskMap[dateKey].push(task);
    });

    setTasksByDay(taskMap);
  };

  // 優先度に基づく色を返す関数
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 日付のフォーマット関数
  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD形式
  };

  // 曜日のラベル
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* カレンダーヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPreviousMonth}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold">{calendarHeaderDate}</h2>

        <button
          onClick={goToNextMonth}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day, index) => (
          <div key={index} className={`text-center py-2 font-medium ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* カレンダー本体 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayInfo, index) => {
          const dateKey = formatDateKey(dayInfo.date);
          const dayTasks = tasksByDay[dateKey] || [];
          const isToday = new Date().toDateString() === dayInfo.date.toDateString();

          return (
            <div
              key={index}
              className={`min-h-28 p-1 border rounded ${
                dayInfo.isCurrentMonth
                  ? isToday
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-white'
                  : 'bg-gray-50 text-gray-400'
              }`}
            >
              <div className="text-right mb-1">
                <span
                  className={`inline-block w-6 h-6 text-center rounded-full ${
                    isToday ? 'bg-blue-500 text-white' : ''
                  }`}
                >
                  {dayInfo.day}
                </span>
              </div>

              {/* タスク一覧 */}
              <div className="space-y-1 overflow-y-auto max-h-20">
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="text-xs p-1 rounded cursor-pointer bg-gray-100 hover:bg-gray-200 flex items-center"
                  >
                    <div className={`${getPriorityColor(task.priority)} w-2 h-2 rounded-full mr-1`}></div>
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TasksCalendar;
