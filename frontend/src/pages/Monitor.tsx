/**
 * Real-time Monitor Page
 * 实时监控页面 - 工业SCADA风格（整合设备列表功能）
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Select,
  message,
  Badge,
  Button,
  Tabs,
} from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  Power,
  CheckCircle,
  BarChart3,
  AlertTriangle as AlertTriangleIcon,
  Upload as UploadIcon,
} from 'lucide-react';
import { deviceAPI, reportAPI } from '@/services/api';
import type { Device, ScenarioInfo } from '@/types';
import { getSeverityColor, getSeverityLabel, formatFaultType } from '@/utils/format';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';

const { Option } = Select;
const { TabPane } = Tabs;

// 状态LED组件
const StatusLED: React.FC<{ status: string }> = ({ status }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-3 h-3 rounded-full ${
        status === 'normal'
          ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'
          : status === 'warning'
          ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]'
          : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
      } animate-pulse`}
    ></div>
    <span className="text-xs font-mono uppercase tracking-wide">
      {status === 'normal' ? 'RUN' : status === 'warning' ? 'WARN' : 'ALARM'}
    </span>
  </div>
);

// 模拟告警数据
const alertsData = [
  {
    id: 1,
    level: 'warning',
    device: '#2主变',
    message: '绕组温度接近上限',
    time: '10:23:45',
    code: 'ALM-002',
  },
  {
    id: 2,
    level: 'info',
    device: '500kV I母',
    message: '电压波动 ±2.8%',
    time: '09:45:12',
    code: 'INF-015',
  },
  {
    id: 3,
    level: 'critical',
    device: '#3断路器',
    message: 'SF6气体压力低',
    time: '08:30:22',
    code: 'ALM-008',
  },
];

// 模拟任务数据
const tasksData = [
  { id: 1, title: '#1主变例行巡检', time: '09:00-11:00', completed: false },
  { id: 2, title: 'SF6气体检测', time: '已完成 ✓', completed: true },
  { id: 3, title: '#2主变油色谱', time: '14:00-16:00', completed: false },
];

const Monitor: React.FC = () => {
  const navigate = useNavigate();

  // 实时监控状态
  const [monitorDevices, setMonitorDevices] = useState<Device[]>([]);
  const [monitorLoading, setMonitorLoading] = useState(true);

  // 设备列表状态
  const [loading, setLoading] = useState(false);
  const [batchReportLoading, setBatchReportLoading] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [devices, setDevices] = useState<Device[]>([]);

  // 加载实时监控设备
  useEffect(() => {
    loadMonitorDevices();
    const interval = setInterval(loadMonitorDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  // 加载场景列表
  useEffect(() => {
    loadScenarios();
  }, []);

  // 加载设备列表
  useEffect(() => {
    if (selectedScenario) {
      loadDevices();
    }
  }, [selectedScenario]);

  const loadMonitorDevices = async () => {
    try {
      const data = await deviceAPI.getAllDevices();
      setMonitorDevices(data.slice(0, 2));
      setMonitorLoading(false);
    } catch (error) {
      console.error('Failed to load monitor devices:', error);
      setMonitorLoading(false);
    }
  };

  const loadScenarios = async () => {
    try {
      const data = await deviceAPI.listScenarios();
      setScenarios(data);
      if (data.length > 0) {
        setSelectedScenario(data[0].scenario_id);
      }
    } catch (error) {
      message.error('加载场景列表失败');
    }
  };

  const loadDevices = async () => {
    if (!selectedScenario) return;

    setLoading(true);
    try {
      const data = await deviceAPI.getScenarioDevices(selectedScenario);
      setDevices(data.devices);
    } catch (error) {
      message.error('加载设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchReport = async () => {
    if (!selectedScenario) {
      message.warning('请先选择场景');
      return;
    }

    if (devices.length === 0) {
      message.warning('当前场景没有设备');
      return;
    }

    setBatchReportLoading(true);
    try {
      const blob = await reportAPI.generateBatchDiagnosisReports(selectedScenario);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagnosis_reports_${selectedScenario}_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`成功生成${devices.length}台设备的诊断报告`);
    } catch (error: any) {
      message.error(`批量生成报告失败: ${error.message}`);
    } finally {
      setBatchReportLoading(false);
    }
  };

  const getDeviceStatus = (device: Device): string => {
    if (device.severity >= 8) return 'critical';
    if (device.severity >= 5) return 'warning';
    return 'normal';
  };

  const columns: ColumnsType<Device> = [
    {
      title: '设备ID',
      dataIndex: 'device_id',
      key: 'device_id',
      width: 120,
    },
    {
      title: '设备名称',
      dataIndex: 'device_name',
      key: 'device_name',
      width: 150,
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
      width: 120,
    },
    {
      title: '额定容量',
      dataIndex: 'rated_capacity',
      key: 'rated_capacity',
      width: 120,
      render: (value) => `${value} MVA`,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (severity: number) => (
        <Badge color={getSeverityColor(severity)} text={getSeverityLabel(severity)} />
      ),
      sorter: (a, b) => a.severity - b.severity,
    },
    {
      title: '故障类型',
      dataIndex: 'fault_type',
      key: 'fault_type',
      width: 150,
      render: (faultType: string) => (
        <Tag color={faultType === 'normal' ? 'success' : 'error'}>
          {formatFaultType(faultType)}
        </Tag>
      ),
    },
    {
      title: '热点温度',
      key: 'hotspot_temp',
      width: 120,
      render: (_, record) => `${record.thermal.hotspot_temp.toFixed(1)}°C`,
      sorter: (a, b) => a.thermal.hotspot_temp - b.thermal.hotspot_temp,
    },
    {
      title: '当前DP值',
      key: 'current_dp',
      width: 120,
      render: (_, record) => record.aging.current_dp.toFixed(0),
      sorter: (a, b) => a.aging.current_dp - b.aging.current_dp,
    },
    {
      title: '负载率',
      key: 'load_percent',
      width: 120,
      render: (_, record) => `${record.operating_condition.load_percent.toFixed(1)}%`,
      sorter: (a, b) => a.operating_condition.load_percent - b.operating_condition.load_percent,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <a onClick={() => navigate(`/devices/${selectedScenario}/${record.device_id}`)}>
          查看详情
        </a>
      ),
    },
  ];

  return (
    <div>
      <Tabs defaultActiveKey="realtime" size="large">
        {/* Tab 1: 实时监控 */}
        <TabPane tab="实时监控" key="realtime">
          <div className="grid grid-cols-4 gap-4">
            {/* 左侧主要内容区 */}
            <div className="col-span-3 space-y-4">
              {/* 设备实时监控 */}
              <div className="bg-slate-800 border border-slate-700 rounded">
                <div className="px-4 py-2 bg-slate-750 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wide">
                    主变压器实时监控
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">更新: 1秒前</span>
                    <button
                      className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                      onClick={loadMonitorDevices}
                    >
                      刷新
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {monitorLoading ? (
                    <div className="text-center py-12 text-slate-400">加载中...</div>
                  ) : monitorDevices.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">暂无设备数据</div>
                  ) : (
                    monitorDevices.map((device) => {
                      const status = getDeviceStatus(device);
                      const loadPercent = device.operating_condition?.load_percent || 0;
                      const capacity = device.rated_capacity || 500;

                      return (
                        <div key={device.device_id} className="bg-slate-900 border border-slate-700 p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-slate-800 p-3 rounded">
                                <Power size={24} className="text-blue-400" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <h4 className="text-base font-bold font-mono">{device.device_name}</h4>
                                  <StatusLED status={status} />
                                </div>
                                <p className="text-xs text-slate-500 font-mono mt-1">{device.device_id}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold font-mono text-blue-400 tracking-tight">
                                {(capacity * (loadPercent / 100)).toFixed(1)}
                              </div>
                              <div className="text-xs text-slate-400 font-mono mt-1">
                                MW / {capacity}MW
                              </div>
                              <div className="mt-2 flex items-center justify-end gap-2">
                                <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${loadPercent > 80 ? 'bg-orange-500' : 'bg-blue-500'}`}
                                    style={{ width: `${loadPercent}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-mono text-slate-400">
                                  {loadPercent.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-6 gap-3">
                            <div className="bg-slate-800 border border-slate-700 p-3">
                              <div className="text-xs text-slate-500 font-mono mb-1">电压 U</div>
                              <div className="text-lg font-bold font-mono text-cyan-400">525.3</div>
                              <div className="text-xs text-slate-500 font-mono">kV</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 p-3">
                              <div className="text-xs text-slate-500 font-mono mb-1">电流 I</div>
                              <div className="text-lg font-bold font-mono text-cyan-400">270.8</div>
                              <div className="text-xs text-slate-500 font-mono">A</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 p-3">
                              <div className="text-xs text-slate-500 font-mono mb-1">油温</div>
                              <div
                                className={`text-lg font-bold font-mono ${
                                  device.thermal.oil_temp > 70 ? 'text-orange-400' : 'text-green-400'
                                }`}
                              >
                                {device.thermal.oil_temp.toFixed(1)}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">°C</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 p-3">
                              <div className="text-xs text-slate-500 font-mono mb-1">绕组温度</div>
                              <div
                                className={`text-lg font-bold font-mono ${
                                  device.thermal.hotspot_temp > 80
                                    ? 'text-red-400'
                                    : device.thermal.hotspot_temp > 75
                                    ? 'text-orange-400'
                                    : 'text-green-400'
                                }`}
                              >
                                {device.thermal.hotspot_temp.toFixed(1)}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">°C</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 p-3">
                              <div className="text-xs text-slate-500 font-mono mb-1">有功功率</div>
                              <div className="text-lg font-bold font-mono text-green-400">
                                {(capacity * (loadPercent / 100)).toFixed(1)}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">MW</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 p-3">
                              <div className="text-xs text-slate-500 font-mono mb-1">无功功率</div>
                              <div className="text-lg font-bold font-mono text-purple-400">
                                {(capacity * (loadPercent / 100) * 0.3).toFixed(1)}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">Mvar</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 统计数据 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800 border border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">巡检</span>
                    <CheckCircle size={16} className="text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-blue-400">24</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">本月完成</div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">试验</span>
                    <BarChart3 size={16} className="text-green-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-green-400">8</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">本月完成</div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">缺陷</span>
                    <AlertTriangleIcon size={16} className="text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-orange-400">3</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">处理中</div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-mono uppercase">上传</span>
                    <UploadIcon size={16} className="text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-purple-400">156</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">数据条目</div>
                </div>
              </div>
            </div>

            {/* 右侧信息栏 */}
            <div className="space-y-4">
              {/* 告警面板 */}
              <div className="bg-slate-800 border border-slate-700 rounded">
                <div className="px-4 py-2 bg-red-900 bg-opacity-20 border-b border-slate-700 flex items-center gap-2">
                  <AlertTriangleIcon size={16} className="text-red-400" />
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wide">实时告警</h3>
                  <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded font-mono">
                    {alertsData.length}
                  </span>
                </div>
                <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                  {alertsData.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 border-l-2 ${
                        alert.level === 'critical'
                          ? 'bg-red-900 bg-opacity-20 border-red-500'
                          : alert.level === 'warning'
                          ? 'bg-orange-900 bg-opacity-20 border-orange-500'
                          : 'bg-blue-900 bg-opacity-20 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-white">{alert.code}</span>
                        <span className="text-xs font-mono text-slate-400">{alert.time}</span>
                      </div>
                      <div className="text-xs font-bold text-white mb-1">{alert.device}</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 今日任务 */}
              <div className="bg-slate-800 border border-slate-700 rounded">
                <div className="px-4 py-2 bg-slate-750 border-b border-slate-700 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wide">今日任务</h3>
                  <span className="ml-auto text-xs font-mono text-slate-400">2/3</span>
                </div>
                <div className="p-3 space-y-2">
                  {tasksData.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-2 bg-slate-900 border border-slate-700 ${
                        task.completed ? 'opacity-60' : 'hover:border-slate-600'
                      } transition-colors`}
                    >
                      <input type="checkbox" checked={task.completed} readOnly className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs font-mono ${
                            task.completed ? 'line-through text-slate-400' : 'font-bold text-white'
                          } truncate`}
                        >
                          {task.title}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1">{task.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabPane>

        {/* Tab 2: 设备列表 */}
        <TabPane tab="设备列表" key="list">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono">场景选择：</span>
                <Select value={selectedScenario} onChange={setSelectedScenario} style={{ width: 300 }}>
                  {scenarios.map((scenario) => (
                    <Option key={scenario.scenario_id} value={scenario.scenario_id}>
                      {scenario.scenario_name} ({scenario.device_count}台设备)
                    </Option>
                  ))}
                </Select>
              </div>
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={handleBatchReport}
                loading={batchReportLoading}
                disabled={!selectedScenario || devices.length === 0}
              >
                批量生成报告
              </Button>
            </div>

            {selectedScenario && (
              <>
                {loading ? (
                  <LoadingSkeleton type="table" />
                ) : devices.length > 0 ? (
                  <Card>
                    <Table
                      columns={columns}
                      dataSource={devices}
                      rowKey="device_id"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 台设备`,
                      }}
                      scroll={{ x: 1200 }}
                    />
                  </Card>
                ) : (
                  <EmptyState type="no-device" onAction={() => window.location.reload()} />
                )}
              </>
            )}
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Monitor;
