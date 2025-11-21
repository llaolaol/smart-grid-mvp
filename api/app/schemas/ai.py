"""
AI-related Pydantic schemas
AI相关数据模型
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class AIAnalysisRequest(BaseModel):
    """AI分析请求"""
    device_data: Dict[str, Any] = Field(..., description="设备数据")
    diagnosis_result: Optional[Dict[str, Any]] = Field(None, description="诊断结果")
    user_question: Optional[str] = Field(None, description="用户问题")


class AIAnalysisResponse(BaseModel):
    """AI分析响应"""
    success: bool = Field(..., description="是否成功")
    analysis: str = Field(..., description="AI分析结果")
    message: str = Field(..., description="消息")


class MaintenanceRequest(BaseModel):
    """维护建议请求"""
    device_data: Dict[str, Any] = Field(..., description="设备数据")
    simulation_result: Optional[Dict[str, Any]] = Field(None, description="推演结果")


class MaintenanceResponse(BaseModel):
    """维护建议响应"""
    success: bool = Field(..., description="是否成功")
    recommendation: str = Field(..., description="维护建议")
    message: str = Field(..., description="消息")
