/**
 * 趋势图表组件
 *
 * 基于ECharts展示设备历史数据趋势
 * 支持多指标同时展示、时间范围筛选、图表交互功能
 */

import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Spin, Alert, Card } from 'antd';
import dayjs from 'dayjs';
import type { TimeRangeQuery, TrendResponse } from '@/types';
import { historyAPI } from '@/services/api';

/**
 * TrendChart 组件 Props
 */
interface TrendChartProps {
  deviceId: string;                    // 设备ID
  metrics: string[];                   // 指标列表，如: ["dga.H2", "thermal.oil_temp"]
  timeRange?: TimeRangeQuery;          // 时间范围（可选）
  title?: string;                      // 图表标题
  height?: number;                     // 图表高度（px）
  aggregation?: 'avg' | 'min' | 'max'; // 聚合方式
}

/**
 * 趋势图表组件
 *
 * @example
 * ```tsx
 * <TrendChart
 *   deviceId="T001"
 *   metrics={["dga.H2", "dga.CH4"]}
 *   timeRange={{ start_time: "2025-01-01T00:00:00", end_time: "2025-01-31T23:59:59" }}
 *   title="DGA趋势"
 * />
 * ```
 */
export const TrendChart: React.FC<TrendChartProps> = ({
  deviceId,
  metrics,
  timeRange,
  title = '趋势图',
  height = 400,
  aggregation = 'avg',
}) => {
  // 组件状态管理
  const [loading, setLoading] = useState<boolean>(false);
  const [trendData, setTrendData] = useState<TrendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载趋势数据
   */
  const loadTrendData = async () => {
    if (!deviceId || metrics.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 调用API获取趋势数据
      const response = await historyAPI.getTrends(
        deviceId,
        metrics,
        timeRange?.start_time || dayjs().subtract(30, 'days').toISOString(),
        timeRange?.end_time || dayjs().toISOString(),
        aggregation
      );

      setTrendData(response);
    } catch (err: any) {
      console.error('Failed to load trend data:', err);
      setError(err.message || '加载趋势数据失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 监听依赖变化，重新加载数据
   */
  useEffect(() => {
    loadTrendData();
  }, [deviceId, JSON.stringify(metrics), JSON.stringify(timeRange), aggregation]);

  /**
   * 配置 ECharts 选项
   */
  const getChartOption = () => {
    if (!trendData || trendData.data_points.length === 0) {
      return {};
    }

    // 按指标分组数据
    const seriesData: Record<string, { time: string; value: number }[]> = {};

    trendData.data_points.forEach((point) => {
      if (!seriesData[point.metric_name]) {
        seriesData[point.metric_name] = [];
      }
      seriesData[point.metric_name].push({
        time: point.timestamp,
        value: point.value,
      });
    });

    // 构建系列数据
    const series = Object.keys(seriesData).map((metricName) => ({
      name: metricName,
      type: 'line',
      smooth: true,
      data: seriesData[metricName].map((item) => [
        dayjs(item.time).format('YYYY-MM-DD HH:mm'),
        item.value,
      ]),
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2,
      },
    }));

    return {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          color: '#f1f5f9',
          fontSize: 16,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: {
          color: '#f1f5f9',
        },
      },
      legend: {
        bottom: 10,
        textStyle: {
          color: '#cbd5e1',
        },
        type: 'scroll',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
            title: {
              zoom: '区域缩放',
              back: '还原',
            },
          },
          restore: {
            title: '还原',
          },
          saveAsImage: {
            title: '保存图片',
            backgroundColor: '#0f172a',
          },
        },
        iconStyle: {
          borderColor: '#94a3b8',
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        axisLabel: {
          color: '#94a3b8',
          rotate: 45,
        },
        axisLine: {
          lineStyle: {
            color: '#334155',
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#94a3b8',
        },
        splitLine: {
          lineStyle: {
            color: '#1e293b',
          },
        },
        axisLine: {
          lineStyle: {
            color: '#334155',
          },
        },
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          start: 0,
          end: 100,
          handleIcon:
            'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z',
          handleSize: '80%',
          handleStyle: {
            color: '#3b82f6',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.6)',
            shadowOffsetX: 2,
            shadowOffsetY: 2,
          },
          textStyle: {
            color: '#94a3b8',
          },
          borderColor: '#334155',
        },
      ],
      series,
    };
  };

  /**
   * 加载状态UI
   */
  if (loading) {
    return (
      <Card style={{ height, background: '#0f172a', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spin tip="加载趋势数据中..." />
        </div>
      </Card>
    );
  }

  /**
   * 错误状态UI
   */
  if (error) {
    return (
      <Card style={{ height, background: '#0f172a', border: '1px solid #334155' }}>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <a onClick={loadTrendData} style={{ color: '#3b82f6' }}>
              重试
            </a>
          }
        />
      </Card>
    );
  }

  /**
   * 无数据状态UI
   */
  if (!trendData || trendData.data_points.length === 0) {
    return (
      <Card style={{ height, background: '#0f172a', border: '1px solid #334155' }}>
        <Alert
          message="暂无数据"
          description="该时间范围内没有趋势数据"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  /**
   * 渲染图表
   */
  return (
    <ReactECharts
      option={getChartOption()}
      style={{ height, width: '100%' }}
      notMerge={true}
      lazyUpdate={true}
      theme="dark"
    />
  );
};

export default TrendChart;
