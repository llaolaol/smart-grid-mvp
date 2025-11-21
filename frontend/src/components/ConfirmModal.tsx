/**
 * Confirm Modal Component
 * 确认对话框组件 - 工业SCADA风格
 */

import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  okText?: string;
  cancelText?: string;
  onOk: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  content,
  type = 'warning',
  okText = '确认',
  cancelText = '取消',
  onOk,
  onCancel,
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-600',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-500',
    },
    danger: {
      icon: XCircle,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-600',
      buttonColor: 'bg-red-600 hover:bg-red-500',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-500',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-600',
      buttonColor: 'bg-green-600 hover:bg-green-500',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-md overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 bg-slate-750 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${config.iconBg} p-2 rounded`}>
              <Icon size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wide">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          <p className="text-slate-200 font-mono text-sm leading-relaxed">{content}</p>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-slate-750 border-t border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-mono text-sm rounded transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onOk}
            className={`px-6 py-2 ${config.buttonColor} text-white font-mono text-sm rounded transition-colors`}
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
