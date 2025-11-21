"""
LLM Agent - 智能对话接口

支持多个LLM提供商：
- DeepSeek API (推荐，性价比高)
- OpenAI API
- 其他兼容OpenAI格式的API

使用方式:
1. 设置环境变量 DEEPSEEK_API_KEY 或 OPENAI_API_KEY
2. 或在config.yaml中配置API密钥
"""

import os
from typing import Dict, List, Optional
import yaml
from pathlib import Path


class LLMAgent:
    """LLM智能代理 - 提供设备诊断和运维建议"""

    def __init__(self, provider: str = "deepseek", api_key: Optional[str] = None):
        """
        初始化LLM Agent

        Args:
            provider: LLM提供商 ("deepseek" 或 "openai")
            api_key: API密钥（可选，优先使用此参数，否则从环境变量或配置文件读取）
        """
        self.provider = provider.lower()
        self.api_key = api_key or self._load_api_key()

        if not self.api_key:
            raise ValueError(
                f"未找到{provider}的API密钥。请通过以下方式之一提供：\n"
                f"1. 传入api_key参数\n"
                f"2. 设置环境变量 {provider.upper()}_API_KEY\n"
                f"3. 在config.yaml中配置api_key"
            )

        # 初始化客户端
        self._init_client()

        # 系统提示词
        self.system_prompt = self._load_system_prompt()

    def _load_api_key(self) -> Optional[str]:
        """从环境变量或配置文件加载API密钥"""
        # 1. 尝试从环境变量读取
        env_var = f"{self.provider.upper()}_API_KEY"
        api_key = os.getenv(env_var)

        if api_key:
            return api_key

        # 2. 尝试从配置文件读取
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        if config_path.exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
                if 'llm' in config and 'api_key' in config['llm']:
                    return config['llm']['api_key']

        return None

    def _init_client(self):
        """初始化LLM客户端"""
        try:
            if self.provider == "deepseek":
                # DeepSeek使用OpenAI兼容接口
                from openai import OpenAI
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url="https://api.deepseek.com/v1"
                )
                self.model = "deepseek-chat"

            elif self.provider == "openai":
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
                self.model = "gpt-4"

            else:
                raise ValueError(f"不支持的LLM提供商: {self.provider}")

        except ImportError:
            raise ImportError(
                "请安装openai库：pip install openai\n"
                "DeepSeek和OpenAI都使用相同的客户端库"
            )

    def _load_system_prompt(self) -> str:
        """加载系统提示词"""
        return """你是一个专业的电力设备运维专家，精通变压器故障诊断和预测性维护。

你的专业领域包括：
1. DGA (溶解气体分析) 故障诊断
2. 变压器热分析和负载管理
3. 绝缘老化评估和寿命预测
4. 运维策略优化建议

回答要求：
- 基于提供的数据进行专业分析
- 给出明确的诊断结论和建议
- 解释技术原理但使用简洁语言
- 提供可操作的运维建议
- 如果数据不足，明确指出需要哪些额外信息

请始终保持专业、准确、实用。
"""

    def analyze_device(
        self,
        device_data: Dict,
        diagnosis_result: Optional[Dict] = None,
        user_question: Optional[str] = None
    ) -> str:
        """
        分析设备状态并提供运维建议

        Args:
            device_data: 设备数据（包含DGA、热参数、老化参数等）
            diagnosis_result: DGA诊断结果（可选）
            user_question: 用户问题（可选）

        Returns:
            LLM分析和建议
        """
        # 构建上下文
        context = self._build_context(device_data, diagnosis_result)

        # 构建用户消息
        if user_question:
            user_message = f"设备状态：\n{context}\n\n用户问题：{user_question}"
        else:
            user_message = f"请分析以下设备状态并给出运维建议：\n{context}"

        # 调用LLM
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            return response.choices[0].message.content

        except Exception as e:
            return f"LLM调用失败：{str(e)}\n\n请检查API密钥和网络连接。"

    def _build_context(self, device_data: Dict, diagnosis_result: Optional[Dict]) -> str:
        """构建设备状态上下文"""
        context_parts = []

        # 设备基本信息
        context_parts.append(f"设备：{device_data.get('device_name', device_data.get('device_id', '未知'))}")

        # DGA数据
        if 'dga' in device_data:
            dga = device_data['dga']
            context_parts.append("\nDGA数据：")
            context_parts.append(f"  H₂: {dga.get('H2', 0):.1f} ppm")
            context_parts.append(f"  CH₄: {dga.get('CH4', 0):.1f} ppm")
            context_parts.append(f"  C₂H₆: {dga.get('C2H6', 0):.1f} ppm")
            context_parts.append(f"  C₂H₄: {dga.get('C2H4', 0):.1f} ppm")
            context_parts.append(f"  C₂H₂: {dga.get('C2H2', 0):.1f} ppm")
            context_parts.append(f"  CO: {dga.get('CO', 0):.1f} ppm")
            context_parts.append(f"  CO₂: {dga.get('CO2', 0):.1f} ppm")

        # 诊断结果
        if diagnosis_result:
            context_parts.append(f"\n诊断结果：")
            context_parts.append(f"  故障类型：{diagnosis_result.get('fault_type', '未知')}")
            context_parts.append(f"  严重程度：{diagnosis_result.get('severity', 0)}/3")
            context_parts.append(f"  置信度：{diagnosis_result.get('confidence', 0):.0%}")

        # 热参数
        if 'thermal' in device_data:
            thermal = device_data['thermal']
            context_parts.append("\n热参数：")
            context_parts.append(f"  热点温度：{thermal.get('hotspot_temp', 0):.1f}°C")
            context_parts.append(f"  油温：{thermal.get('oil_temp', 0):.1f}°C")
            context_parts.append(f"  环境温度：{thermal.get('ambient_temp', 0):.1f}°C")

        # 老化参数
        if 'aging' in device_data:
            aging = device_data['aging']
            context_parts.append("\n老化参数：")
            context_parts.append(f"  当前DP值：{aging.get('current_dp', 0):.0f}")
            context_parts.append(f"  运行年限：{aging.get('device_age', 0):.1f}年")
            context_parts.append(f"  老化速率：{aging.get('aging_rate', 0):.4f} DP/天")

        # 运行工况
        if 'operating_condition' in device_data:
            op = device_data['operating_condition']
            context_parts.append("\n运行工况：")
            context_parts.append(f"  负载率：{op.get('load_percent', 0):.0f}%")

        # 故障信息
        if 'fault_type' in device_data:
            context_parts.append(f"\n当前状态：{device_data['fault_type']}")
            context_parts.append(f"严重程度：{device_data.get('severity', 0)}")

        return "\n".join(context_parts)

    def chat(self, messages: List[Dict[str, str]]) -> str:
        """
        多轮对话

        Args:
            messages: 消息历史，格式：[{"role": "user"/"assistant", "content": "..."}]

        Returns:
            LLM回复
        """
        try:
            # 添加系统提示
            full_messages = [{"role": "system", "content": self.system_prompt}] + messages

            response = self.client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                temperature=0.7,
                max_tokens=1000
            )

            return response.choices[0].message.content

        except Exception as e:
            return f"LLM调用失败：{str(e)}"

    def get_maintenance_recommendation(
        self,
        device_data: Dict,
        simulation_result: Optional[Dict] = None
    ) -> str:
        """
        获取维护建议

        Args:
            device_data: 设备数据
            simulation_result: 推演结果（可选）

        Returns:
            维护建议
        """
        context = self._build_context(device_data, None)

        user_message = f"设备状态：\n{context}\n\n"

        if simulation_result:
            user_message += f"\n推演结果：\n"
            user_message += f"  当前工况预计寿命损失：{simulation_result.get('baseline', {}).get('life_loss_days', 0):.0f}天\n"
            user_message += f"  优化工况预计寿命损失：{simulation_result.get('simulated', {}).get('life_loss_days', 0):.0f}天\n"
            user_message += f"  寿命延长：{simulation_result.get('changes', {}).get('life_extension_days', 0):.0f}天\n"

        user_message += "\n请基于以上信息，提供具体的维护建议和操作步骤。"

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=1500
            )

            return response.choices[0].message.content

        except Exception as e:
            return f"LLM调用失败：{str(e)}"


# 便捷函数
def quick_analyze(device_data: Dict, provider: str = "deepseek", api_key: Optional[str] = None) -> str:
    """
    快速分析设备状态

    Args:
        device_data: 设备数据
        provider: LLM提供商
        api_key: API密钥

    Returns:
        分析结果
    """
    agent = LLMAgent(provider=provider, api_key=api_key)
    return agent.analyze_device(device_data)


if __name__ == "__main__":
    # 测试（需要设置API密钥）
    print("=" * 70)
    print("LLM Agent 测试")
    print("=" * 70)

    # 模拟设备数据
    test_device = {
        "device_id": "T001",
        "device_name": "1号主变",
        "dga": {
            "H2": 145.0,
            "CH4": 32.0,
            "C2H6": 8.0,
            "C2H4": 45.0,
            "C2H2": 78.0,
            "CO": 420.0,
            "CO2": 3200.0
        },
        "thermal": {
            "hotspot_temp": 105.3,
            "oil_temp": 85.2,
            "ambient_temp": 25.0
        },
        "aging": {
            "current_dp": 450.2,
            "device_age": 10.5,
            "aging_rate": 0.159
        },
        "fault_type": "high_energy_discharge",
        "severity": 3
    }

    try:
        # 测试分析
        agent = LLMAgent(provider="deepseek")
        print("\n测试1: 设备状态分析")
        print("-" * 70)
        result = agent.analyze_device(test_device)
        print(result)

        print("\n测试2: 用户问答")
        print("-" * 70)
        result = agent.analyze_device(
            test_device,
            user_question="这个设备的主要问题是什么？需要采取什么紧急措施？"
        )
        print(result)

        print("\n✅ LLM Agent测试通过")

    except ValueError as e:
        print(f"\n⚠️  配置提示：{e}")
        print("\n请按照以下步骤配置API密钥：")
        print("1. 获取DeepSeek API密钥：https://platform.deepseek.com/")
        print("2. 设置环境变量：export DEEPSEEK_API_KEY='your-api-key'")
        print("3. 或在config.yaml中添加：llm: {api_key: 'your-api-key'}")

    except Exception as e:
        print(f"\n❌ 测试失败：{str(e)}")
