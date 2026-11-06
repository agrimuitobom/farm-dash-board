import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Summary from './Summary';
import {
  getAllHouses,
  subscribeToEnvironmentalData,
  subscribeToUnresolvedAlerts,
  getEnvironmentalReadingsBetween
} from '../firestoreUtils';
import { getCurrentWeather, getDailyForecast } from '../utils/weather/weatherApi';

jest.mock('../firestoreUtils', () => ({
  getAllHouses: jest.fn(),
  subscribeToEnvironmentalData: jest.fn(),
  subscribeToUnresolvedAlerts: jest.fn(),
  getEnvironmentalReadingsBetween: jest.fn()
}));
jest.mock('../utils/weather/weatherApi', () => ({
  getCurrentWeather: jest.fn(),
  getDailyForecast: jest.fn()
}));

const NOW = new Date('2026-11-05T23:30:00Z'); // 日本時間 11/6 08:30
const minutesAgo = (m) => new Date(NOW.getTime() - m * 60000);

const flush = async () => {
  for (let i = 0; i < 5; i++) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => { await Promise.resolve(); });
  }
};

const readJson = () => JSON.parse(document.getElementById('summary-json').textContent);

describe('まとめページ', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    getAllHouses.mockResolvedValue([
      { id: '温室ハウス1', name: '温室ハウス1', currentCrop: 'サラダ菜' },
      { id: '温室ハウス2', name: '温室ハウス2' }
    ]);
    subscribeToEnvironmentalData.mockImplementation((id, callback) => {
      callback(id === '温室ハウス1'
        ? { timestamp: minutesAgo(3), temperature: 31.04, humidity: 60, co2: 612.4 }
        : { timestamp: minutesAgo(45), temperature: 20, humidity: 70 });
      return () => {};
    });
    subscribeToUnresolvedAlerts.mockImplementation((callback) => {
      callback([{ id: 'a1', title: '温室ハウス1の気温が高すぎます', houseId: '温室ハウス1', severity: 'high', timestamp: minutesAgo(10) }]);
      return () => {};
    });
    getEnvironmentalReadingsBetween.mockResolvedValue({
      readings: [{ timestamp: minutesAgo(30), temperature: 22, humidity: 70 }, { timestamp: minutesAgo(5), temperature: 26, humidity: 50 }],
      bundleCount: 1
    });
    getCurrentWeather.mockResolvedValue({ observedAt: minutesAgo(15), weather: { description: '晴れ' }, temp: 14.2, humidity: 71 });
    getDailyForecast.mockResolvedValue([{ date: new Date(2026, 10, 6), description: '晴れ', max: 20, min: 9, precipitationProbability: 10 }]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('最新値・測定時刻・今日のまとめ・アラートを表と JSON で出す', async () => {
    render(<Summary />);
    await flush();

    expect(screen.getByText('読み込み完了')).toBeTruthy();
    const json = readJson();
    expect(json.status).toBe('ready');
    expect(json.generated_at).toBe('2026-11-06T08:30:00+09:00');

    const [h1, h2] = json.houses;
    expect(h1).toMatchObject({
      name: '温室ハウス1', crop: 'サラダ菜', status: '受信中',
      measured_at: '2026-11-06T08:27:00+09:00', age_minutes: 3,
      temperature: 31, humidity: 60, humidity_deficit: 12.8, co2: 612, notes: ['高温']
    });
    expect(h1.today.temperature).toEqual({ avg: 24, max: 26, min: 22 });
    // 45分前のデータは「通信なし」
    expect(h2).toMatchObject({ status: '通信なし', age_minutes: 45 });

    expect(json.alerts).toEqual([
      { house: '温室ハウス1', title: '温室ハウス1の気温が高すぎます', severity: 'high', occurred_at: '2026-11-06T08:20:00+09:00' }
    ]);
    expect(json.weather.description).toBe('晴れ');
    expect(screen.getAllByText('通信なし').length).toBeGreaterThan(0);
  });

  test('ハウスを取得できなければ、見本のデータを出さずにエラーを出す', async () => {
    getAllHouses.mockRejectedValue(new Error('offline'));
    render(<Summary />);
    await flush();

    const json = readJson();
    expect(json.status).toBe('partial');
    expect(json.houses).toEqual([]);
    expect(json.errors[0]).toMatch(/ハウスの一覧を取得できませんでした/);
    expect(screen.getByText(/取得エラー/)).toBeTruthy();
  });
});
