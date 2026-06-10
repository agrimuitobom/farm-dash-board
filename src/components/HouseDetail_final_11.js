      {/* 作物エリア追加/編集モーダル */}
      {isAddCropAreaModalOpen && (
        <CropAreaFormModal
          isOpen={isAddCropAreaModalOpen}
          onClose={() => {
            setIsAddCropAreaModalOpen(false);
            setEditingCropArea(null);
          }}
          onSubmit={editingCropArea ? handleEditCropArea : handleAddCropArea}
          editingCropArea={editingCropArea}
        />
      )}
    </div>
  );
};

export default HouseDetail;