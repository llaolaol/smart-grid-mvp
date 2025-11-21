"""
智能电网MVP - 一体化Demo应用

完整集成：DGA诊断 + 热模型 + 老化模型 + What-if推演

运行: streamlit run demo_app.py
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

# 页面配置
st.set_page_config(
    page_title="智能电网运维平台 MVP",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

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
</style>
""", unsafe_allow_html=True)

# 初始化session state
if 'simulation_result' not in st.session_state:
    st.session_state.simulation_result = None

# 初始化模型
@st.cache_resource
def load_models():
    return {
        'dga': DGADiagnoser(),
        'thermal': ThermalModel(),
        'aging': AgingModel(),
        'simulator': Simulator()
    }

models = load_models()

# 侧边栏 - 设备选择
st.sidebar.title("⚡ 智能电网运维平台")
st.sidebar.markdown("---")

device = st.sidebar.selectbox(
    "选择设备",
    ["1号主变", "2号主变", "GIS-A01"]
)

if device == "1号主变":
    device_status = "⚠️ 高能量放电缺陷"
    status_color = "warning"
else:
    device_status = "✅ 运行正常"
    status_color = "safe"

st.sidebar.markdown(f"**状态**: {device_status}")
st.sidebar.markdown("---")

# 主标签页
tab1, tab2, tab3 = st.tabs(["🔍 诊断分析", "🎯 数字沙盘", "📊 对比报告"])

# ==================== Tab 1: 诊断分析 ====================
with tab1:
    st.header(f"📋 {device} - 综合诊断")

    # 当前状态（模拟数据）
    current_dga = {
        "H2": 145,
        "CH4": 32,
        "C2H6": 8,
        "C2H4": 45,
        "C2H2": 78,
        "CO": 420,
        "CO2": 3200
    }

    # 子标签页：机理诊断 vs 传统诊断
    diag_tab1, diag_tab2, diag_tab3 = st.tabs(["机理诊断", "传统诊断(DGA)", "方法对比"])

    with diag_tab1:
        st.subheader("物理机理诊断结果")

        # 计算当前状态
        thermal_result = models['thermal'].predict(load_percent=85, ambient_temp=25)
        aging_result = models['aging'].analyze(current_dp=450, temp_celsius=thermal_result.hotspot_temp)

        # 关键指标卡片
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.metric("当前负载率", "85%", "高负载")

        with col2:
            temp = thermal_result.hotspot_temp
            temp_delta = f"+{temp-98:.0f}°C 超标" if temp > 98 else "正常"
            st.metric("绕组热点温度", f"{temp:.1f}°C", temp_delta, delta_color="inverse")

        with col3:
            gas_rate = 5.2  # 简化计算
            st.metric("产气速率(C₂H₂)", f"{gas_rate:.1f} ppm/天", "异常")

        with col4:
            tte = 35
            st.metric("预计失效时间", f"{tte} 天", "⚠️ 风险", delta_color="inverse")

        st.warning("⚠️ **机理引擎诊断**：检测到高能量放电缺陷，热-电-化学耦合分析显示绕组热点温度超过安全阈值，油中溶解气体产生速率异常，预计在35天内有失效风险。建议立即进行工况推演评估降载措施。")

    with diag_tab2:
        st.subheader("油色谱分析 (DGA) + 经验诊断")

        # DGA数据表
        st.markdown("#### 溶解气体浓度 (ppm)")
        dga_df = pd.DataFrame({
            '气体': ['H₂', 'CH₄', 'C₂H₆', 'C₂H₄', 'C₂H₂', 'CO', 'CO₂'],
            '浓度(ppm)': list(current_dga.values()),
            '限值(ppm)': [150, 120, 65, 60, 5, 540, 7000],
            '状态': ['注意', '正常', '正常', '正常', '⚠️ 严重超标', '正常', '正常']
        })

        st.dataframe(
            dga_df.style.apply(lambda x: ['background-color: #fecaca' if v == '⚠️ 严重超标'
                                          else 'background-color: #fef3c7' if v == '注意'
                                          else '' for v in x], axis=1, subset=['状态']),
            use_container_width=True,
            hide_index=True
        )

        # DGA诊断
        dga_data = DGAData(**current_dga)
        diagnosis = models['dga'].diagnose(dga_data)

        col1, col2 = st.columns(2)

        with col1:
            st.markdown("##### IEC 三比值法诊断")
            ratios = diagnosis.ratios
            st.markdown(f"""
            - **C₂H₂/C₂H₄**: {ratios['C2H2/C2H4']:.2f}
            - **CH₄/H₂**: {ratios['CH4/H2']:.2f}
            - **C₂H₄/C₂H₆**: {ratios['C2H4/C2H6']:.2f}

            **诊断结论**: {diagnosis.methods['IEC_60599']}
            """)

        with col2:
            st.markdown("##### 杜瓦尔三角图")
            st.markdown(f"""
            **诊断结果**: {diagnosis.methods['Duval']}

            **置信度**: {diagnosis.confidence*100:.0f}%
            """)

            # 简化的杜瓦尔三角图可视化
            total = current_dga['CH4'] + current_dga['C2H4'] + current_dga['C2H2']
            fig = go.Figure(data=[go.Pie(
                labels=['CH₄', 'C₂H₄', 'C₂H₂'],
                values=[current_dga['CH4'], current_dga['C2H4'], current_dga['C2H2']],
                hole=.3,
                marker_colors=['#60a5fa', '#fbbf24', '#ef4444']
            )])
            fig.update_layout(height=250, margin=dict(t=0, b=0, l=0, r=0))
            st.plotly_chart(fig, use_container_width=True)

    with diag_tab3:
        st.subheader("传统方法 vs 机理模型")

        comparison_df = pd.DataFrame({
            '对比维度': ['诊断依据', '诊断结果', '预测能力', '推演能力'],
            '传统经验方法': [
                '基于历史故障统计规律',
                '高能量放电',
                '❌ 仅能判断故障类型',
                '❌ 无法模拟工况变化'
            ],
            '机理物理模型': [
                '基于热-电-化学物理机理',
                '高能量放电 + 热点105°C',
                '✅ 预测失效时间: 35天',
                '✅ What-if 推演'
            ]
        })

        st.table(comparison_df)

        st.success("✅ **融合诊断结论**：传统油色谱三比值法和杜瓦尔三角图均指向「高能量放电」，机理模型进一步揭示了放电产生的物理原因（绕组热点105°C超标）、量化了故障演化速率，并预测了失效时间窗口（35天）。")

# ==================== Tab 2: 数字沙盘 ====================
with tab2:
    st.header("🎯 数字沙盘：What-if 推演")
    st.markdown("基于机理模型进行工况推演，评估运维措施的有效性")

    # 快捷推演
    st.markdown("### 快捷推演场景")
    col1, col2 = st.columns(2)

    with col1:
        if st.button("💡 如果我降低 30% 负载？", use_container_width=True):
            with st.spinner("正在运行热-电-化学耦合模型..."):
                scenario_current = ScenarioConfig("当前工况", load_percent=85, defect_factor=0.8, duration_days=7)
                scenario_new = ScenarioConfig("降载工况", load_percent=55, defect_factor=0.8, duration_days=7)

                initial_state = {"dga": current_dga, "dp": 450, "operation_years": 10}

                comparison = models['simulator'].compare(scenario_current, scenario_new, initial_state)
                st.session_state.simulation_result = comparison
                st.success("✅ 推演完成！请切换到「📊 对比报告」标签页查看详细结果 →")

    with col2:
        if st.button("❄️ 如果冷却系统故障？", use_container_width=True):
            with st.spinner("正在运行热-电-化学耦合模型..."):
                scenario_current = ScenarioConfig("当前工况", load_percent=85, cooling_factor=1.0, duration_days=7)
                scenario_fault = ScenarioConfig("冷却故障", load_percent=85, cooling_factor=0.5, duration_days=7)

                initial_state = {"dga": current_dga, "dp": 450, "operation_years": 10}

                comparison = models['simulator'].compare(scenario_current, scenario_fault, initial_state)
                st.session_state.simulation_result = comparison
                st.success("✅ 推演完成！请切换到「📊 对比报告」标签页查看详细结果 →")

    # 显示推演状态
    if st.session_state.simulation_result is not None:
        st.info("📊 **有推演结果可查看**：请切换到「对比报告」标签页查看详细分析")

    st.markdown("---")

    # 自定义推演
    st.markdown("### 🎨 自定义推演")

    with st.expander("展开自定义推演设置", expanded=False):
        col1, col2, col3 = st.columns(3)

        with col1:
            new_load = st.slider("负载率 (%)", 0, 120, 55, 5)

        with col2:
            new_temp = st.slider("环境温度 (°C)", -20, 50, 25, 5)

        with col3:
            duration = st.selectbox("推演时长", ["7天", "30天"], index=0)

        if st.button("🚀 开始自定义推演", type="primary", use_container_width=True):
            with st.spinner("正在运行推演..."):
                days = 7 if duration == "7天" else 30
                scenario_current = ScenarioConfig("当前工况", load_percent=85, defect_factor=0.8, duration_days=days)
                scenario_new = ScenarioConfig("自定义工况", load_percent=new_load, ambient_temp=new_temp, defect_factor=0.8, duration_days=days)

                initial_state = {"dga": current_dga, "dp": 450, "operation_years": 10}

                comparison = models['simulator'].compare(scenario_current, scenario_new, initial_state)
                st.session_state.simulation_result = comparison
                st.success("✅ 推演完成！请切换到「📊 对比报告」标签页查看详细结果 →")

# ==================== Tab 3: 对比报告 ====================
with tab3:
    st.header("📊 A/B 推演对比分析")

    if st.session_state.simulation_result is None:
        st.info("👈 请在「数字沙盘」页面运行推演后查看结果")
    else:
        result = st.session_state.simulation_result
        result_a = result['scenario_a']
        result_b = result['scenario_b']
        improvements = result['improvements']

        # 关键指标改善
        st.markdown("### 💡 关键指标改善")
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric(
                "温度降低",
                f"{improvements['temperature_reduction']:.1f} °C",
                "效果显著",
                delta_color="normal"
            )

        with col2:
            st.metric(
                "产气速率降低",
                f"{improvements['gas_rate_reduction_pct']:.0f}%",
                "缺陷被抑制",
                delta_color="normal"
            )

        with col3:
            st.metric(
                "寿命延长",
                f"{improvements['life_extension_days']:.0f} 天",
                "风险解除",
                delta_color="normal"
            )

        st.markdown("---")

        # 详细对比表
        st.markdown("### 📋 详细指标对比")

        comparison_data = {
            '关键机理指标': [
                '绕组热点温度 (°C)',
                'C₂H₂产气速率 (ppm/天)',
                '7天后C₂H₂浓度 (ppm)',
                '老化速率 (DP/天)',
                '预计失效时间 (天)'
            ],
            'A: 当前工况': [
                f"{result_a['thermal']['hotspot_temp']:.1f}",
                f"{result_a['dga_projection']['production_rates']['C2H2']:.4f}",
                f"{result_a['dga_projection']['projected_concentrations']['C2H2']:.1f}",
                f"{result_a['aging']['aging_rate']:.4f}",
                f"{result_a['tte_days']:.0f}"
            ],
            'B: 推演工况': [
                f"{result_b['thermal']['hotspot_temp']:.1f}",
                f"{result_b['dga_projection']['production_rates']['C2H2']:.4f}",
                f"{result_b['dga_projection']['projected_concentrations']['C2H2']:.1f}",
                f"{result_b['aging']['aging_rate']:.4f}",
                f"{result_b['tte_days']:.0f}"
            ]
        }

        st.table(pd.DataFrame(comparison_data))

        # 时间线图表
        st.markdown("### 📈 演化趋势预测")

        timeline_a = result_a['timeline']
        timeline_b = result_b['timeline']

        # 温度演化
        fig_temp = go.Figure()
        fig_temp.add_trace(go.Scatter(
            x=[p['day'] for p in timeline_a],
            y=[p['temperature'] for p in timeline_a],
            mode='lines+markers',
            name='场景A',
            line=dict(color='#ef4444', width=2)
        ))
        fig_temp.add_trace(go.Scatter(
            x=[p['day'] for p in timeline_b],
            y=[p['temperature'] for p in timeline_b],
            mode='lines+markers',
            name='场景B',
            line=dict(color='#10b981', width=2)
        ))
        fig_temp.update_layout(
            title='绕组热点温度演化',
            xaxis_title='天数',
            yaxis_title='温度 (°C)',
            height=350
        )
        st.plotly_chart(fig_temp, use_container_width=True)

        # C2H2演化
        fig_c2h2 = go.Figure()
        fig_c2h2.add_trace(go.Scatter(
            x=[p['day'] for p in timeline_a],
            y=[p['C2H2'] for p in timeline_a],
            mode='lines+markers',
            name='场景A',
            line=dict(color='#ef4444', width=2)
        ))
        fig_c2h2.add_trace(go.Scatter(
            x=[p['day'] for p in timeline_b],
            y=[p['C2H2'] for p in timeline_b],
            mode='lines+markers',
            name='场景B',
            line=dict(color='#10b981', width=2)
        ))
        fig_c2h2.update_layout(
            title='C₂H₂浓度演化',
            xaxis_title='天数',
            yaxis_title='浓度 (ppm)',
            height=350
        )
        st.plotly_chart(fig_c2h2, use_container_width=True)

        # 结论
        st.success(f"""
        ✅ **机理引擎推演结论**：

        将负载降低至 {result_b['scenario']['load_percent']:.0f}%，可有效将绕组热点温度压低至安全阈值，
        放电能量和产气速率被大幅抑制。该措施可将安全运行窗口期从 {result_a['tte_days']:.0f} 天
        延长至 {result_b['tte_days']:.0f} 天以上，为安排检修提供了充足时间。
        """)

        # 操作按钮
        col1, col2, col3 = st.columns(3)

        with col1:
            if st.button("📄 导出PDF报告", use_container_width=True):
                st.info("PDF导出功能开发中...")

        with col2:
            if st.button("🔄 基于此结果再次推演", use_container_width=True):
                st.info("请返回数字沙盘页面")

        with col3:
            if st.button("✅ 采纳此方案", type="primary", use_container_width=True):
                st.balloons()
                st.success("方案已保存！调度建议已生成。")

# 页脚
st.sidebar.markdown("---")
st.sidebar.markdown("### 📚 诊断方法")
st.sidebar.markdown("""
- 油色谱分析 (DGA)
- IEC三比值法
- 杜瓦尔三角图
- 机理物理模型
""")

st.sidebar.markdown("---")
st.sidebar.caption("智能电网运维平台 MVP v1.0")
st.sidebar.caption("Powered by Physical Mechanism + AI")
