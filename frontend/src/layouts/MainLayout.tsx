/**
 * Industrial Main Layout
 * 500kV智能变电站监控系统 - 工业风格主布局
 */

import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Tooltip } from 'antd';
import {
  Zap,
  Clock,
  MapPin,
  Bell,
  Settings,
  User,
  Home,
  Database,
  TrendingUp,
  FileText,
  Upload,
  Camera,
  AlertTriangle,
  Bot,
  Info,
  List
} from 'lucide-react';
import DataUploadModal from '../components/DataUploadModal';
import UserPreferencesModal from '../components/UserPreferencesModal';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  // 获取当前时间
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  };

  // 获取当前激活的tab
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'monitor';
    if (path === '/monitor') return 'monitor';
    // 保留/devices访问时也显示monitor tab高亮，因为DeviceList是原有功能
    if (path === '/devices' || path.startsWith('/devices/')) return 'monitor';
    if (path === '/data') return 'data';
    if (path === '/diagnosis' || path === '/simulation' || path === '/ai-assistant' || path === '/comparison') return 'analysis';
    if (path === '/report') return 'report';
    return 'monitor';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: string) => {
    switch (tab) {
      case 'monitor':
        navigate('/dashboard'); // 场景概览仪表盘
        break;
      case 'data':
        navigate('/data');
        break;
      case 'analysis':
        navigate('/diagnosis');
        break;
      case 'report':
        navigate('/report');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* 顶部工具栏 */}
      <div className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold font-mono tracking-wide">500kV 智能变电站监控系统</h1>
              <p className="text-xs text-slate-400 font-mono">SCADA v3.2.1 | 某某变电站 | 在线监测</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Clock size={14} />
              <span className="text-slate-300">{getCurrentTime()}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <MapPin size={14} />
              <span className="text-slate-300">运维班组</span>
            </div>
            <button className="relative p-2 hover:bg-slate-700 rounded transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
            <button
              className="p-2 hover:bg-slate-700 rounded transition-colors"
              onClick={() => setShowPreferencesModal(true)}
              title="用户偏好设置"
            >
              <Settings size={18} />
            </button>
            <button className="p-2 hover:bg-slate-700 rounded transition-colors">
              <User size={18} />
            </button>
          </div>
        </div>

        {/* 导航标签页 */}
        <div className="px-4 bg-slate-800 border-t border-slate-700 flex items-center gap-1">
          <button
            onClick={() => handleTabClick('monitor')}
            className={`px-6 py-3 flex items-center gap-3 transition-all border-b-2 ${
              activeTab === 'monitor'
                ? 'border-blue-500 text-white bg-slate-750'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Home size={18} />
            <span className="font-mono text-sm font-medium">实时监控</span>
          </button>
          <button
            onClick={() => handleTabClick('data')}
            className={`px-6 py-3 flex items-center gap-3 transition-all border-b-2 ${
              activeTab === 'data'
                ? 'border-blue-500 text-white bg-slate-750'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Database size={18} />
            <span className="font-mono text-sm font-medium">数据中心</span>
          </button>
          <button
            onClick={() => handleTabClick('analysis')}
            className={`px-6 py-3 flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'analysis'
                ? 'border-blue-500 text-white bg-slate-750'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            <TrendingUp size={18} />
            <span className="font-mono text-sm font-medium">机理分析</span>
            <Tooltip
              title="机理孪生（Mechanistic Digital Twin）通过物理、化学、热学等多物理场耦合模型，构建设备的高保真数字镜像，实现基于第一性原理的状态预测与故障诊断，区别于传统数据驱动方法。"
              placement="bottom"
            >
              <Info size={14} className="opacity-60 hover:opacity-100 transition-opacity" />
            </Tooltip>
          </button>
          <button
            onClick={() => handleTabClick('report')}
            className={`px-6 py-3 flex items-center gap-3 transition-all border-b-2 ${
              activeTab === 'report'
                ? 'border-blue-500 text-white bg-slate-750'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            <FileText size={18} />
            <span className="font-mono text-sm font-medium">报表管理</span>
          </button>
        </div>

        {/* 快速操作工具栏 */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-800 via-slate-750 to-slate-800 border-t border-slate-700 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/devices')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-mono uppercase tracking-wider flex items-center gap-3 transition-all shadow-lg hover:shadow-indigo-500/50 hover:scale-105 border border-indigo-500"
            >
              <List size={20} strokeWidth={2.5} />
              <span className="font-bold">设备列表</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-mono uppercase tracking-wider flex items-center gap-3 transition-all shadow-lg hover:shadow-blue-500/50 hover:scale-105 border border-blue-500"
            >
              <Upload size={20} strokeWidth={2.5} />
              <span className="font-bold">上传数据</span>
            </button>
            <button
              onClick={() => navigate('/comparison')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-mono uppercase tracking-wider flex items-center gap-3 transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-105 border border-purple-500"
            >
              <TrendingUp size={20} strokeWidth={2.5} />
              <span className="font-bold">设备对比</span>
            </button>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-mono uppercase tracking-wider flex items-center gap-3 transition-all shadow-lg hover:shadow-cyan-500/50 hover:scale-105 border border-cyan-500"
            >
              <Bot size={20} strokeWidth={2.5} />
              <span className="font-bold">AI助手</span>
            </button>
            <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white text-sm font-mono uppercase tracking-wider flex items-center gap-3 transition-all shadow-lg hover:shadow-slate-500/50 hover:scale-105 border border-slate-600">
              <Camera size={20} strokeWidth={2.5} />
              <span className="font-bold">现场拍照</span>
            </button>
            <button
              onClick={() => navigate('/pdf-generator')}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-mono uppercase tracking-wider flex items-center gap-3 transition-all shadow-lg hover:shadow-green-500/50 hover:scale-105 border border-green-500"
            >
              <FileText size={20} strokeWidth={2.5} />
              <span className="font-bold">生成报告</span>
            </button>
            <button className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-mono uppercase tracking-wider flex items-center gap-3 transition-all shadow-lg hover:shadow-orange-500/50 hover:scale-105 border border-orange-500">
              <AlertTriangle size={20} strokeWidth={2.5} />
              <span className="font-bold">缺陷上报</span>
            </button>
            <div className="ml-auto flex items-center gap-4 pl-6 border-l border-slate-600">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">系统状态:</div>
              <div className="flex items-center gap-2 bg-green-900 bg-opacity-30 px-3 py-2 rounded border border-green-700">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.9)] animate-pulse"></div>
                <span className="text-sm font-mono text-green-400 font-bold">正常运行</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="p-4">
        <Outlet />
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
    </div>
  );
};

export default MainLayout;
