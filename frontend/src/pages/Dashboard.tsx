import { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Row,
  Col,
  Statistic,
  Typography,
  Progress,
  message,
  Spin,
  Dropdown,
  Button,
  Space,
  Input,
  Switch,
  Tooltip,
  Badge,
} from 'antd';
import {
  DashboardOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  DownloadOutlined as AntDownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  ReloadOutlined as AntReloadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { RefreshCw, Download } from 'lucide-react';
import type { MenuProps } from 'antd';
import ReactECharts from 'echarts-for-react';
import { deviceAPI } from '@/services/api';
import type { Device } from '@/types';
import { getSeverityColor, getSeverityLabel, formatFaultType } from '@/utils/format';
import { exportDevicesToExcel, exportDevicesToCSV } from '@/utils/exportData';
import { getUserPreferences, updateUserPreferences } from '@/utils/userPreferences';

const { Title, Text } = Typography;
const { Option } = Select;

interface DeviceStats {
  total: number;
  normal: number;
  warning: number;
  abnormal: number;
  critical: number;
}

interface FaultDistribution {
  [key: string]: number;
}

const Dashboard = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DeviceStats>({
    total: 0,
    normal: 0,
    warning: 0,
    abnormal: 0,
    critical: 0,
  });
  const [faultDistribution, setFaultDistribution] = useState<FaultDistribution>({});

  // 从用户偏好设置中加载初始值
  const userPrefs = getUserPreferences();

  // 筛选和搜索状态
  const [searchText, setSearchText] = useState('');
  // 如果启用了"仅显示关键设备"，则初始严重程度筛选设为2（异常及以上）
  const [severityFilter, setSeverityFilter] = useState<number | null>(
    userPrefs.showCriticalDevicesOnly ? 2 : null
  );
  const [faultTypeFilter, setFaultTypeFilter] = useState<string | null>(null);

  // 自动刷新状态
  const [autoRefresh, setAutoRefresh] = useState(userPrefs.autoRefresh);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<number>(userPrefs.refreshInterval);

  // 加载所有设备数据
  useEffect(() => {
    loadDevicesData();
  }, []);

  // 过滤和搜索设备
  useEffect(() => {
    let filtered = [...devices];

    // 按设备名称搜索
    if (searchText) {
      filtered = filtered.filter(
        (d) =>
          d.device_name.toLowerCase().includes(searchText.toLowerCase()) ||
          d.device_id.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 按严重程度筛选
    if (severityFilter !== null) {
      // 如果筛选值为2且"仅显示关键设备"已启用，显示严重程度>=2的设备（异常和严重）
      if (severityFilter === 2 && userPrefs.showCriticalDevicesOnly) {
        filtered = filtered.filter((d) => d.severity >= 2);
      } else {
        // 否则，精确匹配严重程度
        filtered = filtered.filter((d) => d.severity === severityFilter);
      }
    }

    // 按故障类型筛选
    if (faultTypeFilter !== null) {
      filtered = filtered.filter((d) => d.fault_type === faultTypeFilter);
    }

    setFilteredDevices(filtered);
  }, [devices, searchText, severityFilter, faultTypeFilter]);

  // 同步自动刷新设置到用户偏好
  useEffect(() => {
    updateUserPreferences({ autoRefresh, refreshInterval });
  }, [autoRefresh, refreshInterval]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      loadDevicesData();
    }, refreshInterval * 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  // 加载设备数据函数（可复用）
  const loadDevicesData = async () => {
    setLoading(true);
    try {
      const data = await deviceAPI.getAllDevices();
      setDevices(data);
      calculateStats(data);
      setLastRefreshTime(new Date());
    } catch (error) {
      message.error('加载设备数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 手动刷新
  const handleManualRefresh = async () => {
    message.loading({ content: '刷新中...', key: 'refresh' });
    await loadDevicesData();
    message.success({ content: '刷新成功', key: 'refresh', duration: 2 });
  };

  // 计算统计数据
  const calculateStats = (devices: Device[]) => {
    const newStats: DeviceStats = {
      total: devices.length,
      normal: 0,
      warning: 0,
      abnormal: 0,
      critical: 0,
    };

    const faultDist: FaultDistribution = {};

    devices.forEach((device) => {
      // 按严重程度分类
      if (device.severity === 0) newStats.normal++;
      else if (device.severity === 1) newStats.warning++;
      else if (device.severity === 2) newStats.abnormal++;
      else if (device.severity === 3) newStats.critical++;

      // 故障类型分布
      const faultType = formatFaultType(device.fault_type);
      faultDist[faultType] = (faultDist[faultType] || 0) + 1;
    });

    setStats(newStats);
    setFaultDistribution(faultDist);
  };

  // KPI卡片数据
  const kpiData = [
    {
      title: '设备总数',
      value: stats.total,
      icon: <DashboardOutlined />,
      color: '#3b82f6',
      suffix: '台',
    },
    {
      title: '正常设备',
      value: stats.normal,
      icon: <CheckCircleOutlined />,
      color: '#10b981',
      suffix: '台',
      percent: stats.total > 0 ? (stats.normal / stats.total) * 100 : 0,
    },
    {
      title: '注意设备',
      value: stats.warning,
      icon: <WarningOutlined />,
      color: '#f59e0b',
      suffix: '台',
      percent: stats.total > 0 ? (stats.warning / stats.total) * 100 : 0,
    },
    {
      title: '异常设备',
      value: stats.abnormal + stats.critical,
      icon: <CloseCircleOutlined />,
      color: '#ef4444',
      suffix: '台',
      percent: stats.total > 0 ? ((stats.abnormal + stats.critical) / stats.total) * 100 : 0,
    },
  ];

  // 设备健康分布饼图
  const getHealthPieOption = () => {
    const data = [
      { value: stats.normal, name: '正常', itemStyle: { color: '#10b981' } },
      { value: stats.warning, name: '注意', itemStyle: { color: '#f59e0b' } },
      { value: stats.abnormal, name: '异常', itemStyle: { color: '#ef4444' } },
      { value: stats.critical, name: '严重', itemStyle: { color: '#dc2626' } },
    ].filter((item) => item.value > 0);

    return {
      title: {
        text: '设备健康状态分布',
        left: 'center',
        textStyle: { color: '#e2e8f0', fontSize: 16 },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}台 ({d}%)',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#475569',
        textStyle: { color: '#e2e8f0' },
      },
      legend: {
        bottom: 10,
        textStyle: { color: '#94a3b8' },
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            formatter: '{b}\n{c}台',
            color: '#e2e8f0',
          },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' },
          },
          data,
        },
      ],
    };
  };

  // 故障类型分布柱状图
  const getFaultDistributionOption = () => {
    const faultTypes = Object.keys(faultDistribution);
    const values = Object.values(faultDistribution);

    return {
      title: {
        text: '故障类型分布',
        left: 'center',
        textStyle: { color: '#e2e8f0', fontSize: 16 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#475569',
        textStyle: { color: '#e2e8f0' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: faultTypes,
        axisLabel: { color: '#94a3b8', interval: 0, rotate: 20 },
        axisLine: { lineStyle: { color: '#475569' } },
      },
      yAxis: {
        type: 'value',
        name: '设备数量',
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#475569' } },
        splitLine: { lineStyle: { color: '#334155' } },
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: {
            color: (params: any) => {
              const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
              return colors[params.dataIndex % colors.length];
            },
          },
          label: {
            show: true,
            position: 'top',
            color: '#e2e8f0',
            formatter: '{c}台',
          },
        },
      ],
    };
  };

  // 设备老化趋势图
  const getAgingTrendOption = () => {
    const sortedDevices = [...filteredDevices].sort((a, b) => b.aging.device_age - a.aging.device_age);

    return {
      title: {
        text: '设备老化趋势分析',
        left: 'center',
        textStyle: { color: '#e2e8f0', fontSize: 16 },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#475569',
        textStyle: { color: '#e2e8f0' },
      },
      legend: {
        bottom: 10,
        textStyle: { color: '#94a3b8' },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: sortedDevices.map((d) => d.device_name),
        axisLabel: { color: '#94a3b8', interval: 0, rotate: 30 },
        axisLine: { lineStyle: { color: '#475569' } },
      },
      yAxis: [
        {
          type: 'value',
          name: 'DP值 / 年限',
          position: 'left',
          axisLabel: { color: '#94a3b8' },
          axisLine: { lineStyle: { color: '#475569' } },
          splitLine: { lineStyle: { color: '#334155' } },
        },
        {
          type: 'value',
          name: '剩余寿命(年)',
          position: 'right',
          axisLabel: { color: '#94a3b8' },
          axisLine: { lineStyle: { color: '#475569' } },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'DP值',
          type: 'bar',
          yAxisIndex: 0,
          data: sortedDevices.map((d) => d.aging.current_dp),
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '设备年限',
          type: 'bar',
          yAxisIndex: 0,
          data: sortedDevices.map((d) => d.aging.device_age),
          itemStyle: { color: '#f59e0b' },
        },
        {
          name: '剩余寿命',
          type: 'line',
          yAxisIndex: 1,
          data: sortedDevices.map((d) => d.aging.remaining_life_years),
          itemStyle: { color: '#10b981' },
          lineStyle: { width: 3 },
        },
      ],
    };
  };

  // 获取严重程度徽章
  const getSeverityBadge = (severity: number) => {
    const severityConfig: Record<number, { text: string; className: string }> = {
      0: { text: '正常', className: 'bg-green-600 text-white' },
      1: { text: '轻微', className: 'bg-blue-600 text-white' },
      2: { text: '注意', className: 'bg-orange-600 text-white' },
      3: { text: '严重', className: 'bg-red-600 text-white' },
    };
    const config = severityConfig[severity] || severityConfig[0];
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-mono ${config.className}`}>
        {config.text}
      </span>
    );
  };

  // 筛选关键设备（异常和严重）
  const criticalDevices = filteredDevices
    .filter((d) => d.severity >= 2)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 10);

  // 获取唯一的故障类型列表
  const uniqueFaultTypes = Array.from(new Set(devices.map((d) => d.fault_type)));

  // 清除所有筛选
  const handleClearFilters = () => {
    setSearchText('');
    setSeverityFilter(null);
    setFaultTypeFilter(null);
    message.success('已清除所有筛选条件');
  };

  // 判断是否有筛选条件
  const hasFilters = searchText || severityFilter !== null || faultTypeFilter !== null;

  // 导出功能
  const handleExport = (format: 'xlsx' | 'csv', includeDetails: boolean = true) => {
    if (devices.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }

    try {
      const filename = `设备数据_所有设备`;

      if (format === 'xlsx') {
        exportDevicesToExcel(devices, filename, includeDetails);
        message.success('Excel文件导出成功');
      } else {
        exportDevicesToCSV(devices, filename, includeDetails);
        message.success('CSV文件导出成功');
      }
    } catch (error) {
      message.error('导出失败，请重试');
      console.error('Export error:', error);
    }
  };

  // 导出菜单项
  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel-full',
      label: '导出完整数据 (Excel)',
      icon: <AntDownloadOutlined />,
      onClick: () => handleExport('xlsx', true),
    },
    {
      key: 'excel-basic',
      label: '导出基础数据 (Excel)',
      icon: <AntDownloadOutlined />,
      onClick: () => handleExport('xlsx', false),
    },
    {
      type: 'divider',
    },
    {
      key: 'csv-full',
      label: '导出完整数据 (CSV)',
      icon: <AntDownloadOutlined />,
      onClick: () => handleExport('csv', true),
    },
    {
      key: 'csv-basic',
      label: '导出基础数据 (CSV)',
      icon: <AntDownloadOutlined />,
      onClick: () => handleExport('csv', false),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <Title level={3} style={{ margin: 0, color: '#e2e8f0' }}>
          <DashboardOutlined className="mr-2" />
          设备概览仪表盘
        </Title>
        <Space size="middle">
          <Tooltip title="手动刷新数据">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className={`px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-mono flex items-center gap-2 rounded transition-colors border border-slate-600 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>
          </Tooltip>
          <Space direction="vertical" size={0} className="text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                size="small"
              />
              <span>自动刷新</span>
            </div>
            {autoRefresh && (
              <div className="flex items-center gap-1 pl-6">
                <ClockCircleOutlined style={{ fontSize: '10px' }} />
                <span>每{refreshInterval}秒</span>
              </div>
            )}
          </Space>
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
            <button
              disabled={devices.length === 0}
              className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-mono flex items-center gap-2 rounded transition-colors border border-blue-500 ${
                devices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Download size={16} />
              导出数据
            </button>
          </Dropdown>
        </Space>
      </div>

      {/* 搜索和筛选条件 */}
      <div className="bg-slate-800 border border-slate-700 rounded">
        <div className="px-4 py-3 bg-slate-750 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wide flex items-center gap-2">
            <FilterOutlined />
            搜索与筛选
          </h3>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-slate-400 hover:text-slate-200 font-mono flex items-center gap-1 transition-colors"
            >
              <ClearOutlined />
              清除筛选
            </button>
          )}
        </div>
        <div className="p-4">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div className="text-slate-400 text-sm font-mono">设备搜索</div>
              <Input
                placeholder="搜索设备名称或ID"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined className="text-slate-400" />}
                size="large"
              />
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div className="text-slate-400 text-sm font-mono">严重程度筛选</div>
              <Select
                className="w-full"
                placeholder="全部严重程度"
                value={severityFilter}
                onChange={setSeverityFilter}
                size="large"
              >
                <Option value={0}>
                  <Badge color={getSeverityColor(0)} text={getSeverityLabel(0)} />
                </Option>
                <Option value={1}>
                  <Badge color={getSeverityColor(1)} text={getSeverityLabel(1)} />
                </Option>
                <Option value={2}>
                  <Badge color={getSeverityColor(2)} text={getSeverityLabel(2)} />
                </Option>
                <Option value={3}>
                  <Badge color={getSeverityColor(3)} text={getSeverityLabel(3)} />
                </Option>
              </Select>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div className="text-slate-400 text-sm font-mono">故障类型筛选</div>
              <Select
                className="w-full"
                placeholder="全部故障类型"
                value={faultTypeFilter}
                onChange={setFaultTypeFilter}
                size="large"
                popupClassName="select-dropdown-12px"
                dropdownStyle={{ fontSize: '12px' }}
              >
                {uniqueFaultTypes.map((faultType) => (
                  <Option key={faultType} value={faultType} style={{ fontSize: '12px' }}>
                    <span style={{ fontSize: '12px' }}>{formatFaultType(faultType)}</span>
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>
          {hasFilters && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <Text className="text-slate-400 text-sm">
                筛选结果: {filteredDevices.length} / {devices.length} 台设备
              </Text>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" tip="加载中..." />
        </div>
      ) : (
        <>
          {/* KPI指标卡片 */}
          <Row gutter={[16, 16]}>
            {kpiData.map((kpi, index) => (
              <Col span={6} key={index}>
                <Card
                  className="bg-slate-800/50 border-slate-700 hover:shadow-lg transition-shadow"
                  styles={{
                    body: { backgroundColor: 'transparent', height: '120px', display: 'flex', alignItems: 'center' },
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                      <Text className="text-slate-400 text-xs uppercase tracking-wide">
                        {kpi.title}
                      </Text>
                      <div className="mt-2">
                        <Statistic
                          value={kpi.value}
                          suffix={kpi.suffix}
                          valueStyle={{ color: kpi.color, fontSize: '24px', fontWeight: 'bold' }}
                        />
                      </div>
                      {kpi.percent !== undefined && (
                        <Progress
                          percent={kpi.percent}
                          strokeColor={kpi.color}
                          showInfo={false}
                          size="small"
                          className="mt-2"
                        />
                      )}
                    </div>
                    <div
                      className="text-4xl opacity-20"
                      style={{ color: kpi.color }}
                    >
                      {kpi.icon}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* 图表区域 */}
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card
                className="bg-slate-800/50 border-slate-700"
                styles={{
                  body: { backgroundColor: 'transparent' },
                }}
              >
                <ReactECharts option={getHealthPieOption()} style={{ height: 350 }} theme="dark" />
              </Card>
            </Col>
            <Col span={16}>
              <Card
                className="bg-slate-800/50 border-slate-700"
                styles={{
                  body: { backgroundColor: 'transparent' },
                }}
              >
                <ReactECharts
                  option={getFaultDistributionOption()}
                  style={{ height: 350 }}
                  theme="dark"
                />
              </Card>
            </Col>
          </Row>

          {/* 老化趋势图 */}
          <Card
            className="bg-slate-800/50 border-slate-700"
            styles={{
              body: { backgroundColor: 'transparent' },
            }}
          >
            <ReactECharts option={getAgingTrendOption()} style={{ height: 400 }} theme="dark" />
          </Card>

          {/* 关键设备列表 */}
          {criticalDevices.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded">
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex items-center gap-2">
                <ThunderboltOutlined style={{ fontSize: 18, color: '#f97316' }} />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">
                  关键关注设备 ({criticalDevices.length})
                </h3>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                          设备名称
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                          严重程度
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                          故障类型
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                          热点温度
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                          剩余寿命
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {criticalDevices.map((device, index) => (
                        <tr
                          key={device.device_id}
                          className={`border-b border-slate-700 hover:bg-slate-750 transition-colors ${
                            index % 2 === 0 ? 'bg-slate-900 bg-opacity-50' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-mono text-xs text-white font-bold">
                            {device.device_name}
                          </td>
                          <td className="py-3 px-3">
                            {getSeverityBadge(device.severity)}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-slate-300">
                            {formatFaultType(device.fault_type)}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs">
                            <span className={device.thermal.hotspot_temp > 110 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                              {device.thermal.hotspot_temp.toFixed(1)}°C
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-xs">
                            <span className={device.aging.remaining_life_years < 10 ? 'text-orange-400 font-bold' : 'text-slate-300'}>
                              {device.aging.remaining_life_years.toFixed(1)}年
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
