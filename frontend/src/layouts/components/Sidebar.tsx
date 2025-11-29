/**
 * 左侧导航栏 - 垂直菜单布局
 * 一级菜单：图标+文字
 * 二级菜单：在一级菜单下方展开/折叠
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Zap, Info } from 'lucide-react';
import { Tooltip } from 'antd';
import type { MenuItem, SubMenuItem } from './menuConfig';

interface SidebarProps {
  menuItems: MenuItem[];
  utilityItems: MenuItem[];
  systemItems: MenuItem[];
  onDataUpload?: () => void;
}

const Sidebar = ({ menuItems, utilityItems, systemItems, onDataUpload }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 展开的菜单项（记录哪些一级菜单处于展开状态）
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['monitor']));

  // 判断菜单项是否激活
  const isMenuActive = (item: MenuItem): boolean => {
    const path = location.pathname;

    // 检查一级菜单路径
    if (item.path && path === item.path) {
      return true;
    }

    // 检查二级菜单路径
    if (item.children) {
      for (const subItem of item.children) {
        if (path === subItem.path || path.startsWith(subItem.path + '/')) {
          return true;
        }
      }
    }

    return false;
  };

  // 判断子菜单项是否激活
  const isSubMenuActive = (subItem: SubMenuItem): boolean => {
    return location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/');
  };

  // 切换菜单展开/折叠
  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  // 处理一级菜单点击
  const handleMenuClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      // 有子菜单：切换展开状态
      toggleExpand(item.key);

      // 如果当前是折叠状态，导航到第一个子菜单
      if (!expandedKeys.has(item.key)) {
        const firstChild = item.children[0];
        navigate(firstChild.path);
      }
    } else {
      // 无子菜单：直接导航
      if (item.path) {
        navigate(item.path);
      }
    }
  };

  // 处理子菜单点击
  const handleSubMenuClick = (subItem: SubMenuItem) => {
    // 特殊处理：数据上传打开模态框
    if (subItem.key === 'data-upload' && onDataUpload) {
      onDataUpload();
    } else {
      navigate(subItem.path);
    }
  };

  // 渲染一级菜单项
  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = isMenuActive(item);
    const isExpanded = expandedKeys.has(item.key);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.key} className="mb-1">
        {/* 一级菜单项 */}
        <button
          onClick={() => handleMenuClick(item)}
          className={`
            w-full px-4 py-3 flex items-center gap-3
            transition-all duration-200
            border-l-4
            ${
              isActive
                ? 'border-blue-500 bg-slate-800 text-blue-400'
                : 'border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'
            }
          `}
        >
          <Icon size={20} strokeWidth={2} />
          <span className="flex-1 text-left text-sm font-medium">{item.label}</span>

          {/* 描述信息图标 */}
          {item.description && (
            <Tooltip title={item.description} placement="right">
              <Info
                size={14}
                className="text-slate-500 hover:text-blue-400 cursor-help transition-colors"
              />
            </Tooltip>
          )}

          {/* 展开/折叠图标 */}
          {hasChildren && (
            <div className="text-slate-400">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          )}
        </button>

        {/* 二级子菜单（垂直展开） */}
        {hasChildren && isExpanded && (
          <div className="bg-slate-850">
            {item.children!.map((subItem) => {
              const SubIcon = subItem.icon;
              const isSubActive = isSubMenuActive(subItem);

              return (
                <button
                  key={subItem.key}
                  onClick={() => handleSubMenuClick(subItem)}
                  className={`
                    w-full px-4 py-2.5 pl-12 flex items-center gap-3
                    transition-all duration-200
                    border-l-4
                    ${
                      isSubActive
                        ? 'border-blue-500 bg-slate-800 text-blue-400'
                        : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  {SubIcon && <SubIcon size={16} strokeWidth={2} />}
                  <span className="flex-1 text-left text-sm">{subItem.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-60 bg-slate-900 border-r border-slate-700 flex flex-col h-full overflow-hidden">
      {/* Logo 区域 */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-700 bg-slate-800">
        <div className="bg-blue-600 p-2 rounded">
          <Zap size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white truncate">智能变电站</h2>
          <p className="text-xs text-slate-400 truncate">SCADA v3.2.1</p>
        </div>
      </div>

      {/* 菜单内容区 */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* 主菜单 */}
        {menuItems.map(renderMenuItem)}

        {/* 分割线 */}
        <div className="h-px bg-slate-700 my-3 mx-4"></div>

        {/* 辅助功能菜单 */}
        {utilityItems.map(renderMenuItem)}

        {/* 分割线 */}
        <div className="h-px bg-slate-700 my-3 mx-4"></div>

        {/* 系统设置菜单 */}
        {systemItems.map(renderMenuItem)}
      </div>

      {/* 底部系统状态 */}
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.9)] animate-pulse"></div>
          <span className="text-xs font-mono text-green-400 font-medium">系统正常</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
