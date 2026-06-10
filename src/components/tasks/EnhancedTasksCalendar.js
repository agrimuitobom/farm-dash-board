import React, { useState, useCallback } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// 日本語ロケールの設定
moment.locale('ja');
const localizer = momentLocalizer(moment);

// カスタムツールバーコンポーネント
const CustomToolbar = ({ date, onNavigate, onView, view }) => {
  const goToToday = () => onNavigate('TODAY');
  const goToBack = () => onNavigate('PREV');
  const goToNext = () => onNavigate('NEXT');
  
  // 月表示のフォーマット
  const label = moment(date).format('YYYY年 M月');
  
  return (
    <div className="flex justify-between items-center mb-4 px-2">
      <div className="flex items-center">
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200"
          onClick={goToBack}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="mx-4 text-lg font-semibold">{label}</span>
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200"
          onClick={goToNext}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex space-x-1">
        <button
          onClick={goToToday}
          className={`px-3 py-1 text-sm rounded ${
            moment().isSame(date, 'day') ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          今日
        </button>
        <button
          onClick={() => onView(Views.MONTH)}
          className={`px-3 py-1 text-sm rounded ${
            view === Views.MONTH ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          月
        </button>
        <button
          onClick={() => onView(Views.WEEK)}
          className={`px-3 py-1 text-sm rounded ${
            view === Views.WEEK ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          週
        </button>
        <button
          onClick={() => onView(Views.DAY)}
          className={`px-3 py-1 text-sm rounded ${
            view === Views.DAY ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          日
        </button>
        <button
          onClick={() => onView(Views.AGENDA)}
          className={`px-3 py-1 text-sm rounded ${
            view === Views.AGENDA ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          予定表
        </button>
      </div>
    </div>
  );
};

// タスクのイベントスタイル
const eventStyleGetter = (event) => {
  // ステータスに基づく色分け
  let backgroundColor = '#3788d8'; // デフォルト色
  let borderColor = '#2c6cb0';
  
  if (event.status === 'completed') {
    backgroundColor = '#10b981'; // 完了 - 緑色
    borderColor = '#059669';
  } else if (event.status === 'in-progress') {
    backgroundColor = '#f59e0b'; // 進行中 - 黄色
    borderColor = '#d97706';
  } else if (event.priority === 'high') {
    backgroundColor = '#ef4444'; // 未着手&高優先度 - 赤色
    borderColor = '#b91c1c';
  }
  
  return {
    style: {
      backgroundColor,
      borderColor,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: '2px',
      opacity: 0.95,
      color: '#fff',
      padding: '2px 5px',
      fontSize: '0.9em'
    }
  };
};

// TasksCalendarコンポーネント
const EnhancedTasksCalendar = ({ tasks, onTaskClick, onTaskUpdate }) => {
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  
  // タスクをカレンダーイベント形式に変換
  const events = tasks.map(task => ({
    id: task.id,
    title: task.title,
    start: new Date(task.dueDate),
    end: new Date(task.dueDate),
    status: task.status,
    priority: task.priority,
    allDay: true,
    resource: task
  }));
  
  // 日付選択ハンドラー
  const handleSelectSlot = ({ start }) => {
    // 新規タスク作成画面への遷移や、選択日付を渡すことができます
    console.log('日付選択:', start);
    // ここで新規タスク作成のモーダルを表示する処理などを実装
  };
  
  // タスクドラッグ&ドロップハンドラー
  const moveEvent = useCallback(
    ({ event, start, end }) => {
      const updatedTask = {
        ...event.resource,
        dueDate: start
      };
      
      // 親コンポーネントに更新を通知
      onTaskUpdate(updatedTask);
    },
    [onTaskUpdate]
  );
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* 説明ノート */}
      <div className="mb-4 p-3 bg-blue-50 rounded-md flex items-start">
        <AlertCircle className="text-blue-600 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
        <div className="text-blue-700 text-sm">
          <p>
            <strong>ドラッグ&ドロップ:</strong> タスクをドラッグして別の日付に移動できます
          </p>
          <p className="mt-1">
            <strong>タスク詳細:</strong> タスクをクリックすると詳細が表示されます
          </p>
        </div>
      </div>
      
      {/* カレンダー */}
      <div className="h-600" style={{ height: '70vh' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable
          onSelectEvent={({ resource }) => onTaskClick(resource)}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          onEventDrop={moveEvent}
          resizable
          components={{
            toolbar: CustomToolbar
          }}
          formats={{
            monthHeaderFormat: 'YYYY年M月',
            dayHeaderFormat: 'M月D日(ddd)',
            dayRangeHeaderFormat: ({ start, end }) => 
              `${moment(start).format('M月D日')} - ${moment(end).format('M月D日')}`
          }}
          messages={{
            showMore: total => `他 ${total} 件`
          }}
        />
      </div>
    </div>
  );
};

export default EnhancedTasksCalendar;
