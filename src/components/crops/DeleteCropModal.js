import React from 'react';

const DeleteCropModal = ({ isOpen, onClose, crop, handleDelete }) => {
  if (!isOpen || !crop) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">作物削除の確認</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-700">本当に「{crop.name}」を削除しますか？</p>
          <p className="mt-2 text-sm text-red-600">この操作は元に戻せません。</p>
        </div>
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCropModal;