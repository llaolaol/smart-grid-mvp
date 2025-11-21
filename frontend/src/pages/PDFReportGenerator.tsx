/**
 * PDF Report Generator Page
 * PDF报告生成页面 - 完整实现
 */

import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileDown,
  FolderOpen,
} from 'lucide-react';
import { message, Progress, Modal, Select, Space } from 'antd';
import { deviceAPI, diagnosisAPI, reportAPI } from '@/services/api';
import type { Device, DiagnosisRequest } from '@/types';
import { formatFaultType } from '@/utils/format';

const { Option } = Select;

interface ReportGenerationStatus {
  total: number;
  completed: number;
  failed: number;
  current: string;
}

const PDFReportGenerator: React.FC = () => {
  // 设备
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // 生成状态
  const [generating, setGenerating] = useState(false);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<ReportGenerationStatus | null>(null);

  // 加载设备列表
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const data = await deviceAPI.getAllDevices();
      setDevices(data);
      if (data.length > 0) {
        setSelectedDeviceId(data[0].device_id);
      }
    } catch (error) {
      message.error('加载设备列表失败');
    }
  };

  // 生成单设备诊断报告
  const handleGenerateDiagnosisReport = async () => {
    const device = devices.find(d => d.device_id === selectedDeviceId);
    if (!device) {
      message.warning('请先选择设备');
      return;
    }

    setGenerating(true);
    try {
      // 准备诊断请求
      const diagnosisRequest: DiagnosisRequest = {
        dga_data: device.dga,
      };

      // 调用PDF生成API
      const blob = await reportAPI.generateDiagnosisReport(
        selectedDeviceId,
        device,
        diagnosisRequest
      );

      // 下载PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `诊断报告_${device.device_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('诊断报告已生成并下载');
    } catch (error: any) {
      message.error(`生成失败: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // 批量生成诊断报告
  const handleBatchGenerate = async () => {
    if (devices.length === 0) {
      message.warning('没有可用设备');
      return;
    }

    Modal.confirm({
      title: '批量生成诊断报告',
      content: `确定要为所有 ${devices.length} 个设备生成诊断报告吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        setBatchGenerating(true);
        setGenerationStatus({
          total: devices.length,
          completed: 0,
          failed: 0,
          current: '',
        });

        try {
          // 调用批量生成API
          const blob = await reportAPI.generateBatchDiagnosisReports('all');

          // 下载ZIP文件
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `批量诊断报告_所有设备_${new Date().toISOString().split('T')[0]}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          message.success(`成功生成 ${devices.length} 份诊断报告`);
        } catch (error: any) {
          message.error(`批量生成失败: ${error.message}`);
        } finally {
          setBatchGenerating(false);
          setGenerationStatus(null);
        }
      },
    });
  };

  const currentDevice = devices.find(d => d.device_id === selectedDeviceId);

  return (
    <div className="space-y-4 p-6">
      {/* 顶部标题栏 */}
      <div className="bg-slate-800 border border-slate-700 rounded p-4" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-mono text-slate-200 mb-1">PDF 报告生成</h2>
              <p className="text-sm text-slate-400 font-mono">PDF REPORT GENERATION - 专业诊断报告自动生成</p>
            </div>
          </div>
        </div>
      </div>

      {/* 设备选择 */}
      <div className="bg-slate-800 border border-slate-700 rounded">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex items-center gap-2">
          <FolderOpen size={18} className="text-slate-300" />
          <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">选择设备</h3>
        </div>
        <div className="p-4">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <div className="text-sm font-semibold text-slate-200 mb-2">选择设备：</div>
            <Select
              style={{ width: '100%' }}
              value={selectedDeviceId}
              onChange={setSelectedDeviceId}
            >
              {devices.map((d) => (
                <Option key={d.device_id} value={d.device_id}>
                  {d.device_name} - {formatFaultType(d.fault_type)}
                </Option>
              ))}
            </Select>
          </div>

          {currentDevice && (
            <div
              style={{
                background: '#334155',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #475569',
              }}
            >
              <div className="text-sm font-semibold text-slate-200 mb-2">当前设备信息：</div>
              <div className="text-sm text-slate-300 space-y-1">
                <div>设备名称: {currentDevice.device_name}</div>
                <div>设备ID: {currentDevice.device_id}</div>
                <div>故障类型: {currentDevice.fault_type}</div>
                <div>严重程度: {['正常', '轻微', '注意', '严重'][currentDevice.severity]}</div>
              </div>
            </div>
          )}
        </Space>
        </div>
      </div>

      {/* 单设备报告生成 */}
      <div className="bg-slate-800 border border-slate-700 rounded">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex items-center gap-2">
          <FileText size={18} className="text-slate-300" />
          <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">单设备诊断报告</h3>
        </div>
        <div className="p-4">
        <p className="text-sm text-slate-400 mb-3">
          为当前选中的设备生成专业诊断报告PDF，包含：
        </p>
        <ul className="text-sm text-slate-300 space-y-1 mb-5 pl-5">
          <li>设备基本信息</li>
          <li>DGA溶解气体分析数据表格</li>
          <li>故障诊断结果和置信度</li>
          <li>热分析和老化分析</li>
          <li>专业运维建议</li>
        </ul>
        <button
          onClick={handleGenerateDiagnosisReport}
          disabled={!currentDevice || generating}
          className={`w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-mono uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-blue-500/50 border border-blue-500 ${
            !currentDevice || generating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {generating ? <Loader2 size={20} strokeWidth={2.5} className="animate-spin" /> : <FileDown size={20} strokeWidth={2.5} />}
          <span className="font-bold">{generating ? '正在生成PDF...' : '生成诊断报告'}</span>
        </button>
        </div>
      </div>

      {/* 批量报告生成 */}
      <div className="bg-slate-800 border border-slate-700 rounded">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex items-center gap-2">
          <FolderOpen size={18} className="text-slate-300" />
          <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">批量报告生成</h3>
        </div>
        <div className="p-4">
        <p className="text-sm text-slate-400 mb-4">
          为所有设备批量生成诊断报告，生成的报告将打包为ZIP文件下载。
        </p>

        <div
          style={{
            background: '#334155',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #475569',
            marginBottom: 16,
          }}
        >
          <div className="space-y-2">
            <div className="text-sm text-slate-200">
              <strong>设备数量：</strong> {devices.length} 个
            </div>
            <div className="text-sm text-slate-200">
              <strong>预计生成：</strong> {devices.length} 份PDF报告
            </div>
          </div>
        </div>

        {batchGenerating && generationStatus && (
          <div style={{ marginBottom: 16 }}>
            <div className="text-sm text-slate-400 mb-2">
              正在生成批量报告... ({generationStatus.completed}/{generationStatus.total})
            </div>
            <Progress
              percent={Math.round((generationStatus.completed / generationStatus.total) * 100)}
              status="active"
            />
          </div>
        )}

        <button
          onClick={handleBatchGenerate}
          disabled={devices.length === 0 || batchGenerating}
          className={`w-full px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-mono uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-orange-500/50 border border-orange-500 ${
            devices.length === 0 || batchGenerating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {batchGenerating ? <Loader2 size={20} strokeWidth={2.5} className="animate-spin" /> : <Download size={20} strokeWidth={2.5} />}
          <span className="font-bold">{batchGenerating ? '正在批量生成...' : `批量生成 ${devices.length} 份报告`}</span>
        </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded p-4 text-center">
          <div className="text-xs text-slate-400 font-mono uppercase mb-2">设备总数</div>
          <div className="text-3xl font-bold font-mono text-blue-400">{devices.length}</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded p-4 text-center">
          <div className="text-xs text-slate-400 font-mono uppercase mb-2">故障设备数</div>
          <div className="text-3xl font-bold font-mono text-red-400">{devices.filter(d => d.severity >= 2).length}</div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-slate-800 border border-slate-700 rounded">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex items-center gap-2">
          <AlertCircle size={18} className="text-slate-300" />
          <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">使用说明</h3>
        </div>
        <div className="p-4">
          <ul className="text-slate-300 space-y-2 m-0 pl-5">
            <li>单设备报告：选择设备后点击"生成诊断报告"，PDF将自动下载</li>
            <li>批量报告：点击"批量生成"，所有报告将打包为ZIP文件下载</li>
            <li>报告内容：包含完整的DGA分析、诊断结果、热分析和专业建议</li>
            <li>生成时间：单个报告约1-2秒，批量报告根据设备数量而定</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PDFReportGenerator;
