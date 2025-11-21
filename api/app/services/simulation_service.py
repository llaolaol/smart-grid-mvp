"""
Simulation Service
推演服务 - 封装现有推演模型
"""

from models.simulator import Simulator, ScenarioConfig as ModelScenarioConfig
from app.schemas.simulation import (
    SimulationRequest,
    ScenarioResult,
    ThermalResult,
    DGAProjection,
    AgingResult,
    Improvements,
    TimelinePoint
)


class SimulationService:
    """推演服务"""

    def __init__(self):
        """初始化推演器"""
        self.simulator = Simulator()

    def compare(self, request: SimulationRequest) -> dict:
        """
        执行A/B场景对比推演

        Args:
            request: 推演请求

        Returns:
            dict: 包含scenario_a, scenario_b, improvements
        """
        # 转换场景配置
        scenario_a = ModelScenarioConfig(
            name=request.scenario_a.name,
            load_percent=request.scenario_a.load_percent,
            ambient_temp=request.scenario_a.ambient_temp
        )

        scenario_b = ModelScenarioConfig(
            name=request.scenario_b.name,
            load_percent=request.scenario_b.load_percent,
            ambient_temp=request.scenario_b.ambient_temp
        )

        # 准备初始状态
        initial_state = {
            "dga": request.initial_state.dga,
            "dp": request.initial_state.dp,
            "operation_years": request.initial_state.operation_years
        }

        # 调用现有模型进行推演
        result = self.simulator.compare(scenario_a, scenario_b, initial_state)

        # 转换为API响应格式
        response_data = {
            "scenario_a": self._convert_scenario_result(result["scenario_a"]),
            "scenario_b": self._convert_scenario_result(result["scenario_b"]),
            "improvements": Improvements(**result["improvements"])
        }

        return response_data

    def _convert_scenario_result(self, raw_result: dict) -> ScenarioResult:
        """转换场景结果格式"""
        return ScenarioResult(
            scenario=raw_result["scenario"],
            thermal=ThermalResult(**raw_result["thermal"]),
            dga_projection=DGAProjection(**raw_result["dga_projection"]),
            aging=AgingResult(**raw_result["aging"]),
            tte_days=raw_result["tte_days"],
            timeline=[TimelinePoint(**point) for point in raw_result["timeline"]]
        )


# Global instance
simulation_service = SimulationService()
