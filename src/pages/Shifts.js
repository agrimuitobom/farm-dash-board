import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from '../components/common/Tabs';
import ShiftCalendar from '../components/shifts/ShiftCalendar';
import ShiftForm from '../components/shifts/ShiftForm';
import ShiftDetails from '../components/shifts/ShiftDetails';
import { getShiftsMasterList } from '../firestoreUtils';

/**
 * シフト管理ページコンポーネント
 */
const Shifts = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedShift, setSelectedShift] = useState(null);
  const [newShiftTime, setNewShiftTime] = useState({ start: null, end: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shiftsMaster, setShiftsMaster] = useState({ types: [], statuses: [] });

  // シフトマスター情報の取得
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const masterData = await getShiftsMasterList();
        setShiftsMaster(masterData);
      } catch (err) {
        console.error('シフトマスター情報の取得に失敗しました:', err);
      }
    };
    
    fetchMasterData();
  }, []);

  // シフト選択時の処理
  const handleSelectShift = (shiftId) => {
    setSelectedShift(shiftId);
    setActiveTab('details');
  };

  // シフト追加時の処理
  const handleAddShift = (start, end) => {
    setSelectedShift(null);
    setNewShiftTime({ start, end });
    setActiveTab('form');
  };

  // シフト削除時の処理
  const handleDeleteShift = () => {
    setSelectedShift(null);
    setActiveTab('calendar');
  };

  // シフト編集時の処理
  const handleEditShift = (shiftId) => {
    setSelectedShift(shiftId);
    setActiveTab('form');
  };

  // フォーム送信時の処理
  const handleFormSubmit = (shiftId) => {
    setActiveTab('calendar');
  };

  // カレンダーに戻る処理
  const handleBackToCalendar = () => {
    setSelectedShift(null);
    setNewShiftTime({ start: null, end: null });
    setActiveTab('calendar');
  };

  // タブ切り替え時の処理
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'calendar') {
      setSelectedShift(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">シフト管理</h1>
      
      <Tabs activeTab={activeTab} onChange={handleTabChange}>
        <Tab id="calendar" label="シフトカレンダー">
          <ShiftCalendar 
            onSelectShift={handleSelectShift}
            onAddShift={handleAddShift}
          />
        </Tab>
        
        <Tab id="form" label={selectedShift ? 'シフト編集' : 'シフト登録'}>
          <ShiftForm 
            shiftId={selectedShift}
            defaultStart={newShiftTime.start}
            defaultEnd={newShiftTime.end}
            onSubmit={handleFormSubmit}
            onCancel={handleBackToCalendar}
          />
        </Tab>
        
        <Tab id="details" label="シフト詳細">
          {selectedShift ? (
            <ShiftDetails 
              shiftId={selectedShift}
              onClose={handleBackToCalendar}
              onEdit={handleEditShift}
              onDelete={handleDeleteShift}
            />
          ) : (
            <div className="text-center p-8">
              <p>シフトを選択してください</p>
            </div>
          )}
        </Tab>
      </Tabs>
    </div>
  );
};

export default Shifts;