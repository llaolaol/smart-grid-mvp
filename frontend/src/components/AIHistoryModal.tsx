/**
 * AI History Modal Component
 * AI历史记录模态框 - 工业SCADA风格
 */

import { useState } from 'react';
import { X, History, Trash2 } from 'lucide-react';
import { Timeline } from 'antd';
import MarkdownDisplay from './MarkdownDisplay';
import ConfirmModal from './ConfirmModal';
import {
  formatTimestamp,
  getRecordTypeLabel,
  type AIAnalysisRecord,
} from '@/utils/aiHistory';

interface AIHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AIAnalysisRecord[];
  onClearHistory: () => void;
}

const AIHistoryModal: React.FC<AIHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearClick = () => {
    setShowClearConfirm(true);
  };

  const handleClearConfirm = () => {
    onClearHistory();
    setShowClearConfirm(false);
  };

  const handleClearCancel = () => {
    setShowClearConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 bg-slate-750 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-600 p-2 rounded">
              <History size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
                AI分析历史记录 / AI HISTORY
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                AI ANALYSIS HISTORY RECORDS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-6">
          {history.length > 0 ? (
            <Timeline
              items={history.map((record) => ({
                color:
                  record.type === 'device_analysis'
                    ? 'blue'
                    : record.type === 'question'
                    ? 'green'
                    : 'orange',
                children: (
                  <div key={record.id} className="mb-4">
                    <div className="mb-2">
                      <span className="text-white font-bold font-mono text-sm">
                        {getRecordTypeLabel(record.type)}
                      </span>
                      <span className="ml-3 text-xs text-slate-400 font-mono">
                        {formatTimestamp(record.timestamp)}
                      </span>
                    </div>
                    {record.question && (
                      <div className="mb-3 p-3 bg-slate-750 border border-slate-700 rounded">
                        <span className="text-slate-400 font-mono text-xs">问题：</span>
                        <span className="text-slate-200 font-mono text-sm ml-2">
                          {record.question}
                        </span>
                      </div>
                    )}
                    <div className="bg-slate-900 border border-slate-700 rounded p-4 max-h-60 overflow-y-auto">
                      <MarkdownDisplay
                        content={
                          record.analysis.length > 500
                            ? record.analysis.substring(0, 500) + '...'
                            : record.analysis
                        }
                      />
                    </div>
                  </div>
                ),
              }))}
            />
          ) : (
            <div className="text-center py-20">
              <History size={64} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 font-mono text-sm">暂无历史记录</p>
              <p className="text-slate-500 font-mono text-xs mt-2">
                使用AI分析功能后，记录将显示在这里
              </p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-slate-750 border-t border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={handleClearClick}
            disabled={history.length === 0}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Trash2 size={16} />
            清空历史
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-sm rounded transition-colors flex items-center gap-2"
          >
            关闭
          </button>
        </div>
      </div>

      {/* 清空历史确认对话框 */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="清空历史记录"
        content="确定要清空所有AI分析历史记录吗？此操作不可撤销。"
        type="danger"
        okText="确定清空"
        cancelText="取消"
        onOk={handleClearConfirm}
        onCancel={handleClearCancel}
      />
    </div>
  );
};

export default AIHistoryModal;
