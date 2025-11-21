"""
Diagnosis-related Pydantic schemas
诊断相关数据模型
"""

from pydantic import BaseModel, Field
from typing import Dict, List
from app.schemas.device import DGAData


class DiagnosisRequest(BaseModel):
    """诊断请求"""
    dga_data: DGAData = Field(..., description="DGA数据")


class DiagnosisResult(BaseModel):
    """诊断结果"""
    fault_type: str = Field(..., description="故障类型")
    severity: int = Field(..., description="严重程度 (0-3)")
    confidence: float = Field(..., description="置信度 (0-1)")
    ratios: Dict[str, float] = Field(..., description="特征比值")
    recommendations: List[str] = Field(..., description="建议措施")


class DiagnosisResponse(BaseModel):
    """诊断响应"""
    success: bool = Field(..., description="是否成功")
    result: DiagnosisResult = Field(..., description="诊断结果")
    message: str = Field(default="诊断完成", description="响应消息")
