# 智能电网运维平台 - 前端功能优化计划

**文档版本**: v1.0
**创建日期**: 2025-11-21
**优化方向**: 时间筛选、历史数据展示、交互增强
**预计工期**: 2-3周（可按模块拆分执行）

---

## 📊 目录

- [1. 优化功能清单](#1-优化功能清单)
- [2. 后端改动清单](#2-后端改动清单)
- [3. 前端改动清单](#3-前端改动清单)
- [4. 分阶段实施计划](#4-分阶段实施计划)
- [5. 代码模板与示例](#5-代码模板与示例)
- [6. 数据结构设计](#6-数据结构设计)
- [7. 占位符实现策略](#7-占位符实现策略)

---

## 1. 优化功能清单

### 📅 Phase 1: 时间维度功能增强（核心优先级 🔴）

#### 1.1 全局时间范围筛选器 ⭐⭐⭐
**优先级**: 🔴 最高
**工作量**: 2天
**依赖后端**: 是（需要历史数据API）

**功能描述**:
- 支持按时间段查看历史数据
- 快捷选项：今天、最近7天、最近30天、本月、上月
- 自定义时间范围选择
- 数据自动按时间范围过滤
- 时间范围持久化（localStorage）

**影响页面**:
- `Dashboard.tsx`（场景概览）
- `DeviceDetail.tsx`（设备详情）
- `Monitor.tsx`（实时监控）
- `DataCenter.tsx`（数据中心）

**用户价值**:
- 可以查看设备任意时间段的运行状态
- 快速对比不同时间段的数据变化
- 追溯历史故障发生时的状态

---

#### 1.2 历史数据时间线回放 ⭐⭐
**优先级**: 🟠 中
**工作量**: 3天
**依赖后端**: 是（需要时序数据API）

**功能描述**:
- 回放历史数据，重现设备运行状态
- 播放/暂停/快进/快退控制
- 速度调节：0.5x、1x、2x、5x、10x
- 拖拽进度条跳转到特定时间
- 关键事件标注（故障、告警、维护）
- 数据图表同步更新

**新增页面**:
- `frontend/src/pages/HistoryPlayback.tsx`

**用户价值**:
- 直观重现设备故障演化过程
- 用于事故分析和培训演示
- 发现渐变型故障的规律

---

#### 1.3 设备详情页历史趋势图 ⭐⭐⭐
**优先级**: 🔴 最高
**工作量**: 2天
**依赖后端**: 是（需要历史趋势API）

**功能描述**:
- 在设备详情页显示历史趋势（30天/90天/180天）
- DGA浓度趋势图（折线图）
- 温度趋势图（折线图）
- 老化趋势图（折线图）
- 标注超标阈值线
- 支持缩放和数据点查看

**修改页面**:
- `frontend/src/pages/DeviceDetail.tsx`

**用户价值**:
- 一眼看出设备健康状态变化趋势
- 预测未来可能发生的故障
- 辅助制定维护计划

---

### 🔍 Phase 2: 高级筛选与搜索（优先级 🟠）

#### 2.1 多维度高级筛选器 ⭐⭐⭐
**优先级**: 🔴 最高
**工作量**: 3天
**依赖后端**: 否（前端实现）

**功能描述**:
- 支持10+维度组合筛选
  - 时间范围
  - 设备类型
  - 容量范围
  - 运行年限
  - 故障严重程度
  - DGA浓度范围
  - 温度范围
  - 负载率范围
- 筛选条件可保存为"预设"
- 筛选结果数量实时显示
- 一键清除所有筛选

**修改页面**:
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/DeviceList.tsx`

**用户价值**:
- 快速找到符合条件的设备
- 发现问题设备群
- 批量分析同类设备

---

#### 2.2 智能搜索与模糊匹配 ⭐⭐
**优先级**: 🟠 中
**工作量**: 2天
**依赖后端**: 否（前端实现）

**功能描述**:
- 实时搜索建议
- 支持设备名称、ID、位置、故障类型
- 拼音首字母支持
- 高亮匹配文本
- 搜索历史记录（最近10条）
- 支持正则表达式

**修改页面**:
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/DeviceList.tsx`

**用户价值**:
- 快速定位目标设备
- 减少查找时间

---

#### 2.3 筛选预设与快捷筛选 ⭐
**优先级**: 🟡 低
**工作量**: 1天
**依赖后端**: 否（localStorage）

**功能描述**:
- 快捷筛选标签
  - 🔴 严重故障设备
  - ⏰ 老化严重设备
  - ⚡ 过载运行设备
  - 🔧 需要维护设备
- 用户可保存自定义预设
- 预设可命名和管理

**修改页面**:
- `frontend/src/pages/Dashboard.tsx`

**用户价值**:
- 一键切换常用筛选
- 提高工作效率

---

### 📊 Phase 3: 数据可视化增强（优先级 🟠）

#### 3.1 Dashboard仪表盘优化 ⭐⭐⭐
**优先级**: 🔴 高
**工作量**: 2天
**依赖后端**: 否（前端优化）

**功能描述**:
- 实时数据刷新指示器
- 自动刷新开关（5秒/10秒/30秒/1分钟）
- 关键设备卡片增强（添加趋势小图标）
- 告警实时推送（准备WebSocket）
- 数据更新动画效果

**修改页面**:
- `frontend/src/pages/Dashboard.tsx`

**用户价值**:
- 更直观的数据展示
- 实时掌握设备状态变化

---

#### 3.2 图表交互增强 ⭐⭐
**优先级**: 🟠 中
**工作量**: 2天
**依赖后端**: 否（ECharts配置）

**功能描述**:
- 图表工具栏（缩放、保存图片、数据视图）
- 数据点详情弹窗
- 图例交互优化（单击显示/隐藏、双击单独显示）
- 支持折线图和柱状图切换

**修改页面**:
- 所有包含图表的页面

**用户价值**:
- 更友好的图表操作
- 便于数据分析

---

#### 3.3 数据对比可视化 ⭐⭐
**优先级**: 🟠 中
**工作量**: 2天
**依赖后端**: 否（前端实现）

**功能描述**:
- 设备对比矩阵表格（最优值高亮）
- 时段对比（同一设备不同时间）
- 多设备雷达图对比

**修改页面**:
- `frontend/src/pages/Comparison.tsx`

**用户价值**:
- 快速识别最优/最差设备
- 发现异常设备

---

### 📈 Phase 4: 数据导出与报表（优先级 🟡）

#### 4.1 灵活的数据导出 ⭐⭐
**优先级**: 🟠 中
**工作量**: 2天
**依赖后端**: 否（前端实现）

**功能描述**:
- 导出Excel（含图表）
- 导出CSV（纯数据）
- 导出PDF报告
- 导出JSON（API格式）
- 自定义导出选项
  - 选择导出字段
  - 选择时间范围
  - 选择设备
  - 是否包含图表

**修改页面**:
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/DataCenter.tsx`

**用户价值**:
- 便于数据存档和分析
- 满足报告需求

---

#### 4.2 定期报表生成 ⭐
**优先级**: 🟡 低
**工作量**: 3天
**依赖后端**: 是（需要定时任务）

**功能描述**:
- 自动生成日报/周报/月报/季报
- 报表内容可配置
- 自动发送（邮件/钉钉/下载）

**修改页面**:
- `frontend/src/pages/ReportManagement.tsx`

**用户价值**:
- 自动化报表流程
- 减少人工操作

---

### 🎨 Phase 5: UX细节优化（优先级 🟡）

#### 5.1 加载状态优化 ⭐⭐
**优先级**: 🟠 中
**工作量**: 1天
**依赖后端**: 否（前端优化）

**功能描述**:
- Skeleton占位符（替代Loading Spin）
- 图表渐进式加载
- 大数据集分页加载
- 懒加载（滚动到可视区域再加载）

**影响页面**: 所有页面

---

#### 5.2 空状态优化 ⭐
**优先级**: 🟡 低
**工作量**: 1天
**依赖后端**: 否（前端优化）

**功能描述**:
- 更友好的空数据提示
- 引导用户操作
- 空状态插图

**影响页面**: 所有页面

---

#### 5.3 响应式布局优化 ⭐
**优先级**: 🟡 低
**工作量**: 2天
**依赖后端**: 否（CSS优化）

**功能描述**:
- 自适应卡片布局（Grid响应式）
- 移动端折叠筛选面板
- 图表自适应高度
- 触控交互优化

**影响页面**: 所有页面

---

## 2. 后端改动清单

### 📁 需要新建的文件

#### 2.1 路由层

**文件**: `api/app/api/v1/history.py`
**功能**: 历史数据查询API端点

**主要端点**:
```python
# 1. 获取设备历史数据
GET /api/v1/history/devices/{device_id}/history
    ?start_time=2024-01-01T00:00:00
    &end_time=2024-12-31T23:59:59
    &granularity=hour  # minute/hour/day/week/month
    &limit=1000

# 2. 批量获取多设备历史数据
GET /api/v1/history/devices/history/batch
    ?device_ids=T001,T002,T003
    &start_time=2024-01-01T00:00:00
    &end_time=2024-12-31T23:59:59
    &granularity=day

# 3. 获取设备指标趋势数据
GET /api/v1/history/devices/{device_id}/trends
    ?metrics=dga.H2,thermal.hotspot_temp,aging.current_dp
    &start_time=2024-01-01T00:00:00
    &end_time=2024-12-31T23:59:59
    &aggregation=avg  # avg/min/max/sum

# 4. 获取时间线回放数据
GET /api/v1/history/devices/{device_id}/playback
    ?start_time=2024-01-01T00:00:00
    &end_time=2024-12-31T23:59:59
    &interval_seconds=3600

# 5. 按时间和条件筛选设备
GET /api/v1/history/devices/filter
    ?scenario_id=all_normal
    &start_time=2024-01-01T00:00:00
    &end_time=2024-12-31T23:59:59
    &fault_types=high_energy_discharge,overheating
    &min_severity=2

# 6. 获取指定时间段的统计摘要
GET /api/v1/history/devices/{device_id}/statistics
    ?start_time=2024-01-01T00:00:00
    &end_time=2024-12-31T23:59:59
    &metrics=dga.H2,thermal.hotspot_temp
```

**状态**: 🟡 占位符实现（当前返回JSON文件数据，未来连接数据库）

---

#### 2.2 数据模型层

**文件**: `api/app/schemas/history.py`
**功能**: 历史数据相关的Pydantic模型

**主要模型**:
```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# 历史快照（带时间戳）
class DeviceHistorySnapshot(BaseModel):
    timestamp: datetime
    device_id: str
    device_name: str
    dga: DGAData
    thermal: ThermalData
    aging: AgingData
    operating_condition: OperatingCondition
    fault_type: str
    severity: int

# 时间范围查询参数
class TimeRangeQuery(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    granularity: str = Field(default="hour", pattern="^(minute|hour|day|week|month)$")

# 趋势数据点
class TrendDataPoint(BaseModel):
    timestamp: datetime
    value: float
    metric_name: str

# 历史数据响应
class HistoryResponse(BaseModel):
    device_id: str
    total_points: int
    time_range: dict
    snapshots: List[DeviceHistorySnapshot]

# 趋势数据响应
class TrendResponse(BaseModel):
    device_id: str
    metrics: List[str]
    data_points: List[TrendDataPoint]

# 统计摘要
class StatisticsSummary(BaseModel):
    metric_name: str
    avg: float
    min: float
    max: float
    std_dev: float
    percentile_95: float
```

---

#### 2.3 服务层

**文件**: `api/app/services/history_service.py`
**功能**: 历史数据业务逻辑（占位符实现）

**核心方法**:
```python
class HistoryService:
    """历史数据服务（占位符实现）"""

    def __init__(self):
        # 【占位符】当前使用DataLoader读取JSON
        # 未来替换为数据库连接
        self.data_loader = DataLoader()

    async def get_device_history(
        self,
        device_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        granularity: str = "hour",
        limit: int = 1000
    ) -> HistoryResponse:
        """
        获取设备历史数据

        【占位符】当前从JSON文件读取时序数据

        TODO: 替换为SQL查询
        SELECT * FROM device_history
        WHERE device_id = ?
        AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp
        LIMIT ?
        """
        pass

    async def get_batch_history(
        self,
        device_ids: List[str],
        start_time: datetime,
        end_time: datetime,
        granularity: str = "day"
    ) -> Dict[str, HistoryResponse]:
        """
        批量获取多设备历史数据

        【占位符】用于对比视图

        TODO: 数据库批量查询
        SELECT * FROM device_history
        WHERE device_id IN (?, ?, ...)
        AND timestamp BETWEEN ? AND ?
        """
        pass

    async def get_trend_data(
        self,
        device_id: str,
        metrics: List[str],
        start_time: datetime,
        end_time: datetime,
        aggregation: str = "avg"
    ) -> TrendResponse:
        """
        获取设备指标趋势数据

        【占位符】提取指定指标的趋势

        TODO: SQL聚合查询
        SELECT
            DATE_TRUNC('hour', timestamp) as time_bucket,
            AVG(dga_h2) as value
        FROM device_history
        WHERE device_id = ? AND timestamp BETWEEN ? AND ?
        GROUP BY time_bucket
        ORDER BY time_bucket
        """
        pass

    async def get_playback_data(
        self,
        device_id: str,
        start_time: datetime,
        end_time: datetime,
        interval_seconds: int = 3600
    ) -> List[DeviceHistorySnapshot]:
        """
        获取时间线回放数据

        【占位符】按时间间隔采样

        TODO: 采样查询
        """
        pass

    async def filter_devices_by_time(
        self,
        scenario_id: Optional[str],
        start_time: Optional[datetime],
        end_time: Optional[datetime],
        fault_types: Optional[List[str]],
        min_severity: Optional[int]
    ) -> List[Device]:
        """
        按时间和条件筛选设备

        【占位符】当前返回最新快照，未来支持时间筛选

        TODO: 数据库WHERE查询
        """
        pass

    async def get_statistics(
        self,
        device_id: str,
        start_time: datetime,
        end_time: datetime,
        metrics: List[str]
    ) -> List[StatisticsSummary]:
        """
        获取指定时间段的统计摘要

        【占位符】返回均值/最大/最小/标准差等

        TODO: SQL聚合函数
        """
        pass
```

---

### 📝 需要修改的文件

#### 2.4 设备数据模型

**文件**: `api/app/schemas/device.py`
**修改**: 添加 `timestamp` 字段（可选）

```python
class Device(BaseModel):
    device_id: str
    device_name: str
    timestamp: Optional[str] = None  # ← 新增字段（ISO 8601格式）
    # ... 其他字段保持不变
```

---

#### 2.5 主应用配置

**文件**: `api/app/main.py`
**修改**: 注册 history 路由

```python
from app.api.v1 import diagnosis, simulation, devices, reports, ai, data, history  # ← 导入

# 添加路由注册
app.include_router(
    history.router,
    prefix=f"{settings.API_V1_PREFIX}/history",
    tags=["History"]
)
```

---

#### 2.6 数据加载器

**文件**: `backend/data/data_loader.py`
**修改**: 添加时间过滤方法

```python
class DataLoader:
    # 新增方法
    def load_timeseries(
        self,
        device_id: str,
        scenario_type: str = "gradual_discharge"
    ) -> List[dict]:
        """加载时间序列数据"""
        file_path = self.data_dir / f"timeseries_{device_id}_{scenario_type}.json"
        if not file_path.exists():
            raise FileNotFoundError(f"Timeseries data not found: {file_path}")

        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def load_history(
        self,
        device_id: str,
        days: int = 365
    ) -> List[dict]:
        """加载历史数据"""
        file_path = self.data_dir / f"history_{device_id}_{days}days.json"
        if not file_path.exists():
            raise FileNotFoundError(f"History data not found: {file_path}")

        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def filter_by_time_range(
        self,
        data: List[dict],
        start_time: Optional[datetime],
        end_time: Optional[datetime]
    ) -> List[dict]:
        """按时间范围过滤数据"""
        if not start_time and not end_time:
            return data

        filtered = []
        for item in data:
            timestamp = datetime.fromisoformat(item['timestamp'])
            if start_time and timestamp < start_time:
                continue
            if end_time and timestamp > end_time:
                continue
            filtered.append(item)

        return filtered
```

---

## 3. 前端改动清单

### 📁 需要新建的文件

#### 3.1 类型定义扩展

**文件**: `frontend/src/types/history.ts` （新建）
**功能**: 历史数据相关类型定义

```typescript
import { Device } from './index';

// 历史快照（带时间戳）
export interface DeviceHistorySnapshot extends Device {
  timestamp: string;  // ISO 8601格式
}

// 时间范围查询参数
export interface TimeRangeQuery {
  start_time?: string;
  end_time?: string;
  granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

// 趋势数据点
export interface TrendDataPoint {
  timestamp: string;
  value: number;
  metric_name: string;
}

// 历史数据响应
export interface HistoryResponse {
  device_id: string;
  total_points: number;
  time_range: {
    start: string;
    end: string;
  };
  snapshots: DeviceHistorySnapshot[];
}

// 趋势数据响应
export interface TrendResponse {
  device_id: string;
  metrics: string[];
  data_points: TrendDataPoint[];
}

// 统计摘要
export interface StatisticsSummary {
  metric_name: string;
  avg: number;
  min: number;
  max: number;
  std_dev: number;
  percentile_95: number;
}

// 筛选预设
export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    severityFilter?: number;
    faultTypeFilter?: string;
    timeRange?: TimeRangeQuery;
    customFilters?: Record<string, any>;
  };
}
```

---

#### 3.2 新增组件

**1. 时间范围选择器**

**文件**: `frontend/src/components/TimeRangePicker.tsx`
**功能**: 时间范围选择组件

```typescript
import React from 'react';
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { TimeRangeQuery } from '@/types/history';

const { RangePicker } = DatePicker;

interface TimeRangePickerProps {
  value?: TimeRangeQuery;
  onChange?: (value: TimeRangeQuery) => void;
  showTime?: boolean;
}

export const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  value,
  onChange,
  showTime = true,
}) => {
  const handleChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!dates || !dates[0] || !dates[1]) {
      onChange?.({});
      return;
    }

    onChange?.({
      start_time: dates[0].toISOString(),
      end_time: dates[1].toISOString(),
    });
  };

  return (
    <RangePicker
      showTime={showTime}
      format="YYYY-MM-DD HH:mm"
      onChange={handleChange}
      ranges={{
        '今天': [dayjs().startOf('day'), dayjs().endOf('day')],
        '最近7天': [dayjs().subtract(7, 'days'), dayjs()],
        '最近30天': [dayjs().subtract(30, 'days'), dayjs()],
        '最近90天': [dayjs().subtract(90, 'days'), dayjs()],
        '本月': [dayjs().startOf('month'), dayjs().endOf('month')],
        '上月': [
          dayjs().subtract(1, 'month').startOf('month'),
          dayjs().subtract(1, 'month').endOf('month'),
        ],
      }}
      style={{ width: '100%' }}
    />
  );
};
```

---

**2. 趋势图表组件**

**文件**: `frontend/src/components/TrendChart.tsx`
**功能**: 历史趋势图表组件

```typescript
import React, { useEffect, useState } from 'react';
import { Card, Spin, Select, message } from 'antd';
import ReactECharts from 'echarts-for-react';
import { historyAPI } from '@/services/api';
import type { TimeRangeQuery, TrendResponse } from '@/types/history';

interface TrendChartProps {
  deviceId: string;
  metrics: string[];
  timeRange: TimeRangeQuery;
  title?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  deviceId,
  metrics,
  timeRange,
  title = '历史趋势',
}) => {
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<TrendResponse | null>(null);

  useEffect(() => {
    loadTrendData();
  }, [deviceId, metrics, timeRange]);

  const loadTrendData = async () => {
    if (!timeRange.start_time || !timeRange.end_time) return;

    setLoading(true);
    try {
      const data = await historyAPI.getTrends(
        deviceId,
        metrics,
        timeRange.start_time,
        timeRange.end_time
      );
      setTrendData(data);
    } catch (error) {
      message.error('加载趋势数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getChartOption = () => {
    if (!trendData) return {};

    // 按指标分组数据
    const seriesData: Record<string, any[]> = {};
    trendData.data_points.forEach((point) => {
      if (!seriesData[point.metric_name]) {
        seriesData[point.metric_name] = [];
      }
      seriesData[point.metric_name].push([point.timestamp, point.value]);
    });

    return {
      title: { text: title, left: 'center' },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: Object.keys(seriesData),
        top: 30,
      },
      grid: { top: 80, bottom: 60, left: 60, right: 60 },
      xAxis: {
        type: 'time',
        name: '时间',
      },
      yAxis: {
        type: 'value',
        name: '数值',
      },
      dataZoom: [
        { type: 'slider', start: 0, end: 100 },
        { type: 'inside' },
      ],
      series: Object.entries(seriesData).map(([name, data]) => ({
        name,
        type: 'line',
        data,
        smooth: true,
      })),
    };
  };

  return (
    <Card>
      <Spin spinning={loading}>
        <ReactECharts option={getChartOption()} style={{ height: 400 }} />
      </Spin>
    </Card>
  );
};
```

---

**3. 时间线回放控制器**

**文件**: `frontend/src/components/TimelinePlayer.tsx`
**功能**: 时间线回放控制组件

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Slider, Select, Space, Typography } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  FastBackwardOutlined,
  FastForwardOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import type { TimeRangeQuery, DeviceHistorySnapshot } from '@/types/history';
import { historyAPI } from '@/services/api';

const { Text } = Typography;

interface TimelinePlayerProps {
  deviceId: string;
  timeRange: TimeRangeQuery;
  onDataChange?: (snapshot: DeviceHistorySnapshot) => void;
}

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({
  deviceId,
  timeRange,
  onDataChange,
}) => {
  const [data, setData] = useState<DeviceHistorySnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 5x, 10x
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadPlaybackData();
  }, [deviceId, timeRange]);

  useEffect(() => {
    if (data.length > 0 && onDataChange) {
      onDataChange(data[currentIndex]);
    }
  }, [currentIndex, data]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= data.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speed, data.length]);

  const loadPlaybackData = async () => {
    if (!timeRange.start_time || !timeRange.end_time) return;

    try {
      const playbackData = await historyAPI.getPlaybackData(
        deviceId,
        timeRange.start_time,
        timeRange.end_time,
        3600 // 1小时间隔
      );
      setData(playbackData);
      setCurrentIndex(0);
    } catch (error) {
      console.error('加载回放数据失败', error);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleStepBack = () => setCurrentIndex(Math.max(0, currentIndex - 1));
  const handleStepForward = () =>
    setCurrentIndex(Math.min(data.length - 1, currentIndex + 1));
  const handleFastBackward = () => setCurrentIndex(0);
  const handleFastForward = () => setCurrentIndex(data.length - 1);

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 进度条 */}
        <Slider
          min={0}
          max={data.length - 1}
          value={currentIndex}
          onChange={setCurrentIndex}
          tooltip={{
            formatter: (value) =>
              value !== undefined && data[value]
                ? new Date(data[value].timestamp).toLocaleString()
                : '',
          }}
        />

        {/* 控制按钮 */}
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button icon={<FastBackwardOutlined />} onClick={handleFastBackward}>
            回到开始
          </Button>
          <Button icon={<StepBackwardOutlined />} onClick={handleStepBack}>
            上一步
          </Button>
          {isPlaying ? (
            <Button
              type="primary"
              icon={<PauseCircleOutlined />}
              onClick={handlePause}
            >
              暂停
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handlePlay}
            >
              播放
            </Button>
          )}
          <Button icon={<StepForwardOutlined />} onClick={handleStepForward}>
            下一步
          </Button>
          <Button icon={<FastForwardOutlined />} onClick={handleFastForward}>
            跳到结尾
          </Button>
          <Select value={speed} onChange={setSpeed} style={{ width: 80 }}>
            <Select.Option value={0.5}>0.5x</Select.Option>
            <Select.Option value={1}>1x</Select.Option>
            <Select.Option value={2}>2x</Select.Option>
            <Select.Option value={5}>5x</Select.Option>
            <Select.Option value={10}>10x</Select.Option>
          </Select>
        </Space>

        {/* 当前时间显示 */}
        {data.length > 0 && (
          <Text style={{ textAlign: 'center', display: 'block' }}>
            当前时间: {new Date(data[currentIndex].timestamp).toLocaleString()}
          </Text>
        )}
      </Space>
    </Card>
  );
};
```

---

**4. 高级筛选面板**

**文件**: `frontend/src/components/AdvancedFilterPanel.tsx`
**功能**: 多维度高级筛选组件

```typescript
import React, { useState } from 'react';
import {
  Card,
  Form,
  Select,
  Slider,
  InputNumber,
  Checkbox,
  Button,
  Space,
} from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { TimeRangePicker } from './TimeRangePicker';
import type { TimeRangeQuery } from '@/types/history';

interface AdvancedFilters {
  timeRange?: TimeRangeQuery;
  deviceTypes?: string[];
  capacityRange?: [number, number];
  operationYears?: string;
  severities?: number[];
  dgaRange?: { min?: number; max?: number };
  tempRange?: [number, number];
  loadRange?: [number, number];
}

interface AdvancedFilterPanelProps {
  onApply?: (filters: AdvancedFilters) => void;
  onClear?: () => void;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  onApply,
  onClear,
}) => {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<AdvancedFilters>({});

  const handleApply = () => {
    const values = form.getFieldsValue();
    setFilters(values);
    onApply?.(values);
  };

  const handleClear = () => {
    form.resetFields();
    setFilters({});
    onClear?.();
  };

  return (
    <Card title="高级筛选" bordered={false}>
      <Form form={form} layout="vertical">
        {/* 时间范围 */}
        <Form.Item label="数据时间" name="timeRange">
          <TimeRangePicker />
        </Form.Item>

        {/* 设备类型 */}
        <Form.Item label="设备类型" name="deviceTypes">
          <Select mode="multiple" placeholder="选择设备类型">
            <Select.Option value="transformer">主变压器</Select.Option>
            <Select.Option value="distribution">配电变压器</Select.Option>
            <Select.Option value="special">特种变压器</Select.Option>
          </Select>
        </Form.Item>

        {/* 容量范围 */}
        <Form.Item label="额定容量 (MVA)" name="capacityRange">
          <Slider range min={10} max={500} marks={{ 10: '10', 500: '500' }} />
        </Form.Item>

        {/* 运行年限 */}
        <Form.Item label="运行年限" name="operationYears">
          <Select placeholder="选择运行年限">
            <Select.Option value="0-5">0-5年</Select.Option>
            <Select.Option value="5-10">5-10年</Select.Option>
            <Select.Option value="10-20">10-20年</Select.Option>
            <Select.Option value="20+">20年以上</Select.Option>
          </Select>
        </Form.Item>

        {/* 故障严重程度 */}
        <Form.Item label="严重程度" name="severities">
          <Checkbox.Group
            options={[
              { label: '正常', value: 0 },
              { label: '注意', value: 1 },
              { label: '异常', value: 2 },
              { label: '严重', value: 3 },
            ]}
          />
        </Form.Item>

        {/* DGA浓度范围 */}
        <Form.Item label="C2H2浓度 (ppm)">
          <Space>
            <Form.Item name={['dgaRange', 'min']} noStyle>
              <InputNumber placeholder="最小值" min={0} />
            </Form.Item>
            <span>-</span>
            <Form.Item name={['dgaRange', 'max']} noStyle>
              <InputNumber placeholder="最大值" min={0} />
            </Form.Item>
          </Space>
        </Form.Item>

        {/* 温度范围 */}
        <Form.Item label="热点温度 (°C)" name="tempRange">
          <Slider range min={60} max={150} marks={{ 60: '60', 150: '150' }} />
        </Form.Item>

        {/* 负载率范围 */}
        <Form.Item label="负载率 (%)" name="loadRange">
          <Slider range min={0} max={130} marks={{ 0: '0', 130: '130' }} />
        </Form.Item>

        {/* 操作按钮 */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleApply}
            >
              应用筛选
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              清除筛选
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};
```

---

#### 3.3 API服务扩展

**文件**: `frontend/src/services/api.ts`
**修改**: 添加历史数据API

```typescript
// 在文件末尾添加

// 历史数据API
export const historyAPI = {
  /**
   * 获取设备历史数据
   */
  getDeviceHistory: async (
    deviceId: string,
    startTime?: string,
    endTime?: string,
    granularity?: string,
    limit?: number
  ): Promise<HistoryResponse> => {
    const response = await apiClient.get(
      `/history/devices/${deviceId}/history`,
      {
        params: {
          start_time: startTime,
          end_time: endTime,
          granularity,
          limit,
        },
      }
    );
    return response.data;
  },

  /**
   * 批量获取历史数据
   */
  getBatchHistory: async (
    deviceIds: string[],
    startTime: string,
    endTime: string,
    granularity?: string
  ): Promise<Record<string, HistoryResponse>> => {
    const response = await apiClient.get('/history/devices/history/batch', {
      params: {
        device_ids: deviceIds.join(','),
        start_time: startTime,
        end_time: endTime,
        granularity,
      },
    });
    return response.data;
  },

  /**
   * 获取趋势数据
   */
  getTrends: async (
    deviceId: string,
    metrics: string[],
    startTime: string,
    endTime: string,
    aggregation?: string
  ): Promise<TrendResponse> => {
    const response = await apiClient.get(
      `/history/devices/${deviceId}/trends`,
      {
        params: {
          metrics: metrics.join(','),
          start_time: startTime,
          end_time: endTime,
          aggregation,
        },
      }
    );
    return response.data;
  },

  /**
   * 获取时间线回放数据
   */
  getPlaybackData: async (
    deviceId: string,
    startTime: string,
    endTime: string,
    intervalSeconds?: number
  ): Promise<DeviceHistorySnapshot[]> => {
    const response = await apiClient.get(
      `/history/devices/${deviceId}/playback`,
      {
        params: {
          start_time: startTime,
          end_time: endTime,
          interval_seconds: intervalSeconds,
        },
      }
    );
    return response.data;
  },

  /**
   * 按时间筛选设备
   */
  filterDevicesByTime: async (
    scenarioId?: string,
    startTime?: string,
    endTime?: string,
    faultTypes?: string[],
    minSeverity?: number
  ): Promise<Device[]> => {
    const response = await apiClient.get('/history/devices/filter', {
      params: {
        scenario_id: scenarioId,
        start_time: startTime,
        end_time: endTime,
        fault_types: faultTypes?.join(','),
        min_severity: minSeverity,
      },
    });
    return response.data;
  },

  /**
   * 获取统计摘要
   */
  getStatistics: async (
    deviceId: string,
    startTime: string,
    endTime: string,
    metrics: string[]
  ): Promise<StatisticsSummary[]> => {
    const response = await apiClient.get(
      `/history/devices/${deviceId}/statistics`,
      {
        params: {
          start_time: startTime,
          end_time: endTime,
          metrics: metrics.join(','),
        },
      }
    );
    return response.data;
  },
};

// 导出
export default {
  device: deviceAPI,
  diagnosis: diagnosisAPI,
  simulation: simulationAPI,
  report: reportAPI,
  ai: aiAPI,
  data: dataAPI,
  history: historyAPI, // ← 新增
};
```

---

### 📝 需要修改的文件

#### 3.4 类型定义修改

**文件**: `frontend/src/types/index.ts`
**修改**: 添加时间戳字段

```typescript
// 在 Device 接口中添加
export interface Device {
  device_id: string;
  device_name: string;
  timestamp?: string; // ← 新增字段（ISO 8601格式）
  // ... 其他字段保持不变
}

// 在文件末尾添加历史数据相关类型导出
export * from './history';
```

---

#### 3.5 DeviceDetail 页面修改

**文件**: `frontend/src/pages/DeviceDetail.tsx`
**修改**: 添加历史趋势标签页

```typescript
// 在导入部分添加
import { TimeRangePicker } from '@/components/TimeRangePicker';
import { TrendChart } from '@/components/TrendChart';
import { TimelinePlayer } from '@/components/TimelinePlayer';
import type { TimeRangeQuery, DeviceHistorySnapshot } from '@/types/history';

// 在组件内添加状态
const [timeRange, setTimeRange] = useState<TimeRangeQuery>({
  start_time: dayjs().subtract(30, 'days').toISOString(),
  end_time: dayjs().toISOString(),
});
const [playbackSnapshot, setPlaybackSnapshot] = useState<DeviceHistorySnapshot | null>(null);

// 在 JSX 中添加标签页
<Tabs defaultActiveKey="1">
  <TabPane tab="实时状态" key="1">
    {/* 现有内容保持不变 */}
  </TabPane>

  <TabPane tab="历史趋势" key="2">
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <TimeRangePicker value={timeRange} onChange={setTimeRange} />

      <TrendChart
        deviceId={deviceId}
        metrics={['dga.H2', 'dga.CH4', 'dga.C2H2']}
        timeRange={timeRange}
        title="DGA气体浓度趋势"
      />

      <TrendChart
        deviceId={deviceId}
        metrics={['thermal.hotspot_temp', 'thermal.oil_temp']}
        timeRange={timeRange}
        title="温度趋势"
      />

      <TrendChart
        deviceId={deviceId}
        metrics={['aging.current_dp', 'aging.remaining_life_years']}
        timeRange={timeRange}
        title="老化趋势"
      />
    </Space>
  </TabPane>

  <TabPane tab="数据回放" key="3">
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <TimeRangePicker value={timeRange} onChange={setTimeRange} />

      <TimelinePlayer
        deviceId={deviceId}
        timeRange={timeRange}
        onDataChange={setPlaybackSnapshot}
      />

      {/* 显示回放时刻的设备状态 */}
      {playbackSnapshot && (
        <Card title="当前时刻设备状态">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="时间">
              {new Date(playbackSnapshot.timestamp).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="故障类型">
              {formatFaultType(playbackSnapshot.fault_type)}
            </Descriptions.Item>
            <Descriptions.Item label="严重程度">
              <Badge
                status={getSeverityColor(playbackSnapshot.severity)}
                text={getSeverityLabel(playbackSnapshot.severity)}
              />
            </Descriptions.Item>
            {/* 更多设备参数... */}
          </Descriptions>
        </Card>
      )}
    </Space>
  </TabPane>
</Tabs>
```

---

#### 3.6 Dashboard 页面修改

**文件**: `frontend/src/pages/Dashboard.tsx`
**修改**: 添加时间筛选和高级筛选

```typescript
// 在导入部分添加
import { TimeRangePicker } from '@/components/TimeRangePicker';
import { AdvancedFilterPanel } from '@/components/AdvancedFilterPanel';
import { historyAPI } from '@/services/api';
import type { TimeRangeQuery } from '@/types/history';

// 在组件内添加状态
const [timeRange, setTimeRange] = useState<TimeRangeQuery>({});
const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

// 修改数据加载函数
const loadDevicesData = async () => {
  setLoading(true);
  try {
    let allDevices: Device[] = [];

    // 如果有时间范围，使用筛选接口
    if (timeRange.start_time || timeRange.end_time) {
      allDevices = await historyAPI.filterDevicesByTime(
        undefined, // scenario_id
        timeRange.start_time,
        timeRange.end_time,
        undefined, // fault_types
        severityFilter || undefined
      );
    } else {
      // 否则使用原有接口
      allDevices = await deviceAPI.getAllDevices();
    }

    setDevices(allDevices);
    calculateStats(allDevices);
    calculateFaultDistribution(allDevices);
  } catch (error) {
    message.error('加载设备数据失败');
  } finally {
    setLoading(false);
  }
};

// 在筛选器区域添加时间选择器
<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
  <Col span={8}>
    <TimeRangePicker value={timeRange} onChange={setTimeRange} />
  </Col>

  <Col span={4}>
    <Button
      icon={<FilterOutlined />}
      onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
    >
      {showAdvancedFilter ? '隐藏高级筛选' : '高级筛选'}
    </Button>
  </Col>

  {/* 现有的筛选器保持不变 */}
</Row>

{/* 高级筛选面板 */}
{showAdvancedFilter && (
  <Row style={{ marginBottom: 24 }}>
    <Col span={24}>
      <AdvancedFilterPanel
        onApply={handleAdvancedFiltersApply}
        onClear={handleAdvancedFiltersClear}
      />
    </Col>
  </Row>
)}
```

---

#### 3.7 DeviceList 页面修改

**文件**: `frontend/src/pages/DeviceList.tsx`
**修改**: 添加时间筛选

```typescript
// 类似 Dashboard 的修改，添加 TimeRangePicker 和时间筛选逻辑
```

---

#### 3.8 新增历史分析页面（可选）

**文件**: `frontend/src/pages/HistoryAnalysis.tsx`（新建）
**功能**: 专门的历史数据分析页面

```typescript
import React, { useState } from 'react';
import { Card, Row, Col, Tabs, Select, Space } from 'antd';
import { TimeRangePicker } from '@/components/TimeRangePicker';
import { TrendChart } from '@/components/TrendChart';
import { TimelinePlayer } from '@/components/TimelinePlayer';
import type { TimeRangeQuery } from '@/types/history';

const { TabPane } = Tabs;

const HistoryAnalysis: React.FC = () => {
  const [selectedDevices, setSelectedDevices] = useState<string[]>(['T001']);
  const [timeRange, setTimeRange] = useState<TimeRangeQuery>({});
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'dga.H2',
    'thermal.hotspot_temp',
  ]);

  return (
    <div style={{ padding: 24 }}>
      <Card title="历史数据分析">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 设备和时间选择 */}
          <Row gutter={16}>
            <Col span={12}>
              <Select
                mode="multiple"
                placeholder="选择设备"
                value={selectedDevices}
                onChange={setSelectedDevices}
                style={{ width: '100%' }}
              >
                <Select.Option value="T001">1号主变</Select.Option>
                <Select.Option value="T002">2号主变</Select.Option>
                <Select.Option value="T003">3号主变</Select.Option>
              </Select>
            </Col>
            <Col span={12}>
              <TimeRangePicker value={timeRange} onChange={setTimeRange} />
            </Col>
          </Row>

          {/* 指标选择 */}
          <Select
            mode="multiple"
            placeholder="选择分析指标"
            value={selectedMetrics}
            onChange={setSelectedMetrics}
            style={{ width: '100%' }}
          >
            <Select.OptGroup label="DGA气体">
              <Select.Option value="dga.H2">H2</Select.Option>
              <Select.Option value="dga.CH4">CH4</Select.Option>
              <Select.Option value="dga.C2H2">C2H2</Select.Option>
            </Select.OptGroup>
            <Select.OptGroup label="温度">
              <Select.Option value="thermal.hotspot_temp">热点温度</Select.Option>
              <Select.Option value="thermal.oil_temp">油顶温度</Select.Option>
            </Select.OptGroup>
            <Select.OptGroup label="老化">
              <Select.Option value="aging.current_dp">DP值</Select.Option>
              <Select.Option value="aging.remaining_life_years">
                剩余寿命
              </Select.Option>
            </Select.OptGroup>
          </Select>

          {/* 多设备趋势对比 */}
          <Tabs defaultActiveKey="1">
            <TabPane tab="趋势对比" key="1">
              {selectedDevices.map((deviceId) => (
                <TrendChart
                  key={deviceId}
                  deviceId={deviceId}
                  metrics={selectedMetrics}
                  timeRange={timeRange}
                  title={`${deviceId} 历史趋势`}
                />
              ))}
            </TabPane>

            <TabPane tab="时间线回放" key="2">
              {selectedDevices.length === 1 && (
                <TimelinePlayer
                  deviceId={selectedDevices[0]}
                  timeRange={timeRange}
                />
              )}
            </TabPane>
          </Tabs>
        </Space>
      </Card>
    </div>
  );
};

export default HistoryAnalysis;
```

---

#### 3.9 路由配置修改

**文件**: `frontend/src/App.tsx`
**修改**: 添加历史分析页面路由

```typescript
import HistoryAnalysis from './pages/HistoryAnalysis';

// 在路由配置中添加
<Route path="/history" element={<HistoryAnalysis />} />
```

---

#### 3.10 导航菜单修改

**文件**: `frontend/src/layouts/MainLayout.tsx`
**修改**: 添加历史分析菜单项

```typescript
// 在菜单项中添加
{
  key: '/history',
  icon: <ClockCircleOutlined />,
  label: '历史分析',
}
```

---

## 4. 分阶段实施计划

### 📅 阶段1：基础架构准备（3天）

**目标**: 搭建时间筛选的基础架构，不依赖数据库

**任务清单**:
- [ ] **Day 1: 后端占位符API**
  - 创建 `api/app/api/v1/history.py`
  - 创建 `api/app/schemas/history.py`
  - 创建 `api/app/services/history_service.py`
  - 修改 `api/app/schemas/device.py`（添加timestamp字段）
  - 注册路由到 `api/app/main.py`

- [ ] **Day 2: 前端类型和组件**
  - 创建 `frontend/src/types/history.ts`
  - 修改 `frontend/src/types/index.ts`
  - 创建 `frontend/src/components/TimeRangePicker.tsx`
  - 扩展 `frontend/src/services/api.ts`（添加historyAPI）

- [ ] **Day 3: 数据加载器扩展**
  - 修改 `backend/data/data_loader.py`
  - 实现从JSON文件读取时序数据
  - 实现时间范围过滤方法
  - 测试占位符API返回数据

**验收标准**:
- ✅ API端点可访问（返回占位数据）
- ✅ 前端类型定义完整
- ✅ TimeRangePicker组件正常工作
- ✅ 可以从JSON文件读取历史数据

---

### 📅 阶段2：历史趋势展示（4天）

**目标**: 在设备详情页展示历史趋势图

**任务清单**:
- [ ] **Day 1: TrendChart组件开发**
  - 创建 `frontend/src/components/TrendChart.tsx`
  - 实现ECharts趋势图配置
  - 支持多指标显示
  - 支持缩放和数据点查看

- [ ] **Day 2: DeviceDetail页面集成**
  - 修改 `frontend/src/pages/DeviceDetail.tsx`
  - 添加"历史趋势"标签页
  - 集成TimeRangePicker和TrendChart
  - 实现DGA、温度、老化三个趋势图

- [ ] **Day 3: 后端趋势数据实现**
  - 完善 `history_service.py` 的 `get_trend_data` 方法
  - 从JSON文件提取指标数据
  - 实现数据聚合（按小时/天）
  - 测试API返回正确的趋势数据

- [ ] **Day 4: 数据对接和优化**
  - 前后端联调
  - 处理边界情况（无数据、数据不足）
  - 优化图表性能（大数据集降采样）
  - UI细节调整

**验收标准**:
- ✅ 设备详情页可查看30天历史趋势
- ✅ 图表交互流畅（缩放、数据点查看）
- ✅ 支持自定义时间范围
- ✅ 数据加载快速（< 2秒）

---

### 📅 阶段3：高级筛选功能（3天）

**目标**: 支持多维度筛选设备

**任务清单**:
- [ ] **Day 1: AdvancedFilterPanel组件**
  - 创建 `frontend/src/components/AdvancedFilterPanel.tsx`
  - 实现10+筛选维度UI
  - 实现筛选逻辑（前端）

- [ ] **Day 2: Dashboard页面集成**
  - 修改 `frontend/src/pages/Dashboard.tsx`
  - 添加高级筛选面板
  - 实现筛选结果应用
  - 添加筛选预设功能（localStorage）

- [ ] **Day 3: 筛选预设管理**
  - 快捷筛选标签
  - 自定义预设保存/加载/删除
  - 智能搜索功能
  - 搜索历史记录

**验收标准**:
- ✅ 支持10+维度组合筛选
- ✅ 筛选结果准确
- ✅ 筛选预设可保存和加载
- ✅ 智能搜索实时响应

---

### 📅 阶段4：时间线回放（4天）

**目标**: 实现历史数据回放功能

**任务清单**:
- [ ] **Day 1: TimelinePlayer组件**
  - 创建 `frontend/src/components/TimelinePlayer.tsx`
  - 实现播放控制（播放/暂停/快进/倒退）
  - 实现速度调节
  - 实现进度条拖拽

- [ ] **Day 2: 后端回放数据实现**
  - 完善 `history_service.py` 的 `get_playback_data` 方法
  - 实现时间间隔采样
  - 返回完整的设备快照数据

- [ ] **Day 3: DeviceDetail页面集成**
  - 添加"数据回放"标签页
  - 集成TimelinePlayer组件
  - 显示回放时刻的设备状态
  - 图表同步更新

- [ ] **Day 4: 历史分析页面（可选）**
  - 创建 `frontend/src/pages/HistoryAnalysis.tsx`
  - 支持多设备对比回放
  - 添加路由和菜单

**验收标准**:
- ✅ 回放控制流畅
- ✅ 数据同步准确
- ✅ 支持多种播放速度
- ✅ 可跳转到任意时间点

---

### 📅 阶段5：数据可视化增强（3天）

**目标**: 优化图表交互和数据展示

**任务清单**:
- [ ] **Day 1: Dashboard仪表盘优化**
  - 添加实时刷新指示器
  - 添加自动刷新开关
  - 关键设备卡片添加趋势图标
  - 数据更新动画

- [ ] **Day 2: 图表交互增强**
  - 配置ECharts工具栏
  - 数据点详情弹窗
  - 图例交互优化
  - 图表类型切换

- [ ] **Day 3: 数据对比优化**
  - 设备对比矩阵表格
  - 时段对比功能
  - 最优值高亮
  - 雷达图对比

**验收标准**:
- ✅ 图表交互友好
- ✅ 数据对比直观
- ✅ 自动刷新正常
- ✅ 动画效果流畅

---

### 📅 阶段6：数据导出和UX优化（3天）

**目标**: 完善数据导出和用户体验

**任务清单**:
- [ ] **Day 1: 灵活数据导出**
  - 实现Excel导出（含图表）
  - 实现CSV导出
  - 实现PDF导出
  - 自定义导出选项

- [ ] **Day 2: UX细节优化**
  - Skeleton占位符
  - 空状态优化
  - Loading状态优化
  - 错误处理优化

- [ ] **Day 3: 响应式布局**
  - 自适应卡片布局
  - 移动端折叠筛选
  - 图表自适应
  - 触控交互优化

**验收标准**:
- ✅ 支持多种格式导出
- ✅ 加载状态友好
- ✅ 空状态有引导
- ✅ 移动端体验良好

---

## 5. 代码模板与示例

### 5.1 后端占位符API示例

**文件**: `api/app/api/v1/history.py`

```python
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime

from app.schemas.history import (
    HistoryResponse,
    TrendResponse,
    DeviceHistorySnapshot,
    StatisticsSummary,
)
from app.services.history_service import history_service

router = APIRouter()


@router.get("/devices/{device_id}/history", response_model=HistoryResponse)
async def get_device_history(
    device_id: str,
    start_time: Optional[str] = Query(None, description="开始时间 (ISO 8601)"),
    end_time: Optional[str] = Query(None, description="结束时间 (ISO 8601)"),
    granularity: str = Query("hour", description="时间粒度: minute/hour/day/week/month"),
    limit: int = Query(1000, description="最大返回数量")
):
    """
    获取设备历史数据

    【占位符实现】当前从JSON文件读取时序数据，未来连接数据库
    """
    try:
        # 解析时间
        start_dt = datetime.fromisoformat(start_time) if start_time else None
        end_dt = datetime.fromisoformat(end_time) if end_time else None

        # 调用服务层
        result = await history_service.get_device_history(
            device_id=device_id,
            start_time=start_dt,
            end_time=end_dt,
            granularity=granularity,
            limit=limit
        )

        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"设备 {device_id} 的历史数据不存在")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/devices/history/batch")
async def get_batch_history(
    device_ids: str = Query(..., description="设备ID列表，逗号分隔"),
    start_time: str = Query(..., description="开始时间 (ISO 8601)"),
    end_time: str = Query(..., description="结束时间 (ISO 8601)"),
    granularity: str = Query("day", description="时间粒度")
):
    """
    批量获取多设备历史数据

    【占位符实现】用于对比视图
    """
    device_id_list = [did.strip() for did in device_ids.split(',')]

    start_dt = datetime.fromisoformat(start_time)
    end_dt = datetime.fromisoformat(end_time)

    result = await history_service.get_batch_history(
        device_ids=device_id_list,
        start_time=start_dt,
        end_time=end_dt,
        granularity=granularity
    )

    return result


@router.get("/devices/{device_id}/trends", response_model=TrendResponse)
async def get_device_trends(
    device_id: str,
    metrics: str = Query(..., description="指标列表，逗号分隔，如: dga.H2,thermal.hotspot_temp"),
    start_time: str = Query(..., description="开始时间 (ISO 8601)"),
    end_time: str = Query(..., description="结束时间 (ISO 8601)"),
    aggregation: str = Query("avg", description="聚合方式: avg/min/max/sum")
):
    """
    获取设备指标趋势数据

    【占位符实现】用于图表可视化
    """
    metric_list = [m.strip() for m in metrics.split(',')]

    start_dt = datetime.fromisoformat(start_time)
    end_dt = datetime.fromisoformat(end_time)

    result = await history_service.get_trend_data(
        device_id=device_id,
        metrics=metric_list,
        start_time=start_dt,
        end_time=end_dt,
        aggregation=aggregation
    )

    return result


@router.get("/devices/{device_id}/playback", response_model=List[DeviceHistorySnapshot])
async def get_playback_data(
    device_id: str,
    start_time: str = Query(..., description="开始时间 (ISO 8601)"),
    end_time: str = Query(..., description="结束时间 (ISO 8601)"),
    interval_seconds: int = Query(3600, description="采样间隔（秒）")
):
    """
    获取时间线回放数据

    【占位符实现】用于故障演化回放
    """
    start_dt = datetime.fromisoformat(start_time)
    end_dt = datetime.fromisoformat(end_time)

    result = await history_service.get_playback_data(
        device_id=device_id,
        start_time=start_dt,
        end_time=end_dt,
        interval_seconds=interval_seconds
    )

    return result


@router.get("/devices/filter")
async def filter_devices_by_time(
    scenario_id: Optional[str] = Query(None, description="场景ID"),
    start_time: Optional[str] = Query(None, description="开始时间 (ISO 8601)"),
    end_time: Optional[str] = Query(None, description="结束时间 (ISO 8601)"),
    fault_types: Optional[str] = Query(None, description="故障类型列表，逗号分隔"),
    min_severity: Optional[int] = Query(None, description="最低严重程度")
):
    """
    按时间和条件筛选设备

    【占位符实现】当前返回最新快照，未来支持时间筛选
    """
    start_dt = datetime.fromisoformat(start_time) if start_time else None
    end_dt = datetime.fromisoformat(end_time) if end_time else None
    fault_type_list = [ft.strip() for ft in fault_types.split(',')] if fault_types else None

    result = await history_service.filter_devices_by_time(
        scenario_id=scenario_id,
        start_time=start_dt,
        end_time=end_dt,
        fault_types=fault_type_list,
        min_severity=min_severity
    )

    return result


@router.get("/devices/{device_id}/statistics", response_model=List[StatisticsSummary])
async def get_device_statistics(
    device_id: str,
    start_time: str = Query(..., description="开始时间 (ISO 8601)"),
    end_time: str = Query(..., description="结束时间 (ISO 8601)"),
    metrics: str = Query(..., description="指标列表，逗号分隔")
):
    """
    获取指定时间段的统计摘要

    【占位符实现】返回均值/最大/最小/标准差等
    """
    start_dt = datetime.fromisoformat(start_time)
    end_dt = datetime.fromisoformat(end_time)
    metric_list = [m.strip() for m in metrics.split(',')]

    result = await history_service.get_statistics(
        device_id=device_id,
        start_time=start_dt,
        end_time=end_dt,
        metrics=metric_list
    )

    return result
```

---

### 5.2 后端服务层占位符实现

**文件**: `api/app/services/history_service.py`

```python
from typing import List, Optional, Dict
from datetime import datetime
import statistics

from backend.data.data_loader import DataLoader
from app.schemas.history import (
    HistoryResponse,
    TrendResponse,
    DeviceHistorySnapshot,
    TrendDataPoint,
    StatisticsSummary,
)
from app.schemas.device import Device, DGAData, ThermalData, AgingData, OperatingCondition


class HistoryService:
    """
    历史数据服务

    【占位符实现】当前使用DataLoader读取JSON文件
    未来替换为数据库连接
    """

    def __init__(self):
        self.data_loader = DataLoader()

    async def get_device_history(
        self,
        device_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        granularity: str = "hour",
        limit: int = 1000
    ) -> HistoryResponse:
        """
        获取设备历史数据

        【TODO】替换为SQL查询:
        SELECT * FROM device_history
        WHERE device_id = ?
        AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp
        LIMIT ?
        """
        # 尝试加载时序数据
        try:
            # 优先加载365天历史数据
            raw_data = self.data_loader.load_history(device_id, days=365)
        except FileNotFoundError:
            # 降级到时序数据
            try:
                raw_data = self.data_loader.load_timeseries(device_id, "gradual_discharge")
            except FileNotFoundError:
                # 无历史数据，返回空结果
                return HistoryResponse(
                    device_id=device_id,
                    total_points=0,
                    time_range={"start": None, "end": None},
                    snapshots=[]
                )

        # 应用时间过滤
        filtered_data = self.data_loader.filter_by_time_range(
            raw_data, start_time, end_time
        )

        # 限制数量
        filtered_data = filtered_data[:limit]

        # 转换为DeviceHistorySnapshot
        snapshots = [self._convert_to_snapshot(item) for item in filtered_data]

        return HistoryResponse(
            device_id=device_id,
            total_points=len(snapshots),
            time_range={
                "start": snapshots[0].timestamp if snapshots else None,
                "end": snapshots[-1].timestamp if snapshots else None,
            },
            snapshots=snapshots
        )

    async def get_batch_history(
        self,
        device_ids: List[str],
        start_time: datetime,
        end_time: datetime,
        granularity: str = "day"
    ) -> Dict[str, HistoryResponse]:
        """
        批量获取多设备历史数据

        【TODO】数据库批量查询
        """
        result = {}
        for device_id in device_ids:
            try:
                history = await self.get_device_history(
                    device_id, start_time, end_time, granularity
                )
                result[device_id] = history
            except Exception as e:
                print(f"Failed to load history for {device_id}: {e}")
                result[device_id] = HistoryResponse(
                    device_id=device_id,
                    total_points=0,
                    time_range={"start": None, "end": None},
                    snapshots=[]
                )

        return result

    async def get_trend_data(
        self,
        device_id: str,
        metrics: List[str],
        start_time: datetime,
        end_time: datetime,
        aggregation: str = "avg"
    ) -> TrendResponse:
        """
        获取设备指标趋势数据

        【TODO】SQL聚合查询:
        SELECT
            DATE_TRUNC('hour', timestamp) as time_bucket,
            AVG(dga_h2) as value
        FROM device_history
        WHERE device_id = ? AND timestamp BETWEEN ? AND ?
        GROUP BY time_bucket
        ORDER BY time_bucket
        """
        # 先获取历史数据
        history = await self.get_device_history(
            device_id, start_time, end_time
        )

        # 提取指标数据
        data_points = []
        for snapshot in history.snapshots:
            for metric in metrics:
                value = self._extract_metric_value(snapshot, metric)
                if value is not None:
                    data_points.append(
                        TrendDataPoint(
                            timestamp=snapshot.timestamp,
                            value=value,
                            metric_name=metric
                        )
                    )

        return TrendResponse(
            device_id=device_id,
            metrics=metrics,
            data_points=data_points
        )

    async def get_playback_data(
        self,
        device_id: str,
        start_time: datetime,
        end_time: datetime,
        interval_seconds: int = 3600
    ) -> List[DeviceHistorySnapshot]:
        """
        获取时间线回放数据

        【TODO】采样查询
        """
        history = await self.get_device_history(
            device_id, start_time, end_time
        )

        # 按时间间隔采样
        # 简化实现：每N个数据点取一个
        if not history.snapshots:
            return []

        total_seconds = (end_time - start_time).total_seconds()
        sample_count = int(total_seconds / interval_seconds)
        step = max(1, len(history.snapshots) // sample_count)

        return history.snapshots[::step]

    async def filter_devices_by_time(
        self,
        scenario_id: Optional[str],
        start_time: Optional[datetime],
        end_time: Optional[datetime],
        fault_types: Optional[List[str]],
        min_severity: Optional[int]
    ) -> List[Device]:
        """
        按时间和条件筛选设备

        【TODO】数据库WHERE查询
        """
        # 【占位符】当前返回最新快照
        # 未来从数据库查询指定时间范围的数据

        # 加载场景数据
        if scenario_id:
            devices_data = self.data_loader.load_scenario(scenario_id)
        else:
            # 加载所有场景
            scenarios = self.data_loader.list_scenarios()
            devices_data = []
            for scenario in scenarios:
                devices_data.extend(self.data_loader.load_scenario(scenario['id']))

        # 应用筛选条件
        filtered = devices_data

        if fault_types:
            filtered = [d for d in filtered if d.get('fault_type') in fault_types]

        if min_severity is not None:
            filtered = [d for d in filtered if d.get('severity', 0) >= min_severity]

        # 转换为Device对象
        devices = [self._convert_to_device(d) for d in filtered]

        return devices

    async def get_statistics(
        self,
        device_id: str,
        start_time: datetime,
        end_time: datetime,
        metrics: List[str]
    ) -> List[StatisticsSummary]:
        """
        获取指定时间段的统计摘要

        【TODO】SQL聚合函数
        """
        history = await self.get_device_history(
            device_id, start_time, end_time
        )

        summaries = []

        for metric in metrics:
            values = []
            for snapshot in history.snapshots:
                value = self._extract_metric_value(snapshot, metric)
                if value is not None:
                    values.append(value)

            if values:
                summaries.append(
                    StatisticsSummary(
                        metric_name=metric,
                        avg=statistics.mean(values),
                        min=min(values),
                        max=max(values),
                        std_dev=statistics.stdev(values) if len(values) > 1 else 0.0,
                        percentile_95=sorted(values)[int(len(values) * 0.95)]
                    )
                )

        return summaries

    # 辅助方法

    def _convert_to_snapshot(self, data: dict) -> DeviceHistorySnapshot:
        """将JSON数据转换为DeviceHistorySnapshot"""
        return DeviceHistorySnapshot(
            timestamp=data['timestamp'],
            device_id=data['device_id'],
            device_name=data['device_name'],
            dga=DGAData(**data['dga']),
            thermal=ThermalData(**data['thermal']),
            aging=AgingData(**data['aging']),
            operating_condition=OperatingCondition(**data['operating_condition']),
            fault_type=data['fault_type'],
            severity=data['severity']
        )

    def _convert_to_device(self, data: dict) -> Device:
        """将JSON数据转换为Device"""
        return Device(**data)

    def _extract_metric_value(self, snapshot: DeviceHistorySnapshot, metric: str) -> Optional[float]:
        """从快照中提取指标值"""
        parts = metric.split('.')
        if len(parts) != 2:
            return None

        category, field = parts

        if category == 'dga':
            return getattr(snapshot.dga, field, None)
        elif category == 'thermal':
            return getattr(snapshot.thermal, field, None)
        elif category == 'aging':
            return getattr(snapshot.aging, field, None)
        elif category == 'operating_condition':
            return getattr(snapshot.operating_condition, field, None)

        return None


# 全局实例
history_service = HistoryService()
```

---

## 6. 数据结构设计

### 6.1 宽表结构（未来数据库）

```sql
-- PostgreSQL宽表设计
CREATE TABLE device_history (
    -- 主键和索引
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,

    -- DGA数据（7个气体）
    dga_h2 FLOAT,
    dga_ch4 FLOAT,
    dga_c2h6 FLOAT,
    dga_c2h4 FLOAT,
    dga_c2h2 FLOAT,
    dga_co FLOAT,
    dga_co2 FLOAT,

    -- 热参数
    thermal_oil_temp FLOAT,           -- 油顶温度
    thermal_hotspot_temp FLOAT,       -- 热点温度
    thermal_ambient_temp FLOAT,       -- 环境温度

    -- 老化参数
    aging_current_dp FLOAT,           -- 当前DP值
    aging_device_age FLOAT,           -- 设备年龄
    aging_rate FLOAT,                 -- 老化速率
    aging_remaining_life FLOAT,       -- 剩余寿命（年）

    -- 运行工况
    op_load_percent FLOAT,            -- 负载率（%）
    op_voltage FLOAT,                 -- 电压（kV）
    op_frequency FLOAT,               -- 频率（Hz）

    -- 诊断结果
    fault_type VARCHAR(100),          -- 故障类型
    severity INT,                     -- 严重程度（0-3）

    -- 设备基本信息
    device_type VARCHAR(50),          -- 设备类型
    rated_capacity FLOAT,             -- 额定容量（MVA）
    rated_voltage FLOAT,              -- 额定电压（kV）
    manufacturer VARCHAR(100),        -- 制造商
    installation_date DATE,           -- 安装日期

    -- 审计字段
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引设计（优化查询性能）
CREATE INDEX idx_device_timestamp ON device_history(device_id, timestamp);
CREATE INDEX idx_timestamp ON device_history(timestamp);
CREATE INDEX idx_fault_type ON device_history(fault_type);
CREATE INDEX idx_severity ON device_history(severity);
CREATE INDEX idx_device_fault ON device_history(device_id, fault_type, severity);

-- 时间分区（可选，处理大数据量）
CREATE TABLE device_history_2024 PARTITION OF device_history
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE device_history_2025 PARTITION OF device_history
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

---

### 6.2 查询示例（未来SQL）

```sql
-- 1. 获取设备历史数据（带时间范围）
SELECT * FROM device_history
WHERE device_id = 'T001'
AND timestamp BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY timestamp
LIMIT 1000;

-- 2. 获取趋势数据（按小时聚合）
SELECT
    DATE_TRUNC('hour', timestamp) as time_bucket,
    AVG(dga_h2) as avg_h2,
    AVG(thermal_hotspot_temp) as avg_temp,
    AVG(aging_current_dp) as avg_dp
FROM device_history
WHERE device_id = 'T001'
AND timestamp BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY time_bucket
ORDER BY time_bucket;

-- 3. 按条件筛选设备（指定时间点）
SELECT DISTINCT ON (device_id) *
FROM device_history
WHERE timestamp <= '2024-06-15 14:30:00'
AND severity >= 2
AND fault_type IN ('high_energy_discharge', 'overheating')
ORDER BY device_id, timestamp DESC;

-- 4. 获取统计摘要
SELECT
    device_id,
    AVG(dga_h2) as avg_h2,
    MIN(dga_h2) as min_h2,
    MAX(dga_h2) as max_h2,
    STDDEV(dga_h2) as std_h2,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY dga_h2) as p95_h2
FROM device_history
WHERE device_id = 'T001'
AND timestamp BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY device_id;

-- 5. 时间线采样（每小时一个数据点）
SELECT * FROM (
    SELECT *,
        ROW_NUMBER() OVER (
            PARTITION BY DATE_TRUNC('hour', timestamp)
            ORDER BY timestamp
        ) as rn
    FROM device_history
    WHERE device_id = 'T001'
    AND timestamp BETWEEN '2024-01-01' AND '2024-12-31'
) sub
WHERE rn = 1
ORDER BY timestamp;
```

---

## 7. 占位符实现策略

### 7.1 适配器模式

使用**适配器模式**实现平滑过渡，确保代码在两种数据源下都能工作：

```python
# backend/data/data_source.py

from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime


class HistoryDataSource(ABC):
    """历史数据源抽象接口"""

    @abstractmethod
    async def get_history(
        self,
        device_id: str,
        start_time: Optional[datetime],
        end_time: Optional[datetime]
    ) -> List[dict]:
        """获取历史数据"""
        pass

    @abstractmethod
    async def filter_devices(
        self,
        scenario_id: Optional[str],
        start_time: Optional[datetime],
        end_time: Optional[datetime],
        fault_types: Optional[List[str]],
        min_severity: Optional[int]
    ) -> List[dict]:
        """筛选设备"""
        pass


class JsonHistorySource(HistoryDataSource):
    """JSON文件数据源（当前）"""

    def __init__(self):
        from backend.data.data_loader import DataLoader
        self.data_loader = DataLoader()

    async def get_history(
        self,
        device_id: str,
        start_time: Optional[datetime],
        end_time: Optional[datetime]
    ) -> List[dict]:
        """从JSON文件读取历史数据"""
        try:
            raw_data = self.data_loader.load_history(device_id, days=365)
        except FileNotFoundError:
            raw_data = self.data_loader.load_timeseries(device_id, "gradual_discharge")

        # 应用时间过滤
        return self.data_loader.filter_by_time_range(raw_data, start_time, end_time)

    async def filter_devices(
        self,
        scenario_id: Optional[str],
        start_time: Optional[datetime],
        end_time: Optional[datetime],
        fault_types: Optional[List[str]],
        min_severity: Optional[int]
    ) -> List[dict]:
        """从JSON文件筛选设备"""
        if scenario_id:
            devices = self.data_loader.load_scenario(scenario_id)
        else:
            scenarios = self.data_loader.list_scenarios()
            devices = []
            for scenario in scenarios:
                devices.extend(self.data_loader.load_scenario(scenario['id']))

        # 应用筛选条件
        if fault_types:
            devices = [d for d in devices if d.get('fault_type') in fault_types]

        if min_severity is not None:
            devices = [d for d in devices if d.get('severity', 0) >= min_severity]

        return devices


class DatabaseHistorySource(HistoryDataSource):
    """数据库数据源（未来）"""

    def __init__(self, db_connection):
        self.db = db_connection

    async def get_history(
        self,
        device_id: str,
        start_time: Optional[datetime],
        end_time: Optional[datetime]
    ) -> List[dict]:
        """从数据库查询历史数据"""
        query = """
            SELECT * FROM device_history
            WHERE device_id = $1
            AND timestamp BETWEEN $2 AND $3
            ORDER BY timestamp
            LIMIT 1000
        """

        results = await self.db.fetch(query, device_id, start_time, end_time)
        return [dict(row) for row in results]

    async def filter_devices(
        self,
        scenario_id: Optional[str],
        start_time: Optional[datetime],
        end_time: Optional[datetime],
        fault_types: Optional[List[str]],
        min_severity: Optional[int]
    ) -> List[dict]:
        """从数据库筛选设备"""
        query = """
            SELECT DISTINCT ON (device_id) *
            FROM device_history
            WHERE timestamp <= $1
        """

        params = [end_time or datetime.now()]

        if fault_types:
            query += " AND fault_type = ANY($2)"
            params.append(fault_types)

        if min_severity is not None:
            query += " AND severity >= $3"
            params.append(min_severity)

        query += " ORDER BY device_id, timestamp DESC"

        results = await self.db.fetch(query, *params)
        return [dict(row) for row in results]


# 服务层使用依赖注入
class HistoryService:
    def __init__(self, data_source: HistoryDataSource):
        self.data_source = data_source

    async def get_device_history(self, device_id, start_time, end_time):
        raw_data = await self.data_source.get_history(device_id, start_time, end_time)
        # 转换和处理...
        return result


# 根据环境选择数据源
def create_history_service():
    if USE_DATABASE:
        data_source = DatabaseHistorySource(db_connection)
    else:
        data_source = JsonHistorySource()

    return HistoryService(data_source)
```

---

### 7.2 前端兼容性处理

确保前端在两种模式下都能工作：

```typescript
// frontend/src/services/api.ts

// 优雅降级
export const historyAPI = {
  getDeviceHistory: async (
    deviceId: string,
    startTime?: string,
    endTime?: string
  ): Promise<HistoryResponse> => {
    try {
      // 尝试使用历史API
      const response = await apiClient.get(
        `/history/devices/${deviceId}/history`,
        { params: { start_time: startTime, end_time: endTime } }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 501) {
        // API不可用，降级到设备详情API
        console.warn('历史API不可用，使用快照数据');
        const device = await deviceAPI.getDeviceById(deviceId);

        // 返回单个快照作为历史数据
        return {
          device_id: deviceId,
          total_points: 1,
          time_range: {
            start: device.timestamp || new Date().toISOString(),
            end: device.timestamp || new Date().toISOString(),
          },
          snapshots: [device],
        };
      }

      throw error;
    }
  },
};
```

---

### 7.3 配置切换

使用环境变量控制数据源：

```python
# api/app/core/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ... 其他配置

    # 数据源配置
    USE_DATABASE: bool = False  # 默认使用JSON文件
    DATABASE_URL: Optional[str] = None  # 数据库连接字符串

    class Config:
        env_file = ".env"

settings = Settings()
```

```bash
# .env

# 开发环境（使用JSON文件）
USE_DATABASE=false

# 生产环境（使用数据库）
USE_DATABASE=true
DATABASE_URL=postgresql://user:pass@localhost:5432/smart_grid
```

---

## 8. 总结与后续步骤

### ✅ 完成本计划后你将拥有：

1. **时间维度功能**
   - 全局时间范围筛选器
   - 历史数据趋势图
   - 时间线回放功能

2. **高级筛选功能**
   - 多维度组合筛选
   - 智能搜索
   - 筛选预设管理

3. **数据可视化增强**
   - 优化的仪表盘
   - 增强的图表交互
   - 数据对比功能

4. **数据导出功能**
   - 多格式导出（Excel/CSV/PDF/JSON）
   - 自定义导出选项

5. **占位符API**
   - 完整的历史数据API端点
   - 平滑过渡到数据库的架构

---

### 📋 检查清单

在开始实施前，请确认：

- [ ] 理解了占位符实现策略
- [ ] 确认了优先实施的功能模块
- [ ] 准备好了开发环境
- [ ] 了解了现有代码结构
- [ ] 准备好了时序数据文件（JSON）

---

### 🚀 下一步行动

1. **确认优先级**：你想先实现哪个模块？
   - 推荐：阶段1（基础架构）+ 阶段2（历史趋势）

2. **开始实施**：按照本计划的代码模板开始编码

3. **测试验证**：每完成一个阶段，进行功能测试

4. **迭代优化**：根据实际使用反馈调整

---

### 📞 支持与帮助

如果在实施过程中遇到问题：

1. 参考代码模板中的注释
2. 查看现有API文档（http://localhost:8080/docs）
3. 检查浏览器控制台和后端日志
4. 随时向我提问

---

**文档维护者**: Claude Code
**最后更新**: 2025-11-21
**文档状态**: ✅ 可直接使用

祝开发顺利！🎉
