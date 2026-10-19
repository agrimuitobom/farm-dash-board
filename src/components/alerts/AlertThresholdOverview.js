import React, { useState } from 'react';
import { Pencil, Info } from 'lucide-react';
import HouseFormModal from '../houses/HouseFormModal';
import { getHouseThresholds } from '../../utils/environmentalRanges';

/**
 * ハウスごとのアラート閾値の一覧
 * 閾値はハウス情報（houses.thresholds）に保存し、ハウスの編集画面で変更する
 */
const AlertThresholdOverview = ({ houses }) => {
  const [editingHouse, setEditingHouse] = useState(null);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-900 space-y-1">
          <p>気温・湿度が下の範囲を外れると、アラートが自動で作られます。範囲内に戻ると自動で解決済みになります。</p>
          <p>センサーから10分以上データが届かないときも「通信なし」のアラートが作られます。</p>
          <p className="text-blue-700">
            判定は Raspberry Pi で動く見張りプログラム（raspberry-pi/alert_monitor.py）が1分ごとに行います。
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">ハウス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">気温</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">湿度</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {houses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">ハウスが登録されていません</td>
              </tr>
            ) : houses.map((house) => {
              const t = getHouseThresholds(house);
              return (
                <tr key={house.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{house.name || house.id}</p>
                    {!house.thresholds && <p className="text-xs text-gray-500">既定値（未設定）</p>}
                  </td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{t.temperature.min} 〜 {t.temperature.max} °C</td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{t.humidity.min} 〜 {t.humidity.max} %</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingHouse(house)}
                      className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      変更
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <HouseFormModal
        isOpen={Boolean(editingHouse)}
        onClose={() => setEditingHouse(null)}
        house={editingHouse}
      />
    </div>
  );
};

export default AlertThresholdOverview;
