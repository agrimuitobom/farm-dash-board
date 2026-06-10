    
    // データ読み込み実行
    fetchHouseData();
    fetchEnvironmentalData();
    
    // リアルタイム監視の設定
    const unsubscribeHouse = subscribeToHouse(id, (updatedHouse) => {
      if (updatedHouse) {
        setHouse(updatedHouse);
      }
    });
    
    const unsubscribeEnv = subscribeToEnvironmentalData(id, (latestEnvData) => {
      if (latestEnvData) {
        setEnvData(latestEnvData);
        setEnvHistory(prevHistory => {
          // 同じデータが既にある場合は追加しない
          const exists = prevHistory.some(item => item.id === latestEnvData.id);
          if (exists) return prevHistory;
          
          // 最新のデータを先頭に追加
          return [latestEnvData, ...prevHistory];
        });
      }
    });
    
    // コンポーネントのアンマウント時に監視を解除
    return () => {
      unsubscribeHouse();
      unsubscribeEnv();
    };
  }, [id]);
  
  // 作物エリア追加処理
  const handleAddCropArea = async (cropAreaData) => {
    try {
      await addCropAreaToHouse(id, cropAreaData);
      // ハウスデータは自動的に更新されるため、ここでは何もしない
    } catch (err) {
      console.error('作物エリア追加エラー:', err);
      alert('作物エリアの追加に失敗しました');
    }
  };
  
  // 作物エリア編集処理
  const handleEditCropArea = async (cropAreaData) => {
    try {
      await updateCropArea(id, editingCropArea.id, cropAreaData);
      setEditingCropArea(null);
    } catch (err) {
      console.error('作物エリア更新エラー:', err);
      alert('作物エリアの更新に失敗しました');
    }
  };
  
  // 作物エリア削除処理
  const handleRemoveCropArea = async (areaId) => {
    if (!window.confirm('この作物エリアを削除してもよろしいですか？')) {
      return;
    }
    
    try {
      await removeCropArea(id, areaId);
      // ハウスデータは自動的に更新されるため、ここでは何もしない
    } catch (err) {
      console.error('作物エリア削除エラー:', err);
      alert('作物エリアの削除に失敗しました');
    }
  };
  
  // 作物エリア編集モーダルを開く
  const openEditCropAreaModal = (cropArea) => {
    setEditingCropArea(cropArea);
    setIsAddCropAreaModalOpen(true);
  };