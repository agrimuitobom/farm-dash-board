import React, { useState } from 'react';
import { Plus, Edit, Eye, Trash2, Search, RefreshCw } from 'lucide-react';

/**
 * スタッフ一覧コンポーネント
 * スタッフ情報を一覧表示し、追加・編集・詳細表示・削除機能を提供する
 */
const StaffList = ({ 
  staffList = [], 
  onAddStaff, 
  onEditStaff, 
  onViewDetails, 
  onDeleteStaff, 
  onRefresh 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // 検索フィルタリング
  const filteredStaff = staffList.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (staff.email && staff.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === '' || staff.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // 役職の一覧（重複を除外）
  const roles = [...new Set(staffList.map(staff => staff.role))].filter(Boolean);

  return (
    <div className="staff-list-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">スタッフ一覧</h2>
        <button
          onClick={onAddStaff}
          className="btn btn-primary flex items-center gap-1"
        >
          <Plus size={16} />
          <span>スタッフ追加</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        {/* 検索ボックス */}
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="input input-bordered pl-10 w-full"
            placeholder="名前またはメールで検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 役職フィルター */}
        <select
          className="select select-bordered"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">全ての役職</option>
          {roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>

        {/* 更新ボタン */}
        <button
          onClick={onRefresh}
          className="btn btn-outline"
        >
          <RefreshCw size={16} className="mr-1" />
          更新
        </button>
      </div>

      {filteredStaff.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">スタッフが見つかりません</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>名前</th>
                <th>役職</th>
                <th>連絡先</th>
                <th>スキル</th>
                <th>アクション</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(staff => (
                <tr key={staff.id}>
                  <td className="font-medium">{staff.name}</td>
                  <td>{staff.role || '-'}</td>
                  <td>
                    {staff.email && <div>{staff.email}</div>}
                    {staff.phone && <div className="text-sm text-gray-500">{staff.phone}</div>}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {staff.skills?.slice(0, 3).map(skill => (
                        <span key={skill} className="badge badge-sm">{skill}</span>
                      ))}
                      {staff.skills?.length > 3 && (
                        <span className="badge badge-sm badge-outline">+{staff.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onViewDetails(staff)}
                        className="btn btn-sm btn-ghost"
                        title="詳細表示"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEditStaff(staff)}
                        className="btn btn-sm btn-ghost"
                        title="編集"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteStaff && onDeleteStaff(staff.id)}
                        className="btn btn-sm btn-ghost text-red-500"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StaffList;
