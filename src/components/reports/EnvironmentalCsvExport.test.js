import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnvironmentalCsvExport from './EnvironmentalCsvExport';
import { getEnvironmentalReadingsBetween } from '../../firestoreUtils';

jest.mock('../../firestoreUtils', () => ({
  getEnvironmentalReadingsBetween: jest.fn()
}));
jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));

const houses = [{ id: 'h1', name: '温室ハウス1' }, { id: 'h3', name: '温室ハウス3' }];

// Blob の中身をバイト列で読む（jsdom の Blob には text() が無い）
const readBytes = (blob) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = () => resolve(Buffer.from(reader.result));
  reader.readAsArrayBuffer(blob);
});

describe('環境データの CSV ダウンロード', () => {
  let blobs;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 5, 12, 0));
    blobs = [];
    global.URL.createObjectURL = jest.fn((blob) => { blobs.push(blob); return 'blob:x'; });
    global.URL.revokeObjectURL = jest.fn();
    getEnvironmentalReadingsBetween.mockImplementation(async (houseId) => ({
      readings: [
        { timestamp: new Date(2026, 10, 5, 9, 2), temperature: 24, humidity: 60, ...(houseId === 'h3' ? { co2: 600 } : {}) },
        { timestamp: new Date(2026, 10, 5, 9, 0), temperature: 22, humidity: 70 }
      ],
      bundleCount: 1
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('読み取り件数の目安を出し、全ハウスを10分平均の CSV にする', async () => {
    render(<EnvironmentalCsvExport houses={houses} />);
    // 7日分 × 24時間 + 1 = 169件 × 2ハウス
    const summary = screen.getByText((_, el) => el.tagName === 'P' && el.textContent.startsWith('2ハウス・7日分'));
    expect(summary.textContent).toContain('Firestore の読み取り 約338件');

    fireEvent.click(screen.getByRole('button', { name: /ダウンロード/ }));
    await waitFor(() => expect(blobs).toHaveLength(1));

    expect(getEnvironmentalReadingsBetween).toHaveBeenCalledTimes(2);
    const [, start, end] = getEnvironmentalReadingsBetween.mock.calls[0];
    expect(start).toEqual(new Date(2026, 9, 30, 0, 0));
    expect(end).toEqual(new Date(2026, 10, 5, 23, 59, 59, 999));

    const bytes = await readBytes(blobs[0]);
    expect([...bytes.subarray(0, 3)]).toEqual([0xEF, 0xBB, 0xBF]); // Excel 用の BOM
    const lines = bytes.subarray(3).toString('utf8').trim().split('\r\n');
    expect(lines[0]).toBe('日時,ハウス,温度(℃),湿度(%),飽差(g/m³),CO2(ppm),データ数');
    expect(lines.slice(1)).toEqual([
      '2026/11/05 09:00,温室ハウス1,23,65,7.3,,2',
      '2026/11/05 09:00,温室ハウス3,23,65,7.3,600,2'
    ]);
  });

  test('期間が長すぎるとダウンロードできない', () => {
    render(<EnvironmentalCsvExport houses={houses} />);
    fireEvent.change(screen.getByLabelText('開始日'), { target: { value: '2026-07-01' } });
    expect(screen.getByText('一度にダウンロードできるのは92日までです')).toBeTruthy();
    expect(screen.getByRole('button', { name: /ダウンロード/ }).disabled).toBe(true);
  });
});
