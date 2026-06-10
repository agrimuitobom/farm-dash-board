import React from 'react';

const HouseHistory = ({ historyData }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-4">栽培履歴</h3>
        <p className="text-gray-600 mb-4">このハウスで過去に栽培された作物の記録です。</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>栽培期間</th>
              <th>作物</th>
              <th>収穫量</th>
              <th>備考</th>
              <th>アクション</th>
            </tr>
          </thead>
          <tbody>
            {historyData.map((item, index) => (
              <tr key={index}>
                <td>{item.date}</td>
                <td>{item.crop}</td>
                <td>{item.harvest}</td>
                <td>{item.notes}</td>
                <td>
                  <button className="text-blue-600 hover:text-blue-800 mr-2">詳細</button>
                  <button className="text-red-600 hover:text-red-800">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HouseHistory;