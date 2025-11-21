"""
变压器热模型

基于IEC 60076标准的简化模型，无需FEM仿真。
未来可升级为机器学习模型或PINN。
"""

from typing import Dict, Optional
import math


class ThermalResult:
    """热分析结果"""

    def __init__(
        self,
        oil_top_temp: float,
        oil_bottom_temp: float,
        hotspot_temp: float,
        ambient_temp: float,
        load_percent: float,
        is_overheating: bool,
    ):
        self.oil_top_temp = oil_top_temp
        self.oil_bottom_temp = oil_bottom_temp
        self.hotspot_temp = hotspot_temp
        self.ambient_temp = ambient_temp
        self.load_percent = load_percent
        self.is_overheating = is_overheating

    def to_dict(self) -> Dict:
        return {
            "oil_top_temp": round(self.oil_top_temp, 2),
            "oil_bottom_temp": round(self.oil_bottom_temp, 2),
            "hotspot_temp": round(self.hotspot_temp, 2),
            "ambient_temp": self.ambient_temp,
            "load_percent": self.load_percent,
            "is_overheating": self.is_overheating,
            "oil_temp_rise": round(self.oil_top_temp - self.ambient_temp, 2),
            "hotspot_temp_rise": round(self.hotspot_temp - self.oil_top_temp, 2),
        }


class ThermalModel:
    """
    热模型（简化版本，基于IEC 60076）

    使用等效热网络，计算速度<1ms
    """

    def __init__(self, config: Optional[Dict] = None):
        """
        初始化

        Args:
            config: 配置参数
        """
        self.config = config or {}

        # IEC 60076标准参数
        self.k1 = self.config.get("k1", 55)  # 油温上升系数
        self.k2 = self.config.get("k2", 23)  # 热点温升系数
        self.n1 = self.config.get("n1", 2.0)  # 油温指数
        self.n2 = self.config.get("n2", 1.6)  # 热点指数

        # 温度限值
        self.oil_limit = self.config.get("oil_limit", 105)  # °C
        self.hotspot_limit = self.config.get("hotspot_limit", 118)  # °C

    def predict(
        self,
        load_percent: float,
        ambient_temp: float = 25,
        cooling_factor: float = 1.0,
    ) -> ThermalResult:
        """
        预测温度分布

        Args:
            load_percent: 负载率 (0-150%)
            ambient_temp: 环境温度 (°C)
            cooling_factor: 冷却系数 (0-1)，1为正常，0为失效

        Returns:
            ThermalResult
        """
        # 归一化负载
        K = load_percent / 100.0

        # 油温计算（IEC 60076-2）
        # ΔT_oil = k1 * K^n1
        delta_oil = self.k1 * (K ** self.n1) / cooling_factor
        oil_top_temp = ambient_temp + delta_oil

        # 底层油温估算（简化）
        oil_bottom_temp = ambient_temp + delta_oil * 0.5

        # 热点温升（绕组）
        # ΔT_hotspot = k2 * K^n2
        delta_hotspot = self.k2 * (K ** self.n2)
        hotspot_temp = oil_top_temp + delta_hotspot

        # 判断是否过热
        is_overheating = (
            hotspot_temp > self.hotspot_limit or oil_top_temp > self.oil_limit
        )

        return ThermalResult(
            oil_top_temp=oil_top_temp,
            oil_bottom_temp=oil_bottom_temp,
            hotspot_temp=hotspot_temp,
            ambient_temp=ambient_temp,
            load_percent=load_percent,
            is_overheating=is_overheating,
        )

    def calculate_max_load(
        self, ambient_temp: float = 25, cooling_factor: float = 1.0
    ) -> float:
        """
        计算最大允许负载

        在给定环境条件下，热点不超过118°C的最大负载

        Returns:
            最大负载率 (%)
        """
        # 二分法搜索
        low, high = 0, 150
        while high - low > 0.1:
            mid = (low + high) / 2
            result = self.predict(mid, ambient_temp, cooling_factor)

            if result.hotspot_temp > self.hotspot_limit:
                high = mid
            else:
                low = mid

        return low

    def predict_transient(
        self,
        initial_temp: float,
        load_percent: float,
        ambient_temp: float,
        duration_hours: int,
        time_constant: float = 3.0,  # 小时
    ) -> list:
        """
        瞬态温度预测（指数响应）

        T(t) = T_ss + (T0 - T_ss) * exp(-t/τ)

        Args:
            initial_temp: 初始温度
            load_percent: 新负载
            ambient_temp: 环境温度
            duration_hours: 预测时长（小时）
            time_constant: 热时间常数（小时）

        Returns:
            温度历史列表
        """
        # 稳态温度
        steady_result = self.predict(load_percent, ambient_temp)
        T_ss = steady_result.hotspot_temp

        # 指数响应
        temps = []
        for t in range(duration_hours + 1):
            T_t = T_ss + (initial_temp - T_ss) * math.exp(-t / time_constant)
            temps.append({"hour": t, "temperature": T_t})

        return temps


# 便捷函数
def quick_thermal_check(load_percent: float, ambient_temp: float = 25) -> Dict:
    """快速热检查"""
    model = ThermalModel()
    result = model.predict(load_percent, ambient_temp)
    return result.to_dict()


if __name__ == "__main__":
    # 测试
    print("=" * 60)
    print("热模型测试")
    print("=" * 60)

    model = ThermalModel()

    # 案例1：正常负载
    print("\n【案例1：75%负载，25°C环境】")
    result1 = model.predict(load_percent=75, ambient_temp=25)
    print(f"顶层油温: {result1.oil_top_temp:.1f}°C")
    print(f"热点温度: {result1.hotspot_temp:.1f}°C")
    print(f"是否过热: {'是' if result1.is_overheating else '否'}")

    # 案例2：高负载
    print("\n【案例2：110%负载，35°C环境】")
    result2 = model.predict(load_percent=110, ambient_temp=35)
    print(f"顶层油温: {result2.oil_top_temp:.1f}°C")
    print(f"热点温度: {result2.hotspot_temp:.1f}°C")
    print(f"是否过热: {'是' if result2.is_overheating else '否'}")

    # 案例3：冷却系统故障
    print("\n【案例3：85%负载，冷却系统50%效率】")
    result3 = model.predict(load_percent=85, ambient_temp=25, cooling_factor=0.5)
    print(f"顶层油温: {result3.oil_top_temp:.1f}°C")
    print(f"热点温度: {result3.hotspot_temp:.1f}°C")
    print(f"是否过热: {'是' if result3.is_overheating else '否'}")

    # 案例4：最大允许负载
    print("\n【案例4：35°C环境下的最大允许负载】")
    max_load = model.calculate_max_load(ambient_temp=35)
    print(f"最大允许负载: {max_load:.1f}%")

    # 案例5：瞬态响应
    print("\n【案例5：从120°C降载至60%】")
    transient = model.predict_transient(
        initial_temp=120,
        load_percent=60,
        ambient_temp=25,
        duration_hours=12,
    )
    print("时间(h)  温度(°C)")
    for point in transient[::3]:  # 每3小时显示一次
        print(f"  {point['hour']:2d}      {point['temperature']:.1f}")

    print("\n" + "=" * 60)
    print("✓ 热模型测试完成")
    print("=" * 60)
