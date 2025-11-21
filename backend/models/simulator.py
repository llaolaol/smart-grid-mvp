"""
What-if推演引擎

耦合 DGA诊断 + 热模型 + 老化模型，进行场景推演。
"""

from typing import Dict, Optional, List
import math
import sys
import os

# 支持相对导入和绝对导入
try:
    # 相对导入（作为包的一部分运行时）
    from .dga_diagnoser import DGADiagnoser, DGAData
    from .thermal_model import ThermalModel
    from .aging_model import AgingModel
except ImportError:
    # 绝对导入（独立运行时）
    # 添加项目根目录到Python路径
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    from backend.models.dga_diagnoser import DGADiagnoser, DGAData
    from backend.models.thermal_model import ThermalModel
    from backend.models.aging_model import AgingModel


class ScenarioConfig:
    """推演场景配置"""

    def __init__(
        self,
        name: str,
        baseline: str = "current",  # current / healthy
        duration_days: int = 7,
        load_percent: float = 85,
        ambient_temp: float = 25,
        cooling_factor: float = 1.0,
        defect_factor: float = 0.5,
    ):
        self.name = name
        self.baseline = baseline
        self.duration_days = duration_days
        self.load_percent = load_percent
        self.ambient_temp = ambient_temp
        self.cooling_factor = cooling_factor
        self.defect_factor = defect_factor

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "baseline": self.baseline,
            "duration_days": self.duration_days,
            "load_percent": self.load_percent,
            "ambient_temp": self.ambient_temp,
            "cooling_factor": self.cooling_factor,
            "defect_factor": self.defect_factor,
        }


class SimulationResult:
    """推演结果"""

    def __init__(
        self,
        scenario: ScenarioConfig,
        thermal: Dict,
        dga_projection: Dict,
        aging: Dict,
        tte_days: float,
        timeline: List[Dict],
    ):
        self.scenario = scenario
        self.thermal = thermal
        self.dga_projection = dga_projection
        self.aging = aging
        self.tte_days = tte_days
        self.timeline = timeline

    def to_dict(self) -> Dict:
        return {
            "scenario": self.scenario.to_dict(),
            "thermal": self.thermal,
            "dga_projection": self.dga_projection,
            "aging": self.aging,
            "tte_days": round(self.tte_days, 0),
            "timeline": self.timeline,
        }


class Simulator:
    """
    数字孪生推演引擎

    整合多个机理模型进行耦合仿真
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

        # 初始化各模型
        self.dga_diagnoser = DGADiagnoser(self.config)
        self.thermal_model = ThermalModel(self.config)
        self.aging_model = AgingModel(self.config)

    def run(
        self,
        scenario: ScenarioConfig,
        initial_state: Dict,
    ) -> SimulationResult:
        """
        运行推演

        Args:
            scenario: 推演场景配置
            initial_state: 初始状态
                {
                    "dga": {...},
                    "dp": 450,
                    "operation_years": 10
                }

        Returns:
            SimulationResult
        """
        # 1. 热分析
        thermal_result = self.thermal_model.predict(
            load_percent=scenario.load_percent,
            ambient_temp=scenario.ambient_temp,
            cooling_factor=scenario.cooling_factor,
        )

        # 2. 老化分析
        aging_result = self.aging_model.analyze(
            current_dp=initial_state.get("dp", 450),
            temp_celsius=thermal_result.hotspot_temp,
            operation_years=initial_state.get("operation_years", 10),
        )

        # 3. DGA演化预测
        dga_projection = self._predict_dga_evolution(
            initial_dga=initial_state.get("dga", {}),
            hotspot_temp=thermal_result.hotspot_temp,
            defect_factor=scenario.defect_factor,
            days=scenario.duration_days,
        )

        # 4. 时间线预测
        timeline = self._generate_timeline(
            scenario=scenario,
            initial_dga=initial_state.get("dga", {}),
            initial_dp=initial_state.get("dp", 450),
        )

        # 5. 计算TTE（Time To Failure）
        tte_days = self._calculate_tte(
            dga_projection=dga_projection,
            aging_result=aging_result,
        )

        return SimulationResult(
            scenario=scenario,
            thermal=thermal_result.to_dict(),
            dga_projection=dga_projection,
            aging=aging_result.to_dict(),
            tte_days=tte_days,
            timeline=timeline,
        )

    def _predict_dga_evolution(
        self,
        initial_dga: Dict,
        hotspot_temp: float,
        defect_factor: float,
        days: int,
    ) -> Dict:
        """
        预测DGA演化

        简化模型：基于Arrhenius速率方程
        """
        # Arrhenius参数（简化）
        R = 8.314
        Ea_map = {
            "H2": 70000,
            "CH4": 180000,
            "C2H6": 200000,
            "C2H4": 150000,
            "C2H2": 120000,
            "CO": 110000,
            "CO2": 95000,
        }

        # 频率因子（需根据实测数据标定）
        A_map = {
            "H2": 1e8,
            "CH4": 1e6,
            "C2H6": 1e5,
            "C2H4": 1e7,
            "C2H2": 5e7,
            "CO": 1e6,
            "CO2": 5e6,
        }

        T_kelvin = hotspot_temp + 273.15

        projected_dga = {}
        gas_rates = {}

        for gas in ["H2", "CH4", "C2H6", "C2H4", "C2H2", "CO", "CO2"]:
            initial = initial_dga.get(gas, 0)
            Ea = Ea_map[gas]
            A = A_map[gas]

            # 产气速率 [ppm/天]
            rate = A * math.exp(-Ea / (R * T_kelvin)) * (1 + 5 * defect_factor)

            # 预测浓度
            projected = initial + rate * days

            projected_dga[gas] = round(projected, 1)
            gas_rates[gas] = round(rate, 4)

        return {
            "projected_concentrations": projected_dga,
            "production_rates": gas_rates,
            "days": days,
        }

    def _calculate_tte(self, dga_projection: Dict, aging_result) -> float:
        """
        计算失效时间（天）

        基于多个失效判据：
        1. C2H2超过300ppm
        2. DP低于200
        3. 热点温度持续超标
        """
        # 判据1: C2H2达到危险值
        C2H2 = dga_projection["projected_concentrations"].get("C2H2", 0)
        C2H2_rate = dga_projection["production_rates"].get("C2H2", 0)

        if C2H2_rate > 0:
            days_to_alarm = (300 - C2H2) / C2H2_rate
        else:
            days_to_alarm = float("inf")

        # 判据2: DP耗尽
        days_to_dp_failure = aging_result.remaining_life_years * 365

        # 取最小值（最先失效的判据）
        tte = min(days_to_alarm, days_to_dp_failure)

        return max(tte, 0)  # 不能为负

    def _generate_timeline(
        self,
        scenario: ScenarioConfig,
        initial_dga: Dict,
        initial_dp: float,
    ) -> List[Dict]:
        """
        生成时间线（逐天预测）
        """
        timeline = []

        for day in range(scenario.duration_days + 1):
            # 热分析
            thermal = self.thermal_model.predict(
                load_percent=scenario.load_percent,
                ambient_temp=scenario.ambient_temp,
                cooling_factor=scenario.cooling_factor,
            )

            # DGA演化（当天）
            dga_day = self._predict_dga_evolution(
                initial_dga=initial_dga,
                hotspot_temp=thermal.hotspot_temp,
                defect_factor=scenario.defect_factor,
                days=day,
            )

            # DP演化
            temp_profile = [thermal.hotspot_temp] * day if day > 0 else [thermal.hotspot_temp]
            dp_evolution = self.aging_model.predict_dp_evolution(
                initial_dp=initial_dp, temp_profile=temp_profile
            )
            current_dp = dp_evolution[-1]["dp"] if dp_evolution else initial_dp

            timeline.append(
                {
                    "day": day,
                    "temperature": round(thermal.hotspot_temp, 1),
                    "C2H2": dga_day["projected_concentrations"]["C2H2"],
                    "dp": round(current_dp, 1),
                }
            )

        return timeline

    def compare(
        self,
        scenario_a: ScenarioConfig,
        scenario_b: ScenarioConfig,
        initial_state: Dict,
    ) -> Dict:
        """
        A/B对比推演

        Args:
            scenario_a: 场景A（通常是当前工况）
            scenario_b: 场景B（推演工况）
            initial_state: 初始状态

        Returns:
            对比结果
        """
        result_a = self.run(scenario_a, initial_state)
        result_b = self.run(scenario_b, initial_state)

        comparison = {
            "scenario_a": result_a.to_dict(),
            "scenario_b": result_b.to_dict(),
            "improvements": {
                "temperature_reduction": round(
                    result_a.thermal["hotspot_temp"] - result_b.thermal["hotspot_temp"],
                    1,
                ),
                "gas_rate_reduction_pct": round(
                    (
                        1
                        - result_b.dga_projection["production_rates"]["C2H2"]
                        / result_a.dga_projection["production_rates"]["C2H2"]
                    )
                    * 100,
                    1,
                )
                if result_a.dga_projection["production_rates"]["C2H2"] > 0
                else 0,
                "life_extension_days": round(result_b.tte_days - result_a.tte_days, 0),
            },
        }

        return comparison


# 便捷函数
def quick_what_if(
    current_load: float, new_load: float, initial_dga: Dict, days: int = 7
) -> Dict:
    """快速What-if推演"""
    simulator = Simulator()

    scenario_current = ScenarioConfig(
        name="当前工况", load_percent=current_load, duration_days=days
    )

    scenario_new = ScenarioConfig(
        name="推演工况", load_percent=new_load, duration_days=days
    )

    initial_state = {"dga": initial_dga, "dp": 450, "operation_years": 10}

    comparison = simulator.compare(scenario_current, scenario_new, initial_state)

    return comparison


if __name__ == "__main__":
    # 测试
    print("=" * 60)
    print("What-if推演引擎测试")
    print("=" * 60)

    simulator = Simulator()

    # 初始状态（1号主变，高能放电缺陷）
    initial_state = {
        "dga": {
            "H2": 145,
            "CH4": 32,
            "C2H6": 8,
            "C2H4": 45,
            "C2H2": 78,
            "CO": 420,
            "CO2": 3200,
        },
        "dp": 450,
        "operation_years": 10,
    }

    # 场景A：当前工况（85%负载）
    scenario_a = ScenarioConfig(
        name="当前工况(85%负载)",
        load_percent=85,
        ambient_temp=25,
        defect_factor=0.8,  # 严重缺陷
        duration_days=7,
    )

    # 场景B：降载工况（55%负载）
    scenario_b = ScenarioConfig(
        name="降载工况(55%负载)",
        load_percent=55,
        ambient_temp=25,
        defect_factor=0.8,
        duration_days=7,
    )

    print("\n【推演场景】")
    print(f"场景A: {scenario_a.name}")
    print(f"场景B: {scenario_b.name}")
    print(f"推演时长: {scenario_a.duration_days} 天")

    # A/B对比
    print("\n【正在运行耦合仿真...】")
    comparison = simulator.compare(scenario_a, scenario_b, initial_state)

    # 结果展示
    print("\n【关键指标对比】")
    print("-" * 60)
    print(f"{'指标':<25} {'场景A':>15} {'场景B':>15}")
    print("-" * 60)

    result_a = comparison["scenario_a"]
    result_b = comparison["scenario_b"]

    print(
        f"{'绕组热点温度(°C)':<25} {result_a['thermal']['hotspot_temp']:>15.1f} {result_b['thermal']['hotspot_temp']:>15.1f}"
    )
    print(
        f"{'C2H2产气速率(ppm/天)':<25} {result_a['dga_projection']['production_rates']['C2H2']:>15.4f} {result_b['dga_projection']['production_rates']['C2H2']:>15.4f}"
    )
    print(
        f"{'7天后C2H2浓度(ppm)':<25} {result_a['dga_projection']['projected_concentrations']['C2H2']:>15.1f} {result_b['dga_projection']['projected_concentrations']['C2H2']:>15.1f}"
    )
    print(
        f"{'老化速率(DP/天)':<25} {result_a['aging']['aging_rate']:>15.4f} {result_b['aging']['aging_rate']:>15.4f}"
    )
    print(
        f"{'预计失效时间(天)':<25} {result_a['tte_days']:>15.0f} {result_b['tte_days']:>15.0f}"
    )

    print("\n【改善效果】")
    improvements = comparison["improvements"]
    print(f"✓ 温度降低: {improvements['temperature_reduction']:.1f} °C")
    print(f"✓ 产气速率降低: {improvements['gas_rate_reduction_pct']:.1f}%")
    print(f"✓ 寿命延长: {improvements['life_extension_days']:.0f} 天")

    print("\n【时间线预测（场景B）】")
    timeline = result_b["timeline"]
    print("天数  温度(°C)  C2H2(ppm)  DP值")
    for point in timeline[::2]:  # 隔天显示
        print(
            f" {point['day']:2d}     {point['temperature']:5.1f}     {point['C2H2']:6.1f}   {point['dp']:5.1f}"
        )

    print("\n" + "=" * 60)
    print("✓ What-if推演引擎测试完成")
    print("=" * 60)
