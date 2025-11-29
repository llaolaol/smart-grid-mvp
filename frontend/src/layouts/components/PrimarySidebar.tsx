/**
 * 一级侧边栏 - 图标导航
 * 固定宽度 64px，显示主菜单图标
 */

import { Tooltip } from 'antd';
import { Zap } from 'lucide-react';
import type { MenuItem } from './menuConfig';

interface PrimarySidebarProps {
  menuItems: MenuItem[];
  utilityItems: MenuItem[];
  systemItems: MenuItem[];
  activeMenuKey: string;
  onMenuClick: (key: string) => void;
}

const PrimarySidebar = ({
  menuItems,
  utilityItems,
  systemItems,
  activeMenuKey,
  onMenuClick,
}: PrimarySidebarProps) => {
  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = activeMenuKey === item.key;

    return (
      <Tooltip key={item.key} title={item.label} placement="right">
        <button
          onClick={() => onMenuClick(item.key)}
          className={`
            w-full h-16 flex items-center justify-center
            transition-all duration-200
            border-l-4
            ${
              isActive
                ? 'border-blue-500 bg-slate-800 text-blue-400'
                : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
            }
          `}
        >
          <Icon size={24} strokeWidth={2} />
        </button>
      </Tooltip>
    );
  };

  return (
    <div className="w-16 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      {/* Logo 区域 */}
      <div className="h-16 flex items-center justify-center border-b border-slate-700 bg-slate-800">
        <div className="bg-blue-600 p-2 rounded">
          <Zap size={24} className="text-white" />
        </div>
      </div>

      {/* 主菜单 */}
      <div className="flex-1 overflow-y-auto">
        {menuItems.map(renderMenuItem)}

        {/* 分割线 */}
        <div className="h-px bg-slate-700 my-2 mx-2"></div>

        {/* 辅助功能菜单 */}
        {utilityItems.map(renderMenuItem)}

        {/* 分割线 */}
        <div className="h-px bg-slate-700 my-2 mx-2"></div>

        {/* 系统设置菜单 */}
        {systemItems.map(renderMenuItem)}
      </div>

      {/* 底部系统状态指示器 */}
      <div className="h-12 flex items-center justify-center border-t border-slate-700">
        <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.9)] animate-pulse"></div>
      </div>
    </div>
  );
};

export default PrimarySidebar;
