// alertGenerator.js
// 環境データに基づいてアラートを自動生成するユーティリティ関数

import { addAlert } from '../firestoreUtils';

/**
 * 環境データをチェックしてアラート条件に合致するか確認
 * @param {Object} environmentalData - 環境データオブジェクト
 * @param {Object} house - ハウス情報オブジェクト（閾値情報を含む）
 * @param {Object} crop - 作物情報オブジェクト（推奨環境条件を含む）
 * @returns {Array} - 生成すべきアラートの配列
 */
export const checkEnvironmentalAlerts = (environmentalData, house, crop) => {
  if (!environmentalData || !house) {
    return [];
  }
  
  const alerts = [];
  
  // デフォルトの閾値（ハウスや作物に設定がない場合）
  const defaultThresholds = {
    temperature: {
      min: 15,
      max: 35,
      warningMin: 18,
      warningMax: 32
    },
    humidity: {
      min: 30,
      max: 90,
      warningMin: 40,
      warningMax: 85
    },
    co2: {
      min: 400,
      max: 2000,
      warningMin: 600,
      warningMax: 1800
    },
    light: {
      min: 1000,
      max: 100000,
      warningMin: 2000,
      warningMax: 80000
    }
  };
  
  // 閾値を決定（優先順位: 作物 > ハウス > デフォルト）
  const getThresholds = (parameter) => {
    if (crop && crop.environmentalConditions && crop.environmentalConditions[parameter]) {
      return crop.environmentalConditions[parameter];
    } else if (house.thresholds && house.thresholds[parameter]) {
      return house.thresholds[parameter];
    } else {
      return defaultThresholds[parameter];
    }
  };
  
  // 温度のチェック
  if (environmentalData.temperature !== undefined) {
    const temp = environmentalData.temperature;
    const thresholds = getThresholds('temperature');
    
    if (temp > thresholds.max) {
      alerts.push({
        type: 'temperature',
        title: `温度が高すぎます: ${temp}°C`,
        description: `${house.name}の温度が最大閾値(${thresholds.max}°C)を超えています。熱中症や作物へのダメージを防ぐために至急対応してください。`,
        severity: 'high',
        houseId: house.id,
        houseName: house.name,
        timestamp: environmentalData.timestamp,
        value: temp,
        threshold: thresholds.max,
        status: 'pending'
      });
    } else if (temp > thresholds.warningMax) {
      alerts.push({
        type: 'temperature',
        title: `温度が高くなっています: ${temp}°C`,
        description: `${house.name}の温度が警告閾値(${thresholds.warningMax}°C)を超えています。冷却または換気を検討してください。`,
        severity: 'medium',
        houseId: house.id,
        houseName: house.name,
        timestamp: environmentalData.timestamp,
        value: temp,
        threshold: thresholds.warningMax,
        status: 'pending'
      });
    } else if (temp < thresholds.min) {
      alerts.push({
        type: 'temperature',
        title: `温度が低すぎます: ${temp}°C`,
        description: `${house.name}の温度が最小閾値(${thresholds.min}°C)を下回っています。作物の凍結や成長障害を防ぐために暖房を検討してください。`,
        severity: 'high',
        houseId: house.id,
        houseName: house.name,
        timestamp: environmentalData.timestamp,
        value: temp,
        threshold: thresholds.min,
        status: 'pending'
      });
    } else if (temp < thresholds.warningMin) {
      alerts.push({
        type: 'temperature',
        title: `温度が低くなっています: ${temp}°C`,
        description: `${house.name}の温度が警告閾値(${thresholds.warningMin}°C)を下回っています。暖房の状態を確認してください。`,
        severity: 'medium',
        houseId: house.id,
        houseName: house.name,
        timestamp: environmentalData.timestamp,
        value: temp,
        threshold: thresholds.warningMin,
        status: 'pending'
      });
    }
  }
  
  // 湿度のチェック
  if (environmentalData.humidity !== undefined) {
    const humidity = environmentalData.humidity;
    const thresholds = getThresholds('humidity');
    
    if (humidity > thresholds.max) {
      alerts.push({
        type: 'humidity',
        title: `湿度が高すぎます: ${humidity}%`,
        description: `${house.name}の湿度が最大閾値(${thresholds.max}%)を超えています。カビや病気の発生リスクが高まっています。除湿または換気を行ってください。`,
        severity: 'high',
        houseId: house.id,
        houseName: house.name,
        timestamp: environmentalData.timestamp,
        value: humidity,
        threshold: thresholds.max,
        status: 'pending'
      });
    } else if (humidity > thresholds.warningMax) {
      alerts.push({
        type: 'humidity',
        title: `湿度が高くなっています: ${humidity}%`,
        description: `${house.name}の湿度が警告閾値(${thresholds.warningMax}%)を超えています。換気を検討してください。`,
        severity: 'medium',
        houseId: house.id,
        houseName: house.name,
        timestamp: environmentalData.timestamp,
        value: humidity,
        threshold: thresholds.warningMax,
        status: 'pending'
      });
    } else if (humidity < thresholds.min) {
      alerts.push({
        type: 'humidity',
        title: `湿度が低すぎます: ${humidity}%`,
        description: `${house.name}の湿度が最小閾値(${thresholds.min}%)を下回っています。作物の乾燥ストレスを防ぐために加湿を検討してください。`,
        severity: 'high',
        houseId: house.id,
        houseName: house.name,
        timestamp: environmentalData.timestamp,
        value: humidity,
        threshold: thresholds.min,
        status: 'pending'
      });
    } else if (humidity < thresholds.warningMin) {
      alerts.push({
        type: 'humidity',
        title: `湿度が低くなっています: ${humidity}%`,
        description: `${house.name}の湿度が警告閾値(${thresholds.warningMin}%)を下回っています。加湿器の状態を確認してください。`,
        severity: 'medium',
        houseId: house.id,
        houseName: house.name,
        timestamp: environmentalData.timestamp,
        value: humidity,
        threshold: thresholds.warningMin,
        status: 'pending'
      });
    }
  }
  
  return alerts;
};

/**
 * 生成されたアラート候補を検証し、Firestoreに登録する
 * 同じタイプの未解決アラートが短時間に複数発生しないようにする
 * @param {Array} alertCandidates - アラートの候補配列
 * @param {Array} existingAlerts - 既存の未解決アラート配列
 * @returns {Promise<Array>} - 新たに登録されたアラートのID配列
 */
export const processAndSaveAlerts = async (alertCandidates, existingAlerts) => {
  if (!alertCandidates || alertCandidates.length === 0) {
    return [];
  }
  
  const newAlertIds = [];
  const now = new Date();
  
  // 各アラート候補についてチェック
  for (const alertCandidate of alertCandidates) {
    // 同じタイプ、同じハウス、未解決のアラートが既に存在するかチェック
    const duplicateAlert = existingAlerts.find(alert => 
      alert.type === alertCandidate.type && 
      alert.houseId === alertCandidate.houseId && 
      alert.resolved === false
    );
    
    // 既存アラートのタイムスタンプが30分以内の場合はスキップ（重複防止）
    if (duplicateAlert) {
      const alertTime = new Date(duplicateAlert.timestamp);
      const diffInMinutes = (now - alertTime) / (1000 * 60);
      
      if (diffInMinutes < 30) {
        continue;
      }
    }
    
    // アラートを保存
    try {
      const alertId = await addAlert(alertCandidate);
      if (alertId) {
        newAlertIds.push(alertId);
      }
    } catch (error) {
      console.error('アラートの保存中にエラーが発生しました:', error);
    }
  }
  
  return newAlertIds;
};

/**
 * ハウスの環境データを監視してアラートを自動生成する
 * @param {Object} environmentalData - 最新の環境データ
 * @param {Object} house - ハウス情報
 * @param {Object} crop - 作物情報（オプション）
 * @param {Array} existingAlerts - 既存の未解決アラート
 * @returns {Promise<Array>} - 新たに登録されたアラートのID配列
 */
export const monitorAndAlertEnvironmental = async (environmentalData, house, crop, existingAlerts) => {
  // 環境データをチェックしてアラート候補を生成
  const alertCandidates = checkEnvironmentalAlerts(environmentalData, house, crop);
  
  // アラートを処理して登録
  return await processAndSaveAlerts(alertCandidates, existingAlerts);
};