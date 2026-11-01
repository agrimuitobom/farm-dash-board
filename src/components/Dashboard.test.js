import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import {
  getAllHouses,
  getEnvironmentalReadings,
  getPendingTasks,
  subscribeToUnresolvedAlerts,
  subscribeToEnvironmentalData
} from '../firestoreUtils';

jest.mock('../firestoreUtils', () => ({
  getAllHouses: jest.fn(),
  getEnvironmentalReadings: jest.fn(),
  getPendingTasks: jest.fn(),
  subscribeToUnresolvedAlerts: jest.fn(),
  subscribeToEnvironmentalData: jest.fn(),
  formatFirestoreData: (d) => d
}));

jest.mock('../utils/weather/weatherApi', () => ({
  getCurrentWeather: jest.fn(() => Promise.resolve(null))
}));
jest.mock('./WeatherWidget', () => () => null);
jest.mock('./DailyForecast', () => () => null);
jest.mock('./HouseCard', () => () => null);

// グラフは描かず、渡されたデータだけ確認できるようにする
jest.mock('recharts', () => {
  const Pass = ({ children }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Pass,
    LineChart: ({ data }) => <div data-testid="chart">{data.map(d => d.温度).join(',')}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null
  };
});

const NOW = new Date('2026-11-01T03:00:00Z');
const minutesAgo = (m) => new Date(NOW.getTime() - m * 60 * 1000);

describe('Dashboard の推移グラフ', () => {
  let listeners;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
    listeners = {};
    getAllHouses.mockResolvedValue([{ id: '温室ハウス1', name: '温室ハウス1' }]);
    getPendingTasks.mockResolvedValue([]);
    subscribeToUnresolvedAlerts.mockReturnValue(() => {});
    subscribeToEnvironmentalData.mockImplementation((location, callback) => {
      listeners[location] = callback;
      return () => { delete listeners[location]; };
    });
    // 新しい順で返る
    getEnvironmentalReadings.mockResolvedValue([
      { id: 'b', timestamp: minutesAgo(2), temperature: 21 },
      { id: 'a', timestamp: minutesAgo(4), temperature: 20 }
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('24時間分は最初に1回だけ読み、その後は届いた最新値を付け足す', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await Promise.resolve(); });

    expect(getEnvironmentalReadings).toHaveBeenCalledTimes(1);
    expect(getEnvironmentalReadings).toHaveBeenCalledWith('温室ハウス1', 24);
    expect(screen.getByTestId('chart').textContent).toBe('20,21');

    // リスナーが最初に返す最新値（履歴の最後と同じもの）は重ねない
    act(() => listeners['温室ハウス1']({ id: 'b', timestamp: minutesAgo(2), temperature: 21 }));
    expect(screen.getByTestId('chart').textContent).toBe('20,21');

    // 新しいデータが届いたら付け足す
    act(() => listeners['温室ハウス1']({ id: 'c', timestamp: NOW, temperature: 22 }));
    expect(screen.getByTestId('chart').textContent).toBe('20,21,22');

    // 時間がたっても24時間分を読み直さない
    await act(async () => { jest.advanceTimersByTime(30 * 60 * 1000); });
    expect(getEnvironmentalReadings).toHaveBeenCalledTimes(1);
  });

  test('24時間より古い記録はグラフから外す', async () => {
    getEnvironmentalReadings.mockResolvedValue([
      { id: 'old', timestamp: minutesAgo(24 * 60 - 1), temperature: 10 }
    ]);
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId('chart').textContent).toBe('10');

    act(() => listeners['温室ハウス1']({ id: 'new', timestamp: new Date(NOW.getTime() + 5 * 60 * 1000), temperature: 25 }));
    expect(screen.getByTestId('chart').textContent).toBe('25');
  });
});
