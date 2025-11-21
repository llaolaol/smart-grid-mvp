"""
Diagnosis API Endpoints
诊断相关API接口
"""

from fastapi import APIRouter, HTTPException
from app.schemas.diagnosis import DiagnosisRequest, DiagnosisResponse
from app.services.diagnosis_service import diagnosis_service

router = APIRouter()


@router.post(
    "/",
    response_model=DiagnosisResponse,
    summary="DGA诊断",
    description="基于DGA数据进行设备故障诊断"
)
async def diagnose_device(request: DiagnosisRequest):
    """
    DGA诊断接口

    Args:
        request: 包含DGA数据的诊断请求

    Returns:
        DiagnosisResponse: 诊断结果（故障类型、严重程度、建议）

    Example:
        ```json
        {
            "dga_data": {
                "H2": 150.0,
                "CH4": 25.0,
                "C2H6": 10.0,
                "C2H4": 50.0,
                "C2H2": 5.0,
                "CO": 300.0,
                "CO2": 2500.0
            }
        }
        ```
    """
    try:
        result = diagnosis_service.diagnose(request)

        return DiagnosisResponse(
            success=True,
            result=result,
            message="诊断完成"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"诊断失败: {str(e)}")


@router.get(
    "/health",
    summary="诊断服务健康检查"
)
async def diagnosis_health():
    """诊断服务健康检查"""
    return {
        "status": "healthy",
        "service": "diagnosis",
        "model": "DGA Diagnoser"
    }
