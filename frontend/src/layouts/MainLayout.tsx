/**
 * Industrial Main Layout - 垂直菜单布局
 * 500kV智能变电站监控系统 - 工业风格主布局
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import DataUploadModal from '../components/DataUploadModal';
import {
  menuConfig,
  utilityMenuConfig,
  systemMenuConfig,
} from './components/menuConfig';

const MainLayout = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleDataUpload = () => {
    setShowUploadModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* 顶部工具栏 */}
      <TopBar onUploadClick={() => setShowUploadModal(true)} />

      {/* 主体布局：侧边栏 + 内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧导航栏 */}
        <Sidebar
          menuItems={menuConfig}
          utilityItems={utilityMenuConfig}
          systemItems={systemMenuConfig}
          onDataUpload={handleDataUpload}
        />

        {/* 主内容区 */}
        <div className="flex-1 overflow-auto bg-slate-900">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>

      {/* 数据上传模态框 */}
      <DataUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
};

export default MainLayout;
