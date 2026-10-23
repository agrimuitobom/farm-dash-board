import { parseDailyForecast, getForecastDayLabel } from './weatherApi';

// Open-Meteo /v1/forecast の daily の応答（ドキュメントの形式）
const SAMPLE = {
  daily: {
    time: ['2026-10-23', '2026-10-24', '2026-10-25'],
    weather_code: [1, 61, 3],
    temperature_2m_max: [22.4, 17.8, 16.2],
    temperature_2m_min: [13.2, 5.0, 4.2],
    precipitation_probability_max: [10, 85, null],
    precipitation_sum: [0, 12.4, 0],
    wind_speed_10m_max: [3.1, 6.8, 2.2]
  }
};

describe('parseDailyForecast', () => {
  test('日ごとの予報に変換する', () => {
    const days = parseDailyForecast(SAMPLE);
    expect(days).toHaveLength(3);
    expect(days[0]).toEqual({
      date: new Date(2026, 9, 23),
      code: 1,
      description: '晴れ',
      max: 22.4,
      min: 13.2,
      precipitationProbability: 10,
      precipitation: 0,
      windMax: 3.1,
      lowTemp: false,
      rainy: false
    });
  });

  test('最低気温5℃以下で低温注意、降水確率60%以上で雨を付ける', () => {
    const [, rainyDay, coldDay] = parseDailyForecast(SAMPLE);
    expect(rainyDay.description).toBe('小雨');
    expect(rainyDay.rainy).toBe(true);
    expect(rainyDay.lowTemp).toBe(true); // ちょうど 5℃
    expect(coldDay.lowTemp).toBe(true);
    expect(coldDay.precipitationProbability).toBeNull();
    expect(coldDay.rainy).toBe(false);
  });

  test('daily が無ければ空', () => {
    expect(parseDailyForecast({})).toEqual([]);
  });
});

describe('getForecastDayLabel', () => {
  const now = new Date(2026, 9, 23, 18, 30);

  test('今日・明日・それ以降は日付と曜日', () => {
    expect(getForecastDayLabel(new Date(2026, 9, 23), now)).toBe('今日');
    expect(getForecastDayLabel(new Date(2026, 9, 24), now)).toBe('明日');
    expect(getForecastDayLabel(new Date(2026, 9, 25), now)).toBe('10/25(日)');
    expect(getForecastDayLabel(new Date(2026, 10, 1), now)).toBe('11/1(日)');
  });
});
