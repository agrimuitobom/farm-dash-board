import React from 'react';

const HouseTimeline = ({ events }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-6">作業タイムライン</h3>
      
      <div className="relative pl-8 pb-4">
        {/* タイムラインライン */}
        <div className="absolute left-0 top-0 h-full w-1 bg-green-200"></div>
        
        {events.map((event, index) => (
          <div key={index} className="mb-8 relative">
            {/* タイムラインポイント */}
            <div className="absolute left-0 w-8 flex items-center justify-center" style={{ left: '-8px' }}>
              <div className="h-5 w-5 bg-green-500 rounded-full z-10"></div>
            </div>
            
            <div className="bg-white rounded-lg border p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold">{event.title}</h4>
                  <p className="text-gray-600">{event.date}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <button className="text-green-600 text-sm mr-2">編集</button>
                  <button className="text-red-600 text-sm">削除</button>
                </div>
              </div>
              <p className="mt-2 text-gray-700">{event.description}</p>
            </div>
          </div>
        ))}
        
        {/* 新しいイベント追加ボタン */}
        <div className="flex justify-center mt-4">
          <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg">
            + 新しい作業を追加
          </button>
        </div>
      </div>
    </div>
  );
};

export default HouseTimeline;