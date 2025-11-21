import { useState } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Button,
  Space,
  Typography,
  Row,
  Col,
  message,
  Statistic,
  Progress,
} from 'antd';
import { FundProjectionScreenOutlined, ArrowUpOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { simulationAPI } from '@/services/api';
import type { SimulationResponse } from '@/types';

const { Title, Text } = Typography;

const Simulation = () => {
  const [formA] = Form.useForm();
  const [formB] = Form.useForm();
  const [formInitial] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);

  const handleSimulate = async () => {
    try {
      const valuesA = await formA.validateFields();
      const valuesB = await formB.validateFields();
      const initialState = await formInitial.validateFields();

      setLoading(true);

      const response = await simulationAPI.compare({
        scenario_a: {
          name: '场景A',
          load_percent: valuesA.load_percent,
          ambient_temp: valuesA.ambient_temp,
        },
        scenario_b: {
          name: '场景B',
          load_percent: valuesB.load_percent,
          ambient_temp: valuesB.ambient_temp,
        },
        initial_state: {
          dga: initialState,
          dp: initialState.dp,
          operation_years: initialState.operation_years,
        },
      });

      setResult(response);
      message.success('推演完成');
    } catch (error) {
      message.error('推演失败');
    } finally {
      setLoading(false);
    }
  };

  const loadExampleData = () => {
    formA.setFieldsValue({
      load_percent: 85,
      ambient_temp: 35,
    });
    formB.setFieldsValue({
      load_percent: 60,
      ambient_temp: 35,
    });
    formInitial.setFieldsValue({
      H2: 150,
      CH4: 25,
      C2H6: 10,
      C2H4: 50,
      C2H2: 5,
      CO: 300,
      CO2: 2500,
      dp: 600,
      operation_years: 10,
    });
    message.success('已加载示例数据');
  };

  // 快捷推演场景
  const applyReduceLoad = () => {
    const valuesA = formA.getFieldsValue();
    if (!valuesA.load_percent) {
      message.warning('请先设置场景A的负载率');
      return;
    }
    const newLoad = Math.max(20, valuesA.load_percent * 0.7);
    formB.setFieldsValue({
      load_percent: Math.round(newLoad),
      ambient_temp: valuesA.ambient_temp || 35,
    });
    message.success('已应用降载30%场景');
  };

  const applyIncreaseLoad = () => {
    const valuesA = formA.getFieldsValue();
    if (!valuesA.load_percent) {
      message.warning('请先设置场景A的负载率');
      return;
    }
    const newLoad = Math.min(130, valuesA.load_percent * 1.1);
    formB.setFieldsValue({
      load_percent: Math.round(newLoad),
      ambient_temp: valuesA.ambient_temp || 35,
    });
    message.success('已应用提升10%负载场景');
  };

  const applyWinterCondition = () => {
    const valuesA = formA.getFieldsValue();
    formB.setFieldsValue({
      load_percent: valuesA.load_percent || 85,
      ambient_temp: -5,
    });
    message.success('已应用冬季工况');
  };

  const applySummerCondition = () => {
    const valuesA = formA.getFieldsValue();
    formB.setFieldsValue({
      load_percent: valuesA.load_percent || 85,
      ambient_temp: 38,
    });
    message.success('已应用夏季工况');
  };

  const getComparisonChartOption = () => {
    if (!result) return {};

    return {
      title: { text: '场景对比分析', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['场景A', '场景B'], bottom: 10 },
      radar: {
        indicator: [
          { name: '预期寿命', max: 20 },
          { name: 'DP值', max: 1000 },
          { name: '热点温度', max: 120, min: 60 },
          { name: '老化速率', max: 5, min: 0 },
        ],
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [
                result.scenario_a.years_to_eol,
                result.scenario_a.final_dp,
                result.scenario_a.hotspot_temp,
                result.scenario_a.aging_rate,
              ],
              name: '场景A',
              itemStyle: { color: '#ff4d4f' },
            },
            {
              value: [
                result.scenario_b.years_to_eol,
                result.scenario_b.final_dp,
                result.scenario_b.hotspot_temp,
                result.scenario_b.aging_rate,
              ],
              name: '场景B',
              itemStyle: { color: '#52c41a' },
            },
          ],
        },
      ],
    };
  };

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3}>What-if 场景推演</Title>
          <Space wrap>
            <Button onClick={loadExampleData}>加载示例数据</Button>
            <Button onClick={applyReduceLoad} type="dashed">降载30%</Button>
            <Button onClick={applyIncreaseLoad} type="dashed">提升10%负载</Button>
            <Button onClick={applyWinterCondition} type="dashed">冬季工况</Button>
            <Button onClick={applySummerCondition} type="dashed">夏季工况</Button>
          </Space>
        </div>

        <Row gutter={24}>
          <Col span={8}>
            <Card title="场景A - 当前工况" size="small">
              <Form form={formA} layout="vertical">
                <Form.Item
                  name="load_percent"
                  label="负载率 (%)"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={20}
                    max={130}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item
                  name="ambient_temp"
                  label="环境温度 (°C)"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={-10}
                    max={45}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="场景B - 优化工况" size="small">
              <Form form={formB} layout="vertical">
                <Form.Item
                  name="load_percent"
                  label="负载率 (%)"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={20}
                    max={130}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item
                  name="ambient_temp"
                  label="环境温度 (°C)"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={-10}
                    max={45}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="初始状态" size="small">
              <Form form={formInitial} layout="vertical">
                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item name="H2" label="H₂" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} size="small" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="CH4" label="CH₄" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} size="small" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="C2H6" label="C₂H₆" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} size="small" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="C2H4" label="C₂H₄" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} size="small" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="C2H2" label="C₂H₂" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} size="small" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="CO" label="CO" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} size="small" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="CO2" label="CO₂" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} size="small" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="dp" label="DP值" rules={[{ required: true }]}>
                      <InputNumber min={200} max={1200} style={{ width: '100%' }} size="small" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="operation_years" label="年限" rules={[{ required: true }]}>
                      <InputNumber min={0} max={50} style={{ width: '100%' }} size="small" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>
          </Col>
        </Row>

        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<FundProjectionScreenOutlined />}
            loading={loading}
            onClick={handleSimulate}
          >
            开始推演
          </Button>
        </div>

        {result && (
          <>
            <Card title="改善指标">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="寿命延长"
                    value={result.improvements.lifespan_extension_years}
                    suffix="年"
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<ArrowUpOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="寿命延长比例"
                    value={result.improvements.lifespan_extension_percent}
                    suffix="%"
                    precision={1}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="老化速率降低"
                    value={result.improvements.aging_rate_reduction_percent}
                    suffix="%"
                    precision={1}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="温度降低"
                    value={result.improvements.temperature_reduction}
                    suffix="°C"
                    precision={1}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
              </Row>
            </Card>

            <Card title="场景对比">
              <ReactECharts option={getComparisonChartOption()} style={{ height: 400 }} />
            </Card>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="场景A详情" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">预期寿命：</Text>
                      <Text strong>{result.scenario_a.years_to_eol.toFixed(1)} 年</Text>
                    </div>
                    <div>
                      <Text type="secondary">最终DP值：</Text>
                      <Text strong>{result.scenario_a.final_dp.toFixed(0)}</Text>
                    </div>
                    <div>
                      <Text type="secondary">热点温度：</Text>
                      <Text strong>{result.scenario_a.hotspot_temp.toFixed(1)}°C</Text>
                    </div>
                    <div>
                      <Text type="secondary">老化速率：</Text>
                      <Text strong>{result.scenario_a.aging_rate.toFixed(2)} DP/天</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="场景B详情" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">预期寿命：</Text>
                      <Text strong style={{ color: '#52c41a' }}>
                        {result.scenario_b.years_to_eol.toFixed(1)} 年
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary">最终DP值：</Text>
                      <Text strong style={{ color: '#52c41a' }}>
                        {result.scenario_b.final_dp.toFixed(0)}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary">热点温度：</Text>
                      <Text strong style={{ color: '#52c41a' }}>
                        {result.scenario_b.hotspot_temp.toFixed(1)}°C
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary">老化速率：</Text>
                      <Text strong style={{ color: '#52c41a' }}>
                        {result.scenario_b.aging_rate.toFixed(2)} DP/天
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Space>
    </div>
  );
};

export default Simulation;
