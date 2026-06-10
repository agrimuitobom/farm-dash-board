// mockFirebase.js
// Firebase接続問題を解決するためのモックデータの実装

// モックデータ構造
const mockDatabase = {
  // 作物履歴データ
  crop_history: [
    {
      id: 'history1',
      houseId: 'house1',
      cropName: 'ミニトマト',
      variety: 'R5種',
      startDate: new Date('2025-01-10'),
      endDate: new Date('2025-03-30'),
      harvestAmount: 220,
      notes: '冬季栽培品種',
      harvestNotes: '収量は平均的だが品質良好',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'history2',
      houseId: 'house2',
      cropName: 'キュウリ',
      variety: '夏みずみ',
      startDate: new Date('2024-12-05'),
      endDate: new Date('2025-02-28'),
      harvestAmount: 180,
      notes: '疲れのため早期完了',
      harvestNotes: '精選して税量確保',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  // シフト関連データ
  shifts: [
    {
      id: 'shift1',
      title: '日勤シフト',
      staffId: 'staff1',
      start: new Date('2025-04-05T09:00:00'),
      end: new Date('2025-04-05T17:00:00'),
      type: 'regular',
      status: 'scheduled',
      notes: '通常の日勤シフト',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'shift2',
      title: '午後シフト',
      staffId: 'staff2',
      start: new Date('2025-04-05T13:00:00'),
      end: new Date('2025-04-05T21:00:00'),
      type: 'regular',
      status: 'scheduled',
      notes: '通常の午後シフト',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'shift3',
      title: '農場管理シフト',
      staffId: 'staff1',
      start: new Date('2025-04-06T09:00:00'),
      end: new Date('2025-04-06T17:00:00'),
      type: 'field',
      status: 'scheduled',
      notes: '圃場の管理作業',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  // スタッフ関連データ
  staff: [
    {
      id: 'staff1',
      name: 'テスト 太郎',
      role: '教諭',
      email: 'test@example.com',
      phone: '090-1234-5678',
      skills: ['農業技術', 'IT知識'],
      certifications: [
        { 
          name: '普通自動車免許', 
          issueDate: new Date('2020-01-01'), 
          expiryDate: new Date('2030-01-01') 
        }
      ],
      isActive: true,
      assignedTasks: [],
      notes: 'テスト用スタッフです',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'staff2',
      name: '開発 花子',
      role: '実習助手',
      email: 'hanako@example.com',
      phone: '090-8765-4321',
      skills: ['トラクター運転', '英語'],
      certifications: [
        { 
          name: '大型特殊免許', 
          issueDate: new Date('2019-05-15'), 
          expiryDate: new Date('2029-05-15') 
        }
      ],
      isActive: true,
      assignedTasks: [],
      notes: 'テスト用スタッフ2です',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  // 設定関連データ
  settings: {
    skillsMaster: {
      skills: ['農業技術', 'トラクター運転', 'IT知識', '英語', '簿記'],
      certifications: ['普通自動車免許', '大型特殊免許', '危険物取扱者', '簿記検定'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    shiftsMaster: {
      types: [
        { id: 'regular', name: '通常シフト', color: '#4299e1' },
        { id: 'field', name: '圃場管理', color: '#68d391' },
        { id: 'maintenance', name: '設備保全', color: '#f6ad55' },
        { id: 'teaching', name: '指導・教育', color: '#f687b3' },
        { id: 'other', name: 'その他', color: '#a0aec0' }
      ],
      statuses: [
        { id: 'draft', name: '下書き', color: '#a0aec0' },
        { id: 'scheduled', name: '予定', color: '#4299e1' },
        { id: 'confirmed', name: '確定', color: '#68d391' },
        { id: 'in-progress', name: '実行中', color: '#f6ad55' },
        { id: 'completed', name: '完了', color: '#48bb78' },
        { id: 'cancelled', name: 'キャンセル', color: '#f56565' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  
  // ハウス関連データ
  houses: [
    {
      id: 'house1',
      name: '温室ハウス1',
      currentCropId: 'crop1',
      currentCrop: 'R6ミニトマト',
      plantDate: new Date('2025-02-15'),
      transplantDate: new Date('2025-03-01'),
      fertilizeDate: new Date('2025-03-20'),
      fertilizeInfo: '有機肥料500g/株',
      harvestAmount: 15,
      status: '生育中',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'house2',
      name: '温室ハウス2',
      currentCropId: 'crop3',
      currentCrop: 'キュウリ',
      plantDate: new Date('2025-02-10'),
      transplantDate: new Date('2025-02-25'),
      fertilizeDate: new Date('2025-03-15'),
      fertilizeInfo: '液肥散布',
      harvestAmount: 23,
      status: '生育中',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'house3',
      name: '温室ハウス3',
      currentCropId: 'crop4',
      currentCrop: 'パプリカ',
      plantDate: new Date('2025-01-20'),
      transplantDate: new Date('2025-02-10'),
      fertilizeDate: new Date('2025-03-05'),
      fertilizeInfo: '複合肥料300g/株',
      harvestAmount: 12,
      status: '生育中',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'house4',
      name: '温室ハウス4',
      currentCropId: 'crop2',
      currentCrop: 'レタス',
      plantDate: new Date('2025-02-28'),
      transplantDate: new Date('2025-03-15'),
      fertilizeDate: new Date('2025-03-25'),
      fertilizeInfo: '有機肥料200g/株',
      harvestAmount: 8,
      status: '生育中',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'house5',
      name: '温室ハウス5',
      currentCropId: 'crop5',
      currentCrop: 'ナス',
      plantDate: new Date('2025-02-05'),
      transplantDate: new Date('2025-02-20'),
      fertilizeDate: new Date('2025-03-10'),
      fertilizeInfo: '有機肥料450g/株',
      harvestAmount: 18,
      status: '生育中',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  // 作物関連データ
  crops: [
    {
      id: 'crop1',
      name: '長期ミニトマト R6',
      season: '春-夏',
      growthDays: 90,
      avgYield: '15kg/㎡',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'crop2',
      name: '葉レタス サンチュ',
      season: '秋-冬',
      growthDays: 45,
      avgYield: '5kg/㎡',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'crop3',
      name: 'キュウリ 夏すずみ',
      season: '夏',
      growthDays: 60,
      avgYield: '10kg/㎡',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'crop4',
      name: 'パプリカ オレンジ',
      season: '春-夏',
      growthDays: 120,
      avgYield: '8kg/㎡',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'crop5',
      name: 'ナス 黒真珠',
      season: '夏',
      growthDays: 80,
      avgYield: '12kg/㎡',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  // 環境データ関連
  environmental_data: [
    {
      id: 'env1',
      location: 'outdoor',
      temperature: 23.5,
      humidity: 65,
      soilMoisture: 78,
      sunlight: 85,
      timestamp: new Date('2025-04-05T14:00:00'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'env2',
      location: 'house1',
      temperature: 26.8,
      humidity: 72,
      soilMoisture: 82,
      sunlight: 90,
      timestamp: new Date('2025-04-05T14:00:00'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'env3',
      location: 'house2',
      temperature: 25.2,
      humidity: 68,
      soilMoisture: 75,
      sunlight: 85,
      timestamp: new Date('2025-04-05T14:00:00'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  // タスク関連データ
  tasks: [
    {
      id: 'task1',
      title: '温室ハウス2の水やり',
      description: '午後に全体的に水やりが必要',
      houseId: 'house2',
      assignedTo: 'staff1',
      dueDate: new Date('2025-04-06'),
      priority: '高',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'task2',
      title: 'トマトの収穫',
      description: '成熟した果実を中心に収穫する',
      houseId: 'house1',
      assignedTo: null,
      dueDate: new Date('2025-04-07'),
      priority: '中',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'task3',
      title: '温室ハウス4の追肥',
      description: '液肥を使用して追肥する',
      houseId: 'house4',
      assignedTo: 'staff2',
      dueDate: new Date('2025-04-08'),
      priority: '中',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  // アラート関連データ
  alerts: [
    {
      id: 'alert1',
      title: '温室ハウス1の温度が高すぎます',
      description: '設定温度を28℃としていますが、31℃を超えています',
      houseId: 'house1',
      severity: '警告',
      resolved: false,
      timestamp: new Date('2025-04-05T09:23:00'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'alert2',
      title: '温室ハウス3の湿度が低すぎます',
      description: '湿度が40%を下回っています。通常は60-70%を維持してください',
      houseId: 'house3',
      severity: '注意',
      resolved: false,
      timestamp: new Date('2025-04-05T08:45:00'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'alert3',
      title: '温室ハウス5の土壌水分が低下しています',
      description: '土壌水分が40%を下回っています。灌水が必要です',
      houseId: 'house5',
      severity: '警告',
      resolved: false,
      timestamp: new Date('2025-04-04T22:15:00'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

// モック実装用ユーティリティ
export const mockFirestoreUtils = {
  // ======= 共通ユーティリティ =======
  serverTimestamp: () => new Date(),
  arrayUnion: (...items) => items,
  arrayRemove: (...items) => items,
  
  // ======= シフト関連 =======
  getShiftList: (startDate, endDate) => {
    const shifts = mockDatabase.shifts.filter(shift => {
      return shift.start >= new Date(startDate) && shift.start <= new Date(endDate);
    });
    return Promise.resolve(shifts);
  },
  
  saveShift: (shiftData, shiftId = null) => {
    if (shiftId) {
      // 既存シフトの更新
      const index = mockDatabase.shifts.findIndex(s => s.id === shiftId);
      if (index !== -1) {
        mockDatabase.shifts[index] = {
          ...mockDatabase.shifts[index],
          ...shiftData,
          updatedAt: new Date()
        };
      }
      return Promise.resolve(shiftId);
    } else {
      // 新規シフトの追加
      const newId = 'shift' + (mockDatabase.shifts.length + 1);
      const newShift = {
        id: newId,
        ...shiftData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockDatabase.shifts.push(newShift);
      return Promise.resolve(newId);
    }
  },
  
  deleteShift: (shiftId) => {
    const index = mockDatabase.shifts.findIndex(s => s.id === shiftId);
    if (index !== -1) {
      mockDatabase.shifts.splice(index, 1);
    }
    return Promise.resolve(true);
  },
  
  getStaffShifts: (staffId, startDate, endDate) => {
    const shifts = mockDatabase.shifts.filter(shift => {
      return shift.staffId === staffId &&
             shift.start >= new Date(startDate) &&
             shift.start <= new Date(endDate);
    });
    return Promise.resolve(shifts);
  },
  
  getShiftDetails: (shiftId) => {
    const shift = mockDatabase.shifts.find(s => s.id === shiftId);
    if (shift) {
      return Promise.resolve(shift);
    }
    return Promise.reject(new Error(`シフトID ${shiftId} が見つかりません`));
  },
  
  getShiftsMasterList: () => {
    return Promise.resolve(mockDatabase.settings.shiftsMaster);
  },
  
  // ======= スタッフ関連 =======
  getStaffList: () => {
    const activeStaff = mockDatabase.staff.filter(s => s.isActive);
    return Promise.resolve(activeStaff);
  },
  
  getStaffDetails: (staffId) => {
    const staff = mockDatabase.staff.find(s => s.id === staffId);
    if (staff) {
      return Promise.resolve(staff);
    }
    return Promise.reject(new Error(`スタッフID ${staffId} が見つかりません`));
  },
  
  saveStaffMember: (staffData, staffId = null) => {
    if (staffId) {
      // 既存スタッフの更新
      const index = mockDatabase.staff.findIndex(s => s.id === staffId);
      if (index !== -1) {
        mockDatabase.staff[index] = {
          ...mockDatabase.staff[index],
          ...staffData,
          updatedAt: new Date()
        };
      }
      return Promise.resolve(staffId);
    } else {
      // 新規スタッフの追加
      const newId = 'staff' + (mockDatabase.staff.length + 1);
      const newStaff = {
        id: newId,
        ...staffData,
        isActive: true,
        assignedTasks: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockDatabase.staff.push(newStaff);
      return Promise.resolve(newId);
    }
  },
  
  deleteStaffMember: (staffId) => {
    const index = mockDatabase.staff.findIndex(s => s.id === staffId);
    if (index !== -1) {
      mockDatabase.staff[index].isActive = false;
      mockDatabase.staff[index].updatedAt = new Date();
    }
    return Promise.resolve(true);
  },
  
  getStaffTasks: (staffId) => {
    const tasks = mockDatabase.tasks.filter(task => 
      task.assignedTo === staffId && !task.completed
    );
    return Promise.resolve(tasks);
  },
  
  getSkillsMasterList: () => {
    return Promise.resolve(mockDatabase.settings.skillsMaster);
  },
  
  updateSkillsMasterList: (data) => {
    mockDatabase.settings.skillsMaster = {
      ...mockDatabase.settings.skillsMaster,
      ...data,
      updatedAt: new Date()
    };
    return Promise.resolve(true);
  },
  
  // ======= ハウス関連 =======
  getAllHouses: () => {
    const houses = mockDatabase.houses.filter(h => h.isActive);
    return Promise.resolve(houses);
  },
  
  getHouseById: (houseId) => {
    const house = mockDatabase.houses.find(h => h.id === houseId);
    if (house) {
      return Promise.resolve(house);
    }
    return Promise.reject(new Error(`ハウスID ${houseId} が見つかりません`));
  },
  
  subscribeToHouse: (houseId, callback) => {
    // モック環境では即時にデータを返す
    const house = mockDatabase.houses.find(h => h.id === houseId);
    setTimeout(() => {
      callback(house || null);
    }, 0);
    // 空の関数を返して、実際の監視解除関数のように扱える
    return () => {};
  },
  
  subscribeToHouses: (callback) => {
    // モック環境では即時にデータを返す
    const houses = mockDatabase.houses.filter(h => h.isActive);
    setTimeout(() => {
      callback(houses);
    }, 0);
    // 空の関数を返して、実際の監視解除関数のように扱える
    return () => {};
  },
  
  // ======= 環境データ関連 =======
  getLatestEnvironmentalData: (location) => {
    const envData = mockDatabase.environmental_data
      .filter(e => e.location === location)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    return Promise.resolve(envData || null);
  },
  
  getEnvironmentalHistory: (location, hours = 24) => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);
    
    const history = mockDatabase.environmental_data
      .filter(e => e.location === location && e.timestamp >= startTime)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return Promise.resolve(history);
  },
  
  subscribeToEnvironmentalData: (location, callback) => {
    // モック環境では即時にデータを返す
    const latestData = mockDatabase.environmental_data
      .filter(e => e.location === location)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    setTimeout(() => {
      callback(latestData || null);
    }, 0);
    
    // 空の関数を返して、実際の監視解除関数のように扱える
    return () => {};
  },
  
  // ======= タスク関連 =======
  addTask: (taskData) => {
    const newId = 'task' + (mockDatabase.tasks.length + 1);
    const newTask = {
      id: newId,
      ...taskData,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDatabase.tasks.push(newTask);
    return Promise.resolve(newId);
  },
  
  updateTask: (taskId, taskData) => {
    const index = mockDatabase.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      mockDatabase.tasks[index] = {
        ...mockDatabase.tasks[index],
        ...taskData,
        updatedAt: new Date()
      };
    }
    return Promise.resolve(true);
  },
  
  getTasks: (limitCount = 100) => {
    return Promise.resolve(mockDatabase.tasks.slice(0, limitCount));
  },
  
  getPendingTasks: (limitCount = 10) => {
    const tasks = mockDatabase.tasks
      .filter(t => !t.completed)
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, limitCount);
    
    return Promise.resolve(tasks);
  },
  
  getTasksByHouse: (houseId) => {
    const tasks = mockDatabase.tasks
      .filter(t => t.houseId === houseId && !t.completed)
      .sort((a, b) => a.dueDate - b.dueDate);
    
    return Promise.resolve(tasks);
  },
  
  // ======= アラート関連 =======
  getUnresolvedAlerts: (limitCount = 10) => {
    const alerts = mockDatabase.alerts
      .filter(a => !a.resolved)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limitCount);
    
    return Promise.resolve(alerts);
  },
  
  getAlertsByHouse: (houseId) => {
    const alerts = mockDatabase.alerts
      .filter(a => a.houseId === houseId)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return Promise.resolve(alerts);
  },
  
  resolveAlert: (alertId, resolutionData) => {
    const index = mockDatabase.alerts.findIndex(a => a.id === alertId);
    if (index !== -1) {
      mockDatabase.alerts[index] = {
        ...mockDatabase.alerts[index],
        resolved: true,
        resolvedAt: new Date(),
        resolution: resolutionData.resolution || '',
        resolvedBy: resolutionData.resolvedBy || '',
        actionTaken: resolutionData.actionTaken || '',
        updatedAt: new Date()
      };
    }
    return Promise.resolve(true);
  },
  
  // ======= 作物履歴関連 =======
  getCropHistory: (houseId) => {
    const history = mockDatabase.crop_history.filter(h => h.houseId === houseId);
    return Promise.resolve(history);
  },
  
  moveCropToHistory: (houseId, cropData) => {
    const newId = 'history' + (mockDatabase.crop_history.length + 1);
    
    // 日付型を変換
    const startDate = cropData.startDate ? new Date(cropData.startDate) : null;
    const endDate = cropData.endDate ? new Date(cropData.endDate) : new Date();
    
    const newHistory = {
      id: newId,
      houseId,
      cropName: cropData.cropName,
      variety: cropData.variety || '',
      startDate,
      endDate,
      harvestAmount: cropData.harvestAmount || 0,
      notes: cropData.notes || '',
      harvestNotes: cropData.harvestNotes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockDatabase.crop_history.push(newHistory);
    return Promise.resolve(newId);
  },
  
  // ======= 作物関連 =======
  getAllCrops: () => {
    return Promise.resolve(mockDatabase.crops);
  },
  
  getHousesByCrop: (cropId) => {
    const houses = mockDatabase.houses
      .filter(h => h.currentCropId === cropId && h.isActive);
    
    return Promise.resolve(houses);
  },
  
  addCrop: (cropData) => {
    const newId = 'crop' + (mockDatabase.crops.length + 1);
    const newCrop = {
      id: newId,
      ...cropData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDatabase.crops.push(newCrop);
    return Promise.resolve(newId);
  },
  
  updateCrop: (cropId, cropData) => {
    const index = mockDatabase.crops.findIndex(c => c.id === cropId);
    if (index !== -1) {
      mockDatabase.crops[index] = {
        ...mockDatabase.crops[index],
        ...cropData,
        updatedAt: new Date()
      };
    }
    return Promise.resolve(true);
  },
  
  deleteCrop: (cropId) => {
    const index = mockDatabase.crops.findIndex(c => c.id === cropId);
    if (index !== -1) {
      mockDatabase.crops.splice(index, 1);
    }
    return Promise.resolve(true);
  }
};
