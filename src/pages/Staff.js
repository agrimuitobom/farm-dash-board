import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from '../components/common/Tabs';
import StaffList from '../components/staff/StaffList';
import StaffForm from '../components/staff/StaffForm';
import StaffDetails from '../components/staff/StaffDetails';
import SkillsManager from '../components/staff/SkillsManager';
import { 
  getStaffList, 
  getStaffDetails, 
  saveStaffMember, 
  deleteStaffMember 
} from '../firestoreUtils';

/**
 * スタッフ管理ページコンポーネント
 */
const Staff = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // スタッフリスト取得
  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    setLoading(true);
    try {
      const staff = await getStaffList();
      setStaffList(staff);
      setError(null);
    } catch (err) {
      console.error('スタッフリストの取得に失敗しました:', err);
      setError('スタッフデータの読み込み中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // スタッフ詳細取得
  const fetchStaffDetails = async (staffId) => {
    try {
      const staffDetails = await getStaffDetails(staffId);
      setSelectedStaff(staffDetails);
    } catch (err) {
      console.error('スタッフ詳細の取得に失敗しました:', err);
      setError('スタッフ詳細の読み込み中にエラーが発生しました');
    }
  };

  // スタッフ追加ハンドラ
  const handleAddStaff = () => {
    setSelectedStaff(null);
    setActiveTab('form');
  };

  // スタッフ編集ハンドラ
  const handleEditStaff = (staff) => {
    setSelectedStaff(staff);
    setActiveTab('form');
  };

  // スタッフ詳細表示ハンドラ
  const handleViewDetails = (staff) => {
    setSelectedStaff(staff);
    setActiveTab('details');
  };

  // スタッフ削除ハンドラ
  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('このスタッフを削除してもよろしいですか？')) {
      return;
    }
    
    try {
      await deleteStaffMember(staffId);
      // リストから削除されたスタッフを除外
      setStaffList(staffList.filter(staff => staff.id !== staffId));
    } catch (err) {
      console.error('スタッフの削除に失敗しました:', err);
      alert('スタッフの削除中にエラーが発生しました');
    }
  };

  // フォーム送信ハンドラ
  const handleFormSubmit = async (formData) => {
    try {
      if (selectedStaff) {
        // 既存スタッフの更新
        await saveStaffMember(formData, selectedStaff.id);
      } else {
        // 新規スタッフの追加
        await saveStaffMember(formData);
      }

      // 一覧を更新して一覧タブに戻る
      await fetchStaffList();
      setActiveTab('list');
      return true;
    } catch (err) {
      console.error('スタッフの保存に失敗しました:', err);
      alert('スタッフの保存に失敗しました: ' + (err.message || '不明なエラー'));
      throw err;
    }
  };

  // 一覧に戻るハンドラ
  const handleBackToList = () => {
    setSelectedStaff(null);
    setActiveTab('list');
  };

  // タブ切り替えハンドラ
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'list') {
      setSelectedStaff(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">スタッフ管理</h1>
      
      <Tabs activeTab={activeTab} onChange={handleTabChange}>
        <Tab id="list" label="スタッフ一覧">
          <StaffList 
            staffList={staffList} 
            onAddStaff={handleAddStaff}
            onEditStaff={handleEditStaff}
            onViewDetails={handleViewDetails}
            onDeleteStaff={handleDeleteStaff}
            onRefresh={fetchStaffList}
          />
        </Tab>
        
        <Tab id="form" label={selectedStaff ? 'スタッフ編集' : 'スタッフ追加'}>
          <StaffForm 
            staffData={selectedStaff} 
            onSubmit={handleFormSubmit}
            onCancel={handleBackToList}
          />
        </Tab>
        
        <Tab id="details" label="スタッフ詳細">
          {selectedStaff ? (
            <StaffDetails 
              staff={selectedStaff}
              onBack={handleBackToList}
              onEdit={handleEditStaff}
            />
          ) : (
            <div className="text-center p-8">
              <p>スタッフを選択してください</p>
            </div>
          )}
        </Tab>
        
        <Tab id="skills" label="スキル・資格管理">
          <SkillsManager />
        </Tab>
      </Tabs>
    </div>
  );
};

export default Staff;
