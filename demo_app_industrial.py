"""
智能电网运维平台 - 工业监控风格版本
Industrial Design Version with Dark Theme
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
from datetime import datetime

# ==================== 页面配置 ====================
st.set_page_config(
    page_title="智能电网运维平台 | Smart Grid Monitoring",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 设置API密钥
os.environ['DEEPSEEK_API_KEY'] = 'sk-a87064c3ac3240839f9e8595a85ccb4b'

# ==================== 自定义CSS样式 ====================
st.markdown("""
<style>
    /* ========== 全局样式 ========== */
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;700&display=swap');

    :root {
        --bg-dark: #0f172a;
        --bg-card: #1e293b;
        --border-color: #334155;
        --text-primary: #f1f5f9;
        --text-secondary: #cbd5e1;
        --blue-glow: #3b82f6;
        --green-glow: #10b981;
        --yellow-glow: #f59e0b;
        --red-glow: #ef4444;
    }

    .stApp {
        background-color: var(--bg-dark) !important;
        font-family: 'Roboto Mono', monospace !important;
    }

    /* ========== 主容器 ========== */
    .main .block-container {
        padding-top: 2rem !important;
        padding-bottom: 2rem !important;
        max-width: 100% !important;
    }

    /* ========== 顶部导航栏样式 ========== */
    .top-nav {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        padding: 1.5rem 2rem;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }

    .nav-title {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 2px;
        margin: 0;
        text-align: center;
    }

    .nav-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-align: center;
        letter-spacing: 1px;
        margin-top: 0.5rem;
    }

    /* ========== LED状态指示灯 ========== */
    .status-led {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 8px;
        animation: pulse-glow 2s infinite;
    }

    .led-green {
        background-color: var(--green-glow);
        box-shadow: 0 0 8px var(--green-glow), 0 0 16px var(--green-glow);
    }

    .led-yellow {
        background-color: var(--yellow-glow);
        box-shadow: 0 0 8px var(--yellow-glow), 0 0 16px var(--yellow-glow);
    }

    .led-red {
        background-color: var(--red-glow);
        box-shadow: 0 0 8px var(--red-glow), 0 0 16px var(--red-glow);
    }

    .led-blue {
        background-color: var(--blue-glow);
        box-shadow: 0 0 8px var(--blue-glow), 0 0 16px var(--blue-glow);
    }

    @keyframes pulse-glow {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
    }

    /* ========== 数据卡片样式 ========== */
    .metric-card {
        background: linear-gradient(135deg, var(--bg-card) 0%, #2d3748 100%);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        margin: 0.5rem 0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
    }

    .metric-card:hover {
        border-color: var(--blue-glow);
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
        transform: translateY(-2px);
    }

    .metric-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 0.5rem;
    }

    .metric-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.2;
        font-family: 'Roboto Mono', monospace;
    }

    .metric-unit {
        font-size: 1rem;
        color: var(--text-secondary);
        font-weight: 400;
        margin-left: 0.5rem;
    }

    /* ========== 渐变进度条 ========== */
    .gradient-progress {
        height: 8px;
        border-radius: 4px;
        background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%);
        margin-top: 0.5rem;
        position: relative;
        overflow: hidden;
    }

    .gradient-progress::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
        to { left: 100%; }
    }

    /* ========== 侧边栏样式 ========== */
    .css-1d391kg, [data-testid="stSidebar"] {
        background-color: var(--bg-card) !important;
        border-right: 1px solid var(--border-color);
    }

    .css-1d391kg .element-container, [data-testid="stSidebar"] .element-container {
        color: var(--text-primary) !important;
    }

    /* ========== 标签页样式 ========== */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: transparent;
        border-bottom: 2px solid var(--border-color);
    }

    .stTabs [data-baseweb="tab"] {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 8px 8px 0 0;
        padding: 12px 24px;
        color: var(--text-secondary);
        font-weight: 500;
        font-family: 'Roboto Mono', monospace;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.3s ease;
    }

    .stTabs [data-baseweb="tab"]:hover {
        background-color: #2d3748;
        color: var(--blue-glow);
    }

    .stTabs [data-baseweb="tab"][aria-selected="true"] {
        background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
        color: white;
        border-color: var(--blue-glow);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    /* ========== 按钮样式 ========== */
    .stButton > button {
        background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.75rem 2rem;
        font-weight: 600;
        font-family: 'Roboto Mono', monospace;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }

    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
    }

    /* ========== 输入框样式 ========== */
    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea,
    .stSelectbox > div > div > div {
        background-color: var(--bg-card) !important;
        border: 1px solid var(--border-color) !important;
        color: var(--text-primary) !important;
        border-radius: 8px !important;
        font-family: 'Roboto Mono', monospace !important;
    }

    /* ========== 度量值样式 ========== */
    .stMetric {
        background-color: var(--bg-card);
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }

    .stMetric label {
        color: var(--text-secondary) !important;
        font-size: 0.875rem !important;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .stMetric [data-testid="stMetricValue"] {
        color: var(--text-primary) !important;
        font-size: 2rem !important;
        font-weight: 700 !important;
        font-family: 'Roboto Mono', monospace !important;
    }

    /* ========== 数据表格样式 ========== */
    .stDataFrame, .stTable {
        background-color: var(--bg-card) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 8px;
    }

    .stDataFrame div, .stTable div {
        color: var(--text-primary) !important;
        font-family: 'Roboto Mono', monospace !important;
    }

    /* ========== 告警面板 ========== */
    .alert-panel {
        background: linear-gradient(135deg, #1e293b 0%, #2d3748 100%);
        border: 1px solid var(--border-color);
        border-left: 4px solid var(--red-glow);
        border-radius: 8px;
        padding: 1rem;
        margin: 0.5rem 0;
    }

    .alert-critical {
        border-left-color: var(--red-glow);
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);
    }

    .alert-warning {
        border-left-color: var(--yellow-glow);
        box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
    }

    .alert-info {
        border-left-color: var(--blue-glow);
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
    }

    /* ========== 信息框样式 ========== */
    .stAlert {
        background-color: var(--bg-card) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 8px !important;
        color: var(--text-primary) !important;
    }

    /* ========== 成功/警告/错误提示 ========== */
    .stSuccess {
        background-color: rgba(16, 185, 129, 0.1) !important;
        border-left: 4px solid var(--green-glow) !important;
    }

    .stWarning {
        background-color: rgba(245, 158, 11, 0.1) !important;
        border-left: 4px solid var(--yellow-glow) !important;
    }

    .stError {
        background-color: rgba(239, 68, 68, 0.1) !important;
        border-left: 4px solid var(--red-glow) !important;
    }

    .stInfo {
        background-color: rgba(59, 130, 246, 0.1) !important;
        border-left: 4px solid var(--blue-glow) !important;
    }

    /* ========== 图表容器 ========== */
    .js-plotly-plot {
        border-radius: 12px !important;
        overflow: hidden;
    }

    /* ========== 双语文本样式 ========== */
    .bilingual-text {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .text-zh {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .text-en {
        font-size: 0.75rem;
        font-weight: 400;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    /* ========== 滚动条样式 ========== */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    ::-webkit-scrollbar-track {
        background: var(--bg-dark);
    }

    ::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #475569;
    }

    /* ========== 加载动画 ========== */
    .stSpinner > div {
        border-color: var(--blue-glow) transparent transparent transparent !important;
    }
</style>
""", unsafe_allow_html=True)

# ==================== 辅助函数 ====================

def render_led_status(severity: int) -> str:
    """渲染LED状态指示灯"""
    if severity >= 2:
        return '<span class="status-led led-red"></span>'
    elif severity == 1:
        return '<span class="status-led led-yellow"></span>'
    else:
        return '<span class="status-led led-green"></span>'

def render_bilingual_header(zh: str, en: str, level: int = 1) -> None:
    """渲染双语标题"""
    st.markdown(f"""
        <div class="bilingual-text">
            <div class="text-zh" style="font-size: {2.5 - level * 0.3}rem;">{zh}</div>
            <div class="text-en">{en}</div>
        </div>
    """, unsafe_allow_html=True)

def render_metric_card(label_zh: str, label_en: str, value: float, unit: str, color: str = "blue") -> None:
    """渲染度量卡片"""
    led_class = f"led-{color}"
    st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">
                <span class="status-led {led_class}"></span>
                {label_zh} / {label_en}
            </div>
            <div>
                <span class="metric-value">{value:.1f}</span>
                <span class="metric-unit">{unit}</span>
            </div>
            <div class="gradient-progress" style="width: {min(value, 100)}%"></div>
        </div>
    """, unsafe_allow_html=True)

# ==================== 初始化 ====================

# Session State
if 'simulation_result' not in st.session_state:
    st.session_state.simulation_result = None
if 'selected_device' not in st.session_state:
    st.session_state.selected_device = None
if 'current_scenario' not in st.session_state:
    st.session_state.current_scenario = "mixed"

# 加载模型
@st.cache_resource
def load_models():
    try:
        llm = LLMAgent(provider="deepseek")
    except Exception as e:
        llm = None

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

# ==================== 顶部导航栏 ====================
st.markdown(f"""
    <div class="top-nav">
        <h1 class="nav-title">⚡ 智能电网运维平台</h1>
        <p class="nav-subtitle">SMART GRID OPERATION & MAINTENANCE PLATFORM</p>
        <div style="text-align: center; margin-top: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
            <span class="status-led led-green"></span> 系统运行正常 | SYSTEM OPERATIONAL
            &nbsp;&nbsp;|&nbsp;&nbsp;
            实时监控中 | REALTIME MONITORING
            &nbsp;&nbsp;|&nbsp;&nbsp;
            {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        </div>
    </div>
""", unsafe_allow_html=True)

# ==================== 侧边栏 ====================
with st.sidebar:
    render_bilingual_header("控制面板", "CONTROL PANEL", 2)
    st.markdown("---")

    # 场景选择
    render_bilingual_header("数据场景", "DATA SCENARIO", 3)

    available_scenarios = data_loader.list_available_scenarios()
    scenario_names = {
        "all_normal": "🟢 全部正常 / ALL NORMAL",
        "mixed": "🟡 混合场景 / MIXED STATUS",
        "multiple_faults": "🔴 多设备故障 / MULTIPLE FAULTS"
    }

    selected_scenario = st.selectbox(
        "选择场景 / Select Scenario",
        available_scenarios,
        format_func=lambda x: scenario_names.get(x, x),
        key="scenario_selector",
        label_visibility="collapsed"
    )

    if selected_scenario != st.session_state.current_scenario:
        st.session_state.current_scenario = selected_scenario
        st.session_state.selected_device = None

    # 加载场景数据
    devices_data = data_loader.load_scenario(selected_scenario)

    st.markdown("---")

    # 设备选择
    render_bilingual_header("设备选择", "DEVICE SELECTION", 3)

    device_options = {}
    for device in devices_data:
        severity = device['severity']
        device_id = device['device_id']
        device_name = device['device_name']

        led_html = render_led_status(severity)
        device_options[device_id] = f"{device_name}"

    selected_device_id = st.selectbox(
        "选择设备 / Select Device",
        list(device_options.keys()),
        format_func=lambda x: device_options[x],
        key="device_selector",
        label_visibility="collapsed"
    )

    # 获取当前设备
    current_device = next((d for d in devices_data if d['device_id'] == selected_device_id), None)

    if current_device:
        st.session_state.selected_device = current_device

        st.markdown("---")

        # 设备状态
        severity = current_device['severity']
        led_html = render_led_status(severity)

        if severity >= 2:
            status_text = "严重故障 / CRITICAL"
            status_color = "red"
        elif severity == 1:
            status_text = "轻微异常 / WARNING"
            status_color = "yellow"
        else:
            status_text = "运行正常 / NORMAL"
            status_color = "green"

        st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">设备状态 / DEVICE STATUS</div>
                <div style="margin-top: 0.5rem;">
                    {led_html}
                    <span style="color: var(--text-primary); font-weight: 600;">{status_text}</span>
                </div>
            </div>
        """, unsafe_allow_html=True)

        # 关键指标
        st.markdown("---")
        render_bilingual_header("关键指标", "KEY METRICS", 3)

        hotspot_temp = current_device['thermal']['hotspot_temp']
        c2h2 = current_device['dga']['C2H2']
        current_dp = current_device['aging']['current_dp']

        # 使用Streamlit原生metric，已经被CSS美化
        st.metric("热点温度 / HOTSPOT TEMP", f"{hotspot_temp:.1f} °C")
        st.metric("乙炔浓度 / C₂H₂", f"{c2h2:.1f} ppm")
        st.metric("聚合度 / DP VALUE", f"{current_dp:.0f}")

# 准备设备数据
device_id = selected_device_id
dga_data = current_device['dga'] if current_device else {}

# DGA诊断
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

# ==================== 主标签页 ====================
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "🔍 诊断分析 / DIAGNOSIS",
    "🎯 数字沙盘 / SIMULATION",
    "📊 对比报告 / COMPARISON",
    "📈 场景总览 / OVERVIEW",
    "🤖 AI对话 / AI ASSISTANT",
    "📄 PDF报告 / PDF REPORTS"
])

# ==================== Tab 1: 诊断分析 / DIAGNOSIS ====================
with tab1:
    if current_device and diagnosis:
        render_bilingual_header("综合诊断分析", "COMPREHENSIVE DIAGNOSIS", 2)

        st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">设备信息 / DEVICE INFO</div>
                <div style="margin-top: 0.5rem; color: var(--text-primary); font-size: 1.25rem; font-weight: 600;">
                    {current_device['device_name']} ({current_device['device_id']})
                </div>
            </div>
        """, unsafe_allow_html=True)

        # 诊断结果
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("诊断结果 / DIAGNOSIS", diagnosis.fault_type.value)

        with col2:
            severity_labels = ['正常', '轻微', '注意', '严重']
            st.metric("严重程度 / SEVERITY", severity_labels[diagnosis.severity])

        with col3:
            st.metric("置信度 / CONFIDENCE", f"{diagnosis.confidence:.0%}")

        st.markdown("---")

        # DGA数据表格
        col1, col2 = st.columns(2)

        with col1:
            render_bilingual_header("DGA溶解气体分析", "DGA DATA", 3)
            dga_df = pd.DataFrame({
                "气体 / GAS": ["H₂", "CH₄", "C₂H₆", "C₂H₄", "C₂H₂", "CO", "CO₂"],
                "浓度 / PPM": [
                    f"{dga_data['H2']:.1f}",
                    f"{dga_data['CH4']:.1f}",
                    f"{dga_data['C2H6']:.1f}",
                    f"{dga_data['C2H4']:.1f}",
                    f"{dga_data['C2H2']:.1f}",
                    f"{dga_data['CO']:.1f}",
                    f"{dga_data['CO2']:.1f}"
                ]
            })
            st.dataframe(dga_df, use_container_width=True, hide_index=True)

        with col2:
            render_bilingual_header("特征比值", "CHARACTERISTIC RATIOS", 3)
            ratios_df = pd.DataFrame({
                "比值 / RATIO": list(diagnosis.ratios.keys()),
                "数值 / VALUE": [f"{v:.2f}" for v in diagnosis.ratios.values()]
            })
            st.dataframe(ratios_df, use_container_width=True, hide_index=True)

        # 热分析
        st.markdown("---")
        render_bilingual_header("热分析", "THERMAL ANALYSIS", 3)
        thermal_data = current_device['thermal']

        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.metric("油温 / OIL TEMP", f"{thermal_data['oil_temp']:.1f} °C")

        with col2:
            hotspot_temp = thermal_data['hotspot_temp']
            temp_status = "⚠️ 超标" if hotspot_temp > 110 else "✅ 正常"
            st.metric("热点温度 / HOTSPOT", f"{hotspot_temp:.1f} °C", temp_status)

        with col3:
            st.metric("环境温度 / AMBIENT", f"{thermal_data['ambient_temp']:.1f} °C")

        with col4:
            st.metric("负载 / LOAD", f"{current_device['operating_condition']['load_percent']:.0f} %")

        # 老化分析
        st.markdown("---")
        render_bilingual_header("老化分析", "AGING ANALYSIS", 3)
        aging_data = current_device['aging']

        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("当前DP值 / CURRENT DP", f"{aging_data['current_dp']:.0f}")

        with col2:
            device_age = aging_data['device_age']
            st.metric("运行年限 / SERVICE YEARS", f"{device_age:.1f} 年")

        with col3:
            aging_rate = aging_data['aging_rate']
            st.metric("老化速率 / AGING RATE", f"{aging_rate:.3f} DP/天")

        # 建议措施
        st.markdown("---")
        render_bilingual_header("运维建议", "MAINTENANCE RECOMMENDATIONS", 3)
        for i, rec in enumerate(diagnosis.recommendations, 1):
            st.markdown(f"""
                <div class="alert-panel alert-info">
                    <span class="status-led led-blue"></span>
                    <strong>{i}.</strong> {rec}
                </div>
            """, unsafe_allow_html=True)

# ==================== Tab 2: 数字沙盘 / SIMULATION ====================
with tab2:
    if current_device:
        render_bilingual_header("What-if 推演", "DIGITAL SANDBOX SIMULATION", 2)

        st.markdown("""
            <div class="alert-panel alert-info">
                <span class="status-led led-blue"></span>
                通过调整运行参数，预测设备未来状态和寿命变化。<br>
                <span style="font-size: 0.875rem; color: var(--text-secondary);">
                Adjust operating parameters to predict future device status and lifespan changes.
                </span>
            </div>
        """, unsafe_allow_html=True)

        col1, col2 = st.columns([2, 1])

        with col1:
            render_bilingual_header("调整参数", "ADJUST PARAMETERS", 3)

            current_load = current_device['operating_condition']['load_percent']
            current_ambient = current_device['thermal']['ambient_temp']

            new_load = st.slider(
                "负载率 / LOAD RATE (%)",
                min_value=20,
                max_value=130,
                value=int(current_load),
                step=5
            )

            new_ambient = st.slider(
                "环境温度 / AMBIENT TEMPERATURE (°C)",
                min_value=-10,
                max_value=45,
                value=int(current_ambient),
                step=5
            )

        with col2:
            render_bilingual_header("快捷推演", "QUICK SCENARIOS", 3)

            if st.button("🔽 降低30%负载 / -30% LOAD"):
                new_load = max(20, int(current_load * 0.7))

            if st.button("🔼 提升10%负载 / +10% LOAD"):
                new_load = min(130, int(current_load * 1.1))

            if st.button("❄️ 冬季工况 / WINTER"):
                new_ambient = -5

            if st.button("☀️ 夏季工况 / SUMMER"):
                new_ambient = 38

        if st.button("▶️ 开始推演 / START SIMULATION", type="primary"):
            with st.spinner("正在运行热-电-化学耦合模型 / Running Thermal-Electrical-Chemical Model..."):
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
                    "dp": aging_data['current_dp'],
                    "operation_years": aging_data['device_age']
                }

                # 运行A/B对比
                comparison = models['simulator'].compare(scenario_current, scenario_new, initial_state)
                st.session_state.simulation_result = comparison

                st.success("✅ 推演完成！请切换到「📊 对比报告」标签页查看详细结果 →")

        # 持续显示状态
        if st.session_state.simulation_result:
            st.info("💡 推演结果已生成，请切换到「📊 对比报告 / COMPARISON」查看")

# ==================== Tab 3: 对比报告 / COMPARISON ====================
with tab3:
    if st.session_state.simulation_result:
        result = st.session_state.simulation_result
        result_a = result['scenario_a']
        result_b = result['scenario_b']
        improvements = result['improvements']

        render_bilingual_header("工况对比分析", "SCENARIO COMPARISON ANALYSIS", 2)

        # 关键指标改善
        render_bilingual_header("关键指标改善", "KEY IMPROVEMENTS", 3)
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric(
                "温度降低 / TEMP REDUCTION",
                f"{improvements['temperature_reduction']:.1f} °C",
                "效果显著" if improvements['temperature_reduction'] > 0 else "温度升高"
            )

        with col2:
            st.metric(
                "产气速率降低 / GAS RATE REDUCTION",
                f"{improvements['gas_rate_reduction_pct']:.0f}%",
                "缺陷被抑制" if improvements['gas_rate_reduction_pct'] > 0 else "产气增加"
            )

        with col3:
            st.metric(
                "寿命延长 / LIFE EXTENSION",
                f"{improvements['life_extension_days']:.0f} 天",
                "风险解除" if improvements['life_extension_days'] > 0 else "寿命缩短"
            )

        st.markdown("---")

        # A/B对比表
        render_bilingual_header("详细指标对比", "DETAILED COMPARISON", 3)

        comparison_data = {
            "关键机理指标 / KEY INDICATORS": [
                "绕组热点温度 / Hotspot Temp (°C)",
                "C₂H₂产气速率 / C₂H₂ Rate (ppm/day)",
                "7天后C₂H₂浓度 / C₂H₂ @7d (ppm)",
                "老化速率 / Aging Rate (DP/day)",
                "预计失效时间 / TTE (days)"
            ],
            "A: 当前工况 / CURRENT": [
                f"{result_a['thermal']['hotspot_temp']:.1f}",
                f"{result_a['dga_projection']['production_rates']['C2H2']:.4f}",
                f"{result_a['dga_projection']['projected_concentrations']['C2H2']:.1f}",
                f"{result_a['aging']['aging_rate']:.4f}",
                f"{result_a['tte_days']:.0f}"
            ],
            "B: 推演工况 / SIMULATED": [
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
        render_bilingual_header("温度对比可视化", "TEMPERATURE COMPARISON", 3)

        fig = go.Figure()

        categories = ['热点温度 / Hotspot', '油温 / Oil Temp']
        baseline_temps = [
            result_a['thermal']['hotspot_temp'],
            result_a['thermal']['oil_top_temp']
        ]
        simulated_temps = [
            result_b['thermal']['hotspot_temp'],
            result_b['thermal']['oil_top_temp']
        ]

        fig.add_trace(go.Bar(
            name='当前工况 / Current',
            x=categories,
            y=baseline_temps,
            marker_color='#ef4444'
        ))

        fig.add_trace(go.Bar(
            name='推演工况 / Simulated',
            x=categories,
            y=simulated_temps,
            marker_color='#10b981'
        ))

        fig.update_layout(
            barmode='group',
            yaxis_title='温度 / Temperature (°C)',
            height=400,
            template='plotly_dark',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(30,41,59,0.5)',
            font=dict(family='Roboto Mono', color='#f1f5f9')
        )

        st.plotly_chart(fig, use_container_width=True)

        # 建议
        st.markdown("---")
        render_bilingual_header("推演结论", "SIMULATION CONCLUSION", 3)

        if improvements['life_extension_days'] > 0:
            st.markdown(f"""
                <div class="alert-panel alert-info" style="border-left-color: var(--green-glow);">
                    <span class="status-led led-green"></span>
                    <strong>✅ 机理引擎推演结论 / MECHANISM-BASED CONCLUSION</strong><br><br>
                    推演工况可将安全运行窗口期从 <strong>{result_a['tte_days']:.0f} 天</strong> 延长至 <strong>{result_b['tte_days']:.0f} 天</strong>，
                    为安排检修提供了充足时间。<br>
                    热点温度降低 <strong>{improvements['temperature_reduction']:.1f} °C</strong>，
                    产气速率降低 <strong>{improvements['gas_rate_reduction_pct']:.0f}%</strong>。<br><br>
                    <span style="font-size: 0.875rem; color: var(--text-secondary);">
                    The simulated scenario extends the safe operation window from {result_a['tte_days']:.0f} to {result_b['tte_days']:.0f} days,
                    providing sufficient time for maintenance scheduling.
                    </span>
                </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
                <div class="alert-panel alert-warning">
                    <span class="status-led led-yellow"></span>
                    <strong>⚠️ 机理引擎推演结论 / MECHANISM-BASED CONCLUSION</strong><br><br>
                    推演工况会缩短设备寿命约 <strong>{abs(improvements['life_extension_days']):.0f} 天</strong>，
                    不建议采用此工况运行。<br><br>
                    <span style="font-size: 0.875rem; color: var(--text-secondary);">
                    The simulated scenario would reduce device lifespan by approximately {abs(improvements['life_extension_days']):.0f} days.
                    This operation mode is not recommended.
                    </span>
                </div>
            """, unsafe_allow_html=True)

    else:
        st.info("💡 请先在「数字沙盘 / SIMULATION」中运行推演")

# ==================== Tab 4: 场景总览 / OVERVIEW ====================
with tab4:
    render_bilingual_header("场景总览", "SCENARIO OVERVIEW", 2)

    st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">当前场景 / CURRENT SCENARIO</div>
            <div style="margin-top: 0.5rem; color: var(--text-primary); font-size: 1.25rem; font-weight: 600;">
                {scenario_names.get(selected_scenario, selected_scenario)}
            </div>
        </div>
    """, unsafe_allow_html=True)

    # 设备统计
    col1, col2, col3 = st.columns(3)

    total_devices = len(devices_data)
    normal_devices = sum(1 for d in devices_data if d['severity'] == 0)
    warning_devices = sum(1 for d in devices_data if d['severity'] == 1)
    critical_devices = sum(1 for d in devices_data if d['severity'] >= 2)

    with col1:
        st.metric("总设备数 / TOTAL DEVICES", total_devices)

    with col2:
        st.metric("正常设备 / NORMAL", f"{normal_devices} ({normal_devices/total_devices*100:.0f}%)")

    with col3:
        st.metric("故障设备 / FAULTS", f"{critical_devices} ({critical_devices/total_devices*100:.0f}%)")

    # 设备列表
    st.markdown("---")
    render_bilingual_header("设备详情列表", "DEVICE DETAILS", 3)

    for device in devices_data:
        severity = device['severity']
        device_id = device['device_id']
        fault_type = device['fault_type']
        device_name = device['device_name']
        hotspot = device['thermal']['hotspot_temp']
        c2h2 = device['dga']['C2H2']

        led_html = render_led_status(severity)

        if severity >= 2:
            status_text = "严重故障 / CRITICAL"
            card_class = "alert-critical"
        elif severity == 1:
            status_text = "轻微异常 / WARNING"
            card_class = "alert-warning"
        else:
            status_text = "正常 / NORMAL"
            card_class = "alert-info"

        st.markdown(f"""
            <div class="alert-panel {card_class}">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div style="flex: 1; min-width: 150px;">
                        {led_html}
                        <strong style="font-size: 1.1rem;">{device_name}</strong><br>
                        <span style="font-size: 0.875rem; color: var(--text-secondary);">{device_id}</span>
                    </div>
                    <div style="flex: 1; min-width: 120px;">
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">状态 / STATUS</div>
                        <div style="font-weight: 600;">{status_text}</div>
                    </div>
                    <div style="flex: 1; min-width: 120px;">
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">故障类型 / FAULT</div>
                        <div style="font-weight: 600;">{fault_type}</div>
                    </div>
                    <div style="flex: 1; min-width: 100px;">
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">热点 / HOTSPOT</div>
                        <div style="font-weight: 600; font-family: 'Roboto Mono', monospace;">{hotspot:.1f}°C</div>
                    </div>
                    <div style="flex: 1; min-width: 100px;">
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">乙炔 / C₂H₂</div>
                        <div style="font-weight: 600; font-family: 'Roboto Mono', monospace;">{c2h2:.1f} ppm</div>
                    </div>
                </div>
            </div>
        """, unsafe_allow_html=True)

# ==================== Tab 5: AI对话 / AI ASSISTANT ====================
with tab5:
    render_bilingual_header("AI对话助手", "AI ASSISTANT", 2)

    if models['llm'] is None:
        st.markdown("""
            <div class="alert-panel alert-critical">
                <span class="status-led led-red"></span>
                <strong>❌ LLM Agent未能初始化 / LLM Agent Failed to Initialize</strong><br><br>
                请检查API密钥配置 / Please check API key configuration
            </div>
        """, unsafe_allow_html=True)
        st.info("""
        **配置说明 / Configuration:**
        1. 环境变量 / Environment: `export DEEPSEEK_API_KEY='your-key'`
        2. 或在config.yaml中配置 / Or configure in config.yaml
        """)
    else:
        st.success("✅ AI助手已就绪 (DeepSeek) / AI Assistant Ready")

        # 自动分析按钮
        if st.button("🔍 分析当前设备状态 / ANALYZE DEVICE", type="primary"):
            with st.spinner("AI正在分析设备数据 / AI Analyzing Device Data..."):
                # 调用LLM分析
                analysis = models['llm'].analyze_device(
                    device_data=current_device,
                    diagnosis_result=diagnosis_dict
                )

                render_bilingual_header("AI分析报告", "AI ANALYSIS REPORT", 3)
                st.markdown(f"""
                    <div class="metric-card">
                        {analysis}
                    </div>
                """, unsafe_allow_html=True)

                # 保存到session state
                if 'ai_analysis' not in st.session_state:
                    st.session_state.ai_analysis = {}
                st.session_state.ai_analysis[device_id] = analysis

        # 显示之前的分析结果
        if 'ai_analysis' in st.session_state and device_id in st.session_state.ai_analysis:
            render_bilingual_header("上次分析结果", "PREVIOUS ANALYSIS", 3)
            with st.expander("查看详情 / View Details", expanded=False):
                st.markdown(st.session_state.ai_analysis[device_id])

        st.markdown("---")

        # 自由问答
        render_bilingual_header("自由提问", "ASK QUESTIONS", 3)
        st.info("您可以向AI专家询问关于当前设备的任何问题 / Ask the AI expert any questions about the current device")

        user_question = st.text_area(
            "请输入您的问题 / Enter Your Question:",
            placeholder="例如：这个设备的主要问题是什么？需要采取什么措施？\nE.g.: What are the main issues with this device? What measures should be taken?",
            height=100
        )

        if st.button("💬 提问 / ASK", disabled=not user_question):
            with st.spinner("AI正在思考 / AI Thinking..."):
                answer = models['llm'].analyze_device(
                    device_data=current_device,
                    diagnosis_result=diagnosis_dict,
                    user_question=user_question
                )

                render_bilingual_header("AI回答", "AI RESPONSE", 3)
                st.markdown(f"""
                    <div class="metric-card">
                        {answer}
                    </div>
                """, unsafe_allow_html=True)

        # 维护建议
        st.markdown("---")
        render_bilingual_header("维护建议", "MAINTENANCE RECOMMENDATIONS", 3)

        if st.button("🔧 获取维护建议 / GET RECOMMENDATIONS"):
            with st.spinner("AI正在生成维护建议 / AI Generating Recommendations..."):
                # 如果有推演结果，一起传入
                sim_result = st.session_state.get('simulation_result')

                recommendation = models['llm'].get_maintenance_recommendation(
                    device_data=current_device,
                    simulation_result=sim_result
                )

                st.markdown(f"""
                    <div class="metric-card">
                        {recommendation}
                    </div>
                """, unsafe_allow_html=True)

# ==================== Tab 6: PDF报告 / PDF REPORTS ====================
with tab6:
    render_bilingual_header("PDF报告生成", "PDF REPORT GENERATION", 2)

    if models['pdf'] is None:
        st.markdown("""
            <div class="alert-panel alert-critical">
                <span class="status-led led-red"></span>
                <strong>❌ PDF生成器未能初始化 / PDF Generator Failed to Initialize</strong><br><br>
                请检查reportlab库 / Please check reportlab library
            </div>
        """, unsafe_allow_html=True)
        st.info("安装命令 / Installation: `pip install reportlab`")
    else:
        st.success("✅ PDF生成器已就绪 / PDF Generator Ready")

        # 诊断报告
        render_bilingual_header("诊断报告", "DIAGNOSIS REPORT", 3)
        st.info(f"为设备 **{current_device['device_name']}** 生成诊断报告 / Generate diagnosis report for device **{current_device['device_name']}**")

        col1, col2 = st.columns(2)

        with col1:
            if st.button("📥 生成诊断报告 / GENERATE DIAGNOSIS", type="primary"):
                with st.spinner("正在生成PDF / Generating PDF..."):
                    try:
                        pdf_path = models['pdf'].generate_diagnosis_report(
                            device_data=current_device,
                            diagnosis_result=diagnosis_dict
                        )
                        st.success(f"✅ 报告已生成！/ Report Generated!")
                        st.code(pdf_path, language=None)

                        # 读取PDF文件并提供下载
                        with open(pdf_path, 'rb') as f:
                            pdf_bytes = f.read()

                        st.download_button(
                            label="⬇️ 下载诊断报告 / DOWNLOAD DIAGNOSIS REPORT",
                            data=pdf_bytes,
                            file_name=f"diagnosis_{device_id}.pdf",
                            mime="application/pdf"
                        )

                    except Exception as e:
                        st.error(f"❌ 生成失败 / Generation Failed: {str(e)}")

        # 推演报告
        st.markdown("---")
        render_bilingual_header("推演报告", "SIMULATION REPORT", 3)

        if st.session_state.simulation_result:
            st.info(f"为设备 **{current_device['device_name']}** 生成推演对比报告 / Generate simulation comparison report for device **{current_device['device_name']}**")

            if st.button("📥 生成推演报告 / GENERATE SIMULATION", type="primary"):
                with st.spinner("正在生成PDF / Generating PDF..."):
                    try:
                        pdf_path = models['pdf'].generate_simulation_report(
                            device_data=current_device,
                            simulation_result=st.session_state.simulation_result
                        )
                        st.success(f"✅ 报告已生成！/ Report Generated!")
                        st.code(pdf_path, language=None)

                        # 读取PDF文件并提供下载
                        with open(pdf_path, 'rb') as f:
                            pdf_bytes = f.read()

                        st.download_button(
                            label="⬇️ 下载推演报告 / DOWNLOAD SIMULATION REPORT",
                            data=pdf_bytes,
                            file_name=f"simulation_{device_id}.pdf",
                            mime="application/pdf"
                        )

                    except Exception as e:
                        st.error(f"❌ 生成失败 / Generation Failed: {str(e)}")
        else:
            st.warning("⚠️ 请先在「数字沙盘」中运行推演，才能生成推演报告 / Please run simulation in Digital Sandbox first")

        # 批量报告生成
        st.markdown("---")
        render_bilingual_header("批量报告生成", "BATCH REPORT GENERATION", 3)
        st.info("为当前场景下所有设备生成诊断报告 / Generate diagnosis reports for all devices in current scenario")

        if st.button("📥 批量生成诊断报告 / BATCH GENERATE"):
            with st.spinner(f"正在为 {len(devices_data)} 个设备生成报告 / Generating reports for {len(devices_data)} devices..."):
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
                st.success(f"✅ 成功生成 {len(generated_files)}/{len(devices_data)} 份报告 / Successfully generated {len(generated_files)}/{len(devices_data)} reports")

                if generated_files:
                    st.info("生成的报告文件 / Generated Report Files:")
                    for path in generated_files:
                        st.code(path, language=None)

                if failed_devices:
                    with st.expander("❌ 失败的设备 / Failed Devices", expanded=False):
                        for fail in failed_devices:
                            st.error(fail)

# 底部信息
st.sidebar.markdown("---")
st.sidebar.markdown("""
    <div class="metric-card">
        <div class="metric-label">智能电网运维平台 / SMART GRID PLATFORM</div>
        <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">
            <span class="status-led led-green"></span> Version 4.0 Industrial<br>
            <span class="status-led led-blue"></span> 6个核心功能模块<br>
            <span class="status-led led-blue"></span> DeepSeek AI集成<br>
            <span class="status-led led-blue"></span> 专业PDF报告<br>
            <span class="status-led led-blue"></span> What-if推演引擎
        </div>
    </div>
""", unsafe_allow_html=True)

st.markdown("---")
st.markdown("""
    <div style="text-align: center; color: var(--text-secondary); font-size: 0.75rem; padding: 1rem;">
        © 2025 智能电网运维平台 | Smart Grid Operation Platform | Version 4.0 Industrial Design<br>
        <span style="font-size: 0.7rem; opacity: 0.7;">Powered by Streamlit · DeepSeek AI · Mechanism-Based Modeling</span>
    </div>
""", unsafe_allow_html=True)
