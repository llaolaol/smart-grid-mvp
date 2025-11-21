"""
Diagnosis Service
诊断服务 - 封装现有DGA诊断模型
"""

from models.dga_diagnoser import DGADiagnoser, DGAData as ModelDGAData
from app.schemas.diagnosis import DiagnosisRequest, DiagnosisResult


class DiagnosisService:
    """诊断服务"""

    def __init__(self):
        """初始化诊断器"""
        self.diagnoser = DGADiagnoser()

    def diagnose(self, request: DiagnosisRequest) -> DiagnosisResult:
        """
        执行DGA诊断

        Args:
            request: 诊断请求（包含DGA数据）

        Returns:
            DiagnosisResult: 诊断结果
        """
        # 转换为模型需要的DGA数据格式
        dga_data = ModelDGAData(**request.dga_data.dict())

        # 调用现有模型进行诊断
        diagnosis = self.diagnoser.diagnose(dga_data)

        # 转换为API响应格式
        result = DiagnosisResult(
            fault_type=diagnosis.fault_type.value,
            severity=diagnosis.severity,
            confidence=diagnosis.confidence,
            ratios=diagnosis.ratios,
            recommendations=diagnosis.recommendations
        )

        return result


# Global instance
diagnosis_service = DiagnosisService()
