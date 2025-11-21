"""
Device-related Pydantic schemas
设备相关数据模型
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict


class DGAData(BaseModel):
    """DGA溶解气体分析数据"""
    H2: float = Field(..., description="氢气浓度 (ppm)")
    CH4: float = Field(..., description="甲烷浓度 (ppm)")
    C2H6: float = Field(..., description="乙烷浓度 (ppm)")
    C2H4: float = Field(..., description="乙烯浓度 (ppm)")
    C2H2: float = Field(..., description="乙炔浓度 (ppm)")
    CO: float = Field(..., description="一氧化碳浓度 (ppm)")
    CO2: float = Field(..., description="二氧化碳浓度 (ppm)")


class ThermalData(BaseModel):
    """热参数数据"""
    oil_temp: float = Field(..., description="油温 (°C)")
    hotspot_temp: float = Field(..., description="热点温度 (°C)")
    ambient_temp: float = Field(..., description="环境温度 (°C)")


class AgingData(BaseModel):
    """老化参数数据"""
    current_dp: float = Field(..., description="当前聚合度 DP值")
    device_age: float = Field(..., description="设备使用年限 (年)")
    aging_rate: float = Field(..., description="老化速率 (DP/天)")
    remaining_life_years: float = Field(..., description="剩余寿命 (年)")


class OperatingCondition(BaseModel):
    """运行工况"""
    load_percent: float = Field(..., description="负载率 (%)")
    voltage: float = Field(default=220.0, description="电压 (kV)")
    frequency: float = Field(default=50.0, description="频率 (Hz)")


class DeviceInfo(BaseModel):
    """设备基本信息"""
    device_id: str = Field(..., description="设备ID")
    device_name: str = Field(..., description="设备名称")
    device_type: str = Field(..., description="设备类型")
    rated_capacity: float = Field(..., description="额定容量 (MVA)")
    manufacturer: Optional[str] = Field(None, description="制造商")
    installation_date: Optional[str] = Field(None, description="安装日期")


class Device(BaseModel):
    """完整设备数据"""
    device_id: str
    device_name: str
    device_type: Optional[str] = "Transformer"
    rated_capacity: Optional[float] = 100.0
    severity: int = Field(..., description="严重程度 (0-3)")
    fault_type: str = Field(..., description="故障类型")
    dga: DGAData
    thermal: ThermalData
    aging: AgingData
    operating_condition: OperatingCondition
    manufacturer: Optional[str] = None
    installation_date: Optional[str] = None


class DeviceListResponse(BaseModel):
    """设备列表响应"""
    total: int = Field(..., description="设备总数")
    devices: list[Device] = Field(..., description="设备列表")


class ScenarioInfo(BaseModel):
    """场景信息"""
    scenario_id: str = Field(..., description="场景ID")
    scenario_name: str = Field(..., description="场景名称")
    description: str = Field(..., description="场景描述")
    device_count: int = Field(..., description="设备数量")
