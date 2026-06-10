
      {/* モーダル */}
      <CropAreaFormModal 
        isOpen={showAddCropModal} 
        onClose={() => setShowAddCropModal(false)} 
        onSubmit={handleAddCropArea}
      />
      
      <CropAreaFormModal 
        isOpen={showEditCropModal} 
        onClose={() => {
          setShowEditCropModal(false);
          setCurrentCropArea(null);
        }} 
        onSubmit={handleEditCropArea}
        editingCropArea={currentCropArea}
      />
    </div>
  );
};

export default HouseDetail;
