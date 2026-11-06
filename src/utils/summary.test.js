import { toJstIso, formatJst, startOfJstDay, summarizeReadings } from './summary';

describe('まとめページの計算', () => {
  test('日本時間で表す（端末のタイムゾーンに関係なく）', () => {
    const t = new Date('2026-11-05T23:12:30Z'); // 日本時間 11/6 08:12:30
    expect(toJstIso(t)).toBe('2026-11-06T08:12:30+09:00');
    expect(formatJst(t)).toBe('2026/11/06 08:12');
    expect(toJstIso(null)).toBeNull();
    expect(formatJst(undefined)).toBe('');
  });

  test('日本時間の今日の0時', () => {
    expect(startOfJstDay(new Date('2026-11-05T23:12:30Z')).toISOString()).toBe('2026-11-05T15:00:00.000Z');
    expect(startOfJstDay(new Date('2026-11-05T14:59:00Z')).toISOString()).toBe('2026-11-04T15:00:00.000Z');
  });

  test('平均・最高・最低。値の無い項目は null、飽差は1件ずつ計算してから集計', () => {
    const s = summarizeReadings([
      { temperature: 22, humidity: 70 },
      { temperature: 24, humidity: 60, co2: 600 },
      { temperature: 26, humidity: 50, co2: 401.6 }
    ]);
    expect(s.count).toBe(3);
    expect(s.temperature).toEqual({ avg: 24, max: 26, min: 22 });
    expect(s.humidity).toEqual({ avg: 60, max: 70, min: 50 });
    expect(s.humidityDeficit).toEqual({ avg: 8.9, max: 12.2, min: 5.8 });
    expect(s.co2).toEqual({ avg: 501, max: 600, min: 402 });
    expect(s.soilMoisture).toBeNull();
    expect(summarizeReadings([]).temperature).toBeNull();
  });
});
