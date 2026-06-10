/**
 * 日付フォーマット関数
 * @param {Date|string} date - フォーマットする日付
 * @param {string} format - フォーマット文字列
 * @returns {string} フォーマットされた日付文字列
 * 
 * フォーマット文字列：
 * - YYYY: 年（4桁）
 * - MM: 月（2桁）
 * - DD: 日（2桁）
 * - HH: 時（2桁、24時間制）
 * - mm: 分（2桁）
 * - ss: 秒（2桁）
 * - dd: 曜日（日、月、火、水、木、金、土）
 */
export const formatDate = (date, format = 'YYYY/MM/DD HH:mm') => {
  if (!date) return '';
  const d = new Date(date);
  
  // 年、月、日、時、分、秒を取得
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  // 曜日の配列
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[d.getDay()];
  
  // フォーマット文字列を置換
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
    .replace('dd', weekday);
};

/**
 * 日付範囲を取得する関数
 * @param {Date} date - 基準日
 * @param {string} range - 範囲タイプ ('day', 'week', 'month', 'year')
 * @returns {Object} { start: Date, end: Date } 開始日と終了日
 */
export const getDateRange = (date, range = 'month') => {
  const d = new Date(date);
  
  switch (range) {
    case 'day':
      // 当日の00:00:00から23:59:59
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      return { start: dayStart, end: dayEnd };
      
    case 'week':
      // その週の日曜日から土曜日
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay()); // 日曜日に設定
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // 土曜日
      weekEnd.setHours(23, 59, 59, 999);
      
      return { start: weekStart, end: weekEnd };
      
    case 'month':
      // 月初から月末
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      return { start: monthStart, end: monthEnd };
      
    case 'year':
      // 年初から年末
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const yearEnd = new Date(d.getFullYear(), 11, 31, 23, 59, 59);
      return { start: yearStart, end: yearEnd };
      
    default:
      throw new Error(`無効な範囲タイプ: ${range}`);
  }
};