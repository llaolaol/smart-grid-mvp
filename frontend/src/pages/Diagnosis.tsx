/**
 * Comprehensive Diagnosis Page
 * 综合诊断分析页面 - 包含DGA、热分析、老化分析
 */

import { useState, useEffect } from 'react';
import { Select, message, Tooltip } from 'antd';
import {
  Activity,
  Thermometer,
  Zap,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  Info,
} from 'lucide-react';
import { deviceAPI, diagnosisAPI } from '@/services/api';
import type { Device, DiagnosisResult } from '@/types';

// 双语标题组件
const BilingualHeader: React.FC<{
  chinese: string;
  english: string;
  level?: number;
  tooltip?: string;
}> = ({
  chinese,
  english,
  level = 2,
  tooltip,
}) => {
  const levelClasses = {
    1: 'text-2xl',
    2: 'text-xl',
    3: 'text-base',
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <h2 className={`${levelClasses[level as keyof typeof levelClasses]} font-bold font-mono text-white`}>
          {chinese}
        </h2>
        {tooltip && (
          <Tooltip title={tooltip} placement="right">
            <Info size={16} className="text-slate-400 opacity-60 hover:opacity-100 transition-opacity cursor-help" />
          </Tooltip>
        )}
      </div>
      <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">{english}</p>
    </div>
  );
};

const Diagnosis: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载所有设备
  useEffect(() => {
    loadDevices();
  }, []);

  // 当设备改变时，执行诊断
  useEffect(() => {
    if (currentDevice) {
      performDiagnosis();
    }
  }, [currentDevice]);

  const loadDevices = async () => {
    try {
      const allDevices = await deviceAPI.getAllDevices();
      setDevices(allDevices);
      if (allDevices.length > 0) {
        setSelectedDeviceId(allDevices[0].device_id);
        setCurrentDevice(allDevices[0]);
      }
    } catch (error) {
      message.error('加载设备失败');
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    const device = devices.find((d) => d.device_id === deviceId);
    if (device) {
      setCurrentDevice(device);
    }
  };

  const performDiagnosis = async () => {
    if (!currentDevice) return;

    setLoading(true);
    try {
      const response = await diagnosisAPI.diagnose({
        dga_data: currentDevice.dga,
      });
      setDiagnosis(response.result);
    } catch (error) {
      message.error('诊断失败');
    } finally {
      setLoading(false);
    }
  };

  // 严重程度标签
  const getSeverityLabel = (severity: number) => {
    const labels = ['正常', '轻微', '注意', '严重'];
    return labels[severity] || '未知';
  };

  const getSeverityColor = (severity: number) => {
    const colors = ['text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
    return colors[severity] || 'text-slate-400';
  };

  const getSeverityBgColor = (severity: number) => {
    const colors = ['bg-green-900', 'bg-yellow-900', 'bg-orange-900', 'bg-red-900'];
    return colors[severity] || 'bg-slate-900';
  };

  const getSeverityBorderColor = (severity: number) => {
    const colors = ['border-green-500', 'border-yellow-500', 'border-orange-500', 'border-red-500'];
    return colors[severity] || 'border-slate-500';
  };

  // 故障类型格式化
  const formatFaultType = (type: string) => {
    const mapping: Record<string, string> = {
      normal: '正常',
      thermal: '热故障',
      discharge: '放电故障',
      low_energy_discharge: '低能放电',
      high_energy_discharge: '高能放电',
      partial_discharge: '局部放电',
      overheating: '过热',
      local_overheating: '局部过热',
      general_overheating: '整体过热',
    };
    return mapping[type] || type;
  };

  if (!currentDevice || !diagnosis) {
    return (
      <div className="space-y-4">
        {/* 设备选择 */}
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <BilingualHeader chinese="选择设备" english="SELECT DEVICE" level={3} />
          <Select
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            className="w-full"
            placeholder="选择要诊断的设备"
            loading={devices.length === 0}
          >
            {devices.map((device) => (
              <Select.Option key={device.device_id} value={device.device_id}>
                {device.device_name} - {formatFaultType(device.fault_type)}
              </Select.Option>
            ))}
          </Select>
        </div>

        {loading && (
          <div className="bg-slate-800 border border-slate-700 rounded p-8 text-center">
            <div className="text-blue-400 font-mono">诊断分析中...</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 顶部标题栏 */}
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono uppercase tracking-wide">综合诊断分析</h2>
              <p className="text-xs text-slate-400 font-mono">COMPREHENSIVE DIAGNOSIS</p>
            </div>
          </div>
          <div className="w-80">
            <Select
              value={selectedDeviceId}
              onChange={handleDeviceChange}
              style={{ width: '100%' }}
              placeholder="选择设备"
            >
              {devices.map((device) => (
                <Select.Option key={device.device_id} value={device.device_id}>
                  {device.device_name} - {formatFaultType(device.fault_type)}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* 设备信息 */}
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <div className="text-xs text-slate-400 font-mono uppercase mb-2">设备信息 / DEVICE INFO</div>
        <div className="text-xl font-bold font-mono text-white">
          {currentDevice.device_name} ({currentDevice.device_id})
        </div>
      </div>

      {/* 诊断结果 - 3列 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs text-slate-400 font-mono uppercase">诊断结果 / DIAGNOSIS</div>
            <Tooltip
              title="基于IEC 60599标准的DGA三比值法，通过分析特征气体比值（C2H2/C2H4、CH4/H2、C2H4/C2H6）判断故障类型，包括过热、放电等8种典型故障模式。"
              placement="top"
            >
              <Info size={14} className="text-slate-400 opacity-60 hover:opacity-100 transition-opacity cursor-help" />
            </Tooltip>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {formatFaultType(diagnosis.fault_type)}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs text-slate-400 font-mono uppercase">严重程度 / SEVERITY</div>
            <Tooltip
              title="根据DGA气体浓度、变化速率和热点温度综合评估，分为4级：0-正常（可继续运行）、1-轻微（需监测）、2-注意（需计划检修）、3-严重（需立即处理）。"
              placement="top"
            >
              <Info size={14} className="text-slate-400 opacity-60 hover:opacity-100 transition-opacity cursor-help" />
            </Tooltip>
          </div>
          <div className={`text-2xl font-bold font-mono ${getSeverityColor(diagnosis.severity)}`}>
            {getSeverityLabel(diagnosis.severity)}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs text-slate-400 font-mono uppercase">置信度 / CONFIDENCE</div>
            <Tooltip
              title="诊断结论的可信度，由多个因素决定：比值的明确性（是否接近标准阈值）、气体数据完整性、历史趋势一致性。置信度>80%表示诊断结论可靠。"
              placement="top"
            >
              <Info size={14} className="text-slate-400 opacity-60 hover:opacity-100 transition-opacity cursor-help" />
            </Tooltip>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {(diagnosis.confidence * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* DGA数据 & 特征比值 - 2列 */}
      <div className="grid grid-cols-2 gap-4">
        {/* DGA溶解气体分析 */}
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <BilingualHeader
            chinese="DGA溶解气体分析"
            english="DGA DATA"
            level={3}
            tooltip="溶解气体分析（Dissolved Gas Analysis）：变压器油中溶解的气体成分及浓度反映内部绝缘状态。H2、CH4源于局部过热；C2H2、C2H4指示放电；CO、CO2反映纤维素老化。单位：ppm（百万分之一体积比）。"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-xs font-mono text-slate-400 uppercase">
                    气体 / GAS
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-mono text-slate-400 uppercase">
                    浓度 / PPM
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'H₂', value: currentDevice.dga.H2 },
                  { label: 'CH₄', value: currentDevice.dga.CH4 },
                  { label: 'C₂H₆', value: currentDevice.dga.C2H6 },
                  { label: 'C₂H₄', value: currentDevice.dga.C2H4 },
                  { label: 'C₂H₂', value: currentDevice.dga.C2H2 },
                  { label: 'CO', value: currentDevice.dga.CO },
                  { label: 'CO₂', value: currentDevice.dga.CO2 },
                ].map((gas, index) => (
                  <tr
                    key={gas.label}
                    className={`border-b border-slate-700 ${
                      index % 2 === 0 ? 'bg-slate-900 bg-opacity-50' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-xs text-cyan-400 font-bold">
                      {gas.label}
                    </td>
                    <td className="py-2 px-3 font-mono text-xs text-white text-right">
                      {gas.value.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 特征比值 */}
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
          <BilingualHeader
            chinese="特征比值"
            english="CHARACTERISTIC RATIOS"
            level={3}
            tooltip="IEC三比值法的核心诊断参数。C2H2/C2H4（乙炔/乙烯比）区分放电类型；CH4/H2（甲烷/氢气比）判断过热程度；C2H4/C2H6（乙烯/乙烷比）识别温度范围。通过查表对应故障编码实现精准诊断。"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-xs font-mono text-slate-400 uppercase">
                    比值 / RATIO
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-mono text-slate-400 uppercase">
                    数值 / VALUE
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(diagnosis.ratios).map(([key, value], index) => (
                  <tr
                    key={key}
                    className={`border-b border-slate-700 ${
                      index % 2 === 0 ? 'bg-slate-900 bg-opacity-50' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-xs text-purple-400 font-bold">{key}</td>
                    <td className="py-2 px-3 font-mono text-xs text-white text-right">
                      {value.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 热分析 */}
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <BilingualHeader
          chinese="热分析"
          english="THERMAL ANALYSIS"
          level={3}
          tooltip="基于传热学和电磁场理论的热-电耦合模型。油温反映整体热状态；热点温度（绕组最高温度）通过损耗计算获得，>110°C需关注；环境温度影响散热；负载决定损耗功率。三者耦合预测温升。"
        />
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-900 bg-opacity-50 border border-slate-700 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer size={16} className="text-blue-400" />
              <div className="text-xs text-slate-400 font-mono">油温 / OIL TEMP</div>
            </div>
            <div className="text-xl font-bold font-mono text-blue-400">
              {currentDevice.thermal.oil_temp.toFixed(1)} °C
            </div>
          </div>
          <div className="bg-slate-900 bg-opacity-50 border border-slate-700 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer size={16} className="text-orange-400" />
              <div className="text-xs text-slate-400 font-mono">热点温度 / HOTSPOT</div>
            </div>
            <div
              className={`text-xl font-bold font-mono ${
                currentDevice.thermal.hotspot_temp > 110 ? 'text-red-400' : 'text-orange-400'
              }`}
            >
              {currentDevice.thermal.hotspot_temp.toFixed(1)} °C
            </div>
            {currentDevice.thermal.hotspot_temp > 110 && (
              <div className="text-xs text-red-400 font-mono mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                超标
              </div>
            )}
            {currentDevice.thermal.hotspot_temp <= 110 && (
              <div className="text-xs text-green-400 font-mono mt-1 flex items-center gap-1">
                <CheckCircle size={12} />
                正常
              </div>
            )}
          </div>
          <div className="bg-slate-900 bg-opacity-50 border border-slate-700 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer size={16} className="text-cyan-400" />
              <div className="text-xs text-slate-400 font-mono">环境温度 / AMBIENT</div>
            </div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {currentDevice.thermal.ambient_temp.toFixed(1)} °C
            </div>
          </div>
          <div className="bg-slate-900 bg-opacity-50 border border-slate-700 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Gauge size={16} className="text-yellow-400" />
              <div className="text-xs text-slate-400 font-mono">负载 / LOAD</div>
            </div>
            <div className="text-xl font-bold font-mono text-yellow-400">
              {currentDevice.operating_condition.load_percent.toFixed(0)} %
            </div>
          </div>
        </div>
      </div>

      {/* 老化分析 */}
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <BilingualHeader
          chinese="老化分析"
          english="AGING ANALYSIS"
          level={3}
          tooltip="基于Arrhenius方程的绝缘纸聚合度（DP）衰减模型。DP值反映纤维素聚合链长度，新设备约1200，<200需更换。老化速率受温度、水分、氧气影响，遵循指数衰减规律，预测剩余寿命。"
        />
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 bg-opacity-50 border border-slate-700 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-purple-400" />
              <div className="text-xs text-slate-400 font-mono">当前DP值 / CURRENT DP</div>
            </div>
            <div className="text-xl font-bold font-mono text-purple-400">
              {currentDevice.aging.current_dp.toFixed(0)}
            </div>
          </div>
          <div className="bg-slate-900 bg-opacity-50 border border-slate-700 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-green-400" />
              <div className="text-xs text-slate-400 font-mono">运行年限 / SERVICE YEARS</div>
            </div>
            <div className="text-xl font-bold font-mono text-green-400">
              {currentDevice.aging.device_age.toFixed(1)} 年
            </div>
          </div>
          <div className="bg-slate-900 bg-opacity-50 border border-slate-700 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-red-400" />
              <div className="text-xs text-slate-400 font-mono">老化速率 / AGING RATE</div>
            </div>
            <div className="text-xl font-bold font-mono text-red-400">
              {currentDevice.aging.aging_rate.toFixed(3)} DP/天
            </div>
          </div>
        </div>
      </div>

      {/* 运维建议 */}
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <BilingualHeader chinese="运维建议" english="MAINTENANCE RECOMMENDATIONS" level={3} />
        <div className="space-y-2">
          {diagnosis.recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-3 rounded border flex items-start gap-3 ${
                diagnosis.severity === 0
                  ? 'bg-blue-900 bg-opacity-20 border-blue-700'
                  : diagnosis.severity === 1
                  ? 'bg-yellow-900 bg-opacity-20 border-yellow-700'
                  : diagnosis.severity === 2
                  ? 'bg-orange-900 bg-opacity-20 border-orange-700'
                  : 'bg-red-900 bg-opacity-20 border-red-700'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  diagnosis.severity === 0
                    ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)]'
                    : diagnosis.severity === 1
                    ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.9)]'
                    : diagnosis.severity === 2
                    ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.9)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                }`}
              ></div>
              <div className="text-sm font-mono text-slate-200">
                <strong>{index + 1}.</strong> {rec}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Diagnosis;
