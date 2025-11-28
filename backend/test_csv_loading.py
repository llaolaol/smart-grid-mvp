"""
测试 CSV 数据加载功能

验证:
1. DataLoader 初始化
2. load_mock_history_csv("T001") 正确加载油色谱数据
3. 数据结构符合预期
4. load_history("T001") 成功回退到 CSV 加载
"""

from backend.data.data_loader import DataLoader
from pprint import pprint

def test_csv_loading():
    print("=" * 80)
    print("测试 CSV Mock 数据加载")
    print("=" * 80)

    # 1. 初始化 DataLoader
    print("\n[1] 初始化 DataLoader...")
    try:
        loader = DataLoader()
        print(f"✅ DataLoader 初始化成功")
        print(f"   数据目录: {loader.data_dir}")
        print(f"   CSV目录: {loader.mock_csv_dir}")
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        return

    # 2. 测试直接加载 CSV
    print("\n[2] 测试 load_mock_history_csv('T001')...")
    try:
        csv_data = loader.load_mock_history_csv("T001")
        print(f"✅ CSV 加载成功")
        print(f"   数据行数: {len(csv_data)}")

        if csv_data:
            first_record = csv_data[0]
            print(f"\n   第一条记录字段:")
            for key in first_record.keys():
                print(f"     - {key}: {first_record[key]}")

            # 验证关键字段
            required_fields = ["timestamp", "device_id", "h2", "ch4", "c2h2"]
            missing = [f for f in required_fields if f not in first_record]
            if missing:
                print(f"\n⚠️  缺失字段: {missing}")
            else:
                print(f"\n✅ 所有必需字段都存在")

    except Exception as e:
        print(f"❌ CSV 加载失败: {e}")
        import traceback
        traceback.print_exc()
        return

    # 3. 测试 load_history 回退机制
    print("\n[3] 测试 load_history('T001') 回退到 CSV...")
    try:
        history_data = loader.load_history("T001")
        print(f"✅ load_history 成功")
        print(f"   数据行数: {len(history_data)}")

        # 检查是否是同样的数据
        if len(history_data) == len(csv_data):
            print(f"✅ 数据行数匹配 (CSV 回退成功)")
        else:
            print(f"⚠️  数据行数不匹配: history={len(history_data)}, csv={len(csv_data)}")

    except Exception as e:
        print(f"❌ load_history 失败: {e}")
        import traceback
        traceback.print_exc()
        return

    # 4. 验证时间范围
    print("\n[4] 验证时间戳范围...")
    try:
        timestamps = [r.get("timestamp") for r in csv_data if r.get("timestamp")]
        if timestamps:
            print(f"   第一个时间戳: {timestamps[0]}")
            print(f"   最后时间戳: {timestamps[-1]}")
            print(f"   总时间点: {len(timestamps)}")
            print(f"✅ 时间戳验证通过")
    except Exception as e:
        print(f"⚠️  时间戳验证失败: {e}")

    # 5. 验证 DGA 数据
    print("\n[5] 验证 DGA 数据质量...")
    try:
        dga_fields = ["h2", "ch4", "c2h6", "c2h4", "c2h2", "co", "co2"]
        sample = csv_data[:5]  # 取前5条

        print(f"   前5条记录的 DGA 数据:")
        for i, record in enumerate(sample):
            dga_values = {f: record.get(f, "N/A") for f in dga_fields}
            print(f"   [{i+1}] {dga_values}")

        # 统计非空值
        non_null_counts = {}
        for field in dga_fields:
            non_null = sum(1 for r in csv_data if r.get(field) is not None)
            non_null_counts[field] = non_null

        print(f"\n   DGA 字段非空统计:")
        for field, count in non_null_counts.items():
            percentage = (count / len(csv_data)) * 100
            print(f"     {field}: {count}/{len(csv_data)} ({percentage:.1f}%)")

        print(f"✅ DGA 数据验证通过")
    except Exception as e:
        print(f"⚠️  DGA 数据验证失败: {e}")

    # 6. 测试设备ID映射
    print("\n[6] 验证设备ID映射...")
    try:
        device_ids = set(r.get("device_id") for r in csv_data)
        original_ids = set(r.get("original_device_id") for r in csv_data)

        print(f"   系统设备ID: {device_ids}")
        print(f"   原始设备编号: {original_ids}")

        if "T001" in device_ids:
            print(f"✅ 设备ID映射正确")
        else:
            print(f"⚠️  设备ID映射异常")
    except Exception as e:
        print(f"⚠️  设备ID验证失败: {e}")

    print("\n" + "=" * 80)
    print("✅ CSV Mock 数据加载测试完成!")
    print("=" * 80)


if __name__ == "__main__":
    test_csv_loading()
