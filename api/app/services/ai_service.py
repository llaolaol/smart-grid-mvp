"""
AI Service
AI服务层
"""

import sys
from pathlib import Path

# 添加backend到路径
backend_path = Path(__file__).parent.parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from llm.llm_agent import LLMAgent
from app.schemas.ai import AIAnalysisRequest, MaintenanceRequest
from typing import Optional, Dict, Any


class AIService:
    def __init__(self):
        """初始化AI服务"""
        try:
            self.llm = LLMAgent(provider="deepseek")
        except Exception as e:
            print(f"LLM Agent initialization failed: {e}")
            self.llm = None

    def analyze_device(self, request: AIAnalysisRequest) -> str:
        """分析设备状态"""
        if self.llm is None:
            raise Exception("LLM Agent not initialized. Please check API key configuration.")

        try:
            analysis = self.llm.analyze_device(
                device_data=request.device_data,
                diagnosis_result=request.diagnosis_result,
                user_question=request.user_question
            )
            return analysis
        except Exception as e:
            raise Exception(f"AI analysis failed: {str(e)}")

    def get_maintenance_recommendation(self, request: MaintenanceRequest) -> str:
        """获取维护建议"""
        if self.llm is None:
            raise Exception("LLM Agent not initialized. Please check API key configuration.")

        try:
            recommendation = self.llm.get_maintenance_recommendation(
                device_data=request.device_data,
                simulation_result=request.simulation_result
            )
            return recommendation
        except Exception as e:
            raise Exception(f"Maintenance recommendation generation failed: {str(e)}")

    def is_available(self) -> bool:
        """检查AI服务是否可用"""
        return self.llm is not None


# 单例
ai_service = AIService()
