"""
智能电网MVP - 完整版Demo应用 (Final)

完整功能：
- 集成数据生成器
- 支持多设备选择
- 支持多场景切换
- 真实数据驱动
- DeepSeek LLM智能对话 🆕
- PDF报告生成 🆕

运行: streamlit run demo_app_final.py
"""

import sys
from pathlib import Path

# 添加backend到路径
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from models.dga_diagnoser import DGADiagnoser, DGAData
from models.thermal_model import ThermalModel
from models.aging_model import AgingModel
from models.simulator import Simulator, ScenarioConfig
from data.data_loader import DataLoader
from llm.llm_agent import LLMAgent
from reports.pdf_generator import PDFReportGenerator
import os

# 页面配置
st.set_page_config(
    page_title="智能电网运维平台 MVP Final",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 设置API密钥环境变量
os.environ['DEEPSEEK_API_KEY'] = 'sk-a87064c3ac3240839f9e8595a85ccb4b'

# 自定义CSS
st.markdown("""
<style>
.big-metric {
    font-size: 2rem;
    font-weight: bold;
}
.status-warning {
    color: #f59e0b;
}
.status-danger {
    color: #ef4444;
}
.status-safe {
    color: #10b981;
}
.device-card {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    margin: 0.5rem 0;
}
</style>
""", unsafe_allow_html=True)

# 初始化session state
if 'simulation_result' not in st.session_state:
    st.session_state.simulation_result = None
if 'selected_device' not in st.session_state:
    st.session_state.selected_device = None
if 'current_scenario' not in st.session_state:
    st.session_state.current_scenario = "mixed"

# 初始化模型和数据加载器
@st.cache_resource
def load_models():
    try:
        llm = LLMAgent(provider="deepseek")
    except Exception as e:
        llm = None  # LLM初始化失败时使用None

    try:
        pdf_gen = PDFReportGenerator()
    except Exception as e:
        pdf_gen = None

    return {
        'dga': DGADiagnoser(),
        'thermal': ThermalModel(),
        'aging': AgingModel(),
        'simulator': Simulator(),
        'data_loader': DataLoader(),
        'llm': llm,
        'pdf': pdf_gen
    }

models = load_models()
data_loader = models['data_loader']

# 侧边栏 - 场景和设备选择
st.sidebar.title("⚡ 智能电网运维平台 Final")
st.sidebar.markdown("---")

# 场景选择
st.sidebar.subheader("📁 数据场景")
available_scenarios = data_loader.list_available_scenarios()
scenario_names = {
    "all_normal": "🟢 全部正常",
    "mixed": "🟡 混合场景",
    "multiple_faults": "🔴 多设备故障"
}

selected_scenario = st.sidebar.selectbox(
    "选择场景",
    available_scenarios,
    format_func=lambda x: scenario_names.get(x, x),
    key="scenario_selector"
)

if selected_scenario != st.session_state.current_scenario:
    st.session_state.current_scenario = selected_scenario
    st.session_state.selected_device = None  # 重置设备选择

# 加载场景数据
devices_data = data_loader.load_scenario(selected_scenario)

# 设备选择
st.sidebar.subheader("🔌 设备选择")

device_options = {}
for device in devices_data:
    severity = device['severity']
    device_id = device['device_id']
    fault_type = device['fault_type']
    device_name = device['device_name']

    if severity >= 2:
        status_icon = "⚠️ "
    elif severity == 1:
        status_icon = "🟡"
    else:
        status_icon = "✅"

    device_options[device_id] = f"{status_icon} {device_name}"

selected_device_id = st.sidebar.selectbox(
    "选择设备",
    list(device_options.keys()),
    format_func=lambda x: device_options[x],
    key="device_selector"
)

# 获取当前选中的设备数据
current_device = next((d for d in devices_data if d['device_id'] == selected_device_id), None)

if current_device:
    st.session_state.selected_device = current_device

    # 显示设备状态
    severity = current_device['severity']
    fault_type = current_device['fault_type']

    if severity >= 2:
        status_badge = "🔴 严重故障"
        status_color = "danger"
    elif severity == 1:
        status_badge = "🟡 轻微异常"
        status_color = "warning"
    else:
        status_badge = "✅ 运行正常"
        status_color = "safe"

    st.sidebar.markdown(f"**状态**: {status_badge}")
    st.sidebar.markdown(f"**故障类型**: {fault_type}")
    st.sidebar.markdown("---")

    # 显示关键指标
    st.sidebar.subheader("📊 关键指标")
    hotspot_temp = current_device['thermal']['hotspot_temp']
    c2h2 = current_device['dga']['C2H2']
    current_dp = current_device['aging']['current_dp']

    st.sidebar.metric("热点温度", f"{hotspot_temp:.1f} °C")
    st.sidebar.metric("乙炔 (C₂H₂)", f"{c2h2:.1f} ppm")
    st.sidebar.metric("聚合度 (DP)", f"{current_dp:.0f}")

# 准备设备数据（用于所有tabs）
device_id = selected_device_id
dga_data = current_device['dga'] if current_device else {}

# 进行DGA诊断（用于Tab 1, Tab 5, Tab 6）
diagnosis = None
diagnosis_dict = None
if current_device and dga_data:
    dga_obj = DGAData(**dga_data)
    diagnosis = models['dga'].diagnose(dga_obj)
    diagnosis_dict = {
        'fault_type': diagnosis.fault_type.value,
        'severity': diagnosis.severity,
        'confidence': diagnosis.confidence,
        'ratios': diagnosis.ratios,
        'recommendations': diagnosis.recommendations
    }

# 主标签页
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "🔍 诊断分析",
    "🎯 数字沙盘",
    "📊 对比报告",
    "📈 场景总览",
    "🤖 AI对话",
    "📄 PDF报告"
])

# ==================== Tab 1: 诊断分析 ====================
with tab1:
    if current_device and diagnosis:
        st.header(f"📋 {current_device['device_name']} - 综合诊断")

        # 显示诊断结果
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("诊断结果", diagnosis.fault_type.value)

        with col2:
            severity_labels = ['正常', '轻微', '注意', '严重']
            st.metric("严重程度", severity_labels[diagnosis.severity])

        with col3:
            st.metric("置信度", f"{diagnosis.confidence:.0%}")

        st.markdown("---")

        # DGA数据表格
        col1, col2 = st.columns(2)

        with col1:
            st.subheader("DGA数据")
            dga_df = pd.DataFrame({
                "气体": ["H₂", "CH₄", "C₂H₆", "C₂H₄", "C₂H₂", "CO", "CO₂"],
                "浓度 (ppm)": [
                    dga_data['H2'],
                    dga_data['CH4'],
                    dga_data['C2H6'],
                    dga_data['C2H4'],
                    dga_data['C2H2'],
                    dga_data['CO'],
                    dga_data['CO2']
                ]
            })
            st.dataframe(dga_df, use_container_width=True)

        with col2:
            st.subheader("特征比值")
            ratios_df = pd.DataFrame({
                "比值": list(diagnosis.ratios.keys()),
                "数值": [f"{v:.2f}" for v in diagnosis.ratios.values()]
            })
            st.dataframe(ratios_df, use_container_width=True)

        # 热分析
        st.subheader("🔥 热分析")
        thermal_data = current_device['thermal']

        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.metric("油温", f"{thermal_data['oil_temp']:.1f} °C")

        with col2:
            temp_status = "⚠️ 超标" if hotspot_temp > 110 else "正常"
            st.metric("热点温度", f"{hotspot_temp:.1f} °C", temp_status)

        with col3:
            st.metric("环境温度", f"{thermal_data['ambient_temp']:.1f} °C")

        with col4:
            st.metric("负载", f"{current_device['operating_condition']['load_percent']:.0f} %")

        # 老化分析
        st.subheader("⏳ 老化分析")
        aging_data = current_device['aging']

        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("当前DP值", f"{current_dp:.0f}")

        with col2:
            device_age = aging_data['device_age']
            st.metric("运行年限", f"{device_age:.1f} 年")

        with col3:
            aging_rate = aging_data['aging_rate']
            st.metric("老化速率", f"{aging_rate:.3f} DP/天")

        # 建议措施
        st.subheader("💡 建议措施")
        for i, rec in enumerate(diagnosis.recommendations, 1):
            st.markdown(f"{i}. {rec}")

# ==================== Tab 2: 数字沙盘 ====================
with tab2:
    if current_device:
        st.header("🎯 What-if 推演")

        st.markdown("""
        通过调整运行参数，预测设备未来状态和寿命变化。
        """)

        col1, col2 = st.columns([2, 1])

        with col1:
            st.subheader("调整参数")

            current_load = current_device['operating_condition']['load_percent']
            current_ambient = current_device['thermal']['ambient_temp']

            new_load = st.slider(
                "负载率 (%)",
                min_value=20,
                max_value=130,
                value=int(current_load),
                step=5
            )

            new_ambient = st.slider(
                "环境温度 (°C)",
                min_value=-10,
                max_value=45,
                value=int(current_ambient),
                step=5
            )

        with col2:
            st.subheader("快捷推演")

            if st.button("🔽 降低30%负载"):
                new_load = max(20, int(current_load * 0.7))

            if st.button("🔼 提升10%负载"):
                new_load = min(130, int(current_load * 1.1))

            if st.button("❄️ 冬季工况"):
                new_ambient = -5

            if st.button("☀️ 夏季工况"):
                new_ambient = 38

        if st.button("▶️ 开始推演", type="primary"):
            with st.spinner("正在运行热-电-化学耦合模型..."):
                import time
                time.sleep(1)  # 模拟计算

                # 创建两个场景进行对比
                scenario_current = ScenarioConfig(
                    name="当前工况",
                    load_percent=current_load,
                    ambient_temp=current_ambient
                )
                scenario_new = ScenarioConfig(
                    name="推演工况",
                    load_percent=new_load,
                    ambient_temp=new_ambient
                )

                # 初始状态
                initial_state = {
                    "dga": dga_data,
                    "dp": current_dp,
                    "operation_years": 10
                }

                # 运行A/B对比
                comparison = models['simulator'].compare(scenario_current, scenario_new, initial_state)
                st.session_state.simulation_result = comparison

                st.success("✅ 推演完成！请切换到「📊 对比报告」标签页查看详细结果 →")

        # 持续显示状态
        if st.session_state.simulation_result:
            st.info("💡 推演结果已生成，请切换到「📊 对比报告」查看")

# ==================== Tab 3: 对比报告 ====================
with tab3:
    if st.session_state.simulation_result:
        result = st.session_state.simulation_result
        result_a = result['scenario_a']
        result_b = result['scenario_b']
        improvements = result['improvements']

        st.header("📊 工况对比分析")

        # 关键指标改善
        st.subheader("💡 关键指标改善")
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric(
                "温度降低",
                f"{improvements['temperature_reduction']:.1f} °C",
                "效果显著" if improvements['temperature_reduction'] > 0 else "温度升高"
            )

        with col2:
            st.metric(
                "产气速率降低",
                f"{improvements['gas_rate_reduction_pct']:.0f}%",
                "缺陷被抑制" if improvements['gas_rate_reduction_pct'] > 0 else "产气增加"
            )

        with col3:
            st.metric(
                "寿命延长",
                f"{improvements['life_extension_days']:.0f} 天",
                "风险解除" if improvements['life_extension_days'] > 0 else "寿命缩短"
            )

        st.markdown("---")

        # A/B对比表
        st.subheader("📋 详细指标对比")

        comparison_data = {
            "关键机理指标": [
                "绕组热点温度 (°C)",
                "C₂H₂产气速率 (ppm/天)",
                "7天后C₂H₂浓度 (ppm)",
                "老化速率 (DP/天)",
                "预计失效时间 (天)"
            ],
            "A: 当前工况": [
                f"{result_a['thermal']['hotspot_temp']:.1f}",
                f"{result_a['dga_projection']['production_rates']['C2H2']:.4f}",
                f"{result_a['dga_projection']['projected_concentrations']['C2H2']:.1f}",
                f"{result_a['aging']['aging_rate']:.4f}",
                f"{result_a['tte_days']:.0f}"
            ],
            "B: 推演工况": [
                f"{result_b['thermal']['hotspot_temp']:.1f}",
                f"{result_b['dga_projection']['production_rates']['C2H2']:.4f}",
                f"{result_b['dga_projection']['projected_concentrations']['C2H2']:.1f}",
                f"{result_b['aging']['aging_rate']:.4f}",
                f"{result_b['tte_days']:.0f}"
            ]
        }

        comparison_df = pd.DataFrame(comparison_data)
        st.table(comparison_df)

        # 可视化对比
        st.markdown("---")
        st.subheader("📈 温度对比")

        fig = go.Figure()

        categories = ['热点温度', '油温']
        baseline_temps = [
            result_a['thermal']['hotspot_temp'],
            result_a['thermal']['oil_top_temp']
        ]
        simulated_temps = [
            result_b['thermal']['hotspot_temp'],
            result_b['thermal']['oil_top_temp']
        ]

        fig.add_trace(go.Bar(
            name='当前工况',
            x=categories,
            y=baseline_temps,
            marker_color='#ef4444'
        ))

        fig.add_trace(go.Bar(
            name='推演工况',
            x=categories,
            y=simulated_temps,
            marker_color='#10b981'
        ))

        fig.update_layout(
            barmode='group',
            yaxis_title='温度 (°C)',
            height=400
        )

        st.plotly_chart(fig, use_container_width=True)

        # 建议
        st.subheader("💡 推演结论")

        if improvements['life_extension_days'] > 0:
            st.success(f"""
            ✅ **机理引擎推演结论**：

            推演工况可将安全运行窗口期从 {result_a['tte_days']:.0f} 天延长至 {result_b['tte_days']:.0f} 天，
            为安排检修提供了充足时间。热点温度降低 {improvements['temperature_reduction']:.1f} °C，
            产气速率降低 {improvements['gas_rate_reduction_pct']:.0f}%。
            """)
        else:
            st.warning(f"""
            ⚠️ **机理引擎推演结论**：

            推演工况会缩短设备寿命约 {abs(improvements['life_extension_days']):.0f} 天，
            不建议采用此工况运行。
            """)

    else:
        st.info("💡 请先在「数字沙盘」中运行推演")

# ==================== Tab 4: 场景总览 ====================
with tab4:
    st.header("📈 场景总览")

    st.subheader(f"场景: {scenario_names.get(selected_scenario, selected_scenario)}")

    # 设备统计
    col1, col2, col3 = st.columns(3)

    total_devices = len(devices_data)
    normal_devices = sum(1 for d in devices_data if d['severity'] == 0)
    warning_devices = sum(1 for d in devices_data if d['severity'] == 1)
    critical_devices = sum(1 for d in devices_data if d['severity'] >= 2)

    with col1:
        st.metric("总设备数", total_devices)

    with col2:
        st.metric("正常设备", f"{normal_devices} ({normal_devices/total_devices*100:.0f}%)")

    with col3:
        st.metric("故障设备", f"{critical_devices} ({critical_devices/total_devices*100:.0f}%)")

    # 设备列表
    st.subheader("设备详情")

    for device in devices_data:
        severity = device['severity']
        device_id = device['device_id']
        fault_type = device['fault_type']
        device_name = device['device_name']
        hotspot = device['thermal']['hotspot_temp']
        c2h2 = device['dga']['C2H2']

        if severity >= 2:
            status_icon = "🔴"
            status_text = "严重故障"
        elif severity == 1:
            status_icon = "🟡"
            status_text = "轻微异常"
        else:
            status_icon = "✅"
            status_text = "正常"

        with st.container():
            col1, col2, col3, col4, col5 = st.columns([2, 2, 2, 2, 2])

            with col1:
                st.markdown(f"**{status_icon} {device_name}**")

            with col2:
                st.markdown(f"状态: {status_text}")

            with col3:
                st.markdown(f"故障: {fault_type}")

            with col4:
                st.markdown(f"热点: {hotspot:.1f}°C")

            with col5:
                st.markdown(f"C₂H₂: {c2h2:.1f} ppm")

            st.markdown("---")

# ==================== Tab 5: AI对话 ====================
with tab5:
    st.header("🤖 AI对话助手")

    if models['llm'] is None:
        st.error("❌ LLM Agent未能初始化，请检查API密钥配置")
        st.info("""
        请设置DeepSeek API密钥：
        1. 环境变量: `export DEEPSEEK_API_KEY='your-key'`
        2. 或在config.yaml中配置
        """)
    else:
        st.success("✅ AI助手已就绪 (DeepSeek)")

        # 自动分析按钮
        if st.button("🔍 分析当前设备状态", type="primary"):
            with st.spinner("AI正在分析设备数据..."):
                # 调用LLM分析
                analysis = models['llm'].analyze_device(
                    device_data=current_device,
                    diagnosis_result=diagnosis_dict
                )

                st.subheader("📋 AI分析报告")
                st.markdown(analysis)

                # 保存到session state
                if 'ai_analysis' not in st.session_state:
                    st.session_state.ai_analysis = {}
                st.session_state.ai_analysis[device_id] = analysis

        # 显示之前的分析结果
        if 'ai_analysis' in st.session_state and device_id in st.session_state.ai_analysis:
            st.subheader("📋 上次分析结果")
            with st.expander("查看详情", expanded=False):
                st.markdown(st.session_state.ai_analysis[device_id])

        st.markdown("---")

        # 自由问答
        st.subheader("💬 自由提问")
        st.info("您可以向AI专家询问关于当前设备的任何问题")

        user_question = st.text_area(
            "请输入您的问题：",
            placeholder="例如：这个设备的主要问题是什么？需要采取什么措施？",
            height=100
        )

        if st.button("💬 提问", disabled=not user_question):
            with st.spinner("AI正在思考..."):
                answer = models['llm'].analyze_device(
                    device_data=current_device,
                    diagnosis_result=diagnosis_dict,
                    user_question=user_question
                )

                st.subheader("🤖 AI回答")
                st.markdown(answer)

        # 维护建议
        st.markdown("---")
        st.subheader("🔧 维护建议")

        if st.button("获取维护建议"):
            with st.spinner("AI正在生成维护建议..."):
                # 如果有推演结果，一起传入
                sim_result = st.session_state.get('simulation_result')

                recommendation = models['llm'].get_maintenance_recommendation(
                    device_data=current_device,
                    simulation_result=sim_result
                )

                st.markdown(recommendation)

# ==================== Tab 6: PDF报告 ====================
with tab6:
    st.header("📄 PDF报告生成")

    if models['pdf'] is None:
        st.error("❌ PDF生成器未能初始化，请检查reportlab库")
        st.info("安装命令: `pip install reportlab`")
    else:
        st.success("✅ PDF生成器已就绪")

        # 诊断报告
        st.subheader("📋 诊断报告")
        st.info(f"为设备 **{current_device['device_name']}** 生成诊断报告")

        col1, col2 = st.columns(2)

        with col1:
            if st.button("📥 生成诊断报告", type="primary"):
                with st.spinner("正在生成PDF..."):
                    try:
                        pdf_path = models['pdf'].generate_diagnosis_report(
                            device_data=current_device,
                            diagnosis_result=diagnosis_dict
                        )
                        st.success(f"✅ 报告已生成！")
                        st.code(pdf_path, language=None)

                        # 读取PDF文件并提供下载
                        with open(pdf_path, 'rb') as f:
                            pdf_bytes = f.read()

                        st.download_button(
                            label="⬇️ 下载诊断报告",
                            data=pdf_bytes,
                            file_name=f"diagnosis_{device_id}.pdf",
                            mime="application/pdf"
                        )

                    except Exception as e:
                        st.error(f"❌ 生成失败：{str(e)}")

        # 推演报告
        st.markdown("---")
        st.subheader("🎯 推演报告")

        if 'simulation_result' in st.session_state:
            st.info(f"为设备 **{current_device['device_name']}** 生成推演对比报告")

            if st.button("📥 生成推演报告", type="primary"):
                with st.spinner("正在生成PDF..."):
                    try:
                        pdf_path = models['pdf'].generate_simulation_report(
                            device_data=current_device,
                            simulation_result=st.session_state.simulation_result
                        )
                        st.success(f"✅ 报告已生成！")
                        st.code(pdf_path, language=None)

                        # 读取PDF文件并提供下载
                        with open(pdf_path, 'rb') as f:
                            pdf_bytes = f.read()

                        st.download_button(
                            label="⬇️ 下载推演报告",
                            data=pdf_bytes,
                            file_name=f"simulation_{device_id}.pdf",
                            mime="application/pdf"
                        )

                    except Exception as e:
                        st.error(f"❌ 生成失败：{str(e)}")
        else:
            st.warning("⚠️ 请先在「数字沙盘」中运行推演，才能生成推演报告")

        # 批量报告生成
        st.markdown("---")
        st.subheader("📦 批量报告生成")
        st.info("为当前场景下所有设备生成诊断报告")

        if st.button("📥 批量生成诊断报告"):
            with st.spinner(f"正在为 {len(devices_data)} 个设备生成报告..."):
                generated_files = []
                failed_devices = []

                progress_bar = st.progress(0)

                for idx, device in enumerate(devices_data):
                    try:
                        # 生成诊断结果
                        device_dga = DGAData(**device['dga'])
                        device_diagnosis = models['dga'].diagnose(device_dga)

                        # 转换为字典
                        device_diagnosis_dict = {
                            'fault_type': device_diagnosis.fault_type.value,
                            'severity': device_diagnosis.severity,
                            'confidence': device_diagnosis.confidence,
                            'ratios': device_diagnosis.ratios,
                            'recommendations': device_diagnosis.recommendations
                        }

                        # 生成PDF
                        pdf_path = models['pdf'].generate_diagnosis_report(
                            device_data=device,
                            diagnosis_result=device_diagnosis_dict
                        )
                        generated_files.append(pdf_path)

                    except Exception as e:
                        failed_devices.append(f"{device['device_id']}: {str(e)}")

                    # 更新进度
                    progress_bar.progress((idx + 1) / len(devices_data))

                # 显示结果
                st.success(f"✅ 成功生成 {len(generated_files)}/{len(devices_data)} 份报告")

                if generated_files:
                    st.info("生成的报告文件：")
                    for path in generated_files:
                        st.code(path, language=None)

                if failed_devices:
                    with st.expander("❌ 失败的设备", expanded=False):
                        for fail in failed_devices:
                            st.error(fail)

# 底部信息
st.sidebar.markdown("---")
st.sidebar.info("""
**智能电网运维平台 MVP Final**

✨ 全功能版本：
- 多场景支持
- 真实数据驱动
- 多设备监控
- 智能推演
- 🤖 AI对话助手 (DeepSeek)
- 📄 PDF报告生成

Version 3.0 Final
""")
