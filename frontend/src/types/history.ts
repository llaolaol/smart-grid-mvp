/**
 * 历史数据类型定义
 *
 * 提供时序数据、趋势分析、统计摘要相关的 TypeScript 接口
 * 与后端 Pydantic 模型保持一致
 */

import { Device } from './index';

/**
 * 设备历史快照
 *
 * 带时间戳的设备数据快照，用于历史数据展示和时间线回放
 */
export interface DeviceHistorySnapshot extends Device {
  timestamp: string;  // ISO 8601 格式，如: "2023-04-03T08:43:00"
}

/**
 * 时间范围查询参数
 *
 * 用于历史数据查询的时间范围定义
 */
export interface TimeRangeQuery {
  start_time?: string;  // 开始时间 (ISO 8601)
  end_time?: string;    // 结束时间 (ISO 8601)
  granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month';  // 时间粒度
}

/**
 * 趋势数据点
 *
 * 单个指标在特定时间点的值
 */
export interface TrendDataPoint {
  timestamp: string;     // 时间戳 (ISO 8601)
  value: number;         // 指标值
  metric_name: string;   // 指标名称，如: "dga.H2", "thermal.oil_temp"
}

/**
 * 趋势数据响应
 *
 * 返回设备指定指标的时序趋势数据
 */
export interface TrendResponse {
  device_id: string;              // 设备ID
  metrics: string[];              // 指标列表
  data_points: TrendDataPoint[];  // 数据点列表
  aggregation?: string;           // 聚合方式: avg/min/max/sum
}

/**
 * 历史数据响应
 *
 * 返回设备的历史快照列表
 */
export interface HistoryResponse {
  device_id: string;                    // 设备ID
  total_points: number;                 // 数据点总数
  time_range: {                         // 时间范围
    start: string | null;               // 开始时间
    end: string | null;                 // 结束时间
  };
  snapshots: DeviceHistorySnapshot[];   // 历史快照列表
  granularity?: string;                 // 数据粒度
}

/**
 * 统计摘要
 *
 * 指定时间段内指标的统计信息
 */
export interface StatisticsSummary {
  metric_name: string;      // 指标名称
  avg: number;              // 平均值
  min: number;              // 最小值
  max: number;              // 最大值
  std_dev: number;          // 标准差
  percentile_95: number;    // 95分位数
  sample_count?: number;    // 样本数量
}

/**
 * 筛选预设
 *
 * 保存用户自定义的筛选条件组合
 */
export interface FilterPreset {
  id: string;               // 预设ID
  name: string;             // 预设名称
  filters: {
    timeRange?: TimeRangeQuery;           // 时间范围
    severityFilter?: number;              // 严重程度筛选
    faultTypeFilter?: string;             // 故障类型筛选
    customFilters?: Record<string, any>;  // 自定义筛选条件
  };
}

/**
 * 批量历史数据响应
 *
 * 返回多个设备的历史数据映射
 */
export interface BatchHistoryResponse {
  [device_id: string]: HistoryResponse;
}

/**
 * 回放控制参数
 *
 * 用于时间线回放的控制参数
 */
export interface PlaybackParams {
  device_id: string;        // 设备ID
  start_time: string;       // 开始时间 (ISO 8601)
  end_time: string;         // 结束时间 (ISO 8601)
  interval_seconds?: number; // 采样间隔（秒），默认 3600
  speed?: number;           // 播放速度倍数，如: 1x, 2x, 5x
}

/**
 * 设备筛选参数
 *
 * 按时间和条件筛选设备的参数
 */
export interface DeviceFilterParams {
  scenario_id?: string;     // 场景ID
  start_time?: string;      // 开始时间 (ISO 8601)
  end_time?: string;        // 结束时间 (ISO 8601)
  fault_types?: string[];   // 故障类型列表
  min_severity?: number;    // 最低严重程度
}
