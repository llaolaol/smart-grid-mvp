/**
 * Knowledge Reasoning Page
 * 知识推理系统 - iframe 集成方式（支持子路由）
 */

import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Brain } from 'lucide-react';

// Vue应用路由映射（知识推理系统 - port 3001）
const ROUTE_MAP: Record<string, string> = {
  'documents': '/documents',
  'mindmap': '/fault-tree-management',
  'fault-tree': '/fault-tree',
  'fault-tree-management': '/fault-tree-generation',
  'diagnosis': '/diagnosis',
};

// Dashboard 应用路由映射（运行数据可视化系统 - port 3002）
const DASHBOARD_ROUTE = 'dashboard';

const KnowledgeReasoning = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // 从路径中获取子路由（例如 /knowledge-reasoning/documents -> documents）
  const pathParts = location.pathname.split('/');
  const subRoute = pathParts[pathParts.length - 1];

  // 判断是否是 dashboard 路由（使用单独的端口）
  const isDashboard = subRoute === DASHBOARD_ROUTE;

  // 获取 iframe URL
  const iframeUrl = isDashboard
    ? 'http://localhost:3002'  // Dashboard 应用（前端数据可视化系统）
    : `http://localhost:3001${ROUTE_MAP[subRoute] || '/'}`; // Vue 知识推理系统

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // 设置加载超时
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [iframeUrl]); // 当路由改变时重新加载

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('无法加载知识推理系统，请确保服务正在运行');
  };

  // 获取页面标题
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      'documents': '文档管理',
      'mindmap': '思维导图管理',
      'fault-tree': '故障树展示',
      'fault-tree-management': '故障树管理',
      'diagnosis': '故障推理',
      'dashboard': '运行状态看板',
    };
    return titles[subRoute] || '知识推理系统';
  };

  // 获取页面描述
  const getPageDescription = () => {
    const descriptions: Record<string, string> = {
      'documents': '上传、管理和查看故障树文档',
      'mindmap': '管理和维护系统中的所有故障树模型',
      'fault-tree': '基于知识图谱的智能故障诊断与推理',
      'fault-tree-management': '基于知识图谱的智能故障诊断与推理',
      'diagnosis': '基于知识图谱的智能故障诊断与推理',
      'dashboard': '变压器运行数据多维度可视化分析与异常检测',
    };
    return descriptions[subRoute] || '基于知识图谱的智能故障诊断与推理';
  };

  return (
    <div className="h-full flex flex-col">
      {/* 页面标题 */}
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded">
          <Brain size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-mono uppercase tracking-wide text-white">
            {getPageTitle()}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {getPageDescription()}
          </p>
        </div>
      </div>

      {/* iframe 容器 */}
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded overflow-hidden relative">
        {/* 加载状态 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-400 font-mono text-sm">加载{getPageTitle()}...</p>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
            <div className="text-center max-w-md px-6">
              <div className="bg-red-900 bg-opacity-20 p-4 rounded-lg border border-red-700 mb-4">
                <p className="text-red-400 font-mono text-sm">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-mono rounded transition-colors"
              >
                重新加载
              </button>
            </div>
          </div>
        )}

        {/* iframe 嵌入应用（Vue 知识推理系统 或 Dashboard 可视化系统） */}
        <iframe
          key={iframeUrl} // 使用key强制重新渲染iframe
          src={iframeUrl}
          title={`知识推理系统 - ${getPageTitle()}`}
          className="w-full h-full border-0"
          style={{
            minHeight: 'calc(100vh - 64px - 48px - 80px)', // 64px顶栏 + 48px内边距 + 80px标题
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>

      {/* 底部提示 */}
      <div className="mt-2 text-xs text-slate-500 font-mono text-center">
        {isDashboard ? (
          <>系统运行于独立容器 | Dashboard 端口 3002 | 运行数据可视化分析系统</>
        ) : (
          <>系统运行于独立容器 | Vue 端口 3001 | 知识推理系统</>
        )}
      </div>
    </div>
  );
};

export default KnowledgeReasoning;
