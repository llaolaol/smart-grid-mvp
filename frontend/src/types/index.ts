/**
 * TypeScript Type Definitions for Smart Grid Platform
 * 智能电网平台类型定义
 */

// DGA数据
export interface DGAData {
  H2: number;
  CH4: number;
  C2H6: number;
  C2H4: number;
  C2H2: number;
  CO: number;
  CO2: number;
}

// 热参数
export interface ThermalData {
  oil_temp: number;
  hotspot_temp: number;
  ambient_temp: number;
}

// 老化参数
export interface AgingData {
  current_dp: number;
  device_age: number;
  aging_rate: number;
  remaining_life_years: number;
}

// 运行工况
export interface OperatingCondition {
  load_percent: number;
  voltage: number;
  frequency: number;
}

// 设备信息
export interface Device {
  device_id: string;
  device_name: string;
  device_type?: string;
  rated_capacity?: number;
  severity: number;
  fault_type: string;
  dga: DGAData;
  thermal: ThermalData;
  aging: AgingData;
  operating_condition: OperatingCondition;
  manufacturer?: string;
  installation_date?: string;
  timestamp?: string;  // 数据时间戳 (ISO 8601格式)
}

// 设备列表响应
export interface DeviceListResponse {
  total: number;
  devices: Device[];
}

// 场景信息
export interface ScenarioInfo {
  scenario_id: string;
  scenario_name: string;
  description: string;
  device_count: number;
}

// 诊断请求
export interface DiagnosisRequest {
  dga_data: DGAData;
}

// 诊断结果
export interface DiagnosisResult {
  fault_type: string;
  severity: number;
  confidence: number;
  ratios: Record<string, number>;
  recommendations: string[];
}

// 诊断响应
export interface DiagnosisResponse {
  success: boolean;
  result: DiagnosisResult;
  message: string;
}

// 场景配置
export interface ScenarioConfig {
  name: string;
  load_percent: number;
  ambient_temp: number;
}

// 初始状态
export interface InitialState {
  dga: DGAData;
  dp: number;
  operation_years: number;
}

// 推演请求
export interface SimulationRequest {
  scenario_a: ScenarioConfig;
  scenario_b: ScenarioConfig;
  initial_state: InitialState;
}

// 场景结果
export interface ScenarioResult {
  name: string;
  years_to_eol: number;
  final_dp: number;
  hotspot_temp: number;
  aging_rate: number;
  dga_trend: Partial<DGAData>;
}

// 改善指标
export interface Improvements {
  lifespan_extension_years: number;
  lifespan_extension_percent: number;
  aging_rate_reduction_percent: number;
  temperature_reduction: number;
}

// 推演响应
export interface SimulationResponse {
  success: boolean;
  scenario_a: ScenarioResult;
  scenario_b: ScenarioResult;
  improvements: Improvements;
  message: string;
}

// AI分析请求
export interface AIAnalysisRequest {
  device_data: Record<string, any>;
  diagnosis_result?: Record<string, any>;
  user_question?: string;
}

// AI分析响应
export interface AIAnalysisResponse {
  success: boolean;
  analysis: string;
  message: string;
}

// 维护建议请求
export interface MaintenanceRequest {
  device_data: Record<string, any>;
  simulation_result?: Record<string, any>;
}

// 维护建议响应
export interface MaintenanceResponse {
  success: boolean;
  recommendation: string;
  message: string;
}

// 故障类型映射
export const FaultTypeMap: Record<string, string> = {
  normal: '正常',
  partial_discharge: '局部放电',
  low_energy_discharge: '低能量放电',
  high_energy_discharge: '高能量放电',
  thermal_low: '低温过热 (<300°C)',
  thermal_medium: '中温过热 (300-700°C)',
  thermal_high: '高温过热 (>700°C)',
};

// 严重程度映射
export const SeverityMap: Record<number, { text: string; color: string }> = {
  0: { text: '正常', color: 'success' },
  1: { text: '注意', color: 'warning' },
  2: { text: '异常', color: 'error' },
  3: { text: '严重', color: 'error' },
};

// 导出历史数据相关类型
export * from './history';
