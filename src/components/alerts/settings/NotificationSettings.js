import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Save, X } from 'lucide-react';

const NotificationSettings = ({ settings, onSave, loading }) => {
  const [notificationSettings, setNotificationSettings] = useState(settings || {
    email: {
      enabled: false,
      addresses: [''],
      levels: {
        low: false,
        medium: true,
        high: true
      }
    },
    sms: {
      enabled: false,
      numbers: [''],
      levels: {
        low: false,
        medium: false,
        high: true
      }
    },
    push: {
      enabled: true,
      levels: {
        low: true,
        medium: true,
        high: true
      }
    },
    lineMessenger: {
      enabled: false,
      token: '',
      levels: {
        low: false,
        medium: true,
        high: true
      }
    }
  });

  // 各通知設定の変更をハンドリング
  const handleToggleEnabled = (type) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled
      }
    }));
  };

  // 優先度レベルの変更をハンドリング
  const handleToggleLevel = (type, level) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        levels: {
          ...prev[type].levels,
          [level]: !prev[type].levels[level]
        }
      }
    }));
  };

  // メールアドレスの変更をハンドリング
  const handleEmailChange = (index, value) => {
    const updatedAddresses = [...notificationSettings.email.addresses];
    updatedAddresses[index] = value;
    
    setNotificationSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        addresses: updatedAddresses
      }
    }));
  };

  // メールアドレスの追加
  const handleAddEmail = () => {
    setNotificationSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        addresses: [...prev.email.addresses, '']
      }
    }));
  };

  // メールアドレスの削除
  const handleRemoveEmail = (index) => {
    const updatedAddresses = [...notificationSettings.email.addresses];
    updatedAddresses.splice(index, 1);
    
    setNotificationSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        addresses: updatedAddresses
      }
    }));
  };

  // 電話番号の変更をハンドリング
  const handleSmsChange = (index, value) => {
    const updatedNumbers = [...notificationSettings.sms.numbers];
    updatedNumbers[index] = value;
    
    setNotificationSettings(prev => ({
      ...prev,
      sms: {
        ...prev.sms,
        numbers: updatedNumbers
      }
    }));
  };

  // 電話番号の追加
  const handleAddSms = () => {
    setNotificationSettings(prev => ({
      ...prev,
      sms: {
        ...prev.sms,
        numbers: [...prev.sms.numbers, '']
      }
    }));
  };

  // 電話番号の削除
  const handleRemoveSms = (index) => {
    const updatedNumbers = [...notificationSettings.sms.numbers];
    updatedNumbers.splice(index, 1);
    
    setNotificationSettings(prev => ({
      ...prev,
      sms: {
        ...prev.sms,
        numbers: updatedNumbers
      }
    }));
  };

  // LINEトークンの変更をハンドリング
  const handleLineTokenChange = (value) => {
    setNotificationSettings(prev => ({
      ...prev,
      lineMessenger: {
        ...prev.lineMessenger,
        token: value
      }
    }));
  };

  // 設定の保存
  const handleSave = () => {
    onSave(notificationSettings);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">通知設定</h2>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">⊙</span>
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              設定を保存
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* アプリ内通知設定 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-medium">アプリ内通知</h3>
            <div className="ml-auto">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationSettings.push.enabled}
                  onChange={() => handleToggleEnabled('push')}
                />
                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>

          <div className="pl-2 border-l-2 border-gray-100">
            <p className="text-sm text-gray-600 mb-3">通知する重要度レベル:</p>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.push.levels.low}
                  onChange={() => handleToggleLevel('push', 'low')}
                  disabled={!notificationSettings.push.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">低 (情報)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.push.levels.medium}
                  onChange={() => handleToggleLevel('push', 'medium')}
                  disabled={!notificationSettings.push.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">中 (警告)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.push.levels.high}
                  onChange={() => handleToggleLevel('push', 'high')}
                  disabled={!notificationSettings.push.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">高 (緊急)</span>
              </label>
            </div>
          </div>
        </div>

        {/* メール通知設定 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <Mail className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium">メール通知</h3>
            <div className="ml-auto">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationSettings.email.enabled}
                  onChange={() => handleToggleEnabled('email')}
                />
                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>

          <div className="pl-2 border-l-2 border-gray-100">
            <p className="text-sm text-gray-600 mb-3">通知する重要度レベル:</p>
            <div className="space-y-2 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.email.levels.low}
                  onChange={() => handleToggleLevel('email', 'low')}
                  disabled={!notificationSettings.email.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">低 (情報)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.email.levels.medium}
                  onChange={() => handleToggleLevel('email', 'medium')}
                  disabled={!notificationSettings.email.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">中 (警告)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.email.levels.high}
                  onChange={() => handleToggleLevel('email', 'high')}
                  disabled={!notificationSettings.email.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">高 (緊急)</span>
              </label>
            </div>

            <p className="text-sm text-gray-600 mb-2">通知先メールアドレス:</p>
            <div className="space-y-2">
              {notificationSettings.email.addresses.map((email, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className="flex-1 p-2 text-sm border border-gray-300 rounded"
                    placeholder="example@example.com"
                    disabled={!notificationSettings.email.enabled}
                  />
                  {notificationSettings.email.addresses.length > 1 && (
                    <button
                      onClick={() => handleRemoveEmail(index)}
                      className="ml-2 p-1 text-red-500 hover:text-red-700"
                      disabled={!notificationSettings.email.enabled}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddEmail}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={!notificationSettings.email.enabled}
              >
                + 別のメールアドレスを追加
              </button>
            </div>
          </div>
        </div>

        {/* SMS通知設定 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <Smartphone className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-lg font-medium">SMS通知</h3>
            <div className="ml-auto">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationSettings.sms.enabled}
                  onChange={() => handleToggleEnabled('sms')}
                />
                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>

          <div className="pl-2 border-l-2 border-gray-100">
            <p className="text-sm text-gray-600 mb-3">通知する重要度レベル:</p>
            <div className="space-y-2 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.sms.levels.low}
                  onChange={() => handleToggleLevel('sms', 'low')}
                  disabled={!notificationSettings.sms.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">低 (情報)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.sms.levels.medium}
                  onChange={() => handleToggleLevel('sms', 'medium')}
                  disabled={!notificationSettings.sms.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">中 (警告)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.sms.levels.high}
                  onChange={() => handleToggleLevel('sms', 'high')}
                  disabled={!notificationSettings.sms.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">高 (緊急)</span>
              </label>
            </div>

            <p className="text-sm text-gray-600 mb-2">通知先電話番号:</p>
            <div className="space-y-2">
              {notificationSettings.sms.numbers.map((number, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="tel"
                    value={number}
                    onChange={(e) => handleSmsChange(index, e.target.value)}
                    className="flex-1 p-2 text-sm border border-gray-300 rounded"
                    placeholder="090-1234-5678"
                    disabled={!notificationSettings.sms.enabled}
                  />
                  {notificationSettings.sms.numbers.length > 1 && (
                    <button
                      onClick={() => handleRemoveSms(index)}
                      className="ml-2 p-1 text-red-500 hover:text-red-700"
                      disabled={!notificationSettings.sms.enabled}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddSms}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={!notificationSettings.sms.enabled}
              >
                + 別の電話番号を追加
              </button>
            </div>
          </div>
        </div>

        {/* LINE通知設定 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-lg font-medium">LINE通知</h3>
            <div className="ml-auto">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationSettings.lineMessenger.enabled}
                  onChange={() => handleToggleEnabled('lineMessenger')}
                />
                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>

          <div className="pl-2 border-l-2 border-gray-100">
            <p className="text-sm text-gray-600 mb-3">通知する重要度レベル:</p>
            <div className="space-y-2 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.lineMessenger.levels.low}
                  onChange={() => handleToggleLevel('lineMessenger', 'low')}
                  disabled={!notificationSettings.lineMessenger.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">低 (情報)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.lineMessenger.levels.medium}
                  onChange={() => handleToggleLevel('lineMessenger', 'medium')}
                  disabled={!notificationSettings.lineMessenger.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">中 (警告)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={notificationSettings.lineMessenger.levels.high}
                  onChange={() => handleToggleLevel('lineMessenger', 'high')}
                  disabled={!notificationSettings.lineMessenger.enabled}
                />
                <span className="ml-2 text-sm text-gray-700">高 (緊急)</span>
              </label>
            </div>

            <p className="text-sm text-gray-600 mb-2">LINEアクセストークン:</p>
            <div>
              <input
                type="text"
                value={notificationSettings.lineMessenger.token}
                onChange={(e) => handleLineTokenChange(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded"
                placeholder="LINE Messaging APIアクセストークン"
                disabled={!notificationSettings.lineMessenger.enabled}
              />
              <p className="mt-1 text-xs text-gray-500">
                LINE Notifyまたは公式アカウントMessaging APIで取得したトークンを入力してください
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;