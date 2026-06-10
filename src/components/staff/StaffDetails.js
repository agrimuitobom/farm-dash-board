import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Edit, Phone, Mail, Award, FileText } from 'lucide-react';
import { getStaffTasks } from '../../firestoreUtils';

/**
 * スタッフ詳細コンポーネント
 * スタッフの詳細情報と割り当てられたタスクを表示
 */
const StaffDetails = ({ staff, onBack, onEdit }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!staff?.id) return;
      
      setLoading(true);
      try {
        const staffTasks = await getStaffTasks(staff.id);
        setTasks(staffTasks);
        setError(null);
      } catch (err) {
        console.error('タスクの取得に失敗しました:', err);
        setError('タスクの読み込み中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [staff?.id]);

  if (!staff) {
    return (
      <div className="text-center py-12">
        <p>スタッフが選択されていません</p>
        <button onClick={onBack} className="btn btn-outline mt-4">
          <ArrowLeft size={16} className="mr-2" />
          戻る
        </button>
      </div>
    );
  }

  // 日付フォーマット関数
  const formatDate = (date) => {
    if (!date) return '-';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleDateString('ja-JP');
  };

  // 有効期限切れの資格を強調表示
  const isCertificationExpired = (expiryDate) => {
    if (!expiryDate) return false;
    
    const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
    if (isNaN(expiry.getTime())) return false;
    
    return expiry < new Date();
  };

  return (
    <div className="staff-details-container">
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="btn btn-ghost btn-sm mr-2"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-xl font-semibold flex-grow">{staff.name}</h2>
        <button
          onClick={() => onEdit(staff)}
          className="btn btn-outline btn-sm"
        >
          <Edit size={16} className="mr-1" />
          編集
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 基本情報 */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">基本情報</h3>
            
            <div className="space-y-3">
              {staff.role && (
                <div className="flex items-start">
                  <div className="badge badge-lg">{staff.role}</div>
                </div>
              )}
              
              {staff.email && (
                <div className="flex items-center">
                  <Mail size={16} className="text-gray-400 mr-2" />
                  <a href={`mailto:${staff.email}`} className="link link-hover">
                    {staff.email}
                  </a>
                </div>
              )}
              
              {staff.phone && (
                <div className="flex items-center">
                  <Phone size={16} className="text-gray-400 mr-2" />
                  <a href={`tel:${staff.phone}`} className="link link-hover">
                    {staff.phone}
                  </a>
                </div>
              )}
              

              
              {staff.notes && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center mb-2">
                    <FileText size={16} className="text-gray-400 mr-2" />
                    <span className="font-medium">メモ</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{staff.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* スキルと資格 */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">スキルと資格</h3>
            
            <div>
              <h4 className="font-medium mb-2">スキル</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {staff.skills?.length > 0 ? (
                  staff.skills.map((skill, index) => (
                    <div key={index} className="badge">
                      {skill}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">登録スキルなし</p>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">資格</h4>
              {staff.certifications?.length > 0 ? (
                <div className="space-y-2">
                  {staff.certifications.map((cert, index) => (
                    <div key={index} className="card card-compact bg-base-200">
                      <div className="card-body p-3">
                        <div className="flex items-center">
                          <Award size={16} className="text-gray-400 mr-2" />
                          <span className="font-medium">{cert.name}</span>
                        </div>
                        <div className="text-sm grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">取得日: </span>
                            {formatDate(cert.issueDate)}
                          </div>
                          <div>
                            <span className="text-gray-500">有効期限: </span>
                            <span className={isCertificationExpired(cert.expiryDate) ? 'text-red-500 font-bold' : ''}>
                              {formatDate(cert.expiryDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">登録資格なし</p>
              )}
            </div>
          </div>
        </div>

        {/* 割り当てタスク */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">割り当てタスク</h3>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : error ? (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="card card-compact bg-base-200">
                    <div className="card-body p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{task.title}</h4>
                        <span className={`badge ${
                          new Date(task.dueDate) < new Date() ? 'badge-error' : 'badge-primary'
                        }`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600">{task.description}</p>
                      )}
                      {task.houseId && (
                        <div className="text-xs text-gray-500">
                          ハウスID: {task.houseId}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4">
                現在、割り当てられたタスクはありません
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetails;
