/**
 * 二级侧边栏 - 文字导航
 * 可折叠/展开，展开宽度 200px
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Info } from 'lucide-react';
import { Tooltip } from 'antd';
import type { MenuItem, SubMenuItem } from './menuConfig';

interface SecondarySidebarProps {
  currentMenu: MenuItem | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const SecondarySidebar = ({
  currentMenu,
  isCollapsed,
  onToggleCollapse,
}: SecondarySidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentMenu) {
    return null;
  }

  // 判断子菜单项是否激活
  const isSubMenuActive = (subItem: SubMenuItem) => {
    return location.pathname === subItem.path;
  };

  // 处理子菜单点击
  const handleSubMenuClick = (subItem: SubMenuItem) => {
    navigate(subItem.path);
  };

  return (
    <div
      className={`
        bg-slate-800 border-r border-slate-700 h-full flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-0 opacity-0' : 'w-52 opacity-100'}
      `}
      style={{ overflow: isCollapsed ? 'hidden' : 'visible' }}
    >
      {!isCollapsed && (
        <>
          {/* 二级菜单标题 */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm font-mono">
                {currentMenu.label}
              </span>
              {currentMenu.description && (
                <Tooltip title={currentMenu.description} placement="right">
                  <Info
                    size={14}
                    className="text-slate-400 hover:text-blue-400 cursor-help transition-colors"
                  />
                </Tooltip>
              )}
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title="折叠菜单"
            >
              <ChevronLeft size={16} className="text-slate-400" />
            </button>
          </div>

          {/* 子菜单列表 */}
          <div className="flex-1 overflow-y-auto py-2">
            {currentMenu.children && currentMenu.children.length > 0 ? (
              currentMenu.children.map((subItem) => {
                const SubIcon = subItem.icon;
                const isActive = isSubMenuActive(subItem);

                return (
                  <button
                    key={subItem.key}
                    onClick={() => handleSubMenuClick(subItem)}
                    className={`
                      w-full px-4 py-3 flex items-center gap-3
                      transition-all duration-200
                      border-l-4 text-left
                      ${
                        isActive
                          ? 'border-blue-500 bg-slate-750 text-blue-400'
                          : 'border-transparent text-slate-300 hover:bg-slate-750 hover:text-white'
                      }
                    `}
                  >
                    {SubIcon && <SubIcon size={18} strokeWidth={2} />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {subItem.label}
                      </div>
                      {subItem.description && (
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {subItem.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                暂无子菜单
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div className="px-4 py-3 border-t border-slate-700">
            <div className="text-xs text-slate-500 font-mono">
              {currentMenu.children?.length || 0} 个功能
            </div>
          </div>
        </>
      )}

      {/* 折叠状态下的展开按钮 */}
      {isCollapsed && (
        <div className="absolute left-16 top-20 z-10">
          <button
            onClick={onToggleCollapse}
            className="p-2 bg-slate-800 border border-slate-700 rounded-r hover:bg-slate-700 transition-colors shadow-lg"
            title="展开菜单"
          >
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SecondarySidebar;
