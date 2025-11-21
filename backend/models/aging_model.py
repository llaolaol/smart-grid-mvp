"""
绝缘老化模型

基于Arrhenius方程和IEEE标准，预测绝缘纸聚合度(DP)和剩余寿命。
"""

from typing import Dict, Optional, List
import math


class AgingResult:
    """老化分析结果"""

    def __init__(
        self,
        current_dp: float,
        aging_rate: float,
        life_loss_factor: float,
        remaining_life_years: float,
        life_consumed_pct: float,
    ):
        self.current_dp = current_dp
        self.aging_rate = aging_rate  # DP/天
        self.life_loss_factor = life_loss_factor  # FAA
        self.remaining_life_years = remaining_life_years
        self.life_consumed_pct = life_consumed_pct

    def to_dict(self) -> Dict:
        return {
            "current_dp": round(self.current_dp, 1),
            "aging_rate": round(self.aging_rate, 4),
            "life_loss_factor": round(self.life_loss_factor, 2),
            "remaining_life_years": round(self.remaining_life_years, 1),
            "remaining_life_days": round(self.remaining_life_years * 365, 0),
            "life_consumed_pct": round(self.life_consumed_pct, 1),
        }


class AgingModel:
    """
    绝缘老化模型（基于Arrhenius和IEEE标准）
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

        # Arrhenius参数
        self.Ea = self.config.get("activation_energy", 111000)  # J/mol
        self.R = 8.314  # J/(mol·K)
        self.A = self.config.get("frequency_factor", 1.0e10)

        # IEEE参数
        self.T_ref = self.config.get("reference_temp", 110)  # °C (383K)

        # DP参数
        self.initial_dp = self.config.get("initial_dp", 1000)
        self.failure_dp = self.config.get("failure_dp", 200)

        # 设计寿命
        self.design_life_years = self.config.get("design_life_years", 30)

    def calculate_FAA(self, temp_celsius: float) -> float:
        """
        计算IEEE寿命损失因子 (FAA)

        IEEE Std C57.91标准：
        FAA = exp(15000/383 - 15000/T)

        Args:
            temp_celsius: 温度 (°C)

        Returns:
            FAA: 相对老化速率
        """
        T_kelvin = temp_celsius + 273.15
        T_ref_kelvin = self.T_ref + 273.15

        FAA = math.exp(15000 / T_ref_kelvin - 15000 / T_kelvin)
        return FAA

    def predict_aging_rate(self, temp_celsius: float) -> float:
        """
        预测老化速率 (DP/天)

        基于Arrhenius方程

        Args:
            temp_celsius: 温度 (°C)

        Returns:
            老化速率 (DP/天)
        """
        T_kelvin = temp_celsius + 273.15
        rate = self.A * math.exp(-self.Ea / (self.R * T_kelvin))

        # 转换为DP/天
        rate_per_day = rate * 86400  # 秒 -> 天

        return rate_per_day

    def predict_remaining_life(
        self, current_dp: float, temp_celsius: float
    ) -> float:
        """
        预测剩余寿命 (年)

        Args:
            current_dp: 当前DP值
            temp_celsius: 运行温度 (°C)

        Returns:
            剩余寿命 (年)
        """
        if current_dp <= self.failure_dp:
            return 0

        aging_rate = self.predict_aging_rate(temp_celsius)

        if aging_rate <= 0:
            return float("inf")

        days_remaining = (current_dp - self.failure_dp) / aging_rate
        years_remaining = days_remaining / 365

        return years_remaining

    def analyze(
        self,
        current_dp: Optional[float] = None,
        temp_celsius: float = 85,
        operation_years: float = 10,
    ) -> AgingResult:
        """
        综合老化分析

        Args:
            current_dp: 当前DP值（如无测试，则根据运行年限估算）
            temp_celsius: 当前运行温度
            operation_years: 已运行年数

        Returns:
            AgingResult
        """
        # 估算当前DP
        if current_dp is None:
            # 基于运行年限和温度估算
            avg_rate = self.predict_aging_rate(temp_celsius)
            current_dp = self.initial_dp - avg_rate * operation_years * 365

        # 计算各项指标
        aging_rate = self.predict_aging_rate(temp_celsius)
        faa = self.calculate_FAA(temp_celsius)
        remaining_life = self.predict_remaining_life(current_dp, temp_celsius)

        # 寿命消耗百分比
        consumed_dp = self.initial_dp - current_dp
        total_consumable = self.initial_dp - self.failure_dp
        life_consumed_pct = (consumed_dp / total_consumable) * 100

        return AgingResult(
            current_dp=current_dp,
            aging_rate=aging_rate,
            life_loss_factor=faa,
            remaining_life_years=remaining_life,
            life_consumed_pct=life_consumed_pct,
        )

    def predict_dp_evolution(
        self,
        initial_dp: float,
        temp_profile: List[float],  # 每天的温度
    ) -> List[Dict]:
        """
        预测DP值演化

        Args:
            initial_dp: 初始DP
            temp_profile: 温度历史（每个元素代表一天的平均温度）

        Returns:
            DP演化历史
        """
        dp_history = []
        current_dp = initial_dp

        for day, temp in enumerate(temp_profile):
            rate = self.predict_aging_rate(temp)
            current_dp -= rate
            current_dp = max(current_dp, 0)

            dp_history.append(
                {
                    "day": day,
                    "dp": round(current_dp, 1),
                    "temperature": temp,
                    "rate": round(rate, 4),
                }
            )

        return dp_history


# 便捷函数
def quick_life_check(
    temp_celsius: float, current_dp: Optional[float] = None, operation_years: float = 10
) -> Dict:
    """快速寿命检查"""
    model = AgingModel()
    result = model.analyze(current_dp, temp_celsius, operation_years)
    return result.to_dict()


if __name__ == "__main__":
    # 测试
    print("=" * 60)
    print("绝缘老化模型测试")
    print("=" * 60)

    model = AgingModel()

    # 案例1：正常运行
    print("\n【案例1：85°C正常运行，已运行10年】")
    result1 = model.analyze(temp_celsius=85, operation_years=10)
    print(f"当前DP估计: {result1.current_dp:.1f}")
    print(f"老化速率: {result1.aging_rate:.4f} DP/天")
    print(f"寿命损失因子(FAA): {result1.life_loss_factor:.2f}x")
    print(f"剩余寿命: {result1.remaining_life_years:.1f} 年")
    print(f"寿命消耗: {result1.life_consumed_pct:.1f}%")

    # 案例2：高温运行
    print("\n【案例2：105°C高温运行（有缺陷）】")
    result2 = model.analyze(current_dp=450, temp_celsius=105)
    print(f"当前DP: {result2.current_dp:.1f}")
    print(f"老化速率: {result2.aging_rate:.4f} DP/天")
    print(f"寿命损失因子(FAA): {result2.life_loss_factor:.2f}x (正常的{result2.life_loss_factor:.1f}倍)")
    print(f"剩余寿命: {result2.remaining_life_years:.1f} 年 ({result2.remaining_life_years*365:.0f} 天)")
    print(f"寿命消耗: {result2.life_consumed_pct:.1f}%")

    # 案例3：降温后效果
    print("\n【案例3：降载后温度降至82°C】")
    result3 = model.analyze(current_dp=450, temp_celsius=82)
    print(f"老化速率: {result3.aging_rate:.4f} DP/天")
    print(f"剩余寿命: {result3.remaining_life_years:.1f} 年 ({result3.remaining_life_years*365:.0f} 天)")
    print(f"寿命延长: {(result3.remaining_life_years - result2.remaining_life_years)*365:.0f} 天")

    # 案例4：不同温度的FAA对比
    print("\n【案例4：温度对老化速率的影响】")
    print("温度(°C)  FAA    剩余寿命(年)")
    for temp in [80, 90, 100, 110, 120]:
        faa = model.calculate_FAA(temp)
        result = model.analyze(current_dp=450, temp_celsius=temp)
        print(f"  {temp:3d}     {faa:4.2f}x    {result.remaining_life_years:6.1f}")

    # 案例5：DP演化预测
    print("\n【案例5：未来30天DP演化（持续105°C）】")
    temp_profile = [105] * 30
    evolution = model.predict_dp_evolution(initial_dp=450, temp_profile=temp_profile)
    print("天数  DP值   老化速率")
    for point in evolution[::7]:  # 每周显示
        print(f" {point['day']:2d}   {point['dp']:5.1f}   {point['rate']:.4f}")

    print("\n" + "=" * 60)
    print("✓ 绝缘老化模型测试完成")
    print("=" * 60)
