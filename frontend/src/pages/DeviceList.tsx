import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Select,
  Space,
  message,
  Typography,
  Badge,
  Button,
} from 'antd';
import { WarningOutlined, CheckCircleOutlined, FilePdfOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { deviceAPI, reportAPI } from '@/services/api';
import type { Device, ScenarioInfo } from '@/types';
import { getSeverityColor, getSeverityLabel, formatFaultType } from '@/utils/format';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';

const { Title } = Typography;
const { Option } = Select;

const DeviceList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [batchReportLoading, setBatchReportLoading] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [devices, setDevices] = useState<Device[]>([]);

  // 加载场景列表
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const data = await deviceAPI.listScenarios();
        setScenarios(data);
        if (data.length > 0) {
          setSelectedScenario(data[0].scenario_id);
        }
      } catch (error) {
        message.error('加载场景列表失败');
      }
    };
    loadScenarios();
  }, []);

  // 加载设备列表
  useEffect(() => {
    if (!selectedScenario) return;

    const loadDevices = async () => {
      setLoading(true);
      try {
        const data = await deviceAPI.getScenarioDevices(selectedScenario);
        setDevices(data.devices);
      } catch (error) {
        message.error('加载设备列表失败');
      } finally {
        setLoading(false);
      }
    };
    loadDevices();
  }, [selectedScenario]);

  // 批量生成诊断报告
  const handleBatchReport = async () => {
    if (!selectedScenario) {
      message.warning('请先选择场景');
      return;
    }

    if (devices.length === 0) {
      message.warning('当前场景没有设备');
      return;
    }

    setBatchReportLoading(true);
    try {
      const blob = await reportAPI.generateBatchDiagnosisReports(selectedScenario);

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagnosis_reports_${selectedScenario}_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`成功生成${devices.length}台设备的诊断报告`);
    } catch (error: any) {
      message.error(`批量生成报告失败: ${error.message}`);
    } finally {
      setBatchReportLoading(false);
    }
  };

  const columns: ColumnsType<Device> = [
    {
      title: '设备ID',
      dataIndex: 'device_id',
      key: 'device_id',
      width: 120,
    },
    {
      title: '设备名称',
      dataIndex: 'device_name',
      key: 'device_name',
      width: 150,
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
      width: 120,
    },
    {
      title: '额定容量',
      dataIndex: 'rated_capacity',
      key: 'rated_capacity',
      width: 120,
      render: (value) => `${value} MVA`,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (severity: number) => (
        <Badge
          color={getSeverityColor(severity)}
          text={getSeverityLabel(severity)}
        />
      ),
      sorter: (a, b) => a.severity - b.severity,
    },
    {
      title: '故障类型',
      dataIndex: 'fault_type',
      key: 'fault_type',
      width: 150,
      render: (faultType: string) => (
        <Tag color={faultType === 'normal' ? 'success' : 'error'}>
          {formatFaultType(faultType)}
        </Tag>
      ),
    },
    {
      title: '热点温度',
      key: 'hotspot_temp',
      width: 120,
      render: (_, record) => `${record.thermal.hotspot_temp.toFixed(1)}°C`,
      sorter: (a, b) => a.thermal.hotspot_temp - b.thermal.hotspot_temp,
    },
    {
      title: '当前DP值',
      key: 'current_dp',
      width: 120,
      render: (_, record) => record.aging.current_dp.toFixed(0),
      sorter: (a, b) => a.aging.current_dp - b.aging.current_dp,
    },
    {
      title: '负载率',
      key: 'load_percent',
      width: 120,
      render: (_, record) => `${record.operating_condition.load_percent.toFixed(1)}%`,
      sorter: (a, b) =>
        a.operating_condition.load_percent - b.operating_condition.load_percent,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <a
          onClick={() =>
            navigate(`/devices/${selectedScenario}/${record.device_id}`)
          }
          className="device-action-link"
        >
          查看详情
        </a>
      ),
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#f1f5f9' }}>
            设备监控
          </Title>
          <Space>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={handleBatchReport}
              loading={batchReportLoading}
              disabled={!selectedScenario || devices.length === 0}
            >
              批量生成报告
            </Button>
            <span style={{ color: '#e2e8f0' }}>场景选择：</span>
            <Select
              value={selectedScenario}
              onChange={setSelectedScenario}
              style={{ width: 300 }}
            >
              {scenarios.map((scenario) => (
                <Option key={scenario.scenario_id} value={scenario.scenario_id}>
                  {scenario.scenario_name} ({scenario.device_count}台设备)
                </Option>
              ))}
            </Select>
          </Space>
        </div>

        {selectedScenario && (
          <>
            {loading ? (
              <LoadingSkeleton type="table" />
            ) : devices.length > 0 ? (
              <Card
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                }}
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  columns={columns}
                  dataSource={devices}
                  rowKey="device_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 台设备`,
                  }}
                  scroll={{ x: 1200 }}
                />
              </Card>
            ) : (
              <EmptyState
                type="no-device"
                onAction={() => window.location.reload()}
              />
            )}
          </>
        )}
      </Space>
    </div>
  );
};

export default DeviceList;
