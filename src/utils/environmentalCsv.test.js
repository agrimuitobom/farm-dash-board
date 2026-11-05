import { buildEnvironmentalCsv, toCsvText } from './environmentalCsv';

// 日本時間（テストは TZ を問わないよう、ローカル時刻で作る）
const at = (h, m) => new Date(2026, 10, 5, h, m);

const house1 = {
  houseName: '温室ハウス1',
  readings: [
    { timestamp: at(9, 2), temperature: 24, humidity: 60 },
    { timestamp: at(9, 0), temperature: 22, humidity: 70 },
    { timestamp: at(9, 12), temperature: 26, humidity: 50 }
  ]
};
const house3 = {
  houseName: '温室ハウス3',
  readings: [
    { timestamp: at(9, 4), temperature: 20, humidity: 80, soilMoisture: 40.04 }
  ]
};

describe('環境データの CSV', () => {
  test('そのまま：1件ずつ、古い順。データのある項目だけ列を作る', () => {
    const { headers, rows } = buildEnvironmentalCsv([house1], 'raw');
    expect(headers).toEqual(['日時', 'ハウス', '温度(℃)', '湿度(%)', '飽差(g/m³)']);
    expect(rows.map(r => r[0])).toEqual(['2026/11/05 09:00', '2026/11/05 09:02', '2026/11/05 09:12']);
    expect(rows[1]).toEqual(['2026/11/05 09:02', '温室ハウス1', 24, 60, 8.7]);
  });

  test('10分ごとの平均：区切りごとに平均し、データ数を付ける', () => {
    const { headers, rows } = buildEnvironmentalCsv([house1, house3], '10min');
    expect(headers).toEqual(['日時', 'ハウス', '温度(℃)', '湿度(%)', '飽差(g/m³)', '土壌水分(%)', 'データ数']);
    expect(rows).toEqual([
      // 9:00 と 9:02 の平均。飽差は1件ずつ計算してから平均する
      ['2026/11/05 09:00', '温室ハウス1', 23, 65, 7.3, '', 2],
      ['2026/11/05 09:10', '温室ハウス1', 26, 50, 12.2, '', 1],
      ['2026/11/05 09:00', '温室ハウス3', 20, 80, 3.5, 40, 1]
    ]);
  });

  test('1日ごと：平均・最高・最低', () => {
    const { headers, rows } = buildEnvironmentalCsv([house1], 'day');
    expect(headers.slice(0, 5)).toEqual(['日付', 'ハウス', '温度平均(℃)', '温度最高(℃)', '温度最低(℃)']);
    expect(rows).toHaveLength(1);
    expect(rows[0].slice(0, 5)).toEqual(['2026/11/05', '温室ハウス1', 24, 26, 22]);
    expect(rows[0][rows[0].length - 1]).toBe(3);
  });

  test('CO2 があれば列ができる（整数）', () => {
    const { headers, rows } = buildEnvironmentalCsv(
      [{ houseName: 'A', readings: [{ timestamp: at(9, 0), temperature: 25, humidity: 60, co2: 612.4 }] }], 'raw');
    expect(headers).toContain('CO2(ppm)');
    expect(rows[0][headers.indexOf('CO2(ppm)')]).toBe(612);
  });

  test('CSV の文字列は BOM 付き・カンマや改行を含む値は囲む', () => {
    const text = toCsvText({ headers: ['a', 'b'], rows: [['x,y', 1], ['"q"', '']] });
    expect(text).toBe('﻿a,b\r\n"x,y",1\r\n"""q""",\r\n');
  });
});
