"""
历史数据模型
提供时序数据、趋势分析、统计摘要相关的 Pydantic 模型

设计原则：
- 灵活适配多数据源（油色谱、机控、智巡）
- 所有字段使用 Optional，支持部分数据缺失
- 兼容现有 Device 模型结构
- 支持原始宽表字段映射
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class TimeRangeQuery(BaseModel):
    """
    时间范围查询参数

    用于历史数据查询的时间范围定义
    """
    start_time: Optional[datetime] = Field(None, description="开始时间")
    end_time: Optional[datetime] = Field(None, description="结束时间")
    granularity: str = Field(
        default="hour",
        description="时间粒度: minute/hour/day/week/month"
    )

    @field_validator('granularity')
    @classmethod
    def validate_granularity(cls, v: str) -> str:
        """验证时间粒度参数"""
        allowed = ['minute', 'hour', 'day', 'week', 'month']
        if v not in allowed:
            raise ValueError(f"granularity 必须是以下之一: {', '.join(allowed)}")
        return v


class TrendDataPoint(BaseModel):
    """
    趋势数据点

    单个指标在特定时间点的值
    """
    timestamp: datetime = Field(..., description="时间戳")
    value: float = Field(..., description="指标值")
    metric_name: str = Field(..., description="指标名称，如: dga.H2, thermal.oil_temp")


class TrendResponse(BaseModel):
    """
    趋势数据响应

    返回设备指定指标的时序趋势数据
    """
    device_id: str = Field(..., description="设备ID")
    metrics: List[str] = Field(..., description="指标列表")
    data_points: List[TrendDataPoint] = Field(..., description="数据点列表")
    aggregation: str = Field(default="avg", description="聚合方式: avg/min/max/sum")


class StatisticsSummary(BaseModel):
    """
    统计摘要

    指定时间段内指标的统计信息
    """
    metric_name: str = Field(..., description="指标名称")
    avg: float = Field(..., description="平均值")
    min: float = Field(..., description="最小值")
    max: float = Field(..., description="最大值")
    std_dev: float = Field(..., description="标准差")
    percentile_95: float = Field(..., description="95分位数")
    sample_count: int = Field(default=0, description="样本数量")


class DeviceHistorySnapshot(BaseModel):
    """
    设备历史快照

    灵活模型设计，适配多数据源：
    - 油色谱数据（yousepu）: equip_no, acquisitiontime, h2, ch4, c2h6...
    - 机控数据（jikong）: equip_no, aris_time, oil_temp1, oil_temp2, el_p...
    - 智巡数据（zhixun）: pms_device_code, inspect_time, temperature...

    所有字段均为 Optional，支持部分数据缺失
    """

    # ===== 核心标识字段 =====
    timestamp: datetime = Field(..., description="时间戳（统一字段）")
    device_id: Optional[str] = Field(None, description="设备ID（统一字段）")

    # ===== 原始数据源字段映射 =====
    equip_no: Optional[str] = Field(None, description="设备编号（油色谱/机控）")
    pms_device_code: Optional[str] = Field(None, description="设备编号（智巡）")
    acquisitiontime: Optional[str] = Field(None, description="采集时间（油色谱原始）")
    aris_time: Optional[str] = Field(None, description="采集时间（机控原始）")
    inspect_time: Optional[str] = Field(None, description="巡检时间（智巡原始）")

    # ===== DGA 溶解气体分析数据（油色谱） =====
    h2: Optional[float] = Field(None, description="氢气浓度 (ppm)")
    ch4: Optional[float] = Field(None, description="甲烷浓度 (ppm)")
    c2h6: Optional[float] = Field(None, description="乙烷浓度 (ppm)")
    c2h4: Optional[float] = Field(None, description="乙烯浓度 (ppm)")
    c2h2: Optional[float] = Field(None, description="乙炔浓度 (ppm)")
    co: Optional[float] = Field(None, description="一氧化碳浓度 (ppm)")
    co2: Optional[float] = Field(None, description="二氧化碳浓度 (ppm)")
    totalhydrocarbon: Optional[float] = Field(None, description="总烃浓度 (ppm)")

    # ===== 温度数据（机控+智巡） =====
    oil_temp: Optional[float] = Field(None, description="油温 (°C)")
    oil_temp1: Optional[float] = Field(None, description="油温1 (°C) - 机控")
    oil_temp2: Optional[float] = Field(None, description="油温2 (°C) - 机控")
    temp: Optional[float] = Field(None, description="绕组温度 (°C) - 机控")
    temperature: Optional[float] = Field(None, description="温度 (°C) - 智巡")
    oil_temperature: Optional[float] = Field(None, description="油温 (°C) - 智巡")
    winding_temperature: Optional[float] = Field(None, description="绕组温度 (°C) - 智巡")
    ambient_temp: Optional[float] = Field(None, description="环境温度 (°C)")
    hotspot_temp: Optional[float] = Field(None, description="热点温度 (°C)")

    # ===== 电气参数（机控） =====
    el_p: Optional[float] = Field(None, description="有功功率 (kW)")
    el_i: Optional[float] = Field(None, description="电流 (A)")
    el_v: Optional[float] = Field(None, description="电压 (kV)")
    load_percent: Optional[float] = Field(None, description="负载率 (%)")

    # ===== 油位数据（智巡） =====
    oil_level: Optional[float] = Field(None, description="油位")

    # ===== 老化数据 =====
    current_dp: Optional[float] = Field(None, description="当前聚合度 DP值")
    device_age: Optional[float] = Field(None, description="设备使用年限 (年)")
    aging_rate: Optional[float] = Field(None, description="老化速率 (DP/天)")
    remaining_life_years: Optional[float] = Field(None, description="剩余寿命 (年)")

    # ===== 诊断结果 =====
    fault_type: Optional[str] = Field(None, description="故障类型")
    severity: Optional[int] = Field(None, description="严重程度 (0-3)")

    # ===== 设备基本信息 =====
    device_name: Optional[str] = Field(None, description="设备名称")
    device_type: Optional[str] = Field(None, description="设备类型")
    rated_capacity: Optional[float] = Field(None, description="额定容量 (MVA)")
    manufacturer: Optional[str] = Field(None, description="制造商")
    installation_date: Optional[str] = Field(None, description="安装日期")

    # ===== 数据源信息 =====
    source: Optional[str] = Field(None, description="数据来源，如: 0.8 中台")
    photo_path: Optional[str] = Field(None, description="照片路径（智巡）")

    # ===== 原始数据（保留完整宽表数据） =====
    raw_data: Optional[Dict[str, Any]] = Field(None, description="原始宽表数据（JSON）")

    class Config:
        """Pydantic v2 配置"""
        json_schema_extra = {
            "example": {
                "timestamp": "2023-04-03T08:43:00",
                "device_id": "12M00000159733143",
                "equip_no": "12M00000159733143",
                "acquisitiontime": "2023/4/3 8:43:00",
                "h2": 9.92,
                "ch4": 0.45,
                "c2h6": 0.14,
                "c2h4": 0.21,
                "c2h2": 0.0,
                "co": 68.62,
                "co2": 265.97,
                "source": "0.8 中台"
            }
        }


class HistoryResponse(BaseModel):
    """
    历史数据响应

    返回设备的历史快照列表
    """
    device_id: str = Field(..., description="设备ID")
    total_points: int = Field(..., description="数据点总数")
    time_range: Dict[str, Optional[str]] = Field(
        ...,
        description="时间范围，如: {'start': '2023-01-01T00:00:00', 'end': '2023-01-31T23:59:59'}"
    )
    snapshots: List[DeviceHistorySnapshot] = Field(..., description="历史快照列表")
    granularity: Optional[str] = Field(None, description="数据粒度")

    class Config:
        """Pydantic v2 配置"""
        json_schema_extra = {
            "example": {
                "device_id": "12M00000159733143",
                "total_points": 720,
                "time_range": {
                    "start": "2023-04-01T00:00:00",
                    "end": "2023-04-30T23:59:59"
                },
                "snapshots": [],
                "granularity": "hour"
            }
        }
