import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HouseCard from '../components/HouseCard';
import { hasSoilSensor, withoutUnusedSoil } from './soilSensor';

describe('土壌水分センサーの有無', () => {
  test('「土壌水分センサーあり」のハウスだけ土壌水分を残す', () => {
    const reading = { temperature: 25, humidity: 60, soilMoisture: 100 };
    expect(withoutUnusedSoil({ id: 'h1' }, reading)).toEqual({ temperature: 25, humidity: 60 });
    expect(withoutUnusedSoil({ id: 'h1', hasSoilSensor: false }, reading).soilMoisture).toBeUndefined();
    expect(withoutUnusedSoil({ id: 'h3', hasSoilSensor: true }, reading)).toBe(reading);
    expect(withoutUnusedSoil({ id: 'h1' }, null)).toBeNull();
    expect(hasSoilSensor(undefined)).toBe(false);
  });

  test('ハウスカード: センサーの無いハウスでは 100% を出さない', () => {
    const data = { temperature: 25, humidity: 60, soilMoisture: 100, timestamp: new Date() };
    const without = render(<MemoryRouter><HouseCard house={{ id: 'h1', name: 'ハウス1' }} environmentalData={data} /></MemoryRouter>);
    expect(without.container.textContent).not.toContain('100%');
    expect(without.container.textContent).toContain('土 --%');
    without.unmount();
    const withSensor = render(<MemoryRouter><HouseCard house={{ id: 'h3', name: 'ハウス3', hasSoilSensor: true }} environmentalData={data} /></MemoryRouter>);
    expect(withSensor.container.textContent).toContain('土 100%');
  });
});
