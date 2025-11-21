"""
Simulation API Endpoints
推演相关API接口
"""

from fastapi import APIRouter, HTTPException
from app.schemas.simulation import SimulationRequest, SimulationResponse
from app.services.simulation_service import simulation_service

router = APIRouter()


@router.post(
    "/compare",
    response_model=SimulationResponse,
    summary="A/B场景对比推演",
    description="比较两个运行场景的设备状态和寿命预测"
)
async def compare_scenarios(request: SimulationRequest):
    """
    A/B场景对比推演

    Args:
        request: 包含场景A、场景B和初始状态的推演请求

    Returns:
        SimulationResponse: 两个场景的推演结果和改善指标

    Example:
        ```json
        {
            "scenario_a": {
                "name": "当前工况",
                "load_percent": 85,
                "ambient_temp": 35
            },
            "scenario_b": {
                "name": "降载工况",
                "load_percent": 60,
                "ambient_temp": 35
            },
            "initial_state": {
                "dga": {"H2": 150, "CH4": 25, ...},
                "dp": 600,
                "operation_years": 10
            }
        }
        ```
    """
    try:
        result = simulation_service.compare(request)

        return SimulationResponse(
            success=True,
            scenario_a=result["scenario_a"],
            scenario_b=result["scenario_b"],
            improvements=result["improvements"],
            message="推演完成"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"推演失败: {str(e)}")


@router.get(
    "/health",
    summary="推演服务健康检查"
)
async def simulation_health():
    """推演服务健康检查"""
    return {
        "status": "healthy",
        "service": "simulation",
        "model": "Thermal-Electrical-Chemical Simulator"
    }
