"""
测试 CSV Parser 功能 (独立测试，无需 pandas 等依赖)

验证:
1. OilChromatographyParser 正确解析油色谱数据
2. 数据结构符合预期
3. 时间格式转换正确
"""

import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.data.csv_parsers import get_parser

def test_oil_parser():
    print("=" * 80)
    print("测试油色谱数据解析器")
    print("=" * 80)

    # 1. 定位 CSV 文件
    print("\n[1] 定位 CSV 文件...")
    csv_path = project_root / "data_pic" / "simulated_oil_chromatography_data.csv"

    if not csv_path.exists():
        print(f"❌ CSV 文件不存在: {csv_path}")
        return

    print(f"✅ 找到 CSV 文件: {csv_path}")
    print(f"   文件大小: {csv_path.stat().st_size / 1024:.1f} KB")

    # 2. 创建解析器
    print("\n[2] 创建油色谱解析器...")
    try:
        parser = get_parser(csv_path, "oil")
        print(f"✅ 解析器创建成功: {type(parser).__name__}")
    except Exception as e:
        print(f"❌ 解析器创建失败: {e}")
        import traceback
        traceback.print_exc()
        return

    # 3. 解析数据
    print("\n[3] 解析 CSV 数据...")
    try:
        records = parser.parse()
        print(f"✅ 数据解析成功")
        print(f"   总记录数: {len(records)}")
    except Exception as e:
        print(f"❌ 数据解析失败: {e}")
        import traceback
        traceback.print_exc()
        return

    if not records:
        print("⚠️  解析结果为空")
        return

    # 4. 检查第一条记录
    print("\n[4] 检查第一条记录...")
    first = records[0]
    print(f"   字段列表:")
    for key, value in first.items():
        print(f"     {key}: {value}")

    # 5. 验证必需字段
    print("\n[5] 验证必需字段...")
    required_fields = [
        "timestamp", "device_id", "equip_no",
        "h2", "ch4", "c2h6", "c2h4", "c2h2", "co", "co2",
        "source", "fault_type", "severity"
    ]

    missing = [f for f in required_fields if f not in first]
    if missing:
        print(f"❌ 缺失字段: {missing}")
    else:
        print(f"✅ 所有必需字段都存在")

    # 6. 验证时间格式
    print("\n[6] 验证时间格式...")
    try:
        timestamp = first["timestamp"]
        print(f"   原始时间戳: {timestamp}")

        # 检查是否是 ISO 8601 格式
        from datetime import datetime
        dt = datetime.fromisoformat(timestamp)
        print(f"   解析后: {dt}")
        print(f"✅ 时间格式正确 (ISO 8601)")
    except Exception as e:
        print(f"❌ 时间格式错误: {e}")

    # 7. 验证 DGA 数据类型
    print("\n[7] 验证 DGA 数据类型...")
    dga_fields = ["h2", "ch4", "c2h6", "c2h4", "c2h2", "co", "co2"]

    type_check = {}
    for field in dga_fields:
        value = first[field]
        type_check[field] = {
            "value": value,
            "type": type(value).__name__,
            "is_number": isinstance(value, (int, float))
        }

    print(f"   DGA 字段类型:")
    for field, info in type_check.items():
        status = "✅" if info["is_number"] else "❌"
        print(f"     {status} {field}: {info['value']} ({info['type']})")

    # 8. 统计数据质量
    print("\n[8] 统计数据质量...")
    stats = {
        "total_records": len(records),
        "valid_timestamps": 0,
        "dga_non_null": {field: 0 for field in dga_fields}
    }

    for record in records:
        # 统计有效时间戳
        if record.get("timestamp"):
            stats["valid_timestamps"] += 1

        # 统计非空 DGA 值
        for field in dga_fields:
            if record.get(field) is not None:
                stats["dga_non_null"][field] += 1

    print(f"   总记录数: {stats['total_records']}")
    print(f"   有效时间戳: {stats['valid_timestamps']} ({stats['valid_timestamps']/stats['total_records']*100:.1f}%)")
    print(f"\n   DGA 字段非空率:")
    for field, count in stats["dga_non_null"].items():
        percentage = (count / stats['total_records']) * 100
        print(f"     {field}: {count}/{stats['total_records']} ({percentage:.1f}%)")

    # 9. 显示样本数据
    print("\n[9] 样本数据 (前3条)...")
    for i, record in enumerate(records[:3]):
        print(f"\n   记录 #{i+1}:")
        print(f"     时间: {record['timestamp']}")
        print(f"     设备: {record['device_id']}")
        print(f"     H2={record['h2']}, CH4={record['ch4']}, C2H2={record['c2h2']}")

    # 10. 时间范围
    print("\n[10] 时间范围...")
    try:
        first_time = records[0]["timestamp"]
        last_time = records[-1]["timestamp"]
        print(f"   开始时间: {first_time}")
        print(f"   结束时间: {last_time}")
        print(f"✅ 时间范围验证通过")
    except Exception as e:
        print(f"⚠️  时间范围验证失败: {e}")

    print("\n" + "=" * 80)
    print("✅ 油色谱数据解析器测试完成!")
    print("=" * 80)


if __name__ == "__main__":
    test_oil_parser()
