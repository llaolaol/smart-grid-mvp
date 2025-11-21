"""
生成完整数据集 - 包含所有场景和演化类型
"""

from data_generator import DataGenerator
from datetime import datetime, timedelta


def generate_comprehensive_dataset():
    """生成综合数据集"""
    print("=" * 70)
    print("生成完整数据集")
    print("=" * 70)

    generator = DataGenerator()

    # 1. 生成所有演化类型的时序数据
    print("\n📊 第1部分: 时序演化数据")
    print("-" * 70)

    evolution_types = ["gradual_discharge", "gradual_overheating", "sudden_fault"]
    devices = ["T001", "T002", "D001"]

    for evolution_type in evolution_types:
        for device_id in devices[:2]:  # 只用前两个设备
            print(f"  生成 {device_id} - {evolution_type}...")
            timeseries = generator.generate_timeseries(
                device_id=device_id,
                evolution_type=evolution_type,
                sampling_interval_hours=24
            )
            filename_base = f"timeseries_{device_id}_{evolution_type}"
            generator.export_to_json(timeseries, f"{filename_base}.json")
            generator.export_to_csv(timeseries, f"{filename_base}.csv")

    # 2. 生成所有运行工况下的设备快照
    print("\n📊 第2部分: 运行工况数据")
    print("-" * 70)

    operating_conditions = list(generator.device_templates["operating_conditions"].keys())

    for op_cond in operating_conditions:
        print(f"  生成工况: {op_cond}...")
        snapshots = []
        for device in generator.device_templates["device_instances"]:
            snapshot = generator.generate_device_snapshot(
                device_id=device["id"],
                fault_type="normal",
                operating_condition=op_cond
            )
            snapshots.append(snapshot)

        generator.export_to_json(snapshots, f"operating_{op_cond}.json")

    # 3. 生成多设备场景
    print("\n📊 第3部分: 多设备场景")
    print("-" * 70)

    scenarios = ["all_normal", "mixed", "multiple_faults"]
    for scenario in scenarios:
        print(f"  生成场景: {scenario}...")
        multi_device = generator.generate_multi_device_data(scenario=scenario)
        generator.export_to_json(multi_device, f"scenario_{scenario}.json")

    # 4. 生成每种故障类型在不同负载下的数据
    print("\n📊 第4部分: 故障类型 × 负载组合")
    print("-" * 70)

    fault_types = list(generator.fault_profiles["fault_types"].keys())
    load_conditions = ["light_load", "normal", "overload"]

    for fault_type in fault_types:
        print(f"  生成故障类型: {fault_type}...")
        snapshots = []
        for load_cond in load_conditions:
            snapshot = generator.generate_device_snapshot(
                device_id="T001",
                fault_type=fault_type,
                operating_condition=load_cond
            )
            snapshots.append(snapshot)

        generator.export_to_json(snapshots, f"fault_{fault_type}_by_load.json")

    # 5. 生成长期历史数据（365天）
    print("\n📊 第5部分: 长期历史数据")
    print("-" * 70)

    print("  生成 T001 全年数据（正常运行）...")
    start_date = datetime.now() - timedelta(days=365)
    long_term_data = []

    for day in range(365):
        current_date = start_date + timedelta(days=day)

        # 模拟季节性负载变化
        if 150 <= day <= 240:  # 夏季
            op_cond = "summer_peak"
        elif day <= 60 or day >= 330:  # 冬季
            op_cond = "winter_peak"
        else:
            op_cond = "normal"

        snapshot = generator.generate_device_snapshot(
            device_id="T001",
            fault_type="normal",
            operating_condition=op_cond,
            timestamp=current_date
        )
        long_term_data.append(snapshot)

    generator.export_to_json(long_term_data, "history_T001_365days.json")
    generator.export_to_csv(long_term_data, "history_T001_365days.csv")

    # 6. 生成数据集汇总信息
    print("\n📊 第6部分: 数据集汇总")
    print("-" * 70)

    summary = {
        "generation_date": datetime.now().isoformat(),
        "total_devices": len(generator.device_templates["device_instances"]),
        "device_types": list(generator.device_templates["device_types"].keys()),
        "fault_types": fault_types,
        "evolution_types": evolution_types,
        "operating_conditions": operating_conditions,
        "datasets": {
            "timeseries_evolution": f"{len(evolution_types)} * {len(devices[:2])} = {len(evolution_types) * len(devices[:2])} files",
            "operating_conditions": f"{len(operating_conditions)} files",
            "multi_device_scenarios": f"{len(scenarios)} files",
            "fault_load_combinations": f"{len(fault_types)} files",
            "long_term_history": "1 file (365 days)"
        },
        "total_files": (
            len(evolution_types) * len(devices[:2]) * 2 +  # timeseries (json + csv)
            len(operating_conditions) +
            len(scenarios) +
            len(fault_types) +
            2  # long-term (json + csv)
        )
    }

    generator.export_to_json(summary, "dataset_summary.json")

    print("\n" + "=" * 70)
    print(f"✅ 数据集生成完成！")
    print(f"   总文件数: {summary['total_files']}")
    print(f"   输出目录: backend/data/generated/")
    print("=" * 70)

    return summary


if __name__ == "__main__":
    summary = generate_comprehensive_dataset()
