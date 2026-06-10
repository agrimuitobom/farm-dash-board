import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const TrainingForm = ({ training, onSave, onCancel }) => {
  const initialFormData = {
    title: '',
    category: '',
    instructor: '',
    trainingDate: format(new Date(), 'yyyy-MM-dd'),
    duration: '',
    location: '',
    participants: '',
    content: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  // カテゴリーオプション
  const categoryOptions = [
    '安全教育',
    '作業技術',
    '品質管理',
    '衛生管理',
    '環境保全',
    '機械操作',
    '防災訓練',
    'その他'
  ];

  useEffect(() => {
    if (training) {
      // 編集モードの場合、既存のデータをフォームに設定
      const trainingDate = training.trainingDate ? 
        format(training.trainingDate.toDate(), 'yyyy-MM-dd') : 
        format(new Date(), 'yyyy-MM-dd');
      
      setFormData({
        title: training.title || '',
        category: training.category || '',
        instructor: training.instructor || '',
        trainingDate,
        duration: training.duration || '',
        location: training.location || '',
        participants: training.participants || '',
        content: training.content || '',
        notes: training.notes || ''
      });
    }
  }, [training]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 必須項目のバリデーション
    if (!formData.title || !formData.trainingDate) {
      toast.error('タイトルと実施日は必須です');
      return;
    }

    setLoading(true);
    
    try {
      // 日付をタイムスタンプに変換
      const trainingDate = new Date(formData.trainingDate);
      
      // 送信データを整形
      const submissionData = {
        ...formData,
        trainingDate
      };
      
      // 親コンポーネントの保存ハンドラを呼び出し
      await onSave(submissionData);
      
      // 新規作成の場合はフォームをクリア
      if (!training) {
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error('保存中にエラーが発生しました', error);
      toast.error('保存中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">
        {training ? 'トレーニング記録の編集' : '新規トレーニング記録'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* タイトル */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        
        {/* カテゴリ */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            カテゴリー
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {categoryOptions.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        {/* 講師/担当者 */}
        <div>
          <label htmlFor="instructor" className="block text-sm font-medium text-gray-700">
            講師/担当者
          </label>
          <input
            type="text"
            id="instructor"
            name="instructor"
            value={formData.instructor}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        {/* 実施日 */}
        <div>
          <label htmlFor="trainingDate" className="block text-sm font-medium text-gray-700">
            実施日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="trainingDate"
            name="trainingDate"
            value={formData.trainingDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        
        {/* 所要時間 */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            所要時間
          </label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="例: 2時間"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        {/* 実施場所 */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            実施場所
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        {/* 参加者 */}
        <div>
          <label htmlFor="participants" className="block text-sm font-medium text-gray-700">
            参加者
          </label>
          <input
            type="text"
            id="participants"
            name="participants"
            value={formData.participants}
            onChange={handleChange}
            placeholder="例: 全スタッフ10名"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* 内容 */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          内容
        </label>
        <textarea
          id="content"
          name="content"
          rows="3"
          value={formData.content}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        ></textarea>
      </div>
      
      {/* 備考 */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          備考
        </label>
        <textarea
          id="notes"
          name="notes"
          rows="2"
          value={formData.notes}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        ></textarea>
      </div>
      
      {/* ボタン */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={loading}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={loading}
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
};

export default TrainingForm;