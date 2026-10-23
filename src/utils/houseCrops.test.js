import { summarizeCrops, withCropSummary, toDateValue } from './houseCrops';

const ts = (date) => ({ toDate: () => date });

describe('houseCrops', () => {
  test('栽培作物から作物名と定植日（いちばん早い開始日）を求める', () => {
    const result = summarizeCrops([
      { cropName: 'サラダ菜', startDate: ts(new Date(2026, 9, 10)) },
      { cropName: 'レタス', startDate: '2026-10-01' },
      { cropName: 'サラダ菜', startDate: '' }
    ]);
    expect(result.currentCrop).toBe('サラダ菜・レタス');
    expect(result.plantDate).toEqual(new Date(2026, 9, 1));
  });

  test('栽培作物があればハウスの古い作物名・定植日より優先する', () => {
    const house = withCropSummary({
      id: '温室ハウス1',
      currentCrop: 'R6ミニトマト',
      plantDate: new Date(2025, 1, 14),
      crops: [{ cropName: 'サラダ菜', startDate: '2026-10-05' }]
    });
    expect(house.currentCrop).toBe('サラダ菜');
    expect(house.plantDate).toEqual(new Date(2026, 9, 5));
  });

  test('栽培作物が無いハウスはそのまま', () => {
    const house = { id: 'h', currentCrop: 'キュウリ', plantDate: new Date(2025, 1, 10), crops: [] };
    expect(withCropSummary(house)).toBe(house);
    expect(withCropSummary({ id: 'h2', currentCrop: 'ナス' }).currentCrop).toBe('ナス');
  });

  test('開始日が無い作物だけなら定植日は元の値', () => {
    const house = withCropSummary({ plantDate: new Date(2025, 0, 1), crops: [{ cropName: 'ネギ' }] });
    expect(house.currentCrop).toBe('ネギ');
    expect(house.plantDate).toEqual(new Date(2025, 0, 1));
  });

  test('日付の形式をそろえる', () => {
    expect(toDateValue({ seconds: 0, nanoseconds: 0 })).toEqual(new Date(0));
    expect(toDateValue('not a date')).toBeNull();
    expect(toDateValue(null)).toBeNull();
  });
});
