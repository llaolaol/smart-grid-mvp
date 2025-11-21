/**
 * Formatting Utilities
 * 格式化工具函数
 */

import dayjs from 'dayjs';

/**
 * 格式化数字为指定小数位
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

/**
 * 格式化百分比
 */
export const formatPercent = (num: number, decimals: number = 1): string => {
  return `${num.toFixed(decimals)}%`;
};

/**
 * 格式化日期
 */
export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

/**
 * 格式化温度
 */
export const formatTemperature = (temp: number): string => {
  return `${temp.toFixed(1)}°C`;
};

/**
 * 格式化DGA浓度值
 */
export const formatDGAValue = (value: number): string => {
  return `${value.toFixed(1)} ppm`;
};

/**
 * 获取严重程度颜色
 */
export const getSeverityColor = (severity: number): string => {
  const colorMap: Record<number, string> = {
    0: '#52c41a', // 绿色 - 正常
    1: '#faad14', // 橙色 - 注意
    2: '#ff4d4f', // 红色 - 异常
    3: '#cf1322', // 深红 - 严重
  };
  return colorMap[severity] || '#d9d9d9';
};

/**
 * 获取严重程度标签
 */
export const getSeverityLabel = (severity: number): string => {
  const labelMap: Record<number, string> = {
    0: '正常',
    1: '注意',
    2: '异常',
    3: '严重',
  };
  return labelMap[severity] || '未知';
};

/**
 * 格式化故障类型
 */
export const formatFaultType = (faultType: string): string => {
  const faultTypeMap: Record<string, string> = {
    normal: '正常',
    partial_discharge: '局部放电',
    low_energy_discharge: '低能量放电',
    high_energy_discharge: '高能量放电',
    thermal_low: '低温过热',
    thermal_medium: '中温过热',
    thermal_high: '高温过热',
    low_temp_overheating: '低温过热',
    high_temp_overheating: '高温过热',
    thermal: '热故障',
    discharge: '放电故障',
    overheating: '过热',
    local_overheating: '局部过热',
    general_overheating: '整体过热',
  };
  return faultTypeMap[faultType] || faultType;
};

/**
 * 下载文件
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
