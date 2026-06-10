import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getShiftList } from '../../firestoreUtils';

// 日本語設定
moment.locale('ja');
const localizer = momentLocalizer(moment);

// カレンダーのメッセージ設定（日本語化）
const messages = {
  today: '今日',
  previous: '前へ',
  next: '次へ',
  month: '月',
  week: '週',
  day: '日',
  agenda: '一覧',
  date: '日付',
  time: '時間',
  event: 'イベント',
  allDay: '終日',
  noEventsInRange: 'この期間にシフトはありません'
};

/**
 * シフトカレンダーコンポーネント
 * react-big-calendarを使用したカレンダー表示
 */
const ShiftCalendar = ({ onSelectShift, onAddShift }) => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shiftTypes, setShiftTypes] = useState({});

  // 初期データ取得
  useEffect(() => {
    loadShifts();
  }, [currentDate]);

  // シフトデータ取得
  const loadShifts = async () => {
    setLoading(true);
    try {
      // 現在の月の最初と最後の日を計算
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      
      const shiftData = await getShiftList(startDate, endDate);
      
      // カレンダー表示用にフォーマット
      const formattedShifts = shiftData.map(shift => ({
        id: shift.id,
        title: shift.title,
        start: new Date(shift.start),
        end: new Date(shift.end),
        staffId: shift.staffId,
        type: shift.type,
        status: shift.status,
        notes: shift.notes,
        allDay: false,
      }));
      
      setShifts(formattedShifts);
      setError(null);
    } catch (err) {
      console.error('シフトデータの読み込みに失敗しました:', err);
      setError('シフトデータを取得できませんでした');
    } finally {
      setLoading(false);
    }
  };

  // 日付範囲変更時の処理
  const handleRangeChange = (range) => {
    if (Array.isArray(range)) {
      // day view
      setCurrentDate(range[0]);
    } else if (range.start) {
      // week or agenda view
      setCurrentDate(range.start);
    }
  };

  // シフト選択時の処理
  const handleSelectEvent = (event) => {
    onSelectShift && onSelectShift(event.id);
  };

  // 新規シフト作成時の処理（カレンダーのスロット選択）
  const handleSelectSlot = ({ start, end }) => {
    onAddShift && onAddShift(start, end);
  };

  // シフトの背景色設定
  const eventPropGetter = (event) => {
    // シフトタイプに応じた色分け（仮設定）
    const colorMap = {
      'regular': '#4299e1', // 通常シフト: 青
      'field': '#68d391',   // 圃場管理: 緑
      'maintenance': '#f6ad55', // 設備保全: オレンジ
      'teaching': '#f687b3',   // 指導・教育: ピンク
      'other': '#a0aec0',    // その他: グレー
    };
    
    return {
      style: {
        backgroundColor: colorMap[event.type] || '#4299e1',
        borderRadius: '3px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
          {error}
        </div>
      )}
      
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="text-lg">読み込み中...</div>
          </div>
        )}
        
        <Calendar
          localizer={localizer}
          events={shifts}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onRangeChange={handleRangeChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={true}
          messages={messages}
          eventPropGetter={eventPropGetter}
          views={['month', 'week', 'day']}
          defaultView="week"
        />
      </div>
    </div>
  );
};

export default ShiftCalendar;