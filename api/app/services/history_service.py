"""
历史数据服务
提供设备历史数据查询、趋势分析、时间线回放等业务逻辑

【占位符实现】
当前使用 DataLoader 读取 JSON 文件（backend/data/generated/timeseries_*.json）
未来迁移到数据库时，替换数据源即可，接口保持不变
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import statistics
from pathlib import Path

# 导入数据加载器
from backend.data.data_loader import DataLoader

# 导入历史数据模型
from app.schemas.history import (
    DeviceHistorySnapshot,
    HistoryResponse,
    TrendResponse,
    TrendDataPoint,
    StatisticsSummary,
)

# 导入设备数据模型
from app.schemas.device import (
    Device,
    DGAData,
    ThermalData,
    AgingData,
    OperatingCondition,
)


class HistoryService:
    """
    历史数据服务类

    提供6个核心方法：
    1. get_device_history() - 获取设备历史数据
    2. get_batch_history() - 批量获取多设备历史数据
    3. get_trend_data() - 获取设备指标趋势数据
    4. get_playback_data() - 获取时间线回放数据
    5. filter_devices_by_time() - 按时间和条件筛选设备
    6. get_statistics() - 获取指定时间段的统计摘要
    """

    def __init__(self):
        """初始化历史数据服务"""
        # 【占位符】当前使用 DataLoader 读取 JSON 文件
        # TODO: 未来替换为数据库连接
        # self.db = Database()
        self.data_loader = DataLoader()

    # ========== 辅助方法（私有） ==========

    def _parse_timestamp(self, timestamp_str: str) -> datetime:
        """
        解析不同格式的时间戳

        支持三类数据源的时间格式：
        - 油色谱: "2023/4/3 8:43:00"
        - 机控: "2024/5/25 0:50:00"
        - 智巡: "2025/10/20 12:00:54 local"
        - ISO 8601: "2023-04-03T08:43:00"

        Args:
            timestamp_str: 时间戳字符串

        Returns:
            datetime 对象
        """
        # 移除 "local" 后缀（智巡数据）
        timestamp_str = timestamp_str.replace(" local", "").strip()

        # 尝试多种格式解析
        formats = [
            "%Y/%m/%d %H:%M:%S",      # 2023/4/3 8:43:00
            "%Y-%m-%d %H:%M:%S",      # 2023-04-03 08:43:00
            "%Y-%m-%dT%H:%M:%S",      # 2023-04-03T08:43:00 (ISO 8601)
            "%Y-%m-%dT%H:%M:%S.%f",   # 2023-04-03T08:43:00.123456
        ]

        for fmt in formats:
            try:
                return datetime.strptime(timestamp_str, fmt)
            except ValueError:
                continue

        # 如果都失败，尝试 ISO 8601 解析
        try:
            return datetime.fromisoformat(timestamp_str)
        except ValueError:
            raise ValueError(f"无法解析时间戳格式: {timestamp_str}")

    def _extract_metric_value(self, snapshot: DeviceHistorySnapshot, metric_path: str) -> Optional[float]:
        """
        从快照中提取指标值（支持嵌套路径）

        支持的指标路径示例：
        - "dga.H2" -> snapshot.h2
        - "thermal.oil_temp" -> snapshot.oil_temp
        - "aging.current_dp" -> snapshot.current_dp
        - "el_p" -> snapshot.el_p

        Args:
            snapshot: 设备历史快照
            metric_path: 指标路径，如 "dga.H2"

        Returns:
            指标值，如果不存在则返回 None
        """
        # 分割路径
        parts = metric_path.split(".")

        # 映射表：前缀到实际字段名
        field_mapping = {
            # DGA 指标
            "dga.H2": "h2",
            "dga.CH4": "ch4",
            "dga.C2H6": "c2h6",
            "dga.C2H4": "c2h4",
            "dga.C2H2": "c2h2",
            "dga.CO": "co",
            "dga.CO2": "co2",
            "dga.totalhydrocarbon": "totalhydrocarbon",

            # 温度指标
            "thermal.oil_temp": "oil_temp",
            "thermal.oil_temp1": "oil_temp1",
            "thermal.oil_temp2": "oil_temp2",
            "thermal.hotspot_temp": "hotspot_temp",
            "thermal.ambient_temp": "ambient_temp",
            "thermal.temp": "temp",
            "thermal.temperature": "temperature",
            "thermal.oil_temperature": "oil_temperature",
            "thermal.winding_temperature": "winding_temperature",

            # 老化指标
            "aging.current_dp": "current_dp",
            "aging.device_age": "device_age",
            "aging.aging_rate": "aging_rate",
            "aging.remaining_life_years": "remaining_life_years",

            # 电气指标
            "operating.load_percent": "load_percent",
            "operating.el_p": "el_p",
            "operating.el_i": "el_i",
            "operating.el_v": "el_v",
        }

        # 先尝试完整路径匹配
        field_name = field_mapping.get(metric_path)
        if field_name:
            value = getattr(snapshot, field_name, None)
            # 只返回数值类型，过滤掉字符串等非数值类型
            if isinstance(value, (int, float)):
                return value
            return None

        # 如果是单层路径（无点号），直接获取
        if len(parts) == 1:
            value = getattr(snapshot, metric_path, None)
            # 只返回数值类型
            if isinstance(value, (int, float)):
                return value
            return None

        # 尝试获取嵌套属性（未来扩展）
        return None

    def _convert_to_snapshot(self, raw_data: Dict[str, Any]) -> DeviceHistorySnapshot:
        """
        将原始数据转换为 DeviceHistorySnapshot

        支持三类数据源的字段映射：
        - 油色谱数据（equip_no, acquisitiontime, h2, ch4...）
        - 机控数据（equip_no, aris_time, oil_temp1, el_p...）
        - 智巡数据（pms_device_code, inspect_time, temperature...）

        Args:
            raw_data: 原始数据字典

        Returns:
            DeviceHistorySnapshot 对象
        """
        # 提取时间戳（优先级：timestamp > acquisitiontime > aris_time > inspect_time）
        timestamp_str = raw_data.get("timestamp") or \
                       raw_data.get("acquisitiontime") or \
                       raw_data.get("aris_time") or \
                       raw_data.get("inspect_time")

        if timestamp_str:
            timestamp = self._parse_timestamp(str(timestamp_str))
        else:
            timestamp = datetime.now()  # 默认当前时间

        # 提取设备ID（优先级：device_id > equip_no > pms_device_code）
        device_id = raw_data.get("device_id") or \
                   raw_data.get("equip_no") or \
                   raw_data.get("pms_device_code")

        # 移除已提取的字段，避免重复参数
        clean_data = {k: v for k, v in raw_data.items() if k not in ["timestamp", "device_id"]}

        # 构建快照对象（所有字段都是 Optional，直接传入原始数据）
        snapshot = DeviceHistorySnapshot(
            timestamp=timestamp,
            device_id=device_id,
            **clean_data  # 展开其他字段
        )

        return snapshot

    # ========== 核心业务方法（公开） ==========

    async def get_device_history(
        self,
        device_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        granularity: str = "hour",
        limit: int = 1000
    ) -> HistoryResponse:
        """
        获取设备历史数据

        【TODO】未来数据库实现:
        SELECT * FROM device_history
        WHERE device_id = ?
        AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp
        LIMIT ?

        Args:
            device_id: 设备ID
            start_time: 开始时间
            end_time: 结束时间
            granularity: 时间粒度（未实现降采样，预留参数）
            limit: 最大返回数量

        Returns:
            HistoryResponse 对象
        """
        # 【占位符】从 JSON 文件读取时序数据
        try:
            # 尝试加载不同演化类型的时序数据
            evolution_types = ["gradual_discharge", "gradual_overheating", "sudden_fault"]
            raw_data = []

            for evolution_type in evolution_types:
                try:
                    data = self.data_loader.load_timeseries(device_id, evolution_type)
                    raw_data.extend(data)
                except FileNotFoundError:
                    continue

            if not raw_data:
                # 如果没有时序数据，尝试从场景数据生成单点快照
                device_data = self.data_loader.get_device_by_id(device_id, "all_normal")
                if device_data:
                    device_data["timestamp"] = datetime.now().isoformat()
                    raw_data = [device_data]

        except FileNotFoundError:
            raise FileNotFoundError(f"设备 {device_id} 的历史数据不存在")

        # 转换为快照列表
        snapshots = [self._convert_to_snapshot(item) for item in raw_data]

        # 应用时间过滤
        if start_time:
            snapshots = [s for s in snapshots if s.timestamp >= start_time]
        if end_time:
            snapshots = [s for s in snapshots if s.timestamp <= end_time]

        # 按时间排序
        snapshots.sort(key=lambda s: s.timestamp)

        # 限制数量
        snapshots = snapshots[:limit]

        # 构建响应
        return HistoryResponse(
            device_id=device_id,
            total_points=len(snapshots),
            time_range={
                "start": snapshots[0].timestamp.isoformat() if snapshots else None,
                "end": snapshots[-1].timestamp.isoformat() if snapshots else None,
            },
            snapshots=snapshots,
            granularity=granularity
        )

    async def get_batch_history(
        self,
        device_ids: List[str],
        start_time: datetime,
        end_time: datetime,
        granularity: str = "day"
    ) -> Dict[str, HistoryResponse]:
        """
        批量获取多设备历史数据

        【TODO】未来数据库实现:
        SELECT * FROM device_history
        WHERE device_id IN (?, ?, ...)
        AND timestamp BETWEEN ? AND ?

        Args:
            device_ids: 设备ID列表
            start_time: 开始时间
            end_time: 结束时间
            granularity: 时间粒度

        Returns:
            设备ID到历史响应的映射
        """
        result = {}

        for device_id in device_ids:
            try:
                history = await self.get_device_history(
                    device_id=device_id,
                    start_time=start_time,
                    end_time=end_time,
                    granularity=granularity
                )
                result[device_id] = history
            except FileNotFoundError:
                # 设备无历史数据，返回空响应
                result[device_id] = HistoryResponse(
                    device_id=device_id,
                    total_points=0,
                    time_range={"start": None, "end": None},
                    snapshots=[],
                    granularity=granularity
                )

        return result

    async def get_trend_data(
        self,
        device_id: str,
        metrics: List[str],
        start_time: datetime,
        end_time: datetime,
        aggregation: str = "avg"
    ) -> TrendResponse:
        """
        获取设备指标趋势数据

        【TODO】未来数据库实现:
        SELECT
            DATE_TRUNC('hour', timestamp) as time_bucket,
            AVG(dga_h2) as value
        FROM device_history
        WHERE device_id = ? AND timestamp BETWEEN ? AND ?
        GROUP BY time_bucket
        ORDER BY time_bucket

        Args:
            device_id: 设备ID
            metrics: 指标列表，如 ["dga.H2", "thermal.oil_temp"]
            start_time: 开始时间
            end_time: 结束时间
            aggregation: 聚合方式（avg/min/max/sum）

        Returns:
            TrendResponse 对象
        """
        # 获取历史数据
        history = await self.get_device_history(
            device_id=device_id,
            start_time=start_time,
            end_time=end_time
        )

        # 提取趋势数据点
        data_points = []

        for snapshot in history.snapshots:
            for metric in metrics:
                value = self._extract_metric_value(snapshot, metric)
                if value is not None:
                    data_points.append(
                        TrendDataPoint(
                            timestamp=snapshot.timestamp,
                            value=value,
                            metric_name=metric
                        )
                    )

        return TrendResponse(
            device_id=device_id,
            metrics=metrics,
            data_points=data_points,
            aggregation=aggregation
        )

    async def get_playback_data(
        self,
        device_id: str,
        start_time: datetime,
        end_time: datetime,
        interval_seconds: int = 3600
    ) -> List[DeviceHistorySnapshot]:
        """
        获取时间线回放数据（按时间间隔采样）

        【TODO】未来数据库实现:
        使用时间窗口采样查询

        Args:
            device_id: 设备ID
            start_time: 开始时间
            end_time: 结束时间
            interval_seconds: 采样间隔（秒）

        Returns:
            采样后的快照列表
        """
        # 获取完整历史数据
        history = await self.get_device_history(
            device_id=device_id,
            start_time=start_time,
            end_time=end_time
        )

        if not history.snapshots:
            return []

        # 简单采样：按固定步长采样
        total_seconds = (end_time - start_time).total_seconds()
        expected_samples = max(1, int(total_seconds / interval_seconds))

        total_points = len(history.snapshots)
        step = max(1, total_points // expected_samples)

        # 使用步长采样
        sampled = history.snapshots[::step]

        # 确保包含最后一个数据点
        if history.snapshots[-1] not in sampled:
            sampled.append(history.snapshots[-1])

        return sampled

    async def filter_devices_by_time(
        self,
        scenario_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        fault_types: Optional[List[str]] = None,
        min_severity: Optional[int] = None
    ) -> List[Device]:
        """
        按时间和条件筛选设备

        【TODO】未来数据库实现:
        SELECT DISTINCT device_id FROM device_history
        WHERE timestamp BETWEEN ? AND ?
        AND fault_type IN (?, ?)
        AND severity >= ?

        Args:
            scenario_id: 场景ID（如果无时间范围，从场景加载）
            start_time: 开始时间
            end_time: 结束时间
            fault_types: 故障类型列表
            min_severity: 最低严重程度

        Returns:
            筛选后的设备列表
        """
        devices_data = []

        # 如果指定了场景ID，从场景加载
        if scenario_id:
            devices_data = self.data_loader.load_scenario(scenario_id)
        else:
            # 否则从默认场景加载
            devices_data = self.data_loader.load_scenario("all_normal")

        # 应用故障类型筛选
        if fault_types:
            devices_data = [
                d for d in devices_data
                if d.get("fault_type") in fault_types
            ]

        # 应用严重程度筛选
        if min_severity is not None:
            devices_data = [
                d for d in devices_data
                if d.get("severity", 0) >= min_severity
            ]

        # 转换为 Device 对象
        devices = []
        for data in devices_data:
            device = Device(
                device_id=data["device_id"],
                device_name=data["device_name"],
                device_type=data.get("device_type", "Transformer"),
                rated_capacity=data.get("rated_capacity", 100.0),
                severity=data["severity"],
                fault_type=data["fault_type"],
                dga=DGAData(**data["dga"]),
                thermal=ThermalData(**data["thermal"]),
                aging=AgingData(**data["aging"]),
                operating_condition=OperatingCondition(**data["operating_condition"]),
                manufacturer=data.get("manufacturer"),
                installation_date=data.get("installation_date")
            )
            devices.append(device)

        return devices

    async def get_statistics(
        self,
        device_id: str,
        start_time: datetime,
        end_time: datetime,
        metrics: List[str]
    ) -> List[StatisticsSummary]:
        """
        获取指定时间段的统计摘要

        【TODO】未来数据库实现:
        SELECT
            'dga.H2' as metric_name,
            AVG(dga_h2) as avg,
            MIN(dga_h2) as min,
            MAX(dga_h2) as max,
            STDDEV(dga_h2) as std_dev,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY dga_h2) as percentile_95
        FROM device_history
        WHERE device_id = ? AND timestamp BETWEEN ? AND ?

        Args:
            device_id: 设备ID
            start_time: 开始时间
            end_time: 结束时间
            metrics: 指标列表

        Returns:
            统计摘要列表
        """
        # 获取历史数据
        history = await self.get_device_history(
            device_id=device_id,
            start_time=start_time,
            end_time=end_time
        )

        summaries = []

        for metric in metrics:
            # 提取指标值
            values = []
            for snapshot in history.snapshots:
                value = self._extract_metric_value(snapshot, metric)
                if value is not None:
                    values.append(value)

            if not values:
                continue

            # 计算统计值
            avg_val = statistics.mean(values)
            min_val = min(values)
            max_val = max(values)
            std_dev_val = statistics.stdev(values) if len(values) > 1 else 0.0

            # 计算 95 分位数
            sorted_values = sorted(values)
            percentile_95_index = int(len(sorted_values) * 0.95)
            percentile_95_val = sorted_values[min(percentile_95_index, len(sorted_values) - 1)]

            summaries.append(
                StatisticsSummary(
                    metric_name=metric,
                    avg=avg_val,
                    min=min_val,
                    max=max_val,
                    std_dev=std_dev_val,
                    percentile_95=percentile_95_val,
                    sample_count=len(values)
                )
            )

        return summaries


# ========== 服务实例（单例） ==========

# 创建全局服务实例，供路由层导入使用
history_service = HistoryService()
