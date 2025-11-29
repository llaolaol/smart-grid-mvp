/**
 * 导航菜单配置
 * 双层侧边栏菜单结构定义
 */

import {
  Home,
  Database,
  TrendingUp,
  FileText,
  List,
  BarChart2,
  Upload,
  FolderOpen,
  Activity,
  GitCompare,
  Zap,
  FileDown,
  BookOpen,
  Bot,
  Camera,
  AlertTriangle,
  Settings,
  User,
  Info,
  Brain,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SubMenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  path: string;
  description?: string;
}

export interface MenuItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  description?: string;
  children?: SubMenuItem[];
}

/**
 * 主导航菜单配置
 */
export const menuConfig: MenuItem[] = [
  {
    key: 'monitor',
    label: '实时监控',
    icon: Home,
    description: '设备实时监控与场景概览',
    children: [
      {
        key: 'device-list',
        label: '设备列表',
        icon: List,
        path: '/devices',
        description: '查看所有设备状态',
      },
      {
        key: 'dashboard',
        label: '设备概览',
        icon: BarChart2,
        path: '/dashboard',
        description: '设备概览与统计',
      },
    ],
  },
  {
    key: 'data',
    label: '数据中心',
    icon: Database,
    description: '数据管理与上传',
    children: [
      {
        key: 'data-management',
        label: '数据管理',
        icon: FolderOpen,
        path: '/data',
        description: '数据查询与管理',
      },
      {
        key: 'data-upload',
        label: '数据上传',
        icon: Upload,
        path: '/data',
        description: '上传设备运行数据（通过顶部工具栏按钮）',
      },
    ],
  },
  {
    key: 'analysis',
    label: '机理分析',
    icon: TrendingUp,
    description: '机理孪生 - 基于多物理场耦合模型的状态预测与故障诊断',
    children: [
      {
        key: 'diagnosis',
        label: '故障诊断',
        icon: Activity,
        path: '/diagnosis',
        description: 'DGA诊断与状态评估',
      },
      {
        key: 'simulation',
        label: 'What-if推演',
        icon: Zap,
        path: '/simulation',
        description: '多场景推演与预测',
      },
      {
        key: 'comparison',
        label: '设备对比',
        icon: GitCompare,
        path: '/comparison',
        description: '多设备对比分析',
      },
    ],
  },
  {
    key: 'knowledge-reasoning',
    label: '知识推理',
    icon: Brain,
    description: '基于知识图谱的智能故障诊断与推理系统',
    children: [
      {
        key: 'documents',
        label: '文档管理',
        icon: FileText,
        path: '/knowledge-reasoning/documents',
        description: '上传和管理故障树文档',
      },
      {
        key: 'mindmap',
        label: '思维导图管理',
        icon: GitCompare,
        path: '/knowledge-reasoning/mindmap',
        description: '故障树思维导图管理',
      },
      {
        key: 'fault-tree-preview',
        label: '故障树展示',
        icon: TrendingUp,
        path: '/knowledge-reasoning/fault-tree',
        description: '故障树可视化展示',
      },
      {
        key: 'fault-tree-management',
        label: '故障树管理',
        icon: BarChart2,
        path: '/knowledge-reasoning/fault-tree-management',
        description: '故障树生成和管理',
      },
      {
        key: 'fault-reasoning',
        label: '故障推理',
        icon: Zap,
        path: '/knowledge-reasoning/diagnosis',
        description: '基于知识图谱的故障推理',
      },
      {
        key: 'operation-dashboard',
        label: '运行状态看板',
        icon: Activity,
        path: '/knowledge-reasoning/dashboard',
        description: '系统运行状态监控',
      },
    ],
  },
  {
    key: 'report',
    label: '报表管理',
    icon: FileText,
    description: '诊断报告生成与查看',
    children: [
      {
        key: 'report-generate',
        label: '生成报告',
        icon: FileDown,
        path: '/pdf-generator',
        description: '生成PDF诊断报告',
      },
      {
        key: 'report-view',
        label: '报表查看',
        icon: BookOpen,
        path: '/report',
        description: '查看历史报表',
      },
    ],
  },
];

/**
 * 辅助功能菜单配置（独立项，无子菜单）
 */
export const utilityMenuConfig: MenuItem[] = [
  {
    key: 'ai-assistant',
    label: 'AI 助手',
    icon: Bot,
    path: '/ai-assistant',
    description: 'DeepSeek AI诊断助手',
  },
  {
    key: 'photo',
    label: '现场拍照',
    icon: Camera,
    path: '/photo',
    description: '现场设备拍照记录',
  },
  {
    key: 'defect-report',
    label: '缺陷上报',
    icon: AlertTriangle,
    path: '/defect-report',
    description: '设备缺陷上报',
  },
];

/**
 * 系统设置菜单
 */
export const systemMenuConfig: MenuItem[] = [
  {
    key: 'settings',
    label: '系统设置',
    icon: Settings,
    description: '系统配置与用户偏好',
    children: [
      {
        key: 'user-preferences',
        label: '用户偏好',
        icon: User,
        path: '/settings/preferences',
        description: '个人偏好设置',
      },
    ],
  },
];
