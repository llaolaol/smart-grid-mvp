/**
 * Report Management Page
 * 报表管理页面 - 定期报表与专项报表管理
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Download,
  Eye,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  FileBarChart,
  Search,
  Filter,
} from 'lucide-react';

// 报表类型接口
interface ReportType {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  count: number;
  unit: string;
  color: string;
  bgColor: string;
  borderColor: string;
  category: 'regular' | 'special';
}

// 报表记录接口
interface ReportRecord {
  id: number;
  name: string;
  type: string;
  period: string;
  createTime: string;
  status: 'completed' | 'pending' | 'processing';
  size: string;
}

const ReportManagement: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'regular' | 'special'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 报表类型
  const reportTypes: ReportType[] = [
    // 定期报表
    {
      id: 'daily',
      title: '日报',
      subtitle: 'Daily Report',
      icon: <Calendar size={32} />,
      count: 365,
      unit: '份',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900',
      borderColor: 'border-blue-500',
      category: 'regular',
    },
    {
      id: 'weekly',
      title: '周报',
      subtitle: 'Weekly Report',
      icon: <BarChart3 size={32} />,
      count: 52,
      unit: '份',
      color: 'text-green-400',
      bgColor: 'bg-green-900',
      borderColor: 'border-green-500',
      category: 'regular',
    },
    {
      id: 'monthly',
      title: '月报',
      subtitle: 'Monthly Report',
      icon: <TrendingUp size={32} />,
      count: 12,
      unit: '份',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-900',
      borderColor: 'border-cyan-500',
      category: 'regular',
    },
    {
      id: 'quarterly',
      title: '季报',
      subtitle: 'Quarterly Report',
      icon: <PieChart size={32} />,
      count: 4,
      unit: '份',
      color: 'text-purple-400',
      bgColor: 'bg-purple-900',
      borderColor: 'border-purple-500',
      category: 'regular',
    },
    // 专项报表
    {
      id: 'dga',
      title: 'DGA油色谱分析',
      subtitle: 'DGA Analysis Report',
      icon: <Activity size={32} />,
      count: 156,
      unit: '份',
      color: 'text-orange-400',
      bgColor: 'bg-orange-900',
      borderColor: 'border-orange-500',
      category: 'special',
    },
    {
      id: 'pd',
      title: '局部放电检测',
      subtitle: 'PD Detection Report',
      icon: <FileBarChart size={32} />,
      count: 89,
      unit: '份',
      color: 'text-red-400',
      bgColor: 'bg-red-900',
      borderColor: 'border-red-500',
      category: 'special',
    },
  ];

  // 最近报表记录
  const recentReports: ReportRecord[] = [
    {
      id: 1,
      name: '2025年11月14日 日常运维报告',
      type: '日报',
      period: '2025-11-14',
      createTime: '2025-11-14 18:00:00',
      status: 'completed',
      size: '2.3 MB',
    },
    {
      id: 2,
      name: '2025年第46周 设备运行周报',
      type: '周报',
      period: '2025-W46',
      createTime: '2025-11-10 09:00:00',
      status: 'completed',
      size: '5.8 MB',
    },
    {
      id: 3,
      name: '#1主变 DGA油色谱分析报告',
      type: 'DGA专项',
      period: '2025-11',
      createTime: '2025-11-13 14:30:00',
      status: 'completed',
      size: '1.2 MB',
    },
    {
      id: 4,
      name: '2025年10月 月度设备健康报告',
      type: '月报',
      period: '2025-10',
      createTime: '2025-11-01 10:00:00',
      status: 'completed',
      size: '12.5 MB',
    },
    {
      id: 5,
      name: '500kV I母 局部放电检测报告',
      type: 'PD专项',
      period: '2025-11',
      createTime: '2025-11-12 16:45:00',
      status: 'processing',
      size: '3.7 MB',
    },
    {
      id: 6,
      name: '2025年Q3 季度设备评估报告',
      type: '季报',
      period: '2025-Q3',
      createTime: '2025-10-15 11:20:00',
      status: 'completed',
      size: '28.9 MB',
    },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      completed: { text: '已完成', className: 'bg-green-600 text-white' },
      processing: { text: '生成中', className: 'bg-orange-600 text-white' },
      pending: { text: '待生成', className: 'bg-slate-600 text-white' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-mono ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const filteredReportTypes = reportTypes.filter((type) => {
    if (selectedCategory === 'all') return true;
    return type.category === selectedCategory;
  });

  return (
    <div className="space-y-4">
      {/* 顶部标题栏 */}
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono uppercase tracking-wide">报表管理</h2>
              <p className="text-xs text-slate-400 font-mono">REPORT MANAGEMENT - 定期报表与专项报表</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-mono flex items-center gap-2 rounded transition-colors border border-slate-600">
              <Filter size={16} />
              筛选
            </button>
          </div>
        </div>
      </div>

      {/* 报表类别切换 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 text-sm font-mono rounded transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white border border-blue-500'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          全部报表
        </button>
        <button
          onClick={() => setSelectedCategory('regular')}
          className={`px-4 py-2 text-sm font-mono rounded transition-colors ${
            selectedCategory === 'regular'
              ? 'bg-blue-600 text-white border border-blue-500'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          定期报表
        </button>
        <button
          onClick={() => setSelectedCategory('special')}
          className={`px-4 py-2 text-sm font-mono rounded transition-colors ${
            selectedCategory === 'special'
              ? 'bg-blue-600 text-white border border-blue-500'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          专项报表
        </button>
      </div>

      {/* 报表类型网格 */}
      <div className="grid grid-cols-3 gap-4">
        {filteredReportTypes.map((type) => (
          <div
            key={type.id}
            className="bg-slate-800 border border-slate-700 rounded p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${type.bgColor} bg-opacity-20 p-3 rounded border ${type.borderColor}`}>
                <div className={type.color}>{type.icon}</div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold font-mono ${type.color} tracking-tight`}>
                  {type.count}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">{type.unit}</div>
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-white mb-1">{type.title}</h3>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">
                {type.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 最近报表记录 */}
      <div className="bg-slate-800 border border-slate-700 rounded">
        <div className="px-4 py-3 bg-slate-750 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wide">最近报表记录</h3>
          <div className="flex items-center gap-3">
            <button className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-2">
              <Clock size={14} />
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
                    报表名称
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    类型
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    周期
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    生成时间
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    文件大小
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    状态
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report, index) => (
                  <tr
                    key={report.id}
                    className={`border-b border-slate-700 hover:bg-slate-750 transition-colors ${
                      index % 2 === 0 ? 'bg-slate-900 bg-opacity-50' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-xs text-white font-bold">
                      {report.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-cyan-400">
                      {report.type}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-300">
                      {report.period}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-300">
                      {report.createTime}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-400">
                      {report.size}
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(report.status)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="预览"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="p-1 text-green-400 hover:text-green-300 transition-colors"
                          title="下载"
                          disabled={report.status !== 'completed'}
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 统计面板 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="text-xs text-slate-400 font-mono uppercase mb-2">本月生成</div>
          <div className="text-2xl font-bold font-mono text-blue-400">28</div>
          <div className="text-xs text-slate-500 font-mono mt-1">份报表</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="text-xs text-slate-400 font-mono uppercase mb-2">定期报表</div>
          <div className="text-2xl font-bold font-mono text-green-400">433</div>
          <div className="text-xs text-slate-500 font-mono mt-1">份累计</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="text-xs text-slate-400 font-mono uppercase mb-2">专项报表</div>
          <div className="text-2xl font-bold font-mono text-orange-400">245</div>
          <div className="text-xs text-slate-500 font-mono mt-1">份累计</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="text-xs text-slate-400 font-mono uppercase mb-2">报表完整率</div>
          <div className="text-2xl font-bold font-mono text-purple-400">99.2%</div>
          <div className="text-xs text-slate-500 font-mono mt-1">优秀</div>
        </div>
      </div>
    </div>
  );
};

export default ReportManagement;
