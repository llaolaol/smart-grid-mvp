import { useState, useEffect } from 'react';
import {
  Select,
  Space,
  Typography,
  Row,
  Col,
  message,
  Spin,
} from 'antd';
import { SwapOutlined, DownloadOutlined } from '@ant-design/icons';
import { Download, RefreshCw } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { deviceAPI } from '@/services/api';
import type { Device } from '@/types';
import { formatFaultType } from '@/utils/format';
import { exportComparisonToExcel, exportComparisonToCSV } from '@/utils/exportData';

const { Text } = Typography;
const { Option } = Select;

const Comparison = () => {
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [comparedDevices, setComparedDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载所有设备列表
  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true);
      try {
        const data = await deviceAPI.getAllDevices();
        setAvailableDevices(data);
        // 默认选择前3个设备
        const defaultIds = data.slice(0, 3).map((d) => d.device_id);
        setSelectedDeviceIds(defaultIds);
      } catch (error) {
        message.error('加载设备列表失败');
      } finally {
        setLoading(false);
      }
    };
    loadDevices();
  }, []);

  // 当设备选择变化时更新对比数据
  useEffect(() => {
    const devices = availableDevices.filter((d) =>
      selectedDeviceIds.includes(d.device_id)
    );
    setComparedDevices(devices);
  }, [selectedDeviceIds, availableDevices]);

  // DGA气体浓度对比 - 雷达图
  const getDGARadarOption = () => {
    if (comparedDevices.length === 0) return {};

    const indicator = [
      { name: 'H₂', max: 500 },
      { name: 'CH₄', max: 300 },
      { name: 'C₂H₆', max: 200 },
      { name: 'C₂H₄', max: 200 },
      { name: 'C₂H₂', max: 100 },
      { name: 'CO', max: 1000 },
      { name: 'CO₂', max: 10000 },
    ];

    const series = comparedDevices.map((device) => ({
      value: [
        device.dga.H2,
        device.dga.CH4,
        device.dga.C2H6,
        device.dga.C2H4,
        device.dga.C2H2,
        device.dga.CO,
        device.dga.CO2,
      ],
      name: device.device_name,
    }));

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    return {
      title: {
        text: 'DGA气体浓度对比',
        left: 'center',
        textStyle: { color: '#e2e8f0', fontSize: 16 },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#475569',
        textStyle: { color: '#e2e8f0' },
      },
      legend: {
        bottom: 10,
        textStyle: { color: '#94a3b8' },
        data: comparedDevices.map((d) => d.device_name),
      },
      radar: {
        indicator,
        splitArea: {
          areaStyle: {
            color: ['rgba(51, 65, 85, 0.3)', 'rgba(51, 65, 85, 0.1)'],
          },
        },
        axisLine: { lineStyle: { color: '#475569' } },
        splitLine: { lineStyle: { color: '#475569' } },
        axisName: { color: '#94a3b8' },
      },
      series: [
        {
          type: 'radar',
          data: series,
          itemStyle: {
            color: (params: any) => colors[params.dataIndex % colors.length],
          },
        },
      ],
    };
  };

  // 关键指标对比 - 柱状图
  const getMetricsComparisonOption = () => {
    if (comparedDevices.length === 0) return {};

    const deviceNames = comparedDevices.map((d) => d.device_name);

    return {
      title: {
        text: '关键指标对比',
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
      legend: {
        bottom: 10,
        textStyle: { color: '#94a3b8' },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: deviceNames,
        axisLabel: { color: '#94a3b8', interval: 0, rotate: 15 },
        axisLine: { lineStyle: { color: '#475569' } },
      },
      yAxis: [
        {
          type: 'value',
          name: '温度 (°C)',
          position: 'left',
          axisLabel: { color: '#94a3b8' },
          axisLine: { lineStyle: { color: '#475569' } },
          splitLine: { lineStyle: { color: '#334155' } },
        },
        {
          type: 'value',
          name: 'DP值 / 年限',
          position: 'right',
          axisLabel: { color: '#94a3b8' },
          axisLine: { lineStyle: { color: '#475569' } },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '热点温度',
          type: 'bar',
          yAxisIndex: 0,
          data: comparedDevices.map((d) => d.thermal.hotspot_temp),
          itemStyle: { color: '#ef4444' },
        },
        {
          name: '油温',
          type: 'bar',
          yAxisIndex: 0,
          data: comparedDevices.map((d) => d.thermal.oil_temp),
          itemStyle: { color: '#f59e0b' },
        },
        {
          name: 'DP值',
          type: 'bar',
          yAxisIndex: 1,
          data: comparedDevices.map((d) => d.aging.current_dp),
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '剩余寿命',
          type: 'bar',
          yAxisIndex: 1,
          data: comparedDevices.map((d) => d.aging.remaining_life_years),
          itemStyle: { color: '#10b981' },
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

  // 获取故障类型徽章
  const getFaultTypeBadge = (faultType: string) => {
    const isNormal = faultType === 'normal';
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-mono ${isNormal ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
        {formatFaultType(faultType)}
      </span>
    );
  };

  // 对比表格数据
  const comparisonData = [
    {
      key: 'device_id',
      metric: '设备ID',
      ...Object.fromEntries(comparedDevices.map((d) => [d.device_id, d.device_id])),
    },
    {
      key: 'severity',
      metric: '严重程度',
      ...Object.fromEntries(
        comparedDevices.map((d) => [d.device_id, { type: 'severity', value: d.severity }])
      ),
    },
    {
      key: 'fault_type',
      metric: '故障类型',
      ...Object.fromEntries(
        comparedDevices.map((d) => [d.device_id, { type: 'fault', value: d.fault_type }])
      ),
    },
    {
      key: 'hotspot_temp',
      metric: '热点温度',
      ...Object.fromEntries(
        comparedDevices.map((d) => [d.device_id, `${d.thermal.hotspot_temp.toFixed(1)}°C`])
      ),
    },
    {
      key: 'oil_temp',
      metric: '油温',
      ...Object.fromEntries(
        comparedDevices.map((d) => [d.device_id, `${d.thermal.oil_temp.toFixed(1)}°C`])
      ),
    },
    {
      key: 'current_dp',
      metric: '当前DP值',
      ...Object.fromEntries(
        comparedDevices.map((d) => [d.device_id, d.aging.current_dp.toFixed(0)])
      ),
    },
    {
      key: 'device_age',
      metric: '设备年限',
      ...Object.fromEntries(
        comparedDevices.map((d) => [d.device_id, `${d.aging.device_age.toFixed(1)} 年`])
      ),
    },
    {
      key: 'remaining_life',
      metric: '剩余寿命',
      ...Object.fromEntries(
        comparedDevices.map((d) => [d.device_id, `${d.aging.remaining_life_years.toFixed(1)} 年`])
      ),
    },
    {
      key: 'load',
      metric: '负载率',
      ...Object.fromEntries(
        comparedDevices.map((d) => [d.device_id, `${d.operating_condition.load_percent.toFixed(1)}%`])
      ),
    },
  ];

  // 导出功能
  const handleExport = (format: 'xlsx' | 'csv') => {
    if (comparedDevices.length < 2) {
      message.warning('至少需要选择2台设备才能导出对比数据');
      return;
    }

    try {
      const deviceNames = comparedDevices.map((d) => d.device_name).join('_');
      const filename = `设备对比_${deviceNames}`;

      if (format === 'xlsx') {
        exportComparisonToExcel(comparedDevices, filename);
        message.success('Excel文件导出成功');
      } else {
        exportComparisonToCSV(comparedDevices, filename);
        message.success('CSV文件导出成功');
      }
    } catch (error) {
      message.error('导出失败，请重试');
      console.error('Export error:', error);
    }
  };

  const handleReset = () => {
    if (availableDevices.length > 0) {
      const defaultIds = availableDevices.slice(0, 3).map((d) => d.device_id);
      setSelectedDeviceIds(defaultIds);
      message.success('已重置为默认选择');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="bg-slate-800 border border-slate-700 rounded p-4" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded">
              <SwapOutlined style={{ fontSize: 24, color: 'white' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-mono text-slate-200 mb-1">多设备对比分析</h2>
              <p className="text-sm text-slate-400 font-mono">MULTI-DEVICE COMPARISON ANALYSIS</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => {
                const menu = document.getElementById('export-menu');
                if (menu) {
                  menu.classList.toggle('hidden');
                }
              }}
              disabled={comparedDevices.length < 2}
              className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-mono flex items-center gap-2 rounded transition-all shadow-lg hover:shadow-blue-500/50 border border-blue-500 ${
                comparedDevices.length < 2 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Download size={16} />
              导出对比数据
            </button>
            <div
              id="export-menu"
              className="hidden absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 min-w-[200px]"
              onClick={(e) => {
                const menu = document.getElementById('export-menu');
                if (menu) {
                  menu.classList.add('hidden');
                }
              }}
            >
              <div
                onClick={() => handleExport('xlsx')}
                className="px-4 py-2 text-slate-200 hover:bg-slate-700 cursor-pointer flex items-center gap-2 text-sm font-mono"
              >
                <DownloadOutlined />
                导出对比数据 (Excel)
              </div>
              <div
                onClick={() => handleExport('csv')}
                className="px-4 py-2 text-slate-200 hover:bg-slate-700 cursor-pointer flex items-center gap-2 text-sm font-mono"
              >
                <DownloadOutlined />
                导出对比数据 (CSV)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 设备选择器 */}
      <div className="bg-slate-800 border border-slate-700 rounded">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">选择对比设备</h3>
          <button
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-200 font-mono flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={14} />
            重置
          </button>
        </div>
        <div className="p-4">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Text className="text-slate-300 font-mono text-sm">设备选择 (2-4台):</Text>
            <Select
              mode="multiple"
              className="w-full comparison-device-select"
              value={selectedDeviceIds}
              onChange={(values) => {
                if (values.length > 4) {
                  message.warning('最多只能选择4台设备进行对比');
                  return;
                }
                setSelectedDeviceIds(values);
              }}
              placeholder="请选择2-4台设备"
              maxTagCount={4}
              style={{
                fontSize: '14px',
              }}
            >
              {availableDevices.map((device) => (
                <Option key={device.device_id} value={device.device_id}>
                  {device.device_name} - {formatFaultType(device.fault_type)}
                </Option>
              ))}
            </Select>
          </Space>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" tip="加载中..." />
        </div>
      ) : comparedDevices.length < 2 ? (
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="text-center py-10 text-slate-400 font-mono">
            请至少选择2台设备进行对比分析
          </div>
        </div>
      ) : (
        <>
          {/* 图表对比 */}
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <ReactECharts
                  option={getDGARadarOption()}
                  style={{ height: 450 }}
                  theme="dark"
                />
              </div>
            </Col>
            <Col span={12}>
              <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <ReactECharts
                  option={getMetricsComparisonOption()}
                  style={{ height: 450 }}
                  theme="dark"
                />
              </div>
            </Col>
          </Row>

          {/* 详细对比表格 */}
          <div className="bg-slate-800 border border-slate-700 rounded">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-700">
              <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">详细参数对比</h3>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide">
                        指标
                      </th>
                      {comparedDevices.map((device) => (
                        <th
                          key={device.device_id}
                          className="text-left py-3 px-3 text-xs font-mono text-slate-400 uppercase tracking-wide"
                        >
                          {device.device_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, index) => (
                      <tr
                        key={row.key}
                        className={`border-b border-slate-700 hover:bg-slate-750 transition-colors ${
                          index % 2 === 0 ? 'bg-slate-900 bg-opacity-50' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono text-xs text-white font-bold">
                          {row.metric}
                        </td>
                        {comparedDevices.map((device) => {
                          const value = row[device.device_id];
                          return (
                            <td key={device.device_id} className="py-3 px-3 font-mono text-xs text-slate-300">
                              {typeof value === 'object' && value !== null ? (
                                value.type === 'severity' ? (
                                  getSeverityBadge(value.value)
                                ) : value.type === 'fault' ? (
                                  getFaultTypeBadge(value.value)
                                ) : (
                                  value
                                )
                              ) : (
                                value
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Comparison;
