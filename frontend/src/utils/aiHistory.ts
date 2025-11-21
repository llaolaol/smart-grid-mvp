/**
 * AI Analysis History Management
 * AI分析历史记录管理
 */

export interface AIAnalysisRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  timestamp: number;
  type: 'device_analysis' | 'question' | 'maintenance';
  question?: string;
  analysis: string;
}

const STORAGE_KEY = 'smart_grid_ai_history';
const MAX_RECORDS = 50; // 最多保存50条记录

/**
 * 获取所有历史记录
 */
export const getAIHistory = (): AIAnalysisRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load AI history:', error);
  }
  return [];
};

/**
 * 获取特定设备的历史记录
 */
export const getDeviceAIHistory = (deviceId: string): AIAnalysisRecord[] => {
  const allHistory = getAIHistory();
  return allHistory.filter(record => record.deviceId === deviceId);
};

/**
 * 添加新的分析记录
 */
export const addAIHistoryRecord = (record: Omit<AIAnalysisRecord, 'id' | 'timestamp'>): AIAnalysisRecord => {
  const newRecord: AIAnalysisRecord = {
    ...record,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  const history = getAIHistory();
  history.unshift(newRecord); // 最新的在前面

  // 限制记录数量
  const trimmedHistory = history.slice(0, MAX_RECORDS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));

  return newRecord;
};

/**
 * 删除特定记录
 */
export const deleteAIHistoryRecord = (id: string): void => {
  const history = getAIHistory();
  const filtered = history.filter(record => record.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

/**
 * 清空所有历史记录
 */
export const clearAIHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * 清空特定设备的历史记录
 */
export const clearDeviceAIHistory = (deviceId: string): void => {
  const history = getAIHistory();
  const filtered = history.filter(record => record.deviceId !== deviceId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

/**
 * 导出历史记录为JSON
 */
export const exportAIHistory = (): string => {
  const history = getAIHistory();
  return JSON.stringify(history, null, 2);
};

/**
 * 导入历史记录
 */
export const importAIHistory = (jsonString: string): boolean => {
  try {
    const imported = JSON.parse(jsonString);
    if (Array.isArray(imported)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
      return true;
    }
  } catch (error) {
    console.error('Failed to import AI history:', error);
  }
  return false;
};

/**
 * 获取记录类型的显示名称
 */
export const getRecordTypeLabel = (type: AIAnalysisRecord['type']): string => {
  const labels = {
    device_analysis: '设备分析',
    question: '智能问答',
    maintenance: '维护建议',
  };
  return labels[type] || type;
};

/**
 * 格式化时间戳
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
