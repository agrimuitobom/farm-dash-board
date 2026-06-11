import React, { useState, useEffect } from 'react';
import { X, Check, Calendar } from 'lucide-react';
import { getSkillsMasterList } from '../../firestoreUtils';

/**
 * スタッフ情報フォームコンポーネント
 * スタッフ情報の新規追加・編集に使用される
 */
const StaffForm = ({ staffData = null, onSubmit, onCancel }) => {
  const isEditing = !!staffData;
  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableCertifications, setAvailableCertifications] = useState([]);
  
  // フォームの状態
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    skills: [],
    certifications: [],
    notes: ''
  });

  // 新しいスキル入力
  const [newSkill, setNewSkill] = useState('');
  
  // 新しい資格入力
  const [newCertification, setNewCertification] = useState({
    name: '',
    issueDate: '',
    expiryDate: ''
  });

  // 初期データ読み込み
  useEffect(() => {
    // 編集モードの場合、データを設定
    if (staffData) {
      setFormData({
        name: staffData.name || '',
        role: staffData.role || '',
        email: staffData.email || '',
        phone: staffData.phone || '',
        skills: staffData.skills || [],
        certifications: staffData.certifications || [],
        notes: staffData.notes || ''
      });
    }
    
    // スキルと資格のマスターリストを取得
    const fetchMasterLists = async () => {
      try {
        const { skills, certifications } = await getSkillsMasterList();
        setAvailableSkills(skills || []);
        setAvailableCertifications(certifications || []);
      } catch (error) {
        console.error('スキル・資格マスターリストの取得に失敗しました:', error);
      }
    };
    
    fetchMasterLists();
  }, [staffData]);

  // 入力値変更ハンドラ
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // スキル追加
  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  // スキル削除
  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // 資格追加
  const handleAddCertification = () => {
    if (newCertification.name.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, { ...newCertification }]
      }));
      setNewCertification({
        name: '',
        issueDate: '',
        expiryDate: ''
      });
    }
  };

  // 資格削除
  const handleRemoveCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  // フォーム送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 日付型に変換
      const formattedData = {
        ...formData,
        certifications: formData.certifications.map(cert => ({
          ...cert,
          issueDate: cert.issueDate ? new Date(cert.issueDate) : null,
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null
        }))
      };
      
      await onSubmit(formattedData);
    } catch (error) {
      console.error('スタッフデータの保存中にエラーが発生しました:', error);
      alert('スタッフデータの保存に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ユーティリティ関数: 日付をinput用に整形
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="staff-form-container">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'スタッフ情報編集' : 'スタッフ追加'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報セクション */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">基本情報</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 名前 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">名前 <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="input input-bordered"
                  placeholder="氏名"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* 役職 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">役職</span>
                </label>
                <select
                  name="role"
                  className="select select-bordered w-full"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="">選択してください</option>
                  <option value="校長">校長</option>
                  <option value="教頭">教頭</option>
                  <option value="農場長">農場長</option>
                  <option value="教諭">教諭</option>
                  <option value="実習助手">実習助手</option>
                  <option value="教育業務支援員">教育業務支援員</option>
                </select>
              </div>

              {/* メール */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">メールアドレス</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="input input-bordered"
                  placeholder="example@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* 電話番号 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">電話番号</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="input input-bordered"
                  placeholder="090-1234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>


            </div>
          </div>
        </div>

        {/* スキルセクション */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">スキル</h3>
            
            {/* 現在のスキル */}
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.skills.map((skill, index) => (
                <div key={index} className="badge badge-lg gap-1">
                  {skill}
                  <button 
                    type="button" 
                    className="hover:text-red-500" 
                    onClick={() => handleRemoveSkill(skill)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {formData.skills.length === 0 && (
                <div className="text-gray-500 text-sm">登録されているスキルはありません</div>
              )}
            </div>
            
            {/* 新しいスキル追加 */}
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-grow"
                placeholder="新しいスキルを入力"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddSkill}
                disabled={!newSkill.trim()}
              >
                追加
              </button>
            </div>
          </div>
        </div>

        {/* 資格セクション */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">資格</h3>
            
            {/* 現在の資格 */}
            {formData.certifications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>資格名</th>
                      <th>取得日</th>
                      <th>有効期限</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.certifications.map((cert, index) => (
                      <tr key={index}>
                        <td>{cert.name}</td>
                        <td>{cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : '-'}</td>
                        <td>
                          {cert.expiryDate ? (
                            <span className={
                              new Date(cert.expiryDate) < new Date() 
                              ? 'text-red-500' 
                              : ''
                            }>
                              {new Date(cert.expiryDate).toLocaleDateString()}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost text-red-500"
                            onClick={() => handleRemoveCertification(index)}
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500 text-sm mb-4">登録されている資格はありません</div>
            )}
            
            {/* 新しい資格追加 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="md:col-span-1">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="資格名を入力"
                  value={newCertification.name}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="flex">
                <div className="flex-1 mr-2">
                  <div className="text-xs text-gray-500 mb-1">取得日</div>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={newCertification.issueDate}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, issueDate: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">有効期限</div>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={newCertification.expiryDate}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="md:col-span-3 mt-2">
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={handleAddCertification}
                  disabled={!newCertification.name.trim()}
                >
                  資格を追加
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* メモセクション */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">メモ</h3>
            <textarea
              name="notes"
              className="textarea textarea-bordered w-full"
              placeholder="スタッフに関するメモ..."
              rows="3"
              value={formData.notes}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>

        {/* フォームアクション */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={loading}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <Check size={18} className="mr-2" />
                {isEditing ? '更新' : '追加'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StaffForm;
