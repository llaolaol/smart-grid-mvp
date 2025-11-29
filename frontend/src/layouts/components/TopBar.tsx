/**
 * 顶部工具栏 - 精简版
 * 只保留系统信息和用户操作
 */

import { useState } from 'react';
import { Clock, MapPin, Bell, Settings, User } from 'lucide-react';
import DataUploadModal from '../../components/DataUploadModal';
import UserPreferencesModal from '../../components/UserPreferencesModal';

interface TopBarProps {
  onUploadClick?: () => void;
  onSettingsClick?: () => void;
}

const TopBar = ({ onUploadClick, onSettingsClick }: TopBarProps) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  // 获取当前时间
  const getCurrentTime = () => {
    const now = new Date();
    return now
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '-');
  };

  const handleSettingsClick = () => {
    setShowPreferencesModal(true);
    onSettingsClick?.();
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
    onUploadClick?.();
  };

  return (
    <>
      <div className="h-16 bg-slate-800 border-b border-slate-700 shadow-lg flex items-center justify-between px-6">
        {/* 左侧：系统标题 */}
        <div>
          <h1 className="text-base font-bold font-mono tracking-wide text-white">
            500kV 智能变电站监控系统
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            SCADA v3.2.1 | 某某变电站 | 在线监测
          </p>
        </div>

        {/* 右侧：系统信息和用户操作 */}
        <div className="flex items-center gap-6">
          {/* 时间 */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <Clock size={14} className="text-slate-400" />
            <span className="text-slate-300">{getCurrentTime()}</span>
          </div>

          {/* 位置 */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <MapPin size={14} className="text-slate-400" />
            <span className="text-slate-300">运维班组</span>
          </div>

          {/* 系统状态指示器 */}
          <div className="flex items-center gap-2 bg-green-900 bg-opacity-30 px-3 py-1.5 rounded border border-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.9)] animate-pulse"></div>
            <span className="text-xs font-mono text-green-400 font-medium">
              正常运行
            </span>
          </div>

          {/* 分割线 */}
          <div className="w-px h-6 bg-slate-600"></div>

          {/* 通知 */}
          <button
            className="relative p-2 hover:bg-slate-700 rounded transition-colors"
            title="通知"
          >
            <Bell size={18} className="text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* 设置 */}
          <button
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            onClick={handleSettingsClick}
            title="用户偏好设置"
          >
            <Settings size={18} className="text-slate-300" />
          </button>

          {/* 用户 */}
          <button
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title="用户信息"
          >
            <User size={18} className="text-slate-300" />
          </button>
        </div>
      </div>

      {/* 数据上传模态框 */}
      <DataUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      {/* 用户偏好设置模态框 */}
      <UserPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
      />
    </>
  );
};

export default TopBar;
