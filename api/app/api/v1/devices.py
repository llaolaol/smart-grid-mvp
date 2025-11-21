"""
Devices API Endpoints
设备相关API接口
"""

from fastapi import APIRouter, HTTPException, Query
from app.schemas.device import Device, DeviceListResponse, ScenarioInfo
from app.services.device_service import device_service
from typing import List

router = APIRouter()


@router.get(
    "/scenarios",
    response_model=List[ScenarioInfo],
    summary="获取所有场景",
    description="获取可用的场景列表"
)
async def list_scenarios():
    """
    获取所有场景列表

    Returns:
        List[ScenarioInfo]: 场景信息列表
    """
    try:
        return device_service.list_scenarios()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取场景列表失败: {str(e)}")


@router.get(
    "/scenarios/{scenario_id}",
    response_model=DeviceListResponse,
    summary="获取场景下的所有设备",
    description="获取指定场景下的所有设备列表"
)
async def get_scenario_devices(scenario_id: str):
    """
    获取场景下的所有设备

    Args:
        scenario_id: 场景ID (all_normal, mixed, multiple_faults)

    Returns:
        DeviceListResponse: 设备列表响应
    """
    try:
        return device_service.get_scenario_devices(scenario_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取设备列表失败: {str(e)}")


@router.get(
    "/scenarios/{scenario_id}/devices/{device_id}",
    response_model=Device,
    summary="获取设备详情",
    description="获取指定设备的详细信息"
)
async def get_device(scenario_id: str, device_id: str):
    """
    获取设备详情

    Args:
        scenario_id: 场景ID
        device_id: 设备ID

    Returns:
        Device: 设备详情
    """
    try:
        device = device_service.get_device(scenario_id, device_id)

        if not device:
            raise HTTPException(
                status_code=404,
                detail=f"设备 {device_id} 在场景 {scenario_id} 中不存在"
            )

        return device
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取设备详情失败: {str(e)}")


@router.get(
    "/health",
    summary="设备服务健康检查"
)
async def devices_health():
    """设备服务健康检查"""
    return {
        "status": "healthy",
        "service": "devices",
        "data_source": "scenario files"
    }
