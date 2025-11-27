"""
历史数据路由
提供设备历史数据查询、趋势分析、时间线回放等API端点
"""

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

    Args:
        device_id: 设备ID
        start_time: 开始时间（ISO 8601格式）
        end_time: 结束时间（ISO 8601格式）
        granularity: 时间粒度
        limit: 最大返回数量

    Returns:
        HistoryResponse: 历史数据响应

    Raises:
        HTTPException: 404 - 设备历史数据不存在
        HTTPException: 500 - 服务器错误
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

    Args:
        device_ids: 设备ID列表（逗号分隔）
        start_time: 开始时间（ISO 8601格式）
        end_time: 结束时间（ISO 8601格式）
        granularity: 时间粒度

    Returns:
        Dict[str, HistoryResponse]: 设备历史数据字典
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

    Args:
        device_id: 设备ID
        metrics: 指标列表（逗号分隔）
        start_time: 开始时间（ISO 8601格式）
        end_time: 结束时间（ISO 8601格式）
        aggregation: 聚合方式

    Returns:
        TrendResponse: 趋势数据响应
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

    Args:
        device_id: 设备ID
        start_time: 开始时间（ISO 8601格式）
        end_time: 结束时间（ISO 8601格式）
        interval_seconds: 采样间隔（秒）

    Returns:
        List[DeviceHistorySnapshot]: 历史快照列表
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

    Args:
        scenario_id: 场景ID
        start_time: 开始时间（ISO 8601格式）
        end_time: 结束时间（ISO 8601格式）
        fault_types: 故障类型列表（逗号分隔）
        min_severity: 最低严重程度

    Returns:
        List[Device]: 筛选后的设备列表
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

    Args:
        device_id: 设备ID
        start_time: 开始时间（ISO 8601格式）
        end_time: 结束时间（ISO 8601格式）
        metrics: 指标列表（逗号分隔）

    Returns:
        List[StatisticsSummary]: 统计摘要列表
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
