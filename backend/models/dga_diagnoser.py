"""
DGA油色谱故障诊断引擎

支持多种诊断方法：
- IEC 60599 三比值法
- 杜瓦尔三角图
- Rogers比值法
- 大卫三角图

设计为可插拔模块，未来可升级为机器学习模型。
"""

from typing import Dict, List, Optional, Tuple
from enum import Enum
import math


class FaultType(Enum):
    """故障类型枚举"""
    NORMAL = "正常"
    PD = "局部放电"
    D1 = "低能量放电"
    D2 = "高能量放电"
    T1 = "低温过热 (<300°C)"
    T2 = "中温过热 (300-700°C)"
    T3 = "高温过热 (>700°C)"
    THERMAL = "热故障"
    DISCHARGE = "放电故障"
    MIX = "混合故障"


class DGAData:
    """DGA数据模型"""

    def __init__(
        self,
        H2: float,
        CH4: float,
        C2H6: float,
        C2H4: float,
        C2H2: float,
        CO: float,
        CO2: float,
        device_id: Optional[str] = None,
        timestamp: Optional[str] = None,
    ):
        self.H2 = H2
        self.CH4 = CH4
        self.C2H6 = C2H6
        self.C2H4 = C2H4
        self.C2H2 = C2H2
        self.CO = CO
        self.CO2 = CO2
        self.device_id = device_id
        self.timestamp = timestamp

    def to_dict(self) -> Dict:
        """转为字典"""
        return {
            "H2": self.H2,
            "CH4": self.CH4,
            "C2H6": self.C2H6,
            "C2H4": self.C2H4,
            "C2H2": self.C2H2,
            "CO": self.CO,
            "CO2": self.CO2,
            "device_id": self.device_id,
            "timestamp": self.timestamp,
        }


class DiagnosisResult:
    """诊断结果模型"""

    def __init__(
        self,
        fault_type: FaultType,
        confidence: float,
        severity: int,
        methods: Dict[str, str],
        ratios: Dict[str, float],
        recommendations: List[str],
        raw_data: DGAData,
    ):
        self.fault_type = fault_type
        self.confidence = confidence  # 0-1
        self.severity = severity  # 0-3 (正常/轻微/注意/严重)
        self.methods = methods  # 各方法的诊断结果
        self.ratios = ratios
        self.recommendations = recommendations
        self.raw_data = raw_data

    def to_dict(self) -> Dict:
        """转为字典"""
        return {
            "fault_type": self.fault_type.value,
            "confidence": self.confidence,
            "severity": self.severity,
            "severity_label": ["正常", "轻微", "注意", "严重"][self.severity],
            "methods": self.methods,
            "ratios": self.ratios,
            "recommendations": self.recommendations,
            "raw_data": self.raw_data.to_dict(),
        }


class DGADiagnoser:
    """
    DGA诊断器（规则引擎版本）

    未来可替换为MLDGADiagnoser或EnsembleDGADiagnoser
    """

    def __init__(self, config: Optional[Dict] = None):
        """
        初始化

        Args:
            config: 配置字典，包含标准限值等
        """
        self.config = config or {}
        self.limits = self.config.get("dga_limits", self._default_limits())

    def diagnose(self, dga_data: DGAData) -> DiagnosisResult:
        """
        综合诊断

        Args:
            dga_data: DGA数据

        Returns:
            DiagnosisResult: 诊断结果
        """
        # 1. 计算特征比值
        ratios = self._calculate_ratios(dga_data)

        # 2. 多方法诊断
        iec_result = self._iec_diagnosis(ratios)
        duval_result = self._duval_diagnosis(dga_data)
        rogers_result = self._rogers_diagnosis(ratios)

        # 3. 评估严重程度
        severity = self._assess_severity(dga_data)

        # 4. 综合判断（投票机制）
        fault_type, confidence = self._ensemble_decision(
            iec_result, duval_result, rogers_result
        )

        # 5. 生成建议
        recommendations = self._generate_recommendations(
            fault_type, severity, dga_data
        )

        return DiagnosisResult(
            fault_type=fault_type,
            confidence=confidence,
            severity=severity,
            methods={
                "IEC_60599": iec_result.value,
                "Duval": duval_result.value,
                "Rogers": rogers_result.value,
            },
            ratios=ratios,
            recommendations=recommendations,
            raw_data=dga_data,
        )

    def _calculate_ratios(self, data: DGAData) -> Dict[str, float]:
        """计算特征比值"""
        eps = 1e-6  # 防止除零

        return {
            "C2H2/C2H4": data.C2H2 / (data.C2H4 + eps),
            "CH4/H2": data.CH4 / (data.H2 + eps),
            "C2H4/C2H6": data.C2H4 / (data.C2H6 + eps),
            "CO2/CO": data.CO2 / (data.CO + eps),
        }

    def _iec_diagnosis(self, ratios: Dict[str, float]) -> FaultType:
        """
        IEC 60599 三比值法

        比值编码:
        - C2H2/C2H4: <0.1→0, 0.1-1→1, 1-3→1, >3→2
        - CH4/H2: <0.1→0, 0.1-1→0, 1-3→1, >3→2
        - C2H4/C2H6: <1→0, 1-3→1, >3→2
        """
        r1 = ratios["C2H2/C2H4"]
        r2 = ratios["CH4/H2"]
        r3 = ratios["C2H4/C2H6"]

        # 编码
        c1 = 0 if r1 < 0.1 else (1 if r1 < 3 else 2)
        c2 = 0 if r2 < 1 else (1 if r2 < 3 else 2)
        c3 = 0 if r3 < 1 else (1 if r3 < 3 else 2)

        code = (c1, c2, c3)

        # IEC 60599标准表
        iec_table = {
            (0, 0, 0): FaultType.NORMAL,
            (0, 0, 1): FaultType.PD,
            (0, 0, 2): FaultType.PD,
            (1, 0, 1): FaultType.D1,
            (1, 0, 2): FaultType.D1,
            (2, 0, 2): FaultType.D2,
            (0, 1, 0): FaultType.T1,
            (0, 2, 0): FaultType.T1,
            (0, 2, 1): FaultType.T2,
            (0, 2, 2): FaultType.T3,
        }

        return iec_table.get(code, FaultType.MIX)

    def _duval_diagnosis(self, data: DGAData) -> FaultType:
        """
        杜瓦尔三角图

        基于CH4, C2H4, C2H2的百分比
        """
        total = data.CH4 + data.C2H4 + data.C2H2

        if total < 1:  # 浓度太低
            return FaultType.NORMAL

        # 计算百分比
        pct_CH4 = data.CH4 / total * 100
        pct_C2H4 = data.C2H4 / total * 100
        pct_C2H2 = data.C2H2 / total * 100

        # 区域判断（简化版本）
        if pct_C2H2 > 50:
            return FaultType.D2  # 高能量放电
        elif pct_C2H2 > 15 and pct_C2H4 > 20:
            return FaultType.D1  # 低能量放电
        elif pct_C2H4 > 50:
            return FaultType.T3  # 高温过热
        elif pct_CH4 > 70:
            return FaultType.PD  # 局部放电
        elif pct_CH4 > 50:
            return FaultType.T1  # 低温过热
        else:
            return FaultType.T2  # 中温过热

    def _rogers_diagnosis(self, ratios: Dict[str, float]) -> FaultType:
        """Rogers比值法"""
        r1 = ratios["C2H2/C2H4"]
        r2 = ratios["CH4/H2"]
        r3 = ratios["C2H4/C2H6"]

        # Rogers判据
        if r1 < 0.1 and r2 < 0.1 and r3 < 1:
            return FaultType.NORMAL
        elif r1 < 0.1 and r3 < 1:
            return FaultType.PD
        elif r1 < 0.1 and r3 > 3:
            return FaultType.T3
        elif r1 > 1 and r3 > 3:
            return FaultType.D2
        elif r2 > 1 and r3 < 1:
            return FaultType.T1
        else:
            return FaultType.T2

    def _assess_severity(self, data: DGAData) -> int:
        """
        评估严重程度

        Returns:
            0: 正常
            1: 轻微异常
            2: 需要注意
            3: 严重，需立即处理
        """
        max_level = 0

        for gas, value in data.to_dict().items():
            if gas in ["device_id", "timestamp"]:
                continue

            limits = self.limits.get(gas, {})
            attention = limits.get("attention", float("inf"))
            alarm = limits.get("alarm", float("inf"))

            if value > alarm:
                max_level = max(max_level, 3)
            elif value > attention:
                max_level = max(max_level, 2)
            elif value > attention * 0.5:
                max_level = max(max_level, 1)

        return max_level

    def _ensemble_decision(
        self, iec: FaultType, duval: FaultType, rogers: FaultType
    ) -> Tuple[FaultType, float]:
        """
        集成决策（投票）

        Returns:
            (最终故障类型, 置信度)
        """
        votes = [iec, duval, rogers]

        # 统计投票
        from collections import Counter
        counter = Counter(votes)
        most_common = counter.most_common(1)[0]

        fault_type = most_common[0]
        confidence = most_common[1] / len(votes)

        return fault_type, confidence

    def _generate_recommendations(
        self, fault_type: FaultType, severity: int, data: DGAData
    ) -> List[str]:
        """生成处理建议"""
        recommendations = []

        # 基于故障类型
        if fault_type == FaultType.NORMAL:
            recommendations.append("设备运行正常，继续监测")
        elif fault_type == FaultType.PD:
            recommendations.append("检测到局部放电，建议：")
            recommendations.append("  1. 检查绝缘系统")
            recommendations.append("  2. 进行局部放电在线监测")
            recommendations.append("  3. 考虑降载运行")
        elif fault_type in [FaultType.D1, FaultType.D2]:
            recommendations.append("检测到放电故障，建议：")
            recommendations.append("  1. 立即降低负载至60%以下")
            recommendations.append("  2. 安排停运检修")
            recommendations.append("  3. 检查分接开关、套管等")
        elif fault_type in [FaultType.T1, FaultType.T2, FaultType.T3]:
            recommendations.append("检测到过热故障，建议：")
            recommendations.append("  1. 检查冷却系统是否正常")
            recommendations.append("  2. 检查负载分配")
            recommendations.append("  3. 检查接触电阻")

        # 基于严重程度
        if severity >= 3:
            recommendations.insert(0, "⚠️ 严重异常，建议立即停运检修！")
        elif severity == 2:
            recommendations.insert(0, "⚠️ 需要密切关注，建议48小时内复测")

        # 基于具体气体
        if data.C2H2 > self.limits["C2H2"]["alarm"]:
            recommendations.append(f"  ⚠️ 乙炔浓度{data.C2H2:.1f}ppm严重超标（限值{self.limits['C2H2']['alarm']}ppm）")

        if data.H2 > self.limits["H2"]["alarm"]:
            recommendations.append(f"  ⚠️ 氢气浓度{data.H2:.1f}ppm超标")

        return recommendations

    def _default_limits(self) -> Dict:
        """默认限值（IEC 60599）"""
        return {
            "H2": {"attention": 150, "alarm": 1000},
            "CH4": {"attention": 120, "alarm": 400},
            "C2H2": {"attention": 5, "alarm": 50},
            "C2H4": {"attention": 60, "alarm": 200},
            "C2H6": {"attention": 65, "alarm": 150},
            "CO": {"attention": 540, "alarm": 1400},
            "CO2": {"attention": 7000, "alarm": 15000},
        }


# 便捷函数
def quick_diagnose(
    H2: float,
    CH4: float,
    C2H6: float,
    C2H4: float,
    C2H2: float,
    CO: float,
    CO2: float,
) -> Dict:
    """
    快速诊断（无需创建对象）

    示例:
        result = quick_diagnose(H2=145, CH4=32, C2H2=78, ...)
        print(result['fault_type'])
    """
    dga_data = DGAData(H2, CH4, C2H6, C2H4, C2H2, CO, CO2)
    diagnoser = DGADiagnoser()
    result = diagnoser.diagnose(dga_data)
    return result.to_dict()


if __name__ == "__main__":
    # 测试案例
    print("=" * 60)
    print("DGA诊断引擎测试")
    print("=" * 60)

    # 案例1：正常
    print("\n【案例1：正常运行】")
    data1 = DGAData(
        H2=50, CH4=30, C2H6=15, C2H4=20, C2H2=1, CO=300, CO2=2000
    )
    diagnoser = DGADiagnoser()
    result1 = diagnoser.diagnose(data1)
    print(f"故障类型: {result1.fault_type.value}")
    print(f"严重程度: {['正常', '轻微', '注意', '严重'][result1.severity]}")
    print(f"置信度: {result1.confidence:.2f}")
    print("建议:")
    for rec in result1.recommendations:
        print(f"  {rec}")

    # 案例2：高能放电
    print("\n【案例2：高能放电故障】")
    data2 = DGAData(
        H2=145, CH4=32, C2H6=8, C2H4=45, C2H2=78, CO=420, CO2=3200
    )
    result2 = diagnoser.diagnose(data2)
    print(f"故障类型: {result2.fault_type.value}")
    print(f"严重程度: {['正常', '轻微', '注意', '严重'][result2.severity]}")
    print(f"置信度: {result2.confidence:.2f}")
    print(f"IEC诊断: {result2.methods['IEC_60599']}")
    print(f"Duval诊断: {result2.methods['Duval']}")
    print(f"特征比值:")
    for name, value in result2.ratios.items():
        print(f"  {name} = {value:.3f}")
    print("建议:")
    for rec in result2.recommendations:
        print(f"  {rec}")

    # 案例3：过热
    print("\n【案例3：高温过热】")
    data3 = DGAData(
        H2=80, CH4=150, C2H6=20, C2H4=180, C2H2=5, CO=600, CO2=5000
    )
    result3 = diagnoser.diagnose(data3)
    print(f"故障类型: {result3.fault_type.value}")
    print(f"严重程度: {['正常', '轻微', '注意', '严重'][result3.severity]}")
    print(f"置信度: {result3.confidence:.2f}")
    print("建议:")
    for rec in result3.recommendations:
        print(f"  {rec}")

    print("\n" + "=" * 60)
    print("✓ DGA诊断引擎测试完成")
    print("=" * 60)
