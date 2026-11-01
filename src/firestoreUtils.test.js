import { getDocs, where, documentId } from 'firebase/firestore';
import { getEnvironmentalReadings } from './firestoreUtils';

jest.mock('./firebase', () => ({ db: {}, auth: {} }));

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    documentId: jest.fn(),
    getDocs: jest.fn()
  };
});

const { Timestamp } = jest.requireActual('firebase/firestore');

const NOW = new Date('2026-11-02T03:30:00Z');
const at = (iso) => Timestamp.fromDate(new Date(iso));
const snapshot = (docs) => ({ empty: docs.length === 0, docs: docs.map(data => ({ id: data.id, data: () => data })) });

describe('getEnvironmentalReadings（1時間ごとのまとめから読む）', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    documentId.mockReturnValue('__name__');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('ID の範囲で読み、計測値を新しい順に並べて24時間より前は外す', async () => {
    getDocs.mockResolvedValueOnce(snapshot([
      { id: '温室ハウス1_2026110103', location: '温室ハウス1', readings: [
        { t: at('2026-11-01T03:10:00Z'), temperature: 18, humidity: 70 }, // 24時間より前
        { t: at('2026-11-01T03:40:00Z'), temperature: 19, humidity: 69 }
      ] },
      { id: '温室ハウス1_2026110203', location: '温室ハウス1', readings: [
        { t: at('2026-11-02T03:02:00Z'), temperature: 25, humidity: 60, soilMoisture: 40 },
        { t: at('2026-11-02T03:00:00Z'), temperature: 24, humidity: 61 }
      ] }
    ]));

    const readings = await getEnvironmentalReadings('温室ハウス1', 24);

    expect(where).toHaveBeenCalledWith('__name__', '>=', '温室ハウス1_2026110103');
    expect(where).toHaveBeenCalledWith('__name__', '<=', '温室ハウス1_2026110203');
    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(readings.map(r => r.temperature)).toEqual([25, 24, 19]);
    expect(readings[0].timestamp).toEqual(new Date('2026-11-02T03:02:00Z'));
    expect(readings[0].soilMoisture).toBe(40);
    expect(readings[1].soilMoisture).toBeUndefined();
  });

  test('まとめがまだ無ければ、24時間以内は1件ずつのデータから読む', async () => {
    getDocs
      .mockResolvedValueOnce(snapshot([]))
      .mockResolvedValueOnce(snapshot([{ id: 'raw1', location: '温室ハウス1', temperature: 22, timestamp: at('2026-11-02T03:00:00Z') }]));

    const readings = await getEnvironmentalReadings('温室ハウス1', 24);

    expect(getDocs).toHaveBeenCalledTimes(2);
    expect(readings).toHaveLength(1);
    expect(readings[0].temperature).toBe(22);
  });

  test('まとめが無いとき、1週間は1件ずつ読まない（読み取りが多すぎるため）', async () => {
    getDocs.mockResolvedValueOnce(snapshot([]));

    const readings = await getEnvironmentalReadings('温室ハウス1', 168);

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(readings).toEqual([]);
  });
});
