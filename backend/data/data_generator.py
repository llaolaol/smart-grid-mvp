"""
数据生成器 - 为智能电网MVP生成模拟数据
"""

import yaml
import json
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict
import sys
sys.path.append(str(Path(__file__).parent.parent))
from models.aging_model import AgingModel


@dataclass
class DGAData:
    """DGA数据模型"""
    H2: float
    CH4: float
    C2H6: float
    C2H4: float
    C2H2: float
    CO: float
    CO2: float
    timestamp: str = None
    device_id: str = None


@dataclass
class DeviceSnapshot:
    """设备快照数据"""
    device_id: str
    device_name: str
    timestamp: str
    dga: Dict[str, float]
    thermal: Dict[str, float]
    aging: Dict[str, float]
    operating_condition: Dict[str, float]
    fault_type: str
    severity: int


class DataGenerator:
    """智能电网设备数据生成器"""

    def __init__(self, config_dir: str = None):
        """初始化数据生成器"""
        if config_dir is None:
            config_dir = Path(__file__).parent
        else:
            config_dir = Path(config_dir)

        self.config_dir = config_dir
        self.output_dir = config_dir / "generated"
        self.output_dir.mkdir(exist_ok=True)

        # 加载配置文件
        self.device_templates = self._load_yaml("device_templates.yaml")
        self.fault_profiles = self._load_yaml("fault_profiles.yaml")

        # 设置随机种子（可重现）
        random.seed(42)
        np.random.seed(42)

    def _load_yaml(self, filename: str) -> Dict:
        """加载YAML配置文件"""
        filepath = self.config_dir / filename
        with open(filepath, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)

    def _random_in_range(self, value_range: List[float], noise: float = 0.1) -> float:
        """在范围内生成随机值，带有噪声"""
        min_val, max_val = value_range
        base_value = random.uniform(min_val, max_val)
        noise_factor = 1 + random.uniform(-noise, noise)
        return base_value * noise_factor

    def generate_dga_data(self, fault_type: str = "normal", noise: float = 0.1) -> DGAData:
        """
        生成DGA数据

        Args:
            fault_type: 故障类型 (normal, partial_discharge, etc.)
            noise: 噪声水平 (0-1)

        Returns:
            DGAData对象
        """
        fault_profile = self.fault_profiles["fault_types"][fault_type]
        dga_range = fault_profile["dga_range"]

        return DGAData(
            H2=self._random_in_range(dga_range["H2"], noise),
            CH4=self._random_in_range(dga_range["CH4"], noise),
            C2H6=self._random_in_range(dga_range["C2H6"], noise),
            C2H4=self._random_in_range(dga_range["C2H4"], noise),
            C2H2=self._random_in_range(dga_range["C2H2"], noise),
            CO=self._random_in_range(dga_range["CO"], noise),
            CO2=self._random_in_range(dga_range["CO2"], noise)
        )

    def generate_device_snapshot(
        self,
        device_id: str,
        fault_type: str = "normal",
        operating_condition: str = "normal",
        timestamp: datetime = None
    ) -> DeviceSnapshot:
        """
        生成设备快照数据

        Args:
            device_id: 设备ID
            fault_type: 故障类型
            operating_condition: 运行工况
            timestamp: 时间戳

        Returns:
            DeviceSnapshot对象
        """
        if timestamp is None:
            timestamp = datetime.now()

        # 获取设备信息
        device = next(
            (d for d in self.device_templates["device_instances"] if d["id"] == device_id),
            None
        )
        if device is None:
            raise ValueError(f"Device {device_id} not found")

        # 获取运行工况
        op_cond = self.device_templates["operating_conditions"][operating_condition]

        # 生成DGA数据
        dga = self.generate_dga_data(fault_type)

        # 获取故障信息
        fault_info = self.fault_profiles["fault_types"][fault_type]
        defect_factor = fault_info["defect_factor"]

        # 计算温度（基于负载和环境温度）
        load_percent = op_cond["load_percent"]
        ambient_temp = op_cond["ambient_temp"]
        cooling_factor = op_cond["cooling_factor"]

        # 简化热模型计算
        device_type_config = self.device_templates["device_types"][device["type"]]
        thermal_params = device_type_config["thermal_params"]

        k1, k2 = thermal_params["k1"], thermal_params["k2"]
        n1, n2 = thermal_params["n1"], thermal_params["n2"]

        delta_oil = k1 * (load_percent/100)**n1 / cooling_factor
        oil_temp = ambient_temp + delta_oil
        delta_hotspot = k2 * (load_percent/100)**n2
        hotspot_temp = oil_temp + delta_hotspot

        # 调整温度（故障会导致温度升高）
        temp_adjustment = (1 - defect_factor) * 15
        hotspot_temp += temp_adjustment
        oil_temp += temp_adjustment * 0.6

        # 计算老化
        device_age = 2024 - device["commissioning_year"]
        aging_params = device_type_config["aging_params"]
        initial_dp = aging_params["initial_dp"]

        # 简化老化计算（基于温度和年限）
        aging_rate = 0.15 * (hotspot_temp / 98) ** 2 * (1 + device_age / 20)
        current_dp = max(initial_dp - aging_rate * device_age * 365, aging_params["failure_dp"])

        # 使用AgingModel计算剩余寿命
        aging_model = AgingModel()
        remaining_life_years = aging_model.predict_remaining_life(current_dp, hotspot_temp)

        # 构建快照
        snapshot = DeviceSnapshot(
            device_id=device_id,
            device_name=device["name"],
            timestamp=timestamp.isoformat(),
            dga={
                "H2": round(dga.H2, 1),
                "CH4": round(dga.CH4, 1),
                "C2H6": round(dga.C2H6, 1),
                "C2H4": round(dga.C2H4, 1),
                "C2H2": round(dga.C2H2, 1),
                "CO": round(dga.CO, 1),
                "CO2": round(dga.CO2, 1)
            },
            thermal={
                "load_percent": load_percent,
                "ambient_temp": ambient_temp,
                "oil_temp": round(oil_temp, 1),
                "hotspot_temp": round(hotspot_temp, 1),
                "cooling_factor": cooling_factor
            },
            aging={
                "device_age": device_age,
                "current_dp": round(current_dp, 1),
                "aging_rate": round(aging_rate, 3),
                "remaining_life_years": round(remaining_life_years, 1)
            },
            operating_condition={
                "name": op_cond["name"],
                "load_percent": load_percent,
                "ambient_temp": ambient_temp
            },
            fault_type=fault_type,
            severity=fault_info["severity"]
        )

        return snapshot

    def generate_timeseries(
        self,
        device_id: str,
        evolution_type: str,
        start_date: datetime = None,
        sampling_interval_hours: int = 24
    ) -> List[DeviceSnapshot]:
        """
        生成时序数据（故障演化过程）

        Args:
            device_id: 设备ID
            evolution_type: 演化类型 (gradual_discharge, gradual_overheating, etc.)
            start_date: 开始日期
            sampling_interval_hours: 采样间隔（小时）

        Returns:
            DeviceSnapshot列表
        """
        if start_date is None:
            start_date = datetime.now() - timedelta(days=180)

        evolution = self.fault_profiles["fault_evolution"][evolution_type]
        snapshots = []
        current_date = start_date

        for stage in evolution["stages"]:
            duration_days = stage["duration_days"]
            fault_type = stage["fault_type"]

            # 根据采样间隔计算数据点数量
            num_samples = max(1, duration_days * 24 // sampling_interval_hours)

            for i in range(num_samples):
                # 在阶段内适当变化运行工况
                if i < num_samples // 3:
                    op_cond = "normal"
                elif i < 2 * num_samples // 3:
                    op_cond = random.choice(["normal", "summer_peak", "light_load"])
                else:
                    op_cond = "overload" if "overheating" in evolution_type else "normal"

                snapshot = self.generate_device_snapshot(
                    device_id=device_id,
                    fault_type=fault_type,
                    operating_condition=op_cond,
                    timestamp=current_date
                )
                snapshots.append(snapshot)

                current_date += timedelta(hours=sampling_interval_hours)

        return snapshots

    def generate_multi_device_data(
        self,
        scenario: str = "mixed",
        timestamp: datetime = None
    ) -> List[DeviceSnapshot]:
        """
        生成多设备数据（变电站快照）

        Args:
            scenario: 场景类型 (mixed, all_normal, multiple_faults)
            timestamp: 时间戳

        Returns:
            多设备快照列表
        """
        if timestamp is None:
            timestamp = datetime.now()

        devices = self.device_templates["device_instances"]
        snapshots = []

        if scenario == "all_normal":
            # 所有设备正常
            for device in devices:
                snapshot = self.generate_device_snapshot(
                    device_id=device["id"],
                    fault_type="normal",
                    operating_condition="normal",
                    timestamp=timestamp
                )
                snapshots.append(snapshot)

        elif scenario == "multiple_faults":
            # 多设备故障
            fault_types = ["high_energy_discharge", "high_temp_overheating",
                          "partial_discharge", "low_temp_overheating", "normal"]
            for i, device in enumerate(devices):
                fault_type = fault_types[i % len(fault_types)]
                snapshot = self.generate_device_snapshot(
                    device_id=device["id"],
                    fault_type=fault_type,
                    operating_condition="overload" if i % 2 == 0 else "normal",
                    timestamp=timestamp
                )
                snapshots.append(snapshot)

        else:  # mixed
            # 混合场景：大部分正常，少数故障
            for i, device in enumerate(devices):
                if i == 0:
                    fault_type = "high_energy_discharge"
                    op_cond = "overload"
                elif i == 2:
                    fault_type = "low_temp_overheating"
                    op_cond = "summer_peak"
                else:
                    fault_type = "normal"
                    op_cond = "normal"

                snapshot = self.generate_device_snapshot(
                    device_id=device["id"],
                    fault_type=fault_type,
                    operating_condition=op_cond,
                    timestamp=timestamp
                )
                snapshots.append(snapshot)

        return snapshots

    def export_to_json(self, data: Any, filename: str):
        """导出数据为JSON"""
        filepath = self.output_dir / filename

        if isinstance(data, list):
            data_dict = [asdict(item) if hasattr(item, '__dataclass_fields__') else item
                        for item in data]
        else:
            data_dict = asdict(data) if hasattr(data, '__dataclass_fields__') else data

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data_dict, f, ensure_ascii=False, indent=2)

        print(f"✅ Exported to {filepath}")
        return filepath

    def export_to_csv(self, snapshots: List[DeviceSnapshot], filename: str):
        """导出时序数据为CSV"""
        filepath = self.output_dir / filename

        # 展开数据为平坦结构
        rows = []
        for snapshot in snapshots:
            row = {
                'timestamp': snapshot.timestamp,
                'device_id': snapshot.device_id,
                'device_name': snapshot.device_name,
                'fault_type': snapshot.fault_type,
                'severity': snapshot.severity,
                # DGA
                'H2': snapshot.dga['H2'],
                'CH4': snapshot.dga['CH4'],
                'C2H6': snapshot.dga['C2H6'],
                'C2H4': snapshot.dga['C2H4'],
                'C2H2': snapshot.dga['C2H2'],
                'CO': snapshot.dga['CO'],
                'CO2': snapshot.dga['CO2'],
                # Thermal
                'load_percent': snapshot.thermal['load_percent'],
                'ambient_temp': snapshot.thermal['ambient_temp'],
                'oil_temp': snapshot.thermal['oil_temp'],
                'hotspot_temp': snapshot.thermal['hotspot_temp'],
                # Aging
                'device_age': snapshot.aging['device_age'],
                'current_dp': snapshot.aging['current_dp'],
                'aging_rate': snapshot.aging['aging_rate'],
                'remaining_life_years': snapshot.aging['remaining_life_years']
            }
            rows.append(row)

        df = pd.DataFrame(rows)
        df.to_csv(filepath, index=False, encoding='utf-8')

        print(f"✅ Exported to {filepath}")
        return filepath


# 快速测试函数
def quick_generate_samples():
    """快速生成示例数据"""
    print("=" * 60)
    print("数据生成器测试")
    print("=" * 60)

    generator = DataGenerator()

    # 1. 生成单个设备快照（正常）
    print("\n1. 生成正常设备快照...")
    snapshot_normal = generator.generate_device_snapshot(
        device_id="T001",
        fault_type="normal",
        operating_condition="normal"
    )
    generator.export_to_json(snapshot_normal, "snapshot_normal.json")

    # 2. 生成单个设备快照（高能放电）
    print("\n2. 生成故障设备快照...")
    snapshot_fault = generator.generate_device_snapshot(
        device_id="T001",
        fault_type="high_energy_discharge",
        operating_condition="overload"
    )
    generator.export_to_json(snapshot_fault, "snapshot_fault.json")

    # 3. 生成时序数据（放电演化）
    print("\n3. 生成时序演化数据...")
    timeseries = generator.generate_timeseries(
        device_id="T001",
        evolution_type="gradual_discharge",
        sampling_interval_hours=24
    )
    print(f"   生成 {len(timeseries)} 个时间点")
    generator.export_to_json(timeseries, "timeseries_discharge.json")
    generator.export_to_csv(timeseries, "timeseries_discharge.csv")

    # 4. 生成多设备数据
    print("\n4. 生成多设备快照...")
    multi_device = generator.generate_multi_device_data(scenario="mixed")
    print(f"   生成 {len(multi_device)} 个设备")
    generator.export_to_json(multi_device, "multi_device_mixed.json")

    # 5. 生成所有故障类型示例
    print("\n5. 生成所有故障类型示例...")
    fault_types = list(generator.fault_profiles["fault_types"].keys())
    fault_samples = []
    for fault_type in fault_types:
        snapshot = generator.generate_device_snapshot(
            device_id="T001",
            fault_type=fault_type,
            operating_condition="normal"
        )
        fault_samples.append(snapshot)
    generator.export_to_json(fault_samples, "all_fault_types.json")
    print(f"   生成 {len(fault_samples)} 种故障类型")

    print("\n" + "=" * 60)
    print("✅ 所有数据已生成到 backend/data/generated/")
    print("=" * 60)


if __name__ == "__main__":
    quick_generate_samples()
