/**
 * User Preferences Modal Component
 * 用户偏好设置模态框 - 工业SCADA风格
 */

import { useState, useEffect } from 'react';
import {
  X,
  Settings,
  RefreshCw,
  Download,
  Upload as UploadIcon,
  Bell,
  BarChart3,
  Monitor,
  AlertCircle,
} from 'lucide-react';
import { message } from 'antd';
import ConfirmModal from './ConfirmModal';
import type { UserPreferences } from '@/utils/userPreferences';
import {
  getUserPreferences,
  saveUserPreferences,
  resetUserPreferences,
  exportPreferences,
  importPreferences,
} from '@/utils/userPreferences';

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChange?: (preferences: UserPreferences) => void;
}

const UserPreferencesModal: React.FC<UserPreferencesModalProps> = ({
  isOpen,
  onClose,
  onPreferencesChange,
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentPrefs = getUserPreferences();
      setPreferences(currentPrefs);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveUserPreferences(preferences);
    onPreferencesChange?.(preferences);
    message.success('偏好设置已保存');
    onClose();
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = () => {
    const defaultPrefs = resetUserPreferences();
    setPreferences(defaultPrefs);
    onPreferencesChange?.(defaultPrefs);
    message.success('已重置为默认设置');
    setShowResetConfirm(false);
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
  };

  const handleExport = () => {
    const jsonString = exportPreferences();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user_preferences_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('设置已导出');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (importPreferences(content)) {
            const importedPrefs = getUserPreferences();
            setPreferences(importedPrefs);
            onPreferencesChange?.(importedPrefs);
            message.success('设置已导入');
          } else {
            message.error('导入失败，请检查文件格式');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 bg-slate-750 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
                用户偏好设置 / USER PREFERENCES
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                SYSTEM CONFIGURATION & SETTINGS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 自动刷新设置 */}
          <div className="bg-slate-900 border border-slate-700 rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw size={18} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                自动刷新 / AUTO REFRESH
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300 font-mono">启用自动刷新</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.autoRefresh}
                    onChange={(e) => setPreferences({ ...preferences, autoRefresh: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm text-slate-300 font-mono mb-2">
                  刷新间隔（秒）
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  step={5}
                  value={preferences.refreshInterval}
                  onChange={(e) => setPreferences({ ...preferences, refreshInterval: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 font-mono mt-1">范围: 5-300秒</p>
              </div>
            </div>
          </div>

          {/* 显示设置 */}
          <div className="bg-slate-900 border border-slate-700 rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <Monitor size={18} className="text-green-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                显示设置 / DISPLAY SETTINGS
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-slate-300 font-mono">仅显示关键设备</label>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    启用后，仪表盘默认只显示异常和严重级别的设备
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.showCriticalDevicesOnly}
                    onChange={(e) => setPreferences({ ...preferences, showCriticalDevicesOnly: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm text-slate-300 font-mono mb-2">
                  默认每页显示数量
                </label>
                <select
                  value={preferences.defaultPageSize}
                  onChange={(e) => setPreferences({ ...preferences, defaultPageSize: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value={10}>10 条/页</option>
                  <option value={20}>20 条/页</option>
                  <option value={50}>50 条/页</option>
                  <option value={100}>100 条/页</option>
                </select>
              </div>
            </div>
          </div>

          {/* 图表设置 */}
          <div className="bg-slate-900 border border-slate-700 rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-purple-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                图表设置 / CHART SETTINGS
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-slate-300 font-mono">启用图表动画</label>
                  <p className="text-xs text-slate-500 font-mono mt-1">禁用动画可提升性能</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.enableAnimations}
                    onChange={(e) => setPreferences({ ...preferences, enableAnimations: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm text-slate-300 font-mono mb-2">图表主题</label>
                <select
                  value={preferences.chartTheme}
                  onChange={(e) => setPreferences({ ...preferences, chartTheme: e.target.value as 'dark' | 'light' })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="dark">深色主题</option>
                  <option value="light">浅色主题</option>
                </select>
              </div>
            </div>
          </div>

          {/* 通知设置 */}
          <div className="bg-slate-900 border border-slate-700 rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={18} className="text-orange-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                通知设置 / NOTIFICATION SETTINGS
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300 font-mono">启用系统通知</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.enableNotifications}
                    onChange={(e) => setPreferences({ ...preferences, enableNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-slate-300 font-mono">严重异常时通知</label>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    检测到严重级别故障时显示通知
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.notifyOnCritical}
                    onChange={(e) => setPreferences({ ...preferences, notifyOnCritical: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-slate-750 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-mono text-sm rounded transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              导出设置
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-mono text-sm rounded transition-colors flex items-center gap-2"
            >
              <UploadIcon size={16} />
              导入设置
            </button>
            <button
              onClick={handleResetClick}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-sm rounded transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              重置
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-mono text-sm rounded transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-sm rounded transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              保存设置
            </button>
          </div>
        </div>
      </div>

      {/* 重置确认对话框 */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="确认重置"
        content="确定要将所有设置重置为默认值吗？此操作不可撤销。"
        type="danger"
        okText="确认重置"
        cancelText="取消"
        onOk={handleResetConfirm}
        onCancel={handleResetCancel}
      />
    </div>
  );
};

export default UserPreferencesModal;
