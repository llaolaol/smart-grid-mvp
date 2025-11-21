"""
数据加载器 - 为Demo应用提供便捷的数据访问接口
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
import pandas as pd


class DataLoader:
    """数据加载器 - 统一接口访问生成的数据集"""

    def __init__(self, data_dir: Optional[str] = None):
        """
        初始化数据加载器

        Args:
            data_dir: 数据目录路径，默认为 backend/data/generated/
        """
        if data_dir is None:
            current_dir = Path(__file__).parent
            self.data_dir = current_dir / "generated"
        else:
            self.data_dir = Path(data_dir)

        if not self.data_dir.exists():
            raise FileNotFoundError(f"数据目录不存在: {self.data_dir}")

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
