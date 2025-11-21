/**
 * Data Center Page
 * 数据中心页面 - 工业SCADA风格
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  FileText,
  CheckSquare,
  AlertTriangle,
  Bell,
  Download,
  Calendar,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';

// 数据模块接口
interface DataModule {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  count: number;
  unit: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DataCenter: React.FC = () => {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // 6个数据模块
  const dataModules: DataModule[] = [
    {
      id: 'historical',
      title: '历史数据',
      subtitle: 'Historical Data',
      icon: <TrendingUp size={32} />,
      count: 45680,
      unit: '条记录',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900',
      borderColor: 'border-blue-500'
    },
    {
      id: 'tests',
      title: '试验记录',
      subtitle: 'Test Records',
      icon: <FileText size={32} />,
      count: 1247,
      unit: '次试验',
      color: 'text-green-400',
      bgColor: 'bg-green-900',
      borderColor: 'border-green-500'
    },
    {
      id: 'inspections',
      title: '巡检数据',
      subtitle: 'Inspection Data',
      icon: <CheckSquare size={32} />,
      count: 856,
      unit: '次巡检',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-900',
      borderColor: 'border-cyan-500'
    },
    {
      id: 'defects',
      title: '缺陷记录',
      subtitle: 'Defect Records',
      icon: <AlertTriangle size={32} />,
      count: 89,
      unit: '条缺陷',
      color: 'text-orange-400',
      bgColor: 'bg-orange-900',
      borderColor: 'border-orange-500'
    },
    {
      id: 'alerts',
      title: '告警记录',
      subtitle: 'Alert History',
      icon: <Bell size={32} />,
      count: 234,
      unit: '条告警',
      color: 'text-red-400',
      bgColor: 'bg-red-900',
      borderColor: 'border-red-500'
    },
    {
      id: 'export',
      title: '数据导出',
      subtitle: 'Data Export',
      icon: <Download size={32} />,
      count: 156,
      unit: '个文件',
      color: 'text-purple-400',
      bgColor: 'bg-purple-900',
      borderColor: 'border-purple-500'
    }
  ];

  // 最近数据记录（示例）
  const recentRecords = [
    {
      id: 1,
      time: '2025-11-14 10:23:45',
      device: '#1主变',
      type: '例行巡检',
      operator: '张工',
      status: 'completed',
      data: '油温62.3°C, 绕组温度75.8°C'
    },
    {
      id: 2,
      time: '2025-11-14 09:15:30',
      device: '#2主变',
      type: '油色谱试验',
      operator: '李工',
      status: 'completed',
      data: 'H2: 85ppm, C2H4: 12ppm'
    },
    {
      id: 3,
      time: '2025-11-14 08:45:12',
      device: '#3断路器',
      type: '缺陷处理',
      operator: '王工',
      status: 'processing',
      data: 'SF6气体压力低，待补气'
    },
    {
      id: 4,
      time: '2025-11-13 16:30:00',
      device: '500kV I母',
      type: '电压告警',
      operator: '系统自动',
      status: 'resolved',
      data: '电压波动±2.8%，已恢复正常'
    },
    {
      id: 5,
      time: '2025-11-13 14:20:45',
      device: '#1主变',
      type: 'PD局放检测',
      operator: '赵工',
      status: 'completed',
      data: '局放量15pC，正常范围'
    }
  ];

  const handleModuleClick = (moduleId: string) => {
    setSelectedModule(moduleId);
    // 未来可以导航到详细页面或打开模态框
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      completed: { text: '已完成', className: 'bg-green-600 text-white' },
      processing: { text: '处理中', className: 'bg-orange-600 text-white' },
      resolved: { text: '已解决', className: 'bg-blue-600 text-white' }
    };
    const badge = badges[status] || badges.completed;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-mono ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 顶部标题栏 */}
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded">
              <Database size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono uppercase tracking-wide">数据中心</h2>
              <p className="text-xs text-slate-400 font-mono">DATA CENTER - 统一数据管理平台</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-mono flex items-center gap-2 rounded transition-colors border border-slate-600">
              <Filter size={16} />
              筛选
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-mono flex items-center gap-2 rounded transition-colors border border-blue-500">
              <Search size={16} />
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 数据模块网格 */}
      <div className="grid grid-cols-3 gap-4">
        {dataModules.map((module) => (
          <div
            key={module.id}
            onClick={() => handleModuleClick(module.id)}
            className={`bg-slate-800 border border-slate-700 rounded p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
              selectedModule === module.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${module.bgColor} bg-opacity-20 p-3 rounded border ${module.borderColor}`}>
                <div className={module.color}>{module.icon}</div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold font-mono ${module.color} tracking-tight`}>
                  {module.count.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">{module.unit}</div>
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-white mb-1">{module.title}</h3>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">
                {module.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 最近数据记录 */}
      <div className="bg-slate-800 border border-slate-700 rounded">
        <div className="px-4 py-3 bg-slate-750 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wide">最近数据记录</h3>
          <div className="flex items-center gap-3">
            <button className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-2">
              <Calendar size={14} />
              时间范围
            </button>
            <button className="text-xs text-blue-400 hover:text-blue-300 font-mono">
              查看全部
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    时间
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    设备
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    类型
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    操作员
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    数据内容
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    className={`border-b border-slate-700 hover:bg-slate-750 transition-colors ${
                      index % 2 === 0 ? 'bg-slate-900 bg-opacity-50' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-xs text-slate-300">
                      {record.time}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-white font-bold">
                      {record.device}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-cyan-400">
                      {record.type}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-300">
                      {record.operator}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-400">
                      {record.data}
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(record.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 数据统计面板 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="text-xs text-slate-400 font-mono uppercase mb-2">今日上传</div>
          <div className="text-2xl font-bold font-mono text-blue-400">47</div>
          <div className="text-xs text-slate-500 font-mono mt-1">条数据</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="text-xs text-slate-400 font-mono uppercase mb-2">本周试验</div>
          <div className="text-2xl font-bold font-mono text-green-400">18</div>
          <div className="text-xs text-slate-500 font-mono mt-1">次试验</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="text-xs text-slate-400 font-mono uppercase mb-2">待处理缺陷</div>
          <div className="text-2xl font-bold font-mono text-orange-400">5</div>
          <div className="text-xs text-slate-500 font-mono mt-1">条缺陷</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="text-xs text-slate-400 font-mono uppercase mb-2">数据完整率</div>
          <div className="text-2xl font-bold font-mono text-purple-400">98.7%</div>
          <div className="text-xs text-slate-500 font-mono mt-1">合格</div>
        </div>
      </div>
    </div>
  );
};

export default DataCenter;
