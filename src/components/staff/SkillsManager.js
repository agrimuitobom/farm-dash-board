import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Check } from 'lucide-react';
import { getSkillsMasterList, updateSkillsMasterList } from '../../firestoreUtils';

/**
 * スキルと資格のマスターリスト管理コンポーネント
 */
const SkillsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // スキルと資格のリスト
  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  
  // 新しいスキル/資格の入力
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getSkillsMasterList();
        setSkills(data.skills || []);
        setCertifications(data.certifications || []);
        setError(null);
      } catch (err) {
        console.error('スキル・資格マスターリストの取得に失敗しました:', err);
        setError('データの読み込み中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // スキル追加
  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  // スキル削除
  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // 資格追加
  const handleAddCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  // 資格削除
  const handleRemoveCertification = (certToRemove) => {
    setCertifications(certifications.filter(cert => cert !== certToRemove));
  };

  // 保存処理
  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    
    try {
      await updateSkillsMasterList({
        skills,
        certifications
      });
      setSuccess(true);
      setError(null);
      
      // 成功メッセージを一定時間後に消す
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('スキル・資格マスターリストの保存に失敗しました:', err);
      setError('データの保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="skills-manager-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">スキル・資格マスター管理</h2>
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <>
              <Save size={16} className="mr-1" />
              保存
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          <Check size={16} />
          <span>スキル・資格マスターリストを保存しました</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* スキルマスター */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">スキルマスター</h3>
            <p className="text-sm text-gray-500 mb-4">
              スタッフに割り当て可能なスキルを管理します
            </p>

            {/* スキル追加フォーム */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                className="input input-bordered flex-grow"
                placeholder="新しいスキルを入力..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <button
                className="btn btn-primary"
                onClick={handleAddSkill}
                disabled={!newSkill.trim()}
              >
                <Plus size={16} />
                追加
              </button>
            </div>

            {/* スキルリスト */}
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <div key={index} className="badge badge-lg gap-1">
                    {skill}
                    <button 
                      className="hover:text-red-500" 
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">スキルが登録されていません</p>
              )}
            </div>
          </div>
        </div>

        {/* 資格マスター */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">資格マスター</h3>
            <p className="text-sm text-gray-500 mb-4">
              スタッフが取得可能な資格を管理します
            </p>

            {/* 資格追加フォーム */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                className="input input-bordered flex-grow"
                placeholder="新しい資格を入力..."
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCertification()}
              />
              <button
                className="btn btn-primary"
                onClick={handleAddCertification}
                disabled={!newCertification.trim()}
              >
                <Plus size={16} />
                追加
              </button>
            </div>

            {/* 資格リスト */}
            <div className="flex flex-wrap gap-2">
              {certifications.length > 0 ? (
                certifications.map((cert, index) => (
                  <div key={index} className="badge badge-lg gap-1">
                    {cert}
                    <button 
                      className="hover:text-red-500" 
                      onClick={() => handleRemoveCertification(cert)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">資格が登録されていません</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsManager;
