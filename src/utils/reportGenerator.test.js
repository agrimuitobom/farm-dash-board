import { getDocs, query, where } from 'firebase/firestore';
import {
  getHarvests,
  getProductionReport,
  getProductivityReport,
  getCropTrendsReport,
  convertToCSV
} from './reportGenerator';

jest.mock('../firebase', () => ({ db: {}, auth: {} }));

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    getDocs: jest.fn()
  };
});

const { Timestamp } = jest.requireActual('firebase/firestore');

const harvest = (id, date, houseId, houseName, cropName, quantity, cropId = '') => ({
  id, houseId, houseName, cropName, cropId, quantity,
  harvestDate: Timestamp.fromDate(date)
});

const ALL = [
  harvest('a', new Date(2026, 9, 5, 12), 'h1', '1号ハウス', 'ミニトマト', 10, 'c1'),
  harvest('b', new Date(2026, 9, 12, 12), 'h2', '2号ハウス', 'ミニトマト', 5.5, 'c1'),
  harvest('c', new Date(2026, 9, 15, 12), 'h1', '1号ハウス', 'イチゴ', 3),
  harvest('d', new Date(2026, 8, 20, 12), 'h1', '1号ハウス', 'ミニトマト', 4, 'c1'), // 前期
  harvest('e', new Date(2025, 9, 10, 12), 'h2', '2号ハウス', 'ミニトマト', 7, 'c1') // 前年同期
];

// where 条件の範囲に入る収穫記録だけ返す（Firestore の代わり）
// CRA の resetMocks で実装が消えるので、テストごとに設定する
const mockFirestore = () => {
  query.mockImplementation((...args) => args);
  where.mockImplementation((field, op, value) => ({ field, op, value }));
  getDocs.mockImplementation(async (args) => {
    const [, from, to] = args;
    const docs = ALL
      .filter(h => h.harvestDate.toMillis() >= from.value.toMillis() && h.harvestDate.toMillis() <= to.value.toMillis())
      .sort((x, y) => x.harvestDate.toMillis() - y.harvestDate.toMillis())
      .map(({ id, ...data }) => ({ id, data: () => data }));
    return { docs };
  });
};

describe('reportGenerator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 20, 10));
    mockFirestore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('getHarvests は収穫日を Date に変換して返す', async () => {
    const records = await getHarvests(new Date(2026, 9, 1), new Date(2026, 9, 31));
    expect(records.map(r => r.id)).toEqual(['a', 'b', 'c']);
    expect(records[0].harvestDate).toBeInstanceOf(Date);
  });

  test('生産量レポートは今期・前期・前年同期を作物別に集計する', async () => {
    const rows = await getProductionReport(new Date(2026, 9, 1), new Date(2026, 9, 31));
    expect(rows).toEqual([
      { name: 'ミニトマト', 今期: 15.5, 前期: 4, 前年同期: 7 },
      { name: 'イチゴ', 今期: 3, 前期: 0, 前年同期: 0 }
    ]);
  });

  test('生産量レポートはハウスで絞り込める', async () => {
    const rows = await getProductionReport(new Date(2026, 9, 1), new Date(2026, 9, 31), 'h2');
    expect(rows).toEqual([{ name: 'ミニトマト', 今期: 5.5, 前期: 0, 前年同期: 7 }]);
  });

  test('生産性レポートはハウスの面積で割り、作物で絞り込める', async () => {
    const houses = [{ id: 'h1', name: '1号ハウス', area: 100 }, { id: 'h2', name: '2号ハウス' }];
    const rows = await getProductivityReport(
      new Date(2026, 9, 1), new Date(2026, 9, 31), { id: 'c1', name: 'ミニトマト' }, houses
    );
    expect(rows).toEqual([
      { name: '1号ハウス', totalQuantity: 10, totalArea: 100, productivity: 0.1 },
      { name: '2号ハウス', totalQuantity: 5.5, totalArea: 0, productivity: 0 }
    ]);
  });

  test('推移レポートは月ごとに集計し、収穫の無い月は 0 で埋める', async () => {
    const rows = await getCropTrendsReport(3);
    expect(rows).toEqual([
      { month: '2026-08', ミニトマト: 0, イチゴ: 0 },
      { month: '2026-09', ミニトマト: 4, イチゴ: 0 },
      { month: '2026-10', ミニトマト: 15.5, イチゴ: 3 }
    ]);
  });

  test('収穫記録が無ければ推移レポートは空', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    expect(await getCropTrendsReport(12)).toEqual([]);
  });

  test('CSV に変換できる', () => {
    expect(convertToCSV([{ name: 'A,B', 今期: 1 }])).toBe('name,今期\n"A,B",1');
  });
});
