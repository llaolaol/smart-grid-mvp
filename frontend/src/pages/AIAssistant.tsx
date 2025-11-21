/**
 * AI Assistant Page
 * AI对话助手页面 - 设备分析与智能问答
 */

import React, { useState, useEffect } from 'react';
import {
  Select,
  Button,
  Input,
  Space,
  message,
  Spin,
  Alert,
} from 'antd';
import {
  Bot,
  Zap,
  MessageCircle,
  Wrench,
  History,
  Loader2,
} from 'lucide-react';
import { deviceAPI, diagnosisAPI, aiAPI } from '@/services/api';
import type { Device } from '@/types';
import MarkdownDisplay from '@/components/MarkdownDisplay';
import AIHistoryModal from '@/components/AIHistoryModal';
import {
  addAIHistoryRecord,
  getDeviceAIHistory,
  clearDeviceAIHistory,
  type AIAnalysisRecord,
} from '@/utils/aiHistory';

const { TextArea } = Input;
const { Option } = Select;

const AIAssistant: React.FC = () => {
  // 设备
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // AI分析状态
  const [deviceAnalysisLoading, setDeviceAnalysisLoading] = useState(false);
  const [deviceAnalysis, setDeviceAnalysis] = useState<string>('');

  // 自由问答
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionAnswer, setQuestionAnswer] = useState<string>('');

  // 维护建议
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceRecommendation, setMaintenanceRecommendation] = useState<string>('');

  // AI服务状态
  const [aiAvailable, setAiAvailable] = useState<boolean>(false);

  // 历史记录
  const [history, setHistory] = useState<AIAnalysisRecord[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 加载设备列表和AI服务状态
  useEffect(() => {
    loadDevices();
    checkAIHealth();
  }, []);

  // 加载历史记录
  useEffect(() => {
    if (selectedDeviceId) {
      const deviceHistory = getDeviceAIHistory(selectedDeviceId);
      setHistory(deviceHistory);
    }
  }, [selectedDeviceId]);

  // 加载选中设备
  useEffect(() => {
    if (selectedDeviceId) {
      loadSelectedDevice();
    }
  }, [selectedDeviceId]);

  const checkAIHealth = async () => {
    try {
      const response = await aiAPI.healthCheck();
      setAiAvailable(response.status === 'healthy');
    } catch (error) {
      console.error('AI health check failed:', error);
      setAiAvailable(false);
    }
  };

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

  const loadSelectedDevice = async () => {
    try {
      const device = await deviceAPI.getDeviceById(selectedDeviceId);
      setSelectedDevice(device);
    } catch (error) {
      message.error('加载设备详情失败');
    }
  };

  // 分析设备
  const handleAnalyzeDevice = async () => {
    if (!selectedDevice) {
      message.warning('请先选择设备');
      return;
    }

    setDeviceAnalysisLoading(true);
    try {
      // 先执行诊断
      const diagnosisResult = await diagnosisAPI.diagnose({
        dga_data: selectedDevice.dga,
      });

      // 准备设备数据
      const deviceData = {
        device_id: selectedDevice.device_id,
        device_name: selectedDevice.device_name,
        dga: selectedDevice.dga,
        thermal: selectedDevice.thermal,
        aging: selectedDevice.aging,
        operating_condition: selectedDevice.operating_condition,
      };

      // 调用AI分析
      const response = await aiAPI.analyzeDevice({
        device_data: deviceData,
        diagnosis_result: diagnosisResult.result,
      });

      setDeviceAnalysis(response.analysis);

      // 保存到历史记录
      addAIHistoryRecord({
        deviceId: selectedDevice.device_id,
        deviceName: selectedDevice.device_name,
        type: 'device_analysis',
        analysis: response.analysis,
      });

      // 刷新历史记录
      setHistory(getDeviceAIHistory(selectedDevice.device_id));

      message.success('设备分析完成');
    } catch (error: any) {
      message.error(`分析失败: ${error.message}`);
    } finally {
      setDeviceAnalysisLoading(false);
    }
  };

  // 提问AI
  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) {
      message.warning('请输入问题');
      return;
    }

    if (!selectedDevice) {
      message.warning('请先选择设备');
      return;
    }

    setQuestionLoading(true);
    try {
      const deviceData = {
        device_id: selectedDevice.device_id,
        device_name: selectedDevice.device_name,
        dga: selectedDevice.dga,
        thermal: selectedDevice.thermal,
        aging: selectedDevice.aging,
      };

      const response = await aiAPI.analyzeDevice({
        device_data: deviceData,
        user_question: userQuestion,
      });

      setQuestionAnswer(response.analysis);

      // 保存到历史记录
      addAIHistoryRecord({
        deviceId: selectedDevice.device_id,
        deviceName: selectedDevice.device_name,
        type: 'question',
        question: userQuestion,
        analysis: response.analysis,
      });

      // 刷新历史记录
      setHistory(getDeviceAIHistory(selectedDevice.device_id));

      message.success('问题回答完成');
    } catch (error: any) {
      message.error(`提问失败: ${error.message}`);
    } finally {
      setQuestionLoading(false);
    }
  };

  // 获取维护建议
  const handleGetMaintenance = async () => {
    if (!selectedDevice) {
      message.warning('请先选择设备');
      return;
    }

    setMaintenanceLoading(true);
    try {
      const deviceData = {
        device_id: selectedDevice.device_id,
        device_name: selectedDevice.device_name,
        dga: selectedDevice.dga,
        thermal: selectedDevice.thermal,
        aging: selectedDevice.aging,
        operating_condition: selectedDevice.operating_condition,
      };

      const response = await aiAPI.getMaintenanceRecommendation({
        device_data: deviceData,
      });

      setMaintenanceRecommendation(response.recommendation);

      // 保存到历史记录
      addAIHistoryRecord({
        deviceId: selectedDevice.device_id,
        deviceName: selectedDevice.device_name,
        type: 'maintenance',
        analysis: response.recommendation,
      });

      // 刷新历史记录
      setHistory(getDeviceAIHistory(selectedDevice.device_id));

      message.success('维护建议生成完成');
    } catch (error: any) {
      message.error(`获取建议失败: ${error.message}`);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // 清空设备历史记录
  const handleClearHistory = () => {
    if (!selectedDevice) return;

    clearDeviceAIHistory(selectedDevice.device_id);
    setHistory([]);
    setShowHistoryModal(false);
    message.success('历史记录已清空');
  };

  return (
    <div className="space-y-4">
      {/* 顶部标题栏 */}
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-600 p-2 rounded">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono uppercase tracking-wide">AI 对话助手</h2>
              <p className="text-xs text-slate-400 font-mono">AI ASSISTANT - DEEPSEEK智能设备分析与问答</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistoryModal(true)}
              disabled={history.length === 0}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-mono flex items-center gap-2 rounded transition-colors border border-slate-600"
            >
              <History size={16} />
              历史记录 ({history.length})
            </button>
          </div>
        </div>
      </div>

      {/* AI服务状态警告 */}
      {!aiAvailable && (
        <Alert
          message="AI服务不可用"
          description="请检查 DEEPSEEK_API_KEY 环境变量配置，或检查后端服务是否正常运行。"
          type="warning"
          showIcon
          style={{
            backgroundColor: '#78350f',
            borderColor: '#f59e0b',
            color: '#fbbf24',
          }}
        />
      )}

      {/* 设备选择 */}
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <span className="text-slate-300 font-mono font-bold">选择设备：</span>
            <Select
              style={{ width: 500, marginLeft: 12 }}
              value={selectedDeviceId}
              onChange={setSelectedDeviceId}
            >
              {devices.map((d) => (
                <Option key={d.device_id} value={d.device_id}>
                  {d.device_name} ({d.device_id})
                </Option>
              ))}
            </Select>
          </div>
        </Space>
      </div>

      {/* 主要功能区 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 左侧：设备分析 */}
        <div className="space-y-4">
          {/* 设备智能分析 */}
          <div className="bg-slate-800 border border-slate-700 rounded">
            <div className="px-4 py-3 bg-slate-750 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-blue-400" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">
                  设备智能分析
                </h3>
              </div>
              <button
                onClick={handleAnalyzeDevice}
                disabled={!aiAvailable || !selectedDevice || deviceAnalysisLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-mono flex items-center gap-2 rounded transition-colors border border-blue-500"
              >
                {deviceAnalysisLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    分析设备
                  </>
                )}
              </button>
            </div>
            <div className="p-4">
              {deviceAnalysisLoading ? (
                <div className="text-center py-16">
                  <Spin size="large" />
                  <div className="mt-4 text-slate-400 font-mono text-sm">AI正在分析设备状态...</div>
                </div>
              ) : deviceAnalysis ? (
                <div className="bg-slate-900 border border-slate-700 rounded p-4">
                  <MarkdownDisplay
                    content={deviceAnalysis}
                    filename={`device_analysis_${selectedDevice?.device_id || 'report'}.md`}
                  />
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 font-mono text-sm">
                  点击"分析设备"按钮，AI将分析设备的运行状态、故障诊断结果，并给出专业建议。
                </div>
              )}
            </div>
          </div>

          {/* 维护建议 */}
          <div className="bg-slate-800 border border-slate-700 rounded">
            <div className="px-4 py-3 bg-slate-750 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-green-400" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">
                  维护建议
                </h3>
              </div>
              <button
                onClick={handleGetMaintenance}
                disabled={!aiAvailable || !selectedDevice || maintenanceLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-mono flex items-center gap-2 rounded transition-colors border border-green-500"
              >
                {maintenanceLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wrench size={16} />
                    获取建议
                  </>
                )}
              </button>
            </div>
            <div className="p-4">
              {maintenanceLoading ? (
                <div className="text-center py-16">
                  <Spin size="large" />
                  <div className="mt-4 text-slate-400 font-mono text-sm">AI正在生成维护建议...</div>
                  <div className="mt-2 text-slate-500 font-mono text-xs">
                    正在调用DeepSeek大模型分析，预计需要30-40秒，请耐心等待...
                  </div>
                </div>
              ) : maintenanceRecommendation ? (
                <div className="bg-slate-900 border border-slate-700 rounded p-4">
                  <MarkdownDisplay
                    content={maintenanceRecommendation}
                    filename={`maintenance_${selectedDevice?.device_id || 'recommendation'}.md`}
                  />
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 font-mono text-sm">
                  点击"获取建议"按钮，AI将基于设备数据生成专业的维护建议。
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：智能问答 */}
        <div>
          <div className="bg-slate-800 border border-slate-700 rounded">
            <div className="px-4 py-3 bg-slate-750 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-purple-400" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">
                  智能问答
                </h3>
              </div>
            </div>
            <div className="p-4">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div className="text-slate-300 font-mono font-bold mb-3">向AI提问：</div>
                  <TextArea
                    rows={8}
                    placeholder="输入您关于设备的问题，例如：&#10;- 这台设备目前存在什么风险？&#10;- 如何延长设备寿命？&#10;- DGA数据显示了什么问题？"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    style={{
                      backgroundColor: '#334155',
                      borderColor: '#475569',
                      color: '#e2e8f0',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <button
                  onClick={handleAskQuestion}
                  disabled={!aiAvailable || !selectedDevice || questionLoading}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-mono flex items-center justify-center gap-2 rounded transition-colors border border-purple-500"
                >
                  {questionLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      AI思考中...
                    </>
                  ) : (
                    <>
                      <MessageCircle size={18} />
                      提问
                    </>
                  )}
                </button>

                <div className="border-t border-slate-700 pt-4">
                  <div className="text-slate-300 font-mono font-bold mb-3">AI 回答：</div>
                  {questionLoading ? (
                    <div className="text-center py-12">
                      <Spin size="large" />
                      <div className="mt-4 text-slate-400 font-mono text-sm">AI正在思考...</div>
                    </div>
                  ) : questionAnswer ? (
                    <div className="bg-slate-900 border border-slate-700 rounded p-4 max-h-96 overflow-y-auto">
                      <MarkdownDisplay
                        content={questionAnswer}
                        filename={`qa_answer_${selectedDevice?.device_id || 'response'}.md`}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-20 text-slate-500 font-mono text-sm bg-slate-900 border border-slate-700 rounded">
                      在上方输入您的问题，AI助手将基于当前选中的设备数据为您解答。
                    </div>
                  )}
                </div>
              </Space>
            </div>
          </div>
        </div>
      </div>

      {/* 历史记录模态框 */}
      <AIHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
};

export default AIAssistant;
