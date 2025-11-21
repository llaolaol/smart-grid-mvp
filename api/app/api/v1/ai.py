"""
AI API Endpoints
AI相关API接口
"""

from fastapi import APIRouter, HTTPException
from app.schemas.ai import (
    AIAnalysisRequest,
    AIAnalysisResponse,
    MaintenanceRequest,
    MaintenanceResponse
)
from app.services.ai_service import ai_service

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AIAnalysisResponse,
    summary="AI设备分析",
    description="使用AI分析设备状态或回答用户问题"
)
async def analyze_device(request: AIAnalysisRequest):
    """
    AI设备分析接口

    Args:
        request: 包含设备数据、诊断结果和用户问题的请求

    Returns:
        AIAnalysisResponse: AI分析结果
    """
    try:
        analysis = ai_service.analyze_device(request)

        return AIAnalysisResponse(
            success=True,
            analysis=analysis,
            message="分析完成"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI分析失败: {str(e)}")


@router.post(
    "/maintenance",
    response_model=MaintenanceResponse,
    summary="获取维护建议",
    description="基于设备数据和推演结果获取AI维护建议"
)
async def get_maintenance_recommendation(request: MaintenanceRequest):
    """
    获取维护建议接口

    Args:
        request: 包含设备数据和推演结果的请求

    Returns:
        MaintenanceResponse: AI维护建议
    """
    try:
        recommendation = ai_service.get_maintenance_recommendation(request)

        return MaintenanceResponse(
            success=True,
            recommendation=recommendation,
            message="建议生成完成"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取维护建议失败: {str(e)}")


@router.get(
    "/health",
    summary="AI服务健康检查"
)
async def ai_health():
    """AI服务健康检查"""
    is_available = ai_service.is_available()

    return {
        "status": "healthy" if is_available else "unavailable",
        "service": "ai",
        "model": "DeepSeek LLM" if is_available else "Not initialized"
    }
