import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  message,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Badge,
} from 'antd';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { deviceAPI, diagnosisAPI, reportAPI } from '@/services/api';
import type { Device, DiagnosisResult } from '@/types';
import {
  getSeverityColor,
  getSeverityLabel,
  formatFaultType,
  downloadFile,
} from '@/utils/format';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';

const { Title, Text } = Typography;

const DeviceDetail = () => {
  const { scenarioId, deviceId } = useParams<{
    scenarioId: string;
    deviceId: string;
  }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const loadDevice = async () => {
      if (!scenarioId || !deviceId) return;

      setLoading(true);
      try {
        const deviceData = await deviceAPI.getDevice(scenarioId, deviceId);
        setDevice(deviceData);

        // 自动执行诊断
        const diagnosisResult = await diagnosisAPI.diagnose({
          dga_data: deviceData.dga,
        });
        setDiagnosis(diagnosisResult.result);
      } catch (error) {
        message.error('加载设备详情失败');
      } finally {
        setLoading(false);
      }
    };

    loadDevice();
  }, [scenarioId, deviceId]);

  const handleDownloadReport = async () => {
    if (!device || !diagnosis) return;

    setReportLoading(true);
    try {
      const blob = await reportAPI.generateDiagnosisReport(
        device.device_id,
        device,
        { dga_data: device.dga }
      );
      downloadFile(blob, `diagnosis_${device.device_id}.pdf`);
      message.success('报告生成成功');
    } catch (error) {
      message.error('生成报告失败');
    } finally {
      setReportLoading(false);
    }
  };

  // DGA气体浓度柱状图
  const getDGAChartOption = () => {
    if (!device) return {};

    return {
      title: { text: 'DGA气体浓度分析', left: 'center' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: ['H2', 'CH4', 'C2H6', 'C2H4', 'C2H2', 'CO', 'CO2'],
      },
      yAxis: { type: 'value', name: '浓度 (ppm)' },
      series: [
        {
          data: [
            device.dga.H2,
            device.dga.CH4,
            device.dga.C2H6,
            device.dga.C2H4,
            device.dga.C2H2,
            device.dga.CO,
            device.dga.CO2,
          ],
          type: 'bar',
          itemStyle: {
            color: (params: any) => {
              const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452'];
              return colors[params.dataIndex];
            },
          },
        },
      ],
    };
  };

  // 温度仪表盘
  const getThermalGaugeOption = () => {
    if (!device) return {};

    return {
      title: { text: '热点温度', left: 'center' },
      series: [
        {
          type: 'gauge',
          min: 0,
          max: 150,
          splitNumber: 5,
          progress: { show: true, width: 18 },
          axisLine: { lineStyle: { width: 18 } },
          axisTick: { show: false },
          splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } },
          axisLabel: { distance: 25, color: '#999', fontSize: 12 },
          anchor: { show: true, showAbove: true, size: 18, itemStyle: { borderWidth: 5 } },
          detail: {
            valueAnimation: true,
            formatter: '{value}°C',
            fontSize: 24,
            offsetCenter: [0, '70%'],
          },
          data: [{ value: device.thermal.hotspot_temp, name: '热点温度' }],
        },
      ],
    };
  };

  if (loading) {
    return <LoadingSkeleton type="detail" />;
  }

  if (!device) {
    return (
      <EmptyState
        type="error"
        title="设备不存在"
        description="未找到该设备信息，请返回设备列表重新选择"
        onAction={() => navigate('/devices')}
        actionText="返回设备列表"
      />
    );
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/devices')}>
              返回
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              {device.device_name} - 设备详情
            </Title>
          </Space>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            loading={reportLoading}
            onClick={handleDownloadReport}
          >
            下载诊断报告
          </Button>
        </div>

        <Card title="基本信息">
          <Descriptions column={3} bordered>
            <Descriptions.Item label="设备ID">{device.device_id}</Descriptions.Item>
            <Descriptions.Item label="设备名称">{device.device_name}</Descriptions.Item>
            <Descriptions.Item label="设备类型">{device.device_type}</Descriptions.Item>
            <Descriptions.Item label="额定容量">
              {device.rated_capacity} MVA
            </Descriptions.Item>
            <Descriptions.Item label="制造商">
              {device.manufacturer || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="安装日期">
              {device.installation_date || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="严重程度">
              <Badge
                color={getSeverityColor(device.severity)}
                text={getSeverityLabel(device.severity)}
              />
            </Descriptions.Item>
            <Descriptions.Item label="故障类型">
              <Tag color={device.fault_type === 'normal' ? 'success' : 'error'}>
                {formatFaultType(device.fault_type)}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="DGA气体浓度">
              <ReactECharts option={getDGAChartOption()} style={{ height: 350 }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="温度监控">
              <ReactECharts option={getThermalGaugeOption()} style={{ height: 350 }} />
            </Card>
          </Col>
        </Row>

        <Card title="运行参数">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card size="small" title="热参数">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="油温">
                    {device.thermal.oil_temp.toFixed(1)}°C
                  </Descriptions.Item>
                  <Descriptions.Item label="热点温度">
                    {device.thermal.hotspot_temp.toFixed(1)}°C
                  </Descriptions.Item>
                  <Descriptions.Item label="环境温度">
                    {device.thermal.ambient_temp.toFixed(1)}°C
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="老化参数">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="当前DP值">
                    {device.aging.current_dp.toFixed(0)}
                  </Descriptions.Item>
                  <Descriptions.Item label="设备年限">
                    {device.aging.device_age.toFixed(1)} 年
                  </Descriptions.Item>
                  <Descriptions.Item label="剩余寿命">
                    {device.aging.remaining_life_years.toFixed(1)} 年
                  </Descriptions.Item>
                  <Descriptions.Item label="老化速率">
                    {device.aging.aging_rate.toFixed(2)} DP/天
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="运行工况">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="负载率">
                    {device.operating_condition.load_percent.toFixed(1)}%
                  </Descriptions.Item>
                  <Descriptions.Item label="电压">
                    {device.operating_condition.voltage.toFixed(1)} kV
                  </Descriptions.Item>
                  <Descriptions.Item label="频率">
                    {device.operating_condition.frequency.toFixed(1)} Hz
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </Card>

        {diagnosis && (
          <Card title="诊断结果">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="故障类型">
                <Tag color={diagnosis.fault_type === 'normal' ? 'success' : 'error'}>
                  {formatFaultType(diagnosis.fault_type)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="置信度">
                {(diagnosis.confidence * 100).toFixed(1)}%
              </Descriptions.Item>
              <Descriptions.Item label="特征比值" span={2}>
                <Space>
                  {Object.entries(diagnosis.ratios).map(([key, value]) => (
                    <Tag key={key}>
                      {key}: {value.toFixed(3)}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="建议措施" span={2}>
                <ul>
                  {diagnosis.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default DeviceDetail;
