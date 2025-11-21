/**
 * Data Export Utility
 * 支持导出设备数据到Excel和CSV格式
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Device } from '@/types';
import { formatFaultType, getSeverityLabel } from './format';

/**
 * 导出格式类型
 */
export type ExportFormat = 'xlsx' | 'csv';

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format: ExportFormat;
  /** 文件名（不含扩展名） */
  filename: string;
  /** 是否包含详细信息 */
  includeDetails?: boolean;
}

/**
 * 将设备数据转换为导出格式
 */
export const prepareDeviceDataForExport = (devices: Device[], includeDetails: boolean = true) => {
  return devices.map((device) => {
    const baseData = {
      '设备ID': device.device_id,
      '设备名称': device.device_name,
      '严重程度': getSeverityLabel(device.severity),
      '故障类型': formatFaultType(device.fault_type),
      '置信度': `${(device.confidence * 100).toFixed(1)}%`,
      '热点温度(°C)': device.thermal.hotspot_temp.toFixed(1),
      '油温(°C)': device.thermal.oil_temp.toFixed(1),
      '环境温度(°C)': device.thermal.ambient_temp.toFixed(1),
      '当前DP值': device.aging.current_dp.toFixed(0),
      '设备年限(年)': device.aging.device_age.toFixed(1),
      '老化速率(DP/天)': device.aging.aging_rate.toFixed(3),
      '剩余寿命(年)': device.aging.remaining_life_years.toFixed(1),
      '负载率(%)': device.operating_condition.load_percent.toFixed(1),
      '电压(kV)': device.operating_condition.voltage.toFixed(1),
    };

    if (includeDetails) {
      return {
        ...baseData,
        'H₂(ppm)': device.dga.H2.toFixed(1),
        'CH₄(ppm)': device.dga.CH4.toFixed(1),
        'C₂H₆(ppm)': device.dga.C2H6.toFixed(1),
        'C₂H₄(ppm)': device.dga.C2H4.toFixed(1),
        'C₂H₂(ppm)': device.dga.C2H2.toFixed(1),
        'CO(ppm)': device.dga.CO.toFixed(1),
        'CO₂(ppm)': device.dga.CO2.toFixed(1),
        '含水量(%)': device.oil_quality.moisture_content.toFixed(3),
        '击穿电压(kV)': device.oil_quality.breakdown_voltage.toFixed(1),
        '介质损耗因数': device.oil_quality.dielectric_loss.toFixed(4),
      };
    }

    return baseData;
  });
};

/**
 * 将对比数据转换为导出格式
 */
export const prepareComparisonDataForExport = (devices: Device[]) => {
  const metrics = [
    { key: 'device_id', label: '设备ID' },
    { key: 'device_name', label: '设备名称' },
    { key: 'severity', label: '严重程度' },
    { key: 'fault_type', label: '故障类型' },
    { key: 'hotspot_temp', label: '热点温度(°C)' },
    { key: 'oil_temp', label: '油温(°C)' },
    { key: 'current_dp', label: '当前DP值' },
    { key: 'device_age', label: '设备年限(年)' },
    { key: 'remaining_life', label: '剩余寿命(年)' },
    { key: 'load', label: '负载率(%)' },
    { key: 'H2', label: 'H₂(ppm)' },
    { key: 'CH4', label: 'CH₄(ppm)' },
    { key: 'C2H6', label: 'C₂H₆(ppm)' },
    { key: 'C2H4', label: 'C₂H₄(ppm)' },
    { key: 'C2H2', label: 'C₂H₂(ppm)' },
    { key: 'CO', label: 'CO(ppm)' },
    { key: 'CO2', label: 'CO₂(ppm)' },
  ];

  return metrics.map((metric) => {
    const row: any = { '指标': metric.label };

    devices.forEach((device) => {
      let value: string;

      switch (metric.key) {
        case 'device_id':
          value = device.device_id;
          break;
        case 'device_name':
          value = device.device_name;
          break;
        case 'severity':
          value = getSeverityLabel(device.severity);
          break;
        case 'fault_type':
          value = formatFaultType(device.fault_type);
          break;
        case 'hotspot_temp':
          value = device.thermal.hotspot_temp.toFixed(1);
          break;
        case 'oil_temp':
          value = device.thermal.oil_temp.toFixed(1);
          break;
        case 'current_dp':
          value = device.aging.current_dp.toFixed(0);
          break;
        case 'device_age':
          value = device.aging.device_age.toFixed(1);
          break;
        case 'remaining_life':
          value = device.aging.remaining_life_years.toFixed(1);
          break;
        case 'load':
          value = device.operating_condition.load_percent.toFixed(1);
          break;
        case 'H2':
          value = device.dga.H2.toFixed(1);
          break;
        case 'CH4':
          value = device.dga.CH4.toFixed(1);
          break;
        case 'C2H6':
          value = device.dga.C2H6.toFixed(1);
          break;
        case 'C2H4':
          value = device.dga.C2H4.toFixed(1);
          break;
        case 'C2H2':
          value = device.dga.C2H2.toFixed(1);
          break;
        case 'CO':
          value = device.dga.CO.toFixed(1);
          break;
        case 'CO2':
          value = device.dga.CO2.toFixed(1);
          break;
        default:
          value = '-';
      }

      row[device.device_name] = value;
    });

    return row;
  });
};

/**
 * 导出设备数据到Excel
 */
export const exportDevicesToExcel = (
  devices: Device[],
  filename: string = '设备数据',
  includeDetails: boolean = true
) => {
  const data = prepareDeviceDataForExport(devices, includeDetails);

  // 创建工作簿
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '设备数据');

  // 设置列宽
  const maxWidth = 20;
  const wscols = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));
  worksheet['!cols'] = wscols;

  // 导出文件
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const timestamp = new Date().toISOString().split('T')[0];
  saveAs(blob, `${filename}_${timestamp}.xlsx`);
};

/**
 * 导出设备数据到CSV
 */
export const exportDevicesToCSV = (
  devices: Device[],
  filename: string = '设备数据',
  includeDetails: boolean = true
) => {
  const data = prepareDeviceDataForExport(devices, includeDetails);

  // 创建工作表并转换为CSV
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // 添加BOM以支持中文
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });

  const timestamp = new Date().toISOString().split('T')[0];
  saveAs(blob, `${filename}_${timestamp}.csv`);
};

/**
 * 导出对比数据到Excel
 */
export const exportComparisonToExcel = (devices: Device[], filename: string = '设备对比') => {
  const data = prepareComparisonDataForExport(devices);

  // 创建工作簿
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '设备对比');

  // 设置列宽
  const maxWidth = 15;
  const wscols = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));
  worksheet['!cols'] = wscols;

  // 导出文件
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const timestamp = new Date().toISOString().split('T')[0];
  saveAs(blob, `${filename}_${timestamp}.xlsx`);
};

/**
 * 导出对比数据到CSV
 */
export const exportComparisonToCSV = (devices: Device[], filename: string = '设备对比') => {
  const data = prepareComparisonDataForExport(devices);

  // 创建工作表并转换为CSV
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // 添加BOM以支持中文
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });

  const timestamp = new Date().toISOString().split('T')[0];
  saveAs(blob, `${filename}_${timestamp}.csv`);
};

/**
 * 通用导出函数
 */
export const exportData = (
  devices: Device[],
  options: ExportOptions,
  isComparison: boolean = false
) => {
  const { format, filename, includeDetails = true } = options;

  if (isComparison) {
    if (format === 'xlsx') {
      exportComparisonToExcel(devices, filename);
    } else {
      exportComparisonToCSV(devices, filename);
    }
  } else {
    if (format === 'xlsx') {
      exportDevicesToExcel(devices, filename, includeDetails);
    } else {
      exportDevicesToCSV(devices, filename, includeDetails);
    }
  }
};
