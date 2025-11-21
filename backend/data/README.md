# 数据生成器使用指南

## 📁 目录结构

```
backend/data/
├── device_templates.yaml      # 设备模板配置
├── fault_profiles.yaml        # 故障场景配置
├── data_generator.py          # 数据生成器核心
├── generate_full_dataset.py   # 完整数据集生成脚本
├── generated/                 # 生成的数据输出目录
│   ├── *.json                # JSON格式数据
│   ├── *.csv                 # CSV格式时序数据
│   └── dataset_summary.json  # 数据集汇总
└── README.md                  # 本文档
```

## 🚀 快速开始

### 1. 生成基础示例数据

```bash
cd backend/data
python3 data_generator.py
```

**输出**:
- `snapshot_normal.json` - 正常设备快照
- `snapshot_fault.json` - 故障设备快照
- `timeseries_discharge.json/csv` - 放电演化时序数据
- `multi_device_mixed.json` - 多设备场景
- `all_fault_types.json` - 所有故障类型示例

### 2. 生成完整数据集

```bash
cd backend/data
python3 generate_full_dataset.py
```

**输出**: 38个数据文件，共1.3MB，包括：
- 时序演化数据（6个演化 × 2个CSV/JSON = 12文件）
- 运行工况数据（6个工况）
- 多设备场景（3个场景）
- 故障-负载组合（7种故障）
- 长期历史数据（365天）
- 数据集汇总

## 📊 数据文件说明

### 时序数据 (CSV格式)

适用于时间序列分析、趋势预测

**文件**: `timeseries_*.csv`

**字段**:
- `timestamp` - 时间戳
- `device_id` - 设备ID
- `fault_type` - 故障类型
- `H2, CH4, C2H6, C2H4, C2H2, CO, CO2` - DGA数据
- `load_percent, ambient_temp, oil_temp, hotspot_temp` - 热参数
- `device_age, current_dp, aging_rate` - 老化参数

### 快照数据 (JSON格式)

适用于实时诊断、多设备对比

**文件**: `snapshot_*.json`, `scenario_*.json`

**结构**:
```json
{
  "device_id": "T001",
  "timestamp": "2024-11-13T19:21:00",
  "dga": {
    "H2": 145.2,
    "CH4": 32.1,
    ...
  },
  "thermal": {
    "hotspot_temp": 105.3,
    ...
  },
  "aging": {
    "current_dp": 450.2,
    ...
  },
  "fault_type": "high_energy_discharge",
  "severity": 3
}
```

## 🔧 编程接口

### 基础用法

```python
from data_generator import DataGenerator

generator = DataGenerator()

# 生成单个设备快照
snapshot = generator.generate_device_snapshot(
    device_id="T001",
    fault_type="high_energy_discharge",
    operating_condition="overload"
)

# 生成时序数据
timeseries = generator.generate_timeseries(
    device_id="T001",
    evolution_type="gradual_discharge",
    sampling_interval_hours=24
)

# 生成多设备数据
multi_device = generator.generate_multi_device_data(
    scenario="mixed"
)

# 导出数据
generator.export_to_json(snapshot, "my_snapshot.json")
generator.export_to_csv(timeseries, "my_timeseries.csv")
```

### 可用参数

#### 设备ID
- `T001`, `T002` - 主变压器
- `D001`, `D002`, `D003` - 配电变压器

#### 故障类型 (fault_type)
- `normal` - 正常运行
- `partial_discharge` - 局部放电
- `low_energy_discharge` - 低能量放电
- `high_energy_discharge` - 高能量放电 ⚠️
- `low_temp_overheating` - 低温过热
- `medium_temp_overheating` - 中温过热
- `high_temp_overheating` - 高温过热 ⚠️

#### 运行工况 (operating_condition)
- `normal` - 正常运行
- `summer_peak` - 夏季高峰
- `winter_peak` - 冬季高峰
- `overload` - 过载运行 ⚠️
- `cooling_fault` - 冷却故障 ⚠️
- `light_load` - 轻载运行

#### 演化类型 (evolution_type)
- `gradual_discharge` - 放电逐渐发展
- `gradual_overheating` - 过热逐渐加剧
- `sudden_fault` - 突发故障

#### 多设备场景 (scenario)
- `all_normal` - 所有设备正常
- `mixed` - 混合场景（大部分正常，少数故障）
- `multiple_faults` - 多设备故障

## 📈 数据特性

### 真实性
- DGA数值范围基于IEC 60599标准
- 温度计算基于IEC 60076标准公式
- 老化模型基于IEEE C57.91标准
- 加入10%随机噪声，模拟真实测量

### 多样性
- 7种故障类型
- 6种运行工况
- 3种演化模式
- 5个设备实例
- 支持任意时间跨度

### 可重现性
- 固定随机种子（seed=42）
- 相同参数生成相同数据
- 便于测试和验证

## 🎯 应用场景

### 1. 模型测试
```python
# 测试DGA诊断引擎
from backend.models.dga_diagnoser import DGADiagnoser

diagnoser = DGADiagnoser()
snapshot = generator.generate_device_snapshot("T001", "high_energy_discharge")
result = diagnoser.diagnose(snapshot["dga"])
```

### 2. 系统演示
```python
# 生成演示数据
demo_data = generator.generate_multi_device_data("mixed")
# 用于Streamlit应用展示
```

### 3. 时序分析
```python
# 生成长期数据用于趋势分析
history = generator.generate_timeseries(
    device_id="T001",
    evolution_type="gradual_overheating",
    sampling_interval_hours=1  # 每小时采样
)
```

### 4. 参数标定
```python
# 生成不同工况下的数据用于模型标定
conditions = ["normal", "overload", "summer_peak"]
calibration_data = []
for cond in conditions:
    snapshot = generator.generate_device_snapshot("T001", "normal", cond)
    calibration_data.append(snapshot)
```

## 🛠️ 自定义配置

### 修改设备模板

编辑 `device_templates.yaml`:
```yaml
device_instances:
  - id: "T003"
    name: "3号主变"
    type: "main_transformer"
    capacity: 240
    voltage: "500/220/110kV"
    commissioning_year: 2022
```

### 添加故障类型

编辑 `fault_profiles.yaml`:
```yaml
fault_types:
  custom_fault:
    name: "自定义故障"
    severity: 2
    dga_range:
      H2: [100, 300]
      CH4: [50, 150]
      ...
    defect_factor: 0.85
```

## 📝 数据验证

### 检查数据完整性

```python
import json

# 加载数据
with open("generated/dataset_summary.json") as f:
    summary = json.load(f)

print(f"数据集生成时间: {summary['generation_date']}")
print(f"总文件数: {summary['total_files']}")
print(f"设备数量: {summary['total_devices']}")
```

### 验证DGA范围

```python
import pandas as pd

# 加载时序数据
df = pd.read_csv("generated/timeseries_T001_gradual_discharge.csv")

# 检查DGA范围
print(df[['H2', 'CH4', 'C2H4', 'C2H2']].describe())

# 可视化
import matplotlib.pyplot as plt
df[['H2', 'C2H2']].plot()
plt.show()
```

## ⚠️ 注意事项

1. **数据量控制**: 生成长期数据（365天×小时采样）会产生大文件
2. **磁盘空间**: 完整数据集约1.3MB，大规模生成请预留空间
3. **生成时间**: 完整数据集生成约10-30秒
4. **数据隐私**: 生成的数据为模拟数据，不包含真实设备信息

## 🔄 更新历史

- **2024-11-13**: 初始版本，支持7种故障类型、6种工况、3种演化模式
- **V1.0**: 生成器核心功能完成

## 📞 支持

如需添加新的故障类型、设备模板或演化模式，请：
1. 编辑相应的YAML配置文件
2. 重新运行生成脚本
3. 验证输出数据

---

**生成的数据可直接用于MVP测试、演示和模型验证** ✅
