import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * タッチ操作に最適化した日付選択コンポーネント
 * 大きなタッチエリアとシンプルな操作性を提供
 */
const TouchDatePicker = ({ selectedDate, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [localSelectedDate, setLocalSelectedDate] = useState(new Date(selectedDate));
  
  // 親コンポーネントからの変更を反映
  useEffect(() => {
    setLocalSelectedDate(new Date(selectedDate));
    setCurrentMonth(new Date(selectedDate));
  }, [selectedDate]);

  // 月の日数を取得
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // 月の初日の曜日を取得（0=日曜、1=月曜...）
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // 前月へ移動
  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  // 翌月へ移動
  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // 今日に移動
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setLocalSelectedDate(today);
    onDateChange(today);
  };

  // 日付選択
  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setLocalSelectedDate(newDate);
    onDateChange(newDate);
  };

  // カレンダーの日付配列を生成
  const generateDates = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const dates = [];

    // 前月の日数
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

  // 日本語の月名と曜日
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* ヘッダー - 月選択 */}
      <div className="p-4 border-b flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-3 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          aria-label="前月"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
          </h3>
          <button
            onClick={handleToday}
            className="mt-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full touch-manipulation"
          >
            今日
          </button>
        </div>
        
        <button
          onClick={handleNextMonth}
          className="p-3 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          aria-label="翌月"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekdays.map((day, index) => (
          <div
            key={index}
            className={`text-center py-2 text-sm ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-800'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {generateDates().map((dateObj, index) => {
          // 現在の月かどうかでスタイルを変える
          let bgColor = dateObj.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400';
          
          // 選択中の日付
          if (
            dateObj.isCurrentMonth &&
            localSelectedDate.getDate() === dateObj.day &&
            localSelectedDate.getMonth() === currentMonth.getMonth() &&
            localSelectedDate.getFullYear() === currentMonth.getFullYear()
          ) {
            bgColor = 'bg-green-100 border-2 border-green-500';
          }

          // 今日の日付
          const today = new Date();
          if (
            dateObj.isCurrentMonth &&
            today.getDate() === dateObj.day &&
            today.getMonth() === currentMonth.getMonth() &&
            today.getFullYear() === currentMonth.getFullYear()
          ) {
            if (bgColor.includes('border')) {
              bgColor = 'bg-green-100 border-2 border-green-500';
            } else {
              bgColor = 'bg-yellow-50';
            }
          }

          return (
            <div
              key={index}
              className={`min-h-[60px] p-2 ${bgColor} ${
                index % 7 === 0 ? 'text-red-500' : index % 7 === 6 ? 'text-blue-500' : ''
              } touch-manipulation`}
              onClick={() => dateObj.isCurrentMonth && handleDateClick(dateObj.day)}
            >
              <div className="text-right font-medium">{dateObj.day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TouchDatePicker;