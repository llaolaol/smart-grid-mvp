"""
数据加载器 - 为Demo应用提供便捷的数据访问接口
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import pandas as pd
from backend.data.csv_parsers import get_parser


# 设备到CSV文件的映射配置
DEVICE_CSV_MAPPING = {
    "T001": {
        "csv_file": "simulated_oil_chromatography_data.csv",
        "parser_type": "oil",
        "device_name": "1号主变",
        "device_id": "12M00000159733143",  # CSV中的设备编号
    },
    # 专门用于 CSV Mock 数据测试的设备 ID
    "T001_OIL_CSV": {
        "csv_file": "simulated_oil_chromatography_data.csv",
        "parser_type": "oil",
        "device_name": "1号主变（油色谱CSV数据）",
        "device_id": "12M00000159733143",
    },
    # TODO: 后续添加 T002 (机控数据), T003 (智巡数据)
}


class DataLoader:
    """数据加载器 - 统一接口访问生成的数据集"""

    def __init__(self, data_dir: Optional[str] = None, mock_csv_dir: Optional[str] = None):
        """
        初始化数据加载器

        Args:
            data_dir: 数据目录路径，默认为 backend/data/generated/
            mock_csv_dir: Mock CSV数据目录，默认为项目根目录的 data_pic/
        """
        if data_dir is None:
            current_dir = Path(__file__).parent
            self.data_dir = current_dir / "generated"
        else:
            self.data_dir = Path(data_dir)

        if not self.data_dir.exists():
            raise FileNotFoundError(f"数据目录不存在: {self.data_dir}")

        # 配置 Mock CSV 数据目录
        if mock_csv_dir is None:
            # 默认指向项目根目录的 data_pic/
            project_root = Path(__file__).parent.parent.parent
            self.mock_csv_dir = project_root / "data_pic"
        else:
            self.mock_csv_dir = Path(mock_csv_dir)

    def load_device_snapshot(self, device_id: str, fault_type: str = "normal",
                            operating_condition: str = "normal") -> Dict:
        """
        加载单个设备快照

        Args:
            device_id: 设备ID (如 "T001", "D001")
            fault_type: 故障类型
            operating_condition: 运行工况

        Returns:
            设备快照数据
        """
        # 从故障-负载组合文件中加载
        fault_file = self.data_dir / f"fault_{fault_type}_by_load.json"

        if not fault_file.exists():
            raise FileNotFoundError(f"故障数据文件不存在: {fault_file}")

        with open(fault_file, 'r', encoding='utf-8') as f:
            snapshots = json.load(f)

        # 返回第一个快照（正常负载）
        return snapshots[0] if snapshots else None

    def load_operating_condition(self, operating_condition: str) -> List[Dict]:
        """
        加载特定运行工况下的所有设备数据

        Args:
            operating_condition: 运行工况 (normal, summer_peak, winter_peak, overload, cooling_fault, light_load)

        Returns:
            设备列表
        """
        op_file = self.data_dir / f"operating_{operating_condition}.json"

        if not op_file.exists():
            raise FileNotFoundError(f"运行工况数据文件不存在: {op_file}")

        with open(op_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def load_scenario(self, scenario: str) -> List[Dict]:
        """
        加载多设备场景

        Args:
            scenario: 场景名称 (all_normal, mixed, multiple_faults)

        Returns:
            设备列表
        """
        scenario_file = self.data_dir / f"scenario_{scenario}.json"

        if not scenario_file.exists():
            raise FileNotFoundError(f"场景数据文件不存在: {scenario_file}")

        with open(scenario_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def load_timeseries(self, device_id: str, evolution_type: str,
                       format: str = "json") -> List[Dict]:
        """
        加载时序演化数据

        Args:
            device_id: 设备ID
            evolution_type: 演化类型 (gradual_discharge, gradual_overheating, sudden_fault)
            format: 数据格式 ("json" 或 "csv")

        Returns:
            时序数据列表
        """
        if format == "json":
            ts_file = self.data_dir / f"timeseries_{device_id}_{evolution_type}.json"

            if not ts_file.exists():
                raise FileNotFoundError(f"时序数据文件不存在: {ts_file}")

            with open(ts_file, 'r', encoding='utf-8') as f:
                return json.load(f)

        elif format == "csv":
            ts_file = self.data_dir / f"timeseries_{device_id}_{evolution_type}.csv"

            if not ts_file.exists():
                raise FileNotFoundError(f"时序数据文件不存在: {ts_file}")

            df = pd.read_csv(ts_file)
            return df.to_dict('records')

        else:
            raise ValueError(f"不支持的格式: {format}，请使用 'json' 或 'csv'")

    def load_history(self, device_id: Optional[str] = None) -> List[Dict]:
        """
        加载历史数据文件

        支持加载指定设备的历史数据，或加载所有历史数据文件。

        数据加载优先级:
        1. 优先从 timeseries JSON 文件加载（generated/ 目录）
        2. 如果JSON不存在，尝试从 CSV Mock 数据加载（data_pic/ 目录）
        3. 如果都不存在，抛出 FileNotFoundError

        Args:
            device_id: 设备ID（可选），如果不指定则加载所有设备

        Returns:
            历史数据列表

        Raises:
            FileNotFoundError: 历史数据文件不存在
        """
        if device_id:
            # 加载特定设备的历史数据（尝试所有演化类型）
            evolution_types = ["gradual_discharge", "gradual_overheating", "sudden_fault"]
            all_data = []

            for evolution_type in evolution_types:
                try:
                    data = self.load_timeseries(device_id, evolution_type)
                    all_data.extend(data)
                except FileNotFoundError:
                    continue

            # 如果没有找到timeseries数据，尝试从CSV加载
            if not all_data:
                try:
                    csv_data = self.load_mock_history_csv(device_id)
                    all_data.extend(csv_data)
                except FileNotFoundError:
                    pass  # CSV也不存在，继续抛出错误

            if not all_data:
                raise FileNotFoundError(
                    f"设备 {device_id} 的历史数据不存在\n"
                    f"未找到 timeseries JSON 文件，也未配置 CSV Mock 数据"
                )

            return all_data
        else:
            # 加载所有设备的历史数据
            all_data = []
            devices = self.list_available_devices()

            for dev_id in devices:
                try:
                    device_history = self.load_history(dev_id)
                    all_data.extend(device_history)
                except FileNotFoundError:
                    continue

            return all_data

    def filter_by_time_range(
        self,
        data: List[Dict],
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict]:
        """
        按时间范围过滤数据列表

        支持多种时间字段名（兼容三类数据源）：
        - timestamp (标准字段)
        - acquisitiontime (油色谱数据)
        - aris_time (机控数据)
        - inspect_time (智巡数据)

        Args:
            data: 数据列表
            start_time: 开始时间（可选）
            end_time: 结束时间（可选）

        Returns:
            过滤后的数据列表
        """
        from datetime import datetime as dt

        if not start_time and not end_time:
            return data  # 无时间范围限制，返回全部数据

        filtered = []

        for item in data:
            # 尝试提取时间戳（优先级：timestamp > acquisitiontime > aris_time > inspect_time）
            timestamp_str = (
                item.get("timestamp") or
                item.get("acquisitiontime") or
                item.get("aris_time") or
                item.get("inspect_time")
            )

            if not timestamp_str:
                continue  # 无时间戳，跳过

            # 解析时间戳
            try:
                # 移除 "local" 后缀
                timestamp_str = str(timestamp_str).replace(" local", "").strip()

                # 尝试多种格式
                timestamp = None
                formats = [
                    "%Y/%m/%d %H:%M:%S",      # 2023/4/3 8:43:00
                    "%Y-%m-%d %H:%M:%S",      # 2023-04-03 08:43:00
                    "%Y-%m-%dT%H:%M:%S",      # 2023-04-03T08:43:00
                ]

                for fmt in formats:
                    try:
                        timestamp = dt.strptime(timestamp_str, fmt)
                        break
                    except ValueError:
                        continue

                # 如果都失败，尝试 ISO 解析
                if not timestamp:
                    try:
                        timestamp = dt.fromisoformat(timestamp_str)
                    except ValueError:
                        continue

            except Exception:
                continue  # 解析失败，跳过

            # 应用时间范围过滤
            if start_time and timestamp < start_time:
                continue
            if end_time and timestamp > end_time:
                continue

            filtered.append(item)

        return filtered

    def load_mock_history_csv(self, device_id: str) -> List[Dict]:
        """
        从CSV Mock数据加载设备历史数据

        支持三类数据源:
        - 油色谱数据 (T001)
        - 机控数据 (T002, 待实现)
        - 智巡数据 (T003, 待实现)

        Args:
            device_id: 设备ID (如 "T001", "T002", "T003")

        Returns:
            历史数据列表 (统一的 DeviceHistorySnapshot 格式)

        Raises:
            FileNotFoundError: 设备没有对应的CSV映射或文件不存在
        """
        # 检查设备是否有CSV映射
        if device_id not in DEVICE_CSV_MAPPING:
            raise FileNotFoundError(
                f"设备 {device_id} 没有配置CSV数据源映射，"
                f"可用设备: {list(DEVICE_CSV_MAPPING.keys())}"
            )

        mapping = DEVICE_CSV_MAPPING[device_id]
        csv_path = self.mock_csv_dir / mapping["csv_file"]

        # 检查CSV文件是否存在
        if not csv_path.exists():
            raise FileNotFoundError(
                f"CSV文件不存在: {csv_path}\n"
                f"请确认 {self.mock_csv_dir} 目录下有 {mapping['csv_file']}"
            )

        # 使用解析器加载CSV数据
        parser = get_parser(csv_path, mapping["parser_type"])
        raw_records = parser.parse()

        # 将CSV中的设备编号映射到系统设备ID
        for record in raw_records:
            # 保留原始设备编号作为 equip_no
            record["original_device_id"] = record.get("device_id") or record.get("equip_no")
            # 统一设置为系统设备ID
            record["device_id"] = device_id
            # 设置设备名称
            if not record.get("device_name"):
                record["device_name"] = mapping["device_name"]

        return raw_records

    def list_available_devices(self) -> List[str]:
        """
        列出所有可用的设备ID

        Returns:
            设备ID列表
        """
        # 从scenario_all_normal中获取所有设备
        all_normal = self.load_scenario("all_normal")
        return [device["device_id"] for device in all_normal]

    def list_available_scenarios(self) -> List[str]:
        """
        列出所有可用的场景

        Returns:
            场景名称列表
        """
        scenarios = []
        for file in self.data_dir.glob("scenario_*.json"):
            scenario_name = file.stem.replace("scenario_", "")
            scenarios.append(scenario_name)
        return scenarios

    def list_available_fault_types(self) -> List[str]:
        """
        列出所有可用的故障类型

        Returns:
            故障类型列表
        """
        fault_types = []
        for file in self.data_dir.glob("fault_*_by_load.json"):
            fault_name = file.stem.replace("fault_", "").replace("_by_load", "")
            fault_types.append(fault_name)
        return fault_types

    def get_device_by_id(self, device_id: str, scenario: str = "all_normal") -> Optional[Dict]:
        """
        根据设备ID获取设备数据

        Args:
            device_id: 设备ID
            scenario: 场景名称

        Returns:
            设备数据，如果未找到则返回None
        """
        devices = self.load_scenario(scenario)
        for device in devices:
            if device["device_id"] == device_id:
                return device
        return None

    def get_summary(self) -> Dict:
        """
        获取数据集概览

        Returns:
            数据集统计信息
        """
        summary_file = self.data_dir / "dataset_summary.json"

        if summary_file.exists():
            with open(summary_file, 'r', encoding='utf-8') as f:
                return json.load(f)

        # 如果没有summary文件，动态生成
        return {
            "devices": self.list_available_devices(),
            "scenarios": self.list_available_scenarios(),
            "fault_types": self.list_available_fault_types(),
            "data_directory": str(self.data_dir)
        }


# 便捷函数
def get_demo_device(device_id: str = "T001", fault_type: str = "high_energy_discharge") -> Dict:
    """
    快速获取Demo演示用的设备数据

    Args:
        device_id: 设备ID，默认 "T001"
        fault_type: 故障类型，默认 "high_energy_discharge"

    Returns:
        设备快照数据
    """
    loader = DataLoader()
    return loader.load_device_snapshot(device_id, fault_type)


def get_demo_scenario(scenario: str = "mixed") -> List[Dict]:
    """
    快速获取Demo演示用的场景数据

    Args:
        scenario: 场景名称，默认 "mixed"

    Returns:
        设备列表
    """
    loader = DataLoader()
    return loader.load_scenario(scenario)


def get_demo_timeseries(device_id: str = "T001",
                       evolution_type: str = "gradual_discharge") -> List[Dict]:
    """
    快速获取Demo演示用的时序数据

    Args:
        device_id: 设备ID，默认 "T001"
        evolution_type: 演化类型，默认 "gradual_discharge"

    Returns:
        时序数据列表
    """
    loader = DataLoader()
    return loader.load_timeseries(device_id, evolution_type)


if __name__ == "__main__":
    # 测试数据加载器
    print("=" * 70)
    print("数据加载器测试")
    print("=" * 70)

    loader = DataLoader()

    # 获取数据集概览
    print("\n数据集概览:")
    summary = loader.get_summary()
    print(f"  可用设备: {summary.get('devices', [])}")
    print(f"  可用场景: {summary.get('scenarios', [])}")
    print(f"  故障类型: {summary.get('fault_types', [])}")

    # 测试加载场景
    print("\n加载混合场景:")
    mixed = loader.load_scenario("mixed")
    for device in mixed:
        severity_icon = "⚠️ " if device["severity"] >= 2 else ("🟡" if device["severity"] == 1 else "✅")
        print(f"  {severity_icon} {device['device_id']}: {device['fault_type']} "
              f"(严重程度: {device['severity']})")

    # 测试加载设备
    print("\n加载T001设备 (高能量放电):")
    device = loader.load_device_snapshot("T001", "high_energy_discharge")
    print(f"  设备: {device['device_id']}")
    print(f"  故障: {device['fault_type']}")
    print(f"  热点温度: {device['thermal']['hotspot_temp']:.1f}°C")
    print(f"  C2H2: {device['dga']['C2H2']:.1f} ppm")

    # 测试加载时序数据
    print("\n加载T001时序数据 (逐渐放电):")
    timeseries = loader.load_timeseries("T001", "gradual_discharge")
    print(f"  数据点数: {len(timeseries)}")
    print(f"  起始时间: {timeseries[0]['timestamp']}")
    print(f"  结束时间: {timeseries[-1]['timestamp']}")
    print(f"  初始DP: {timeseries[0]['aging']['current_dp']:.1f}")
    print(f"  最终DP: {timeseries[-1]['aging']['current_dp']:.1f}")

    print("\n" + "=" * 70)
    print("✅ 数据加载器测试通过！")
    print("=" * 70)
