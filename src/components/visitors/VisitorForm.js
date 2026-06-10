import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const VisitorForm = ({ visitor, onSave, onCancel }) => {
  const initialFormData = {
    visitorName: '',
    company: '',
    contact: '',
    visitDate: format(new Date(), 'yyyy-MM-dd'),
    visitTime: format(new Date(), 'HH:mm'),
    purpose: '',
    area: '',
    host: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visitor) {
      // 編集モードの場合、既存のデータをフォームに設定
      const visitDate = visitor.visitDate ? 
        format(visitor.visitDate.toDate(), 'yyyy-MM-dd') : 
        format(new Date(), 'yyyy-MM-dd');
      
      const visitTime = visitor.visitTime || format(new Date(), 'HH:mm');

      setFormData({
        visitorName: visitor.visitorName || '',
        company: visitor.company || '',
        contact: visitor.contact || '',
        visitDate,
        visitTime,
        purpose: visitor.purpose || '',
        area: visitor.area || '',
        host: visitor.host || '',
        notes: visitor.notes || ''
      });
    }
  }, [visitor]);

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
    if (!formData.visitorName || !formData.visitDate) {
      toast.error('訪問者名と訪問日は必須です');
      return;
    }

    setLoading(true);
    
    try {
      // visitDateとvisitTimeからタイムスタンプを作成
      const combinedDateTime = new Date(`${formData.visitDate}T${formData.visitTime}`);
      
      // 送信データを整形
      const submissionData = {
        ...formData,
        visitDate: combinedDateTime,
        // visitTimeは文字列として保存
      };
      
      // 親コンポーネントの保存ハンドラを呼び出し
      await onSave(submissionData);
      
      // 新規作成の場合はフォームをクリア
      if (!visitor) {
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
        {visitor ? '訪問者情報の編集' : '新規訪問者登録'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 訪問者名 */}
        <div>
          <label htmlFor="visitorName" className="block text-sm font-medium text-gray-700">
            訪問者名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="visitorName"
            name="visitorName"
            value={formData.visitorName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        
        {/* 会社/組織 */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">
            会社/組織
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        {/* 連絡先 */}
        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
            連絡先
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        {/* 訪問日 */}
        <div>
          <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700">
            訪問日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="visitDate"
            name="visitDate"
            value={formData.visitDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        
        {/* 訪問時間 */}
        <div>
          <label htmlFor="visitTime" className="block text-sm font-medium text-gray-700">
            訪問時間
          </label>
          <input
            type="time"
            id="visitTime"
            name="visitTime"
            value={formData.visitTime}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        {/* 訪問目的 */}
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
            訪問目的
          </label>
          <input
            type="text"
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        {/* 訪問エリア */}
        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700">
            訪問エリア
          </label>
          <input
            type="text"
            id="area"
            name="area"
            value={formData.area}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        {/* 対応者 */}
        <div>
          <label htmlFor="host" className="block text-sm font-medium text-gray-700">
            対応者
          </label>
          <input
            type="text"
            id="host"
            name="host"
            value={formData.host}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* 備考 */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          備考
        </label>
        <textarea
          id="notes"
          name="notes"
          rows="3"
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

export default VisitorForm;