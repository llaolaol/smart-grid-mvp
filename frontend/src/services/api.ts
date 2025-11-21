/**
 * API Service Layer
 * API服务层 - 封装所有后端API调用
 */

import axios from 'axios';
import type {
  ScenarioInfo,
  DeviceListResponse,
  Device,
  DiagnosisRequest,
  DiagnosisResponse,
  SimulationRequest,
  SimulationResponse,
  AIAnalysisRequest,
  AIAnalysisResponse,
  MaintenanceRequest,
  MaintenanceResponse,
} from '@/types';

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 60000, // 增加到60秒，AI调用需要更长时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.detail || error.message || '请求失败';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

/**
 * 设备管理API
 */
export const deviceAPI = {
  /**
   * 获取所有场景列表
   */
  listScenarios: () => {
    return apiClient.get<any, ScenarioInfo[]>('/devices/scenarios');
  },

  /**
   * 获取所有场景列表（别名）
   */
  getScenarios: () => {
    return apiClient.get<any, ScenarioInfo[]>('/devices/scenarios');
  },

  /**
   * 获取所有设备（跨场景）
   */
  getAllDevices: async () => {
    const scenarios = await apiClient.get<any, ScenarioInfo[]>('/devices/scenarios');
    const allDevices: Device[] = [];

    for (const scenario of scenarios) {
      const response = await apiClient.get<any, DeviceListResponse>(`/devices/scenarios/${scenario.scenario_id}`);
      allDevices.push(...response.devices);
    }

    return allDevices;
  },

  /**
   * 获取场景下的所有设备
   */
  getScenarioDevices: (scenarioId: string) => {
    return apiClient.get<any, DeviceListResponse>(`/devices/scenarios/${scenarioId}`);
  },

  /**
   * 获取设备详情
   */
  getDevice: (scenarioId: string, deviceId: string) => {
    return apiClient.get<any, Device>(`/devices/scenarios/${scenarioId}/devices/${deviceId}`);
  },

  /**
   * 根据设备ID直接获取设备（需要遍历场景查找）
   */
  getDeviceById: async (deviceId: string) => {
    const scenarios = await apiClient.get<any, ScenarioInfo[]>('/devices/scenarios');

    for (const scenario of scenarios) {
      try {
        const device = await apiClient.get<any, Device>(`/devices/scenarios/${scenario.scenario_id}/devices/${deviceId}`);
        return device;
      } catch (error) {
        // 设备不在这个场景，继续查找
        continue;
      }
    }

    throw new Error(`Device ${deviceId} not found`);
  },

  /**
   * 设备服务健康检查
   */
  healthCheck: () => {
    return apiClient.get('/devices/health');
  },
};

/**
 * 诊断API
 */
export const diagnosisAPI = {
  /**
   * 执行DGA诊断
   */
  diagnose: (request: DiagnosisRequest) => {
    return apiClient.post<any, DiagnosisResponse>('/diagnosis/', request);
  },

  /**
   * 诊断服务健康检查
   */
  healthCheck: () => {
    return apiClient.get('/diagnosis/health');
  },
};

/**
 * 推演API
 */
export const simulationAPI = {
  /**
   * A/B场景对比推演
   */
  compare: (request: SimulationRequest) => {
    return apiClient.post<any, SimulationResponse>('/simulation/compare', request);
  },

  /**
   * 推演服务健康检查
   */
  healthCheck: () => {
    return apiClient.get('/simulation/health');
  },
};

/**
 * 报告API
 */
export const reportAPI = {
  /**
   * 生成诊断报告PDF
   */
  generateDiagnosisReport: async (
    deviceId: string,
    deviceData: Device,
    diagnosisRequest: DiagnosisRequest
  ) => {
    // Backend expects device_data and diagnosis_request as embedded keys
    const response = await axios.post(
      `/api/v1/reports/diagnosis/${deviceId}`,
      {
        device_data: deviceData,
        diagnosis_request: diagnosisRequest,
      },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * 批量生成诊断报告
   */
  generateBatchDiagnosisReports: async (scenarioId: string) => {
    const response = await axios.post(
      `/api/v1/reports/batch-diagnosis`,
      {
        scenario_id: scenarioId,
      },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * 报告服务健康检查
   */
  healthCheck: () => {
    return apiClient.get('/reports/health');
  },
};

/**
 * AI服务API
 */
export const aiAPI = {
  /**
   * AI设备分析
   */
  analyzeDevice: (request: AIAnalysisRequest) => {
    return apiClient.post<any, AIAnalysisResponse>('/ai/analyze', request);
  },

  /**
   * 获取维护建议
   */
  getMaintenanceRecommendation: (request: MaintenanceRequest) => {
    return apiClient.post<any, MaintenanceResponse>('/ai/maintenance', request);
  },

  /**
   * AI服务健康检查
   */
  healthCheck: () => {
    return apiClient.get('/ai/health');
  },
};

export default {
  device: deviceAPI,
  diagnosis: diagnosisAPI,
  simulation: simulationAPI,
  report: reportAPI,
  ai: aiAPI,
};
