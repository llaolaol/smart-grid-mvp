# API参考文档

> 各模块的接口说明和使用示例
> 更新时间: 2024-11-13

---

## 📦 模块总览

```
backend/models/
├── dga_diagnoser.py    # DGA诊断引擎
├── thermal_model.py    # 热模型
├── aging_model.py      # 老化模型
└── simulator.py        # What-if推演引擎
```

---

## 1. DGA诊断引擎

### 导入
```python
from backend.models.dga_diagnoser import (
    DGADiagnoser,
    DGAData,
    DiagnosisResult,
    FaultType,
    quick_diagnose
)
```

### 类: `DGAData`
**数据模型**：DGA测试数据

**构造函数**:
```python
DGAData(
    H2: float,      # 氢气 [ppm]
    CH4: float,     # 甲烷 [ppm]
    C2H6: float,    # 乙烷 [ppm]
    C2H4: float,    # 乙烯 [ppm]
    C2H2: float,    # 乙炔 [ppm]
    CO: float,      # 一氧化碳 [ppm]
    CO2: float,     # 二氧化碳 [ppm]
    device_id: Optional[str] = None,
    timestamp: Optional[str] = None
)
```

**方法**:
- `to_dict() -> Dict`: 转为字典

**示例**:
```python
dga = DGAData(
    H2=145, CH4=32, C2H6=8, C2H4=45,
    C2H2=78, CO=420, CO2=3200
)
```

---

### 类: `DiagnosisResult`
**诊断结果模型**

**属性**:
```python
fault_type: FaultType        # 故障类型
confidence: float            # 置信度 [0-1]
severity: int                # 严重程度 [0-3]
methods: Dict[str, str]      # 各方法的诊断结果
ratios: Dict[str, float]     # 特征比值
recommendations: List[str]   # 建议措施
raw_data: DGAData           # 原始数据
```

**方法**:
- `to_dict() -> Dict`: 转为字典

---

### 类: `DGADiagnoser`
**DGA诊断器主类**

**构造函数**:
```python
DGADiagnoser(config: Optional[Dict] = None)
```

**参数**:
- `config`: 配置字典，可包含`dga_limits`（限值）

**主要方法**:

#### `diagnose(dga_data: DGAData) -> DiagnosisResult`
综合诊断

**示例**:
```python
diagnoser = DGADiagnoser()
dga_data = DGAData(H2=145, CH4=32, C2H6=8, C2H4=45, C2H2=78, CO=420, CO2=3200)
result = diagnoser.diagnose(dga_data)

print(f"故障类型: {result.fault_type.value}")
print(f"严重程度: {result.severity}")  # 0-3
print(f"置信度: {result.confidence:.2f}")
for rec in result.recommendations:
    print(f"建议: {rec}")
```

---

### 便捷函数: `quick_diagnose`
快速诊断（无需创建对象）

**签名**:
```python
quick_diagnose(
    H2: float, CH4: float, C2H6: float, C2H4: float,
    C2H2: float, CO: float, CO2: float
) -> Dict
```

**返回**: 诊断结果字典

**示例**:
```python
result = quick_diagnose(
    H2=145, CH4=32, C2H6=8, C2H4=45,
    C2H2=78, CO=420, CO2=3200
)
print(result['fault_type'])  # "高能量放电"
```

---

## 2. 热模型

### 导入
```python
from backend.models.thermal_model import (
    ThermalModel,
    ThermalResult,
    quick_thermal_check
)
```

### 类: `ThermalResult`
**热分析结果模型**

**属性**:
```python
oil_top_temp: float      # 顶层油温 [°C]
oil_bottom_temp: float   # 底层油温 [°C]
hotspot_temp: float      # 热点温度 [°C]
ambient_temp: float      # 环境温度 [°C]
load_percent: float      # 负载率 [%]
is_overheating: bool     # 是否过热
```

**方法**:
- `to_dict() -> Dict`: 转为字典

---

### 类: `ThermalModel`
**热模型主类**（基于IEC 60076）

**构造函数**:
```python
ThermalModel(config: Optional[Dict] = None)
```

**配置参数**:
```python
config = {
    'k1': 55,    # 油温上升系数
    'k2': 23,    # 热点温升系数
    'n1': 2.0,   # 油温指数
    'n2': 1.6,   # 热点指数
    'oil_limit': 105,     # 油温限值 [°C]
    'hotspot_limit': 118  # 热点限值 [°C]
}
```

**主要方法**:

#### `predict(load_percent, ambient_temp=25, cooling_factor=1.0) -> ThermalResult`
预测温度分布

**参数**:
- `load_percent`: 负载率 [%]，范围0-150
- `ambient_temp`: 环境温度 [°C]
- `cooling_factor`: 冷却系数 [0-1]，1为正常，0为失效

**示例**:
```python
model = ThermalModel()

# 正常工况
result = model.predict(load_percent=85, ambient_temp=25)
print(f"热点温度: {result.hotspot_temp:.1f}°C")
print(f"是否过热: {result.is_overheating}")

# 冷却系统故障
result_fault = model.predict(load_percent=85, cooling_factor=0.5)
print(f"故障时热点: {result_fault.hotspot_temp:.1f}°C")
```

---

#### `calculate_max_load(ambient_temp=25, cooling_factor=1.0) -> float`
计算最大允许负载

**返回**: 最大负载率 [%]

**示例**:
```python
max_load = model.calculate_max_load(ambient_temp=35)
print(f"35°C时最大允许负载: {max_load:.1f}%")
```

---

#### `predict_transient(initial_temp, load_percent, ambient_temp, duration_hours, time_constant=3.0) -> list`
瞬态温度预测

**参数**:
- `initial_temp`: 初始温度 [°C]
- `load_percent`: 新负载 [%]
- `ambient_temp`: 环境温度 [°C]
- `duration_hours`: 预测时长 [小时]
- `time_constant`: 热时间常数 [小时]，默认3

**返回**: 时间-温度列表

**示例**:
```python
# 从120°C降载至60%
transient = model.predict_transient(
    initial_temp=120,
    load_percent=60,
    ambient_temp=25,
    duration_hours=12
)

for point in transient:
    print(f"{point['hour']}h: {point['temperature']:.1f}°C")
```

---

### 便捷函数: `quick_thermal_check`
快速热检查

**签名**:
```python
quick_thermal_check(load_percent: float, ambient_temp: float = 25) -> Dict
```

**示例**:
```python
result = quick_thermal_check(load_percent=110, ambient_temp=35)
print(f"热点温度: {result['hotspot_temp']}°C")
```

---

## 3. 老化模型

### 导入
```python
from backend.models.aging_model import (
    AgingModel,
    AgingResult,
    quick_life_check
)
```

### 类: `AgingResult`
**老化分析结果**

**属性**:
```python
current_dp: float              # 当前DP值
aging_rate: float              # 老化速率 [DP/天]
life_loss_factor: float        # 寿命损失因子(FAA)
remaining_life_years: float    # 剩余寿命 [年]
life_consumed_pct: float       # 寿命消耗百分比 [%]
```

**方法**:
- `to_dict() -> Dict`: 转为字典

---

### 类: `AgingModel`
**绝缘老化模型**（基于Arrhenius和IEEE标准）

**构造函数**:
```python
AgingModel(config: Optional[Dict] = None)
```

**配置参数**:
```python
config = {
    'activation_energy': 111000,  # 活化能 [J/mol]
    'reference_temp': 110,         # 参考温度 [°C]
    'initial_dp': 1000,            # 初始DP值
    'failure_dp': 200,             # 失效DP值
    'design_life_years': 30        # 设计寿命 [年]
}
```

**主要方法**:

#### `calculate_FAA(temp_celsius: float) -> float`
计算IEEE寿命损失因子

**公式**: FAA = exp(15000/383 - 15000/T)

**示例**:
```python
model = AgingModel()
faa = model.calculate_FAA(temp_celsius=110)
print(f"110°C的FAA: {faa:.2f}x")  # 1.0x (参考温度)

faa_high = model.calculate_FAA(temp_celsius=120)
print(f"120°C的FAA: {faa_high:.2f}x")  # 约2x (老化速度翻倍)
```

---

#### `predict_aging_rate(temp_celsius: float) -> float`
预测老化速率

**返回**: DP/天

**示例**:
```python
rate = model.predict_aging_rate(temp_celsius=105)
print(f"105°C的老化速率: {rate:.4f} DP/天")
```

---

#### `predict_remaining_life(current_dp: float, temp_celsius: float) -> float`
预测剩余寿命

**返回**: 年

**示例**:
```python
rul = model.predict_remaining_life(current_dp=450, temp_celsius=105)
print(f"剩余寿命: {rul:.1f} 年 ({rul*365:.0f} 天)")
```

---

#### `analyze(current_dp, temp_celsius, operation_years=10) -> AgingResult`
综合老化分析

**参数**:
- `current_dp`: 当前DP值（可选，如无测试则估算）
- `temp_celsius`: 当前运行温度
- `operation_years`: 已运行年数

**示例**:
```python
model = AgingModel()
result = model.analyze(
    current_dp=450,
    temp_celsius=105,
    operation_years=10
)

print(f"当前DP: {result.current_dp:.1f}")
print(f"老化速率: {result.aging_rate:.4f} DP/天")
print(f"寿命损失因子: {result.life_loss_factor:.2f}x")
print(f"剩余寿命: {result.remaining_life_years:.1f} 年")
print(f"寿命消耗: {result.life_consumed_pct:.1f}%")
```

---

#### `predict_dp_evolution(initial_dp, temp_profile) -> List[Dict]`
预测DP演化

**参数**:
- `initial_dp`: 初始DP
- `temp_profile`: 温度历史（列表，每个元素代表一天的温度）

**返回**: DP演化历史

**示例**:
```python
# 未来30天持续105°C
temp_profile = [105] * 30
evolution = model.predict_dp_evolution(initial_dp=450, temp_profile=temp_profile)

for point in evolution[::7]:  # 每周显示
    print(f"第{point['day']}天: DP={point['dp']:.1f}, 速率={point['rate']:.4f}")
```

---

### 便捷函数: `quick_life_check`
快速寿命检查

**签名**:
```python
quick_life_check(
    temp_celsius: float,
    current_dp: Optional[float] = None,
    operation_years: float = 10
) -> Dict
```

**示例**:
```python
result = quick_life_check(temp_celsius=105, current_dp=450)
print(f"剩余寿命: {result['remaining_life_years']} 年")
```

---

## 4. What-if推演引擎

### 导入
```python
from backend.models.simulator import (
    Simulator,
    ScenarioConfig,
    SimulationResult,
    quick_what_if
)
```

### 类: `ScenarioConfig`
**推演场景配置**

**构造函数**:
```python
ScenarioConfig(
    name: str,                     # 场景名称
    baseline: str = "current",     # 基准："current" / "healthy"
    duration_days: int = 7,        # 推演时长 [天]
    load_percent: float = 85,      # 负载率 [%]
    ambient_temp: float = 25,      # 环境温度 [°C]
    cooling_factor: float = 1.0,   # 冷却系数 [0-1]
    defect_factor: float = 0.5     # 缺陷因子 [0-1]
)
```

**方法**:
- `to_dict() -> Dict`: 转为字典

**示例**:
```python
# 场景A：当前工况
scenario_a = ScenarioConfig(
    name="当前工况",
    load_percent=85,
    defect_factor=0.8  # 严重缺陷
)

# 场景B：降载工况
scenario_b = ScenarioConfig(
    name="降载工况",
    load_percent=55,
    defect_factor=0.8
)
```

---

### 类: `SimulationResult`
**推演结果**

**属性**:
```python
scenario: ScenarioConfig       # 场景配置
thermal: Dict                  # 热分析结果
dga_projection: Dict           # DGA演化预测
aging: Dict                    # 老化分析结果
tte_days: float                # 失效时间 [天]
timeline: List[Dict]           # 时间线数据
```

**方法**:
- `to_dict() -> Dict`: 转为字典

---

### 类: `Simulator`
**推演引擎主类**（核心功能）

**构造函数**:
```python
Simulator(config: Optional[Dict] = None)
```

**主要方法**:

#### `run(scenario: ScenarioConfig, initial_state: Dict) -> SimulationResult`
运行推演

**参数**:
- `scenario`: 推演场景配置
- `initial_state`: 初始状态
  ```python
  initial_state = {
      'dga': {...},             # DGA数据字典
      'dp': 450,                # 当前DP值
      'operation_years': 10     # 已运行年数
  }
  ```

**示例**:
```python
simulator = Simulator()

scenario = ScenarioConfig(
    name="降载工况",
    load_percent=55,
    defect_factor=0.8,
    duration_days=7
)

initial_state = {
    'dga': {
        'H2': 145, 'CH4': 32, 'C2H6': 8, 'C2H4': 45,
        'C2H2': 78, 'CO': 420, 'CO2': 3200
    },
    'dp': 450,
    'operation_years': 10
}

result = simulator.run(scenario, initial_state)

print(f"热点温度: {result.thermal['hotspot_temp']:.1f}°C")
print(f"C2H2产气速率: {result.dga_projection['production_rates']['C2H2']:.4f} ppm/天")
print(f"预计失效时间: {result.tte_days:.0f} 天")

# 时间线数据
for point in result.timeline:
    print(f"第{point['day']}天: 温度={point['temperature']:.1f}°C, C2H2={point['C2H2']:.1f}ppm")
```

---

#### `compare(scenario_a, scenario_b, initial_state) -> Dict`
A/B对比推演（核心功能）

**返回**: 对比结果字典
```python
{
    'scenario_a': {...},    # 场景A结果
    'scenario_b': {...},    # 场景B结果
    'improvements': {       # 改善效果
        'temperature_reduction': float,      # 温度降低 [°C]
        'gas_rate_reduction_pct': float,     # 产气速率降低 [%]
        'life_extension_days': float         # 寿命延长 [天]
    }
}
```

**示例**:
```python
simulator = Simulator()

# 场景A：当前工况(85%负载)
scenario_a = ScenarioConfig("当前工况", load_percent=85, defect_factor=0.8, duration_days=7)

# 场景B：降载工况(55%负载)
scenario_b = ScenarioConfig("降载工况", load_percent=55, defect_factor=0.8, duration_days=7)

initial_state = {
    'dga': {...},
    'dp': 450,
    'operation_years': 10
}

comparison = simulator.compare(scenario_a, scenario_b, initial_state)

# 对比结果
improvements = comparison['improvements']
print(f"温度降低: {improvements['temperature_reduction']:.1f} °C")
print(f"产气速率降低: {improvements['gas_rate_reduction_pct']:.1f}%")
print(f"寿命延长: {improvements['life_extension_days']:.0f} 天")

# 详细数据
result_a = comparison['scenario_a']
result_b = comparison['scenario_b']
print(f"\n场景A热点: {result_a['thermal']['hotspot_temp']:.1f}°C")
print(f"场景B热点: {result_b['thermal']['hotspot_temp']:.1f}°C")
```

---

### 便捷函数: `quick_what_if`
快速What-if推演

**签名**:
```python
quick_what_if(
    current_load: float,
    new_load: float,
    initial_dga: Dict,
    days: int = 7
) -> Dict
```

**示例**:
```python
comparison = quick_what_if(
    current_load=85,
    new_load=55,
    initial_dga={'H2': 145, 'CH4': 32, ..., 'C2H2': 78, ...},
    days=7
)

print(comparison['improvements'])
```

---

## 5. 完整使用流程示例

### 示例1: 诊断→分析→推演完整流程

```python
# 1. DGA诊断
from backend.models.dga_diagnoser import DGADiagnoser, DGAData

dga_data = DGAData(H2=145, CH4=32, C2H6=8, C2H4=45, C2H2=78, CO=420, CO2=3200)
diagnoser = DGADiagnoser()
diagnosis = diagnoser.diagnose(dga_data)

print(f"诊断结果: {diagnosis.fault_type.value}")
print(f"严重程度: {['正常', '轻微', '注意', '严重'][diagnosis.severity]}")

# 2. 热分析
from backend.models.thermal_model import ThermalModel

thermal_model = ThermalModel()
thermal_result = thermal_model.predict(load_percent=85, ambient_temp=25)

print(f"热点温度: {thermal_result.hotspot_temp:.1f}°C")
print(f"是否过热: {thermal_result.is_overheating}")

# 3. 老化分析
from backend.models.aging_model import AgingModel

aging_model = AgingModel()
aging_result = aging_model.analyze(
    current_dp=450,
    temp_celsius=thermal_result.hotspot_temp,
    operation_years=10
)

print(f"剩余寿命: {aging_result.remaining_life_years:.1f} 年")
print(f"寿命消耗: {aging_result.life_consumed_pct:.1f}%")

# 4. What-if推演
from backend.models.simulator import Simulator, ScenarioConfig

simulator = Simulator()

scenario_current = ScenarioConfig(
    name="当前工况",
    load_percent=85,
    defect_factor=0.8,
    duration_days=7
)

scenario_reduced = ScenarioConfig(
    name="降载工况",
    load_percent=55,
    defect_factor=0.8,
    duration_days=7
)

initial_state = {
    'dga': dga_data.to_dict(),
    'dp': 450,
    'operation_years': 10
}

comparison = simulator.compare(scenario_current, scenario_reduced, initial_state)

print(f"\n改善效果:")
print(f"  温度降低: {comparison['improvements']['temperature_reduction']:.1f}°C")
print(f"  产气速率降低: {comparison['improvements']['gas_rate_reduction_pct']:.1f}%")
print(f"  寿命延长: {comparison['improvements']['life_extension_days']:.0f}天")
```

---

### 示例2: 参数化批量推演

```python
from backend.models.simulator import Simulator, ScenarioConfig
import pandas as pd

simulator = Simulator()

# 准备多个场景
load_levels = [70, 60, 55, 50]
scenarios = [
    ScenarioConfig(f"负载{load}%", load_percent=load, defect_factor=0.8, duration_days=7)
    for load in load_levels
]

# 基准场景
baseline = ScenarioConfig("当前工况", load_percent=85, defect_factor=0.8, duration_days=7)

initial_state = {...}  # 初始状态

# 批量对比
results = []
for scenario in scenarios:
    comparison = simulator.compare(baseline, scenario, initial_state)
    results.append({
        'load': scenario.load_percent,
        'temp': comparison['scenario_b']['thermal']['hotspot_temp'],
        'tte': comparison['scenario_b']['tte_days'],
        'temp_reduction': comparison['improvements']['temperature_reduction'],
        'life_extension': comparison['improvements']['life_extension_days']
    })

# 转DataFrame分析
df = pd.DataFrame(results)
print(df)

# 找最优方案
best = df.loc[df['life_extension'].idxmax()]
print(f"\n最优方案: 负载{best['load']}%")
print(f"  寿命延长: {best['life_extension']:.0f}天")
```

---

## 6. 配置文件说明

### config.yaml 结构

```yaml
# 模型配置
models:
  dga_diagnoser:
    type: "rule_based"  # rule_based / ml / ensemble
    enabled: true

  thermal_model:
    type: "simplified"  # simplified / ml / pinn / fem
    enabled: true
    params:
      rated_capacity_mva: 180
      rated_voltage_kv: 220
      k1: 55   # 油温上升系数
      k2: 23   # 热点温升系数
      n1: 2.0  # 油温指数
      n2: 1.6  # 热点指数

  aging_model:
    type: "arrhenius"  # arrhenius / ml
    enabled: true
    params:
      activation_energy: 111000  # [J/mol]
      reference_temp: 110         # [°C]
      initial_dp: 1000
      failure_dp: 200

# 标准限值
standards:
  dga_limits:  # IEC 60599
    H2:
      attention: 150
      alarm: 1000
    CH4:
      attention: 120
      alarm: 400
    C2H2:
      attention: 5
      alarm: 50
    # ...

  temperature_limits:  # IEC 60076
    oil_top: 105   # °C
    hotspot: 118   # °C
```

### 加载配置

```python
import yaml

with open('config.yaml', 'r') as f:
    config = yaml.safe_load(f)

# 使用配置
from backend.models.dga_diagnoser import DGADiagnoser
diagnoser = DGADiagnoser(config)

from backend.models.thermal_model import ThermalModel
thermal_model = ThermalModel(config['models']['thermal_model'])
```

---

## 7. 错误处理

### 常见错误和解决方案

#### 错误1: 导入失败
```python
ImportError: No module named 'backend'
```

**解决**:
```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
```

#### 错误2: 除零错误
```python
ZeroDivisionError: division by zero
```

**原因**: DGA数据中某些气体浓度为0

**解决**: 已在代码中添加eps=1e-6防止除零

#### 错误3: 参数超出范围
```python
ValueError: load_percent must be between 0 and 150
```

**解决**: 检查输入参数范围

---

## 8. 性能优化建议

### 缓存计算结果
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_thermal_predict(load, temp):
    model = ThermalModel()
    result = model.predict(load, temp)
    return result.to_dict()
```

### 批量计算
```python
# 避免循环中重复创建模型
simulator = Simulator()  # 创建一次

for scenario in scenarios:
    result = simulator.run(scenario, initial_state)  # 复用
```

---

## 9. 单元测试示例

```python
# tests/test_api.py
import pytest
from backend.models.dga_diagnoser import quick_diagnose
from backend.models.thermal_model import quick_thermal_check

def test_quick_diagnose_normal():
    result = quick_diagnose(
        H2=50, CH4=30, C2H6=15, C2H4=20,
        C2H2=1, CO=300, CO2=2000
    )
    assert result['severity'] <= 1

def test_quick_thermal_check():
    result = quick_thermal_check(load_percent=75, ambient_temp=25)
    assert result['hotspot_temp'] < 118  # 不超标

def test_quick_thermal_check_overload():
    result = quick_thermal_check(load_percent=120, ambient_temp=40)
    assert result['is_overheating'] == True
```

---

**文档版本**: v1.0
**最后更新**: 2024-11-13
**维护者**: chinafocus
