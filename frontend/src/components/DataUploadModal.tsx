/**
 * Data Upload Modal Component
 * 数据上传模态框 - 工业SCADA风格
 */

import { useState, useCallback, useEffect } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { deviceAPI } from '@/services/api';
import type { Device } from '@/types';
import { formatFaultType } from '@/utils/format';

// 数据类型定义
const DATA_TYPES = [
  { value: 'routine', label: '例行试验', color: 'blue' },
  { value: 'preventive', label: '预防性试验', color: 'green' },
  { value: 'dga', label: 'DGA油色谱', color: 'cyan' },
  { value: 'pd', label: '局部放电', color: 'purple' },
  { value: 'defect', label: '缺陷处理', color: 'orange' },
  { value: 'emergency', label: '应急检测', color: 'red' }
];

// 测试项目接口
interface TestItem {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  standard: string;
}

// 上传文件接口
interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

interface DataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataUploadModal: React.FC<DataUploadModalProps> = ({ isOpen, onClose }) => {
  const [dataType, setDataType] = useState('routine');
  const [deviceId, setDeviceId] = useState('');
  const [operator, setOperator] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 16));
  const [remarks, setRemarks] = useState('');
  const [testItems, setTestItems] = useState<TestItem[]>([
    { id: '1', parameter: '', value: '', unit: '', standard: '' }
  ]);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // 加载设备列表
  useEffect(() => {
    const loadDevices = async () => {
      setLoadingDevices(true);
      try {
        const data = await deviceAPI.getAllDevices();
        setDevices(data);
      } catch (error) {
        console.error('Failed to load devices:', error);
      } finally {
        setLoadingDevices(false);
      }
    };

    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  // 添加测试项
  const addTestItem = () => {
    setTestItems([
      ...testItems,
      { id: Date.now().toString(), parameter: '', value: '', unit: '', standard: '' }
    ]);
  };

  // 删除测试项
  const removeTestItem = (id: string) => {
    if (testItems.length > 1) {
      setTestItems(testItems.filter(item => item.id !== id));
    }
  };

  // 更新测试项
  const updateTestItem = (id: string, field: keyof TestItem, value: string) => {
    setTestItems(testItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = Array.from(files).map(file => ({
      id: Date.now().toString() + Math.random(),
      file,
      progress: 0,
      status: 'pending'
    }));

    setUploadFiles([...uploadFiles, ...newFiles]);
  };

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [uploadFiles]);

  // 删除文件
  const removeFile = (id: string) => {
    setUploadFiles(uploadFiles.filter(f => f.id !== id));
  };

  // 表单提交
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // 模拟上传
      const formData = {
        dataType,
        deviceId,
        operator,
        testDate,
        testItems: testItems.filter(item => item.parameter && item.value),
        remarks
      };

      console.log('提交数据:', formData);

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 成功后关闭
      onClose();

      // 重置表单
      resetForm();
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setDataType('routine');
    setDeviceId('');
    setOperator('');
    setTestDate(new Date().toISOString().slice(0, 16));
    setRemarks('');
    setTestItems([{ id: '1', parameter: '', value: '', unit: '', standard: '' }]);
    setUploadFiles([]);
  };

  if (!isOpen) return null;

  const currentDataType = DATA_TYPES.find(t => t.value === dataType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 bg-slate-750 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
              数据上传 / DATA UPLOAD
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              UPLOAD TEST DATA & DOCUMENTS
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 数据类型 */}
            <div>
              <label className="block text-xs text-slate-400 font-mono uppercase mb-2">
                数据类型 / Data Type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DATA_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setDataType(type.value)}
                    className={`px-3 py-2 rounded border text-xs font-mono transition-all ${
                      dataType === type.value
                        ? `bg-${type.color}-600 border-${type.color}-500 text-white`
                        : 'bg-slate-700 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 设备选择 */}
            <div>
              <label className="block text-xs text-slate-400 font-mono uppercase mb-2">
                设备编号 / Device ID *
              </label>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                disabled={loadingDevices}
              >
                <option value="">
                  {loadingDevices ? '加载设备中...' : '请选择设备...'}
                </option>
                {devices.map((device) => (
                  <option key={device.device_id} value={device.device_id}>
                    {device.device_name} - {formatFaultType(device.fault_type)}
                  </option>
                ))}
              </select>
            </div>

            {/* 操作员 */}
            <div>
              <label className="block text-xs text-slate-400 font-mono uppercase mb-2">
                操作员 / Operator *
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="请输入操作员姓名"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>

            {/* 测试日期 */}
            <div>
              <label className="block text-xs text-slate-400 font-mono uppercase mb-2">
                测试时间 / Test Date *
              </label>
              <input
                type="datetime-local"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 测试数据表格 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-slate-400 font-mono uppercase">
                测试数据 / Test Data
              </label>
              <button
                onClick={addTestItem}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-mono rounded flex items-center gap-2 transition-colors"
              >
                <Plus size={14} />
                添加行
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-750">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-mono text-slate-400 uppercase">参数</th>
                    <th className="text-left py-2 px-3 text-xs font-mono text-slate-400 uppercase">测量值</th>
                    <th className="text-left py-2 px-3 text-xs font-mono text-slate-400 uppercase">单位</th>
                    <th className="text-left py-2 px-3 text-xs font-mono text-slate-400 uppercase">标准值</th>
                    <th className="text-center py-2 px-3 text-xs font-mono text-slate-400 uppercase w-20">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {testItems.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900'}>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.parameter}
                          onChange={(e) => updateTestItem(item.id, 'parameter', e.target.value)}
                          placeholder="H2, CH4..."
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => updateTestItem(item.id, 'value', e.target.value)}
                          placeholder="数值"
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateTestItem(item.id, 'unit', e.target.value)}
                          placeholder="ppm, °C"
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.standard}
                          onChange={(e) => updateTestItem(item.id, 'standard', e.target.value)}
                          placeholder="< 150"
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => removeTestItem(item.id)}
                          disabled={testItems.length === 1}
                          className={`p-1 rounded transition-colors ${
                            testItems.length === 1
                              ? 'text-slate-600 cursor-not-allowed'
                              : 'text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-30'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 文件上传 */}
          <div>
            <label className="block text-xs text-slate-400 font-mono uppercase mb-3">
              附件上传 / File Upload
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                  : 'border-slate-700 bg-slate-900'
              }`}
            >
              <Upload size={48} className="mx-auto text-slate-400 mb-3" />
              <p className="text-white font-mono text-sm mb-2">
                拖拽文件到此处或点击上传
              </p>
              <p className="text-slate-400 text-xs font-mono mb-4">
                支持 PDF, Excel, Word, 图片等格式
              </p>
              <input
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-mono rounded cursor-pointer inline-block transition-colors"
              >
                选择文件
              </label>
            </div>

            {/* 文件列表 */}
            {uploadFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText size={20} className="text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-mono text-sm truncate">
                          {file.file.name}
                        </p>
                        <p className="text-slate-400 text-xs font-mono">
                          {(file.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      {file.status === 'success' && (
                        <CheckCircle size={20} className="text-green-400" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle size={20} className="text-red-400" />
                      )}
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="ml-3 p-1 text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-30 rounded transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-xs text-slate-400 font-mono uppercase mb-2">
              备注 / Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="请输入备注信息..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500 resize-none"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-slate-750 border-t border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-mono text-sm rounded transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !deviceId || !operator}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-sm rounded transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                上传中...
              </>
            ) : (
              <>
                <Upload size={16} />
                确认上传
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataUploadModal;
