// reportGenerator.js
// 収穫記録（harvests コレクション）からレポートデータを集計するユーティリティ関数
//
// harvests のドキュメント:
//   { harvestDate: Timestamp, houseId, houseName, cropId, cropName, quantity: kg, notes }
// 収穫記録は統計・レポート画面の「収穫記録」から登録する。
//
// Firestore では日付だけで絞り込み（複合インデックス不要）、ハウス・作物の絞り込みは画面側で行う。

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { formatFirestoreData } from '../firestoreUtils';

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * 期間内の収穫記録を取得する（古い順）
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日（その日の終わりまで含む）
 * @returns {Promise<Array>} 収穫記録の配列
 */
export const getHarvests = async (startDate, endDate) => {
  const harvestsQuery = query(
    collection(db, 'harvests'),
    where('harvestDate', '>=', Timestamp.fromDate(startOfDay(startDate))),
    where('harvestDate', '<=', Timestamp.fromDate(endOfDay(endDate))),
    orderBy('harvestDate', 'asc')
  );
  const querySnapshot = await getDocs(harvestsQuery);
  return querySnapshot.docs.map(doc => formatFirestoreData({
    id: doc.id,
    ...doc.data()
  }));
};

// 作物の絞り込み（作物マスタの ID でも、名前の一致でも当てはまる）
const matchesCrop = (harvest, crop) =>
  !crop || harvest.cropId === crop.id || harvest.cropName === crop.name;

const sumQuantity = (harvests) =>
  harvests.reduce((sum, h) => sum + (Number(h.quantity) || 0), 0);

const groupBy = (items, keyOf) => items.reduce((groups, item) => {
  const key = keyOf(item);
  (groups[key] = groups[key] || []).push(item);
  return groups;
}, {});

const round1 = (value) => Math.round(value * 10) / 10;

/**
 * 作物別の生産量（今期・前期・前年同期）
 * 前期は今期の直前の同じ長さの期間、前年同期は1年前の同じ期間
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @param {string} houseId - ハウスID（省略可）
 * @returns {Promise<Array<{name: string, 今期: number, 前期: number, 前年同期: number}>>}
 */
export const getProductionReport = async (startDate, endDate, houseId = null) => {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);
  const length = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - length - 1);
  const prevEnd = new Date(start.getTime() - 1);
  const lastYearStart = new Date(start); lastYearStart.setFullYear(start.getFullYear() - 1);
  const lastYearEnd = new Date(end); lastYearEnd.setFullYear(end.getFullYear() - 1);

  const [current, previous, lastYear] = await Promise.all([
    getHarvests(start, end),
    getHarvests(prevStart, prevEnd),
    getHarvests(lastYearStart, lastYearEnd)
  ]);
  const inHouse = (h) => !houseId || h.houseId === houseId;

  const summary = {};
  const add = (harvests, key) => {
    harvests.filter(inHouse).forEach((h) => {
      const name = h.cropName || '（作物未設定）';
      summary[name] = summary[name] || { name, 今期: 0, 前期: 0, 前年同期: 0 };
      summary[name][key] += Number(h.quantity) || 0;
    });
  };
  add(current, '今期');
  add(previous, '前期');
  add(lastYear, '前年同期');

  // 今期に収穫のある作物を先に、多い順に並べる
  return Object.values(summary)
    .map(row => ({ ...row, 今期: round1(row.今期), 前期: round1(row.前期), 前年同期: round1(row.前年同期) }))
    .sort((a, b) => b.今期 - a.今期);
};

/**
 * ハウス別の生産性（面積あたりの収穫量）
 * 面積はハウス情報の area（m²）を使う。未登録のハウスは生産性 0
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @param {Object} crop - 作物（{id, name}。省略可）
 * @param {Array} houses - ハウス一覧（面積の取得に使う）
 * @returns {Promise<Array<{name: string, totalQuantity: number, totalArea: number, productivity: number}>>}
 */
export const getProductivityReport = async (startDate, endDate, crop = null, houses = []) => {
  const harvests = (await getHarvests(startDate, endDate)).filter(h => matchesCrop(h, crop));
  const byHouse = groupBy(harvests, h => h.houseId || h.houseName || '（ハウス未設定）');

  return Object.entries(byHouse).map(([houseKey, records]) => {
    const house = houses.find(item => item.id === houseKey);
    const totalQuantity = round1(sumQuantity(records));
    const totalArea = Number(house?.area) || 0;
    return {
      name: house?.name || records[0].houseName || houseKey,
      totalQuantity,
      totalArea,
      productivity: totalArea > 0 ? totalQuantity / totalArea : 0
    };
  }).sort((a, b) => b.productivity - a.productivity);
};

/**
 * 作物ごとの月別収穫量の推移（今月を含む直近 months か月）
 * 収穫の無い月・作物は 0 で埋める（グラフと表で全ての月・作物を並べるため）
 * @param {number} months - 何か月分か
 * @param {Object} crop - 作物（{id, name}。省略可）
 * @returns {Promise<Array<{month: string}>>} month は "2026-10" の形
 */
export const getCropTrendsReport = async (months = 12, crop = null) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const harvests = (await getHarvests(start, now)).filter(h => matchesCrop(h, crop));
  if (harvests.length === 0) return [];

  const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const cropNames = [...new Set(harvests.map(h => h.cropName || '（作物未設定）'))];

  const rows = [];
  for (let i = 0; i < months; i++) {
    const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const row = { month: monthKey(date) };
    cropNames.forEach(name => { row[name] = 0; });
    rows.push(row);
  }
  harvests.forEach((h) => {
    if (!(h.harvestDate instanceof Date)) return;
    const row = rows.find(r => r.month === monthKey(h.harvestDate));
    if (row) row[h.cropName || '（作物未設定）'] += Number(h.quantity) || 0;
  });
  rows.forEach(row => cropNames.forEach(name => { row[name] = round1(row[name]); }));
  return rows;
};

/**
 * レポートデータをCSV形式に変換する
 * @param {Array} data - レポートデータの配列
 * @returns {string} CSV形式のデータ
 */
export const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';

  // ヘッダー行を作成
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  // データ行を作成
  const rows = data.map(item => {
    return headers.map(header => {
      // 数値は単位を削除
      if (typeof item[header] === 'number') {
        return item[header];
      }
      // 文字列の場合、カンマを含む場合はダブルクォートで囲む
      return typeof item[header] === 'string' && item[header].includes(',')
        ? `"${item[header]}"`
        : item[header];
    }).join(',');
  });

  // ヘッダー行とデータ行を結合
  return [headerRow, ...rows].join('\n');
};
