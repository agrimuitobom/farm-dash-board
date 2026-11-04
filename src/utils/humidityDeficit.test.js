import { calcHumidityDeficit, judgeHumidityDeficit } from './humidityDeficit';

describe('飽差', () => {
  test('温度と湿度から計算する（飽和水蒸気量の表とほぼ同じ値になる）', () => {
    // 25℃ の飽和水蒸気量は約 23.0 g/m³
    expect(calcHumidityDeficit(25, 0)).toBeCloseTo(23.0, 0);
    expect(calcHumidityDeficit(25, 60)).toBe(9.2);
    // 20℃ の飽和水蒸気量は約 17.3 g/m³
    expect(calcHumidityDeficit(20, 80)).toBe(3.5);
    expect(calcHumidityDeficit(30, 100)).toBe(0);
  });

  test('計算できないときは null', () => {
    expect(calcHumidityDeficit(null, 60)).toBeNull();
    expect(calcHumidityDeficit(25, undefined)).toBeNull();
    expect(calcHumidityDeficit(NaN, 60)).toBeNull();
  });

  test('湿度が 0〜100% の外でもおかしな値にしない', () => {
    expect(calcHumidityDeficit(25, 105)).toBe(0);
    expect(calcHumidityDeficit(25, -5)).toBe(calcHumidityDeficit(25, 0));
  });

  test('3 未満は多湿、3〜6 は適正、6 を超えると乾燥', () => {
    expect(judgeHumidityDeficit(2.9)).toEqual({ label: '多湿', level: 'low' });
    expect(judgeHumidityDeficit(3)).toEqual({ label: '適正', level: 'ok' });
    expect(judgeHumidityDeficit(6)).toEqual({ label: '適正', level: 'ok' });
    expect(judgeHumidityDeficit(6.1)).toEqual({ label: '乾燥', level: 'high' });
    expect(judgeHumidityDeficit(null)).toEqual({ label: '', level: null });
  });
});
