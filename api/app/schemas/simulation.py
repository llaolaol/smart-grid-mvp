"""
Simulation-related Pydantic schemas
推演相关数据模型
"""

from pydantic import BaseModel, Field
from typing import Dict, List
from app.schemas.device import DGAData


class ScenarioConfig(BaseModel):
    """推演场景配置"""
    name: str = Field(..., description="场景名称")
    load_percent: float = Field(..., description="负载率 (%)", ge=20, le=130)
    ambient_temp: float = Field(..., description="环境温度 (°C)", ge=-10, le=45)


class InitialState(BaseModel):
    """初始状态"""
    dga: Dict[str, float] = Field(..., description="DGA数据")
    dp: float = Field(..., description="DP值")
    operation_years: float = Field(..., description="运行年限")


class SimulationRequest(BaseModel):
    """推演请求"""
    scenario_a: ScenarioConfig = Field(..., description="场景A (当前工况)")
    scenario_b: ScenarioConfig = Field(..., description="场景B (推演工况)")
    initial_state: InitialState = Field(..., description="初始状态")


class ThermalResult(BaseModel):
    """热分析结果"""
    hotspot_temp: float = Field(..., description="热点温度 (°C)")
    oil_top_temp: float = Field(..., description="油顶温度 (°C)")


class DGAProjection(BaseModel):
    """DGA预测"""
    production_rates: Dict[str, float] = Field(..., description="产气速率")
    projected_concentrations: Dict[str, float] = Field(..., description="预测浓度")


class AgingResult(BaseModel):
    """老化分析结果"""
    aging_rate: float = Field(..., description="老化速率 (DP/天)")


class TimelinePoint(BaseModel):
    """时间线数据点"""
    day: int
    dp: float
    hotspot_temp: float
    c2h2: float


class ScenarioResult(BaseModel):
    """单场景推演结果"""
    scenario: ScenarioConfig
    thermal: ThermalResult
    dga_projection: DGAProjection
    aging: AgingResult
    tte_days: float = Field(..., description="预计失效时间 (天)")
    timeline: List[TimelinePoint] = Field(..., description="时间线数据")


class Improvements(BaseModel):
    """改善指标"""
    temperature_reduction: float = Field(..., description="温度降低 (°C)")
    gas_rate_reduction_pct: float = Field(..., description="产气速率降低 (%)")
    life_extension_days: float = Field(..., description="寿命延长 (天)")


class SimulationResponse(BaseModel):
    """推演响应"""
    success: bool = Field(..., description="是否成功")
    scenario_a: ScenarioResult = Field(..., description="场景A结果")
    scenario_b: ScenarioResult = Field(..., description="场景B结果")
    improvements: Improvements = Field(..., description="改善指标")
    message: str = Field(default="推演完成", description="响应消息")
