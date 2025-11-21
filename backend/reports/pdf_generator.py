"""
PDF报告生成器

使用ReportLab生成专业的设备诊断和推演报告

功能：
1. 设备诊断报告
2. What-if推演对比报告
3. 多设备健康报告
4. 自定义报告模板
"""

from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
import io

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        PageBreak, Image as RLImage
    )
    from reportlab.pdfgen import canvas
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class PDFReportGenerator:
    """PDF报告生成器"""

    def __init__(self, output_dir: Optional[str] = None):
        """
        初始化PDF生成器

        Args:
            output_dir: 输出目录，默认为 reports/
        """
        if not REPORTLAB_AVAILABLE:
            raise ImportError(
                "请安装reportlab库：pip install reportlab\n"
                "用于生成PDF报告"
            )

        if output_dir is None:
            self.output_dir = Path(__file__).parent.parent.parent / "reports"
        else:
            self.output_dir = Path(output_dir)

        self.output_dir.mkdir(exist_ok=True, parents=True)

        # 初始化样式
        self.styles = getSampleStyleSheet()
        self._init_custom_styles()

    def _init_custom_styles(self):
        """初始化自定义样式"""
        # 标题样式
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))

        # 小标题样式
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#374151'),
            spaceAfter=12,
            spaceBefore=12
        ))

        # 正文样式
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#4b5563')
        ))

        # 强调样式
        self.styles.add(ParagraphStyle(
            name='Emphasis',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#dc2626'),
            fontName='Helvetica-Bold'
        ))

    def generate_diagnosis_report(
        self,
        device_data: Dict,
        diagnosis_result: Dict,
        output_filename: Optional[str] = None
    ) -> str:
        """
        生成设备诊断报告

        Args:
            device_data: 设备数据
            diagnosis_result: 诊断结果
            output_filename: 输出文件名（可选）

        Returns:
            生成的PDF文件路径
        """
        if output_filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            device_id = device_data.get('device_id', 'unknown')
            output_filename = f"diagnosis_report_{device_id}_{timestamp}.pdf"

        output_path = self.output_dir / output_filename

        # 创建PDF文档
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )

        # 构建报告内容
        story = []

        # 标题
        story.append(Paragraph("设备诊断报告", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.3*inch))

        # 基本信息
        story.append(Paragraph("基本信息", self.styles['CustomHeading']))

        info_data = [
            ["设备ID", device_data.get('device_id', 'N/A')],
            ["设备名称", device_data.get('device_name', 'N/A')],
            ["报告时间", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            ["运行年限", f"{device_data.get('aging', {}).get('device_age', 0):.1f} 年"]
        ]

        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))

        story.append(info_table)
        story.append(Spacer(1, 0.3*inch))

        # 诊断结果
        story.append(Paragraph("诊断结果", self.styles['CustomHeading']))

        severity_labels = ['正常', '轻微', '注意', '严重']
        severity = diagnosis_result.get('severity', 0)
        fault_type = diagnosis_result.get('fault_type', '未知')
        confidence = diagnosis_result.get('confidence', 0)

        diagnosis_data = [
            ["故障类型", fault_type],
            ["严重程度", severity_labels[severity]],
            ["置信度", f"{confidence:.0%}"]
        ]

        diagnosis_table = Table(diagnosis_data, colWidths=[2*inch, 4*inch])
        diagnosis_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))

        story.append(diagnosis_table)
        story.append(Spacer(1, 0.3*inch))

        # DGA数据
        story.append(Paragraph("DGA数据", self.styles['CustomHeading']))

        dga = device_data.get('dga', {})
        dga_data = [
            ["气体", "浓度 (ppm)", "状态"],
            ["H₂", f"{dga.get('H2', 0):.1f}", self._get_dga_status(dga.get('H2', 0), 'H2')],
            ["CH₄", f"{dga.get('CH4', 0):.1f}", self._get_dga_status(dga.get('CH4', 0), 'CH4')],
            ["C₂H₆", f"{dga.get('C2H6', 0):.1f}", self._get_dga_status(dga.get('C2H6', 0), 'C2H6')],
            ["C₂H₄", f"{dga.get('C2H4', 0):.1f}", self._get_dga_status(dga.get('C2H4', 0), 'C2H4')],
            ["C₂H₂", f"{dga.get('C2H2', 0):.1f}", self._get_dga_status(dga.get('C2H2', 0), 'C2H2')],
            ["CO", f"{dga.get('CO', 0):.1f}", self._get_dga_status(dga.get('CO', 0), 'CO')],
            ["CO₂", f"{dga.get('CO2', 0):.1f}", self._get_dga_status(dga.get('CO2', 0), 'CO2')]
        ]

        dga_table = Table(dga_data, colWidths=[1.5*inch, 2*inch, 2.5*inch])
        dga_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))

        story.append(dga_table)
        story.append(Spacer(1, 0.3*inch))

        # 热参数
        story.append(Paragraph("热参数", self.styles['CustomHeading']))

        thermal = device_data.get('thermal', {})
        thermal_data = [
            ["参数", "数值", "状态"],
            ["热点温度", f"{thermal.get('hotspot_temp', 0):.1f} °C",
             "⚠️ 超标" if thermal.get('hotspot_temp', 0) > 110 else "正常"],
            ["油温", f"{thermal.get('oil_temp', 0):.1f} °C", "正常"],
            ["环境温度", f"{thermal.get('ambient_temp', 0):.1f} °C", "正常"]
        ]

        thermal_table = Table(thermal_data, colWidths=[2*inch, 2*inch, 2*inch])
        thermal_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))

        story.append(thermal_table)
        story.append(Spacer(1, 0.3*inch))

        # 建议措施
        if 'recommendations' in diagnosis_result:
            story.append(Paragraph("建议措施", self.styles['CustomHeading']))

            for i, rec in enumerate(diagnosis_result['recommendations'], 1):
                story.append(Paragraph(f"{i}. {rec}", self.styles['CustomBody']))
                story.append(Spacer(1, 0.1*inch))

        # 生成PDF
        doc.build(story)

        return str(output_path)

    def generate_simulation_report(
        self,
        device_data: Dict,
        simulation_result: Dict,
        output_filename: Optional[str] = None
    ) -> str:
        """
        生成What-if推演对比报告

        Args:
            device_data: 设备数据
            simulation_result: 推演结果
            output_filename: 输出文件名（可选）

        Returns:
            生成的PDF文件路径
        """
        if output_filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            device_id = device_data.get('device_id', 'unknown')
            output_filename = f"simulation_report_{device_id}_{timestamp}.pdf"

        output_path = self.output_dir / output_filename

        # 创建PDF文档
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )

        story = []

        # 标题
        story.append(Paragraph("What-if推演对比报告", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.3*inch))

        # 设备信息
        story.append(Paragraph("设备信息", self.styles['CustomHeading']))

        info_data = [
            ["设备ID", device_data.get('device_id', 'N/A')],
            ["设备名称", device_data.get('device_name', 'N/A')],
            ["报告时间", datetime.now().strftime("%Y-%m-%d %H:%M:%S")]
        ]

        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))

        story.append(info_table)
        story.append(Spacer(1, 0.3*inch))

        # 对比分析
        story.append(Paragraph("工况对比分析", self.styles['CustomHeading']))

        baseline = simulation_result.get('baseline', {})
        simulated = simulation_result.get('simulated', {})
        changes = simulation_result.get('changes', {})

        comparison_data = [
            ["指标", "当前工况", "推演工况", "变化"],
            ["热点温度", f"{baseline.get('hotspot_temp', 0):.1f}°C",
             f"{simulated.get('hotspot_temp', 0):.1f}°C",
             f"{changes.get('hotspot_temp_change', 0):+.1f}°C"],
            ["油温", f"{baseline.get('oil_temp', 0):.1f}°C",
             f"{simulated.get('oil_temp', 0):.1f}°C",
             f"{changes.get('oil_temp_change', 0):+.1f}°C"],
            ["预计寿命损失", f"{baseline.get('life_loss_days', 0):.0f}天",
             f"{simulated.get('life_loss_days', 0):.0f}天",
             f"+{changes.get('life_extension_days', 0):.0f}天"]
        ]

        comparison_table = Table(comparison_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        comparison_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))

        story.append(comparison_table)
        story.append(Spacer(1, 0.3*inch))

        # 结论
        story.append(Paragraph("结论", self.styles['CustomHeading']))

        life_extension = changes.get('life_extension_days', 0)
        if life_extension > 0:
            conclusion = f"✅ 推演工况可延长设备寿命约 {life_extension:.0f} 天，建议采用。"
            story.append(Paragraph(conclusion, self.styles['CustomBody']))
        else:
            conclusion = f"⚠️ 推演工况会缩短设备寿命约 {abs(life_extension):.0f} 天，不建议采用。"
            story.append(Paragraph(conclusion, self.styles['Emphasis']))

        # 生成PDF
        doc.build(story)

        return str(output_path)

    def _get_dga_status(self, value: float, gas: str) -> str:
        """获取DGA气体状态"""
        # 简化的阈值判断
        thresholds = {
            'H2': 150,
            'CH4': 120,
            'C2H6': 65,
            'C2H4': 50,
            'C2H2': 5,
            'CO': 700,
            'CO2': 10000
        }

        threshold = thresholds.get(gas, float('inf'))
        if value > threshold:
            return "⚠️ 超标"
        elif value > threshold * 0.7:
            return "🟡 注意"
        else:
            return "✅ 正常"


# 便捷函数
def quick_diagnosis_report(device_data: Dict, diagnosis_result: Dict) -> str:
    """
    快速生成诊断报告

    Args:
        device_data: 设备数据
        diagnosis_result: 诊断结果

    Returns:
        PDF文件路径
    """
    generator = PDFReportGenerator()
    return generator.generate_diagnosis_report(device_data, diagnosis_result)


def quick_simulation_report(device_data: Dict, simulation_result: Dict) -> str:
    """
    快速生成推演报告

    Args:
        device_data: 设备数据
        simulation_result: 推演结果

    Returns:
        PDF文件路径
    """
    generator = PDFReportGenerator()
    return generator.generate_simulation_report(device_data, simulation_result)


if __name__ == "__main__":
    # 测试
    print("=" * 70)
    print("PDF报告生成器测试")
    print("=" * 70)

    if not REPORTLAB_AVAILABLE:
        print("\n⚠️  请安装reportlab：pip install reportlab")
    else:
        # 模拟数据
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
            }
        }

        test_diagnosis = {
            "fault_type": "高能量放电",
            "severity": 3,
            "confidence": 0.85,
            "recommendations": [
                "立即降低设备负载至70%以下",
                "安排停电检修，检查绕组绝缘",
                "增加DGA监测频率至每周一次",
                "准备备用变压器"
            ]
        }

        test_simulation = {
            "baseline": {
                "hotspot_temp": 105.3,
                "oil_temp": 85.2,
                "life_loss_days": 35
            },
            "simulated": {
                "hotspot_temp": 82.0,
                "oil_temp": 68.5,
                "life_loss_days": 180
            },
            "changes": {
                "hotspot_temp_change": -23.3,
                "oil_temp_change": -16.7,
                "life_extension_days": 145
            }
        }

        generator = PDFReportGenerator()

        print("\n测试1: 生成诊断报告")
        try:
            pdf_path = generator.generate_diagnosis_report(test_device, test_diagnosis)
            print(f"✅ 诊断报告已生成: {pdf_path}")
        except Exception as e:
            print(f"❌ 生成失败: {e}")

        print("\n测试2: 生成推演报告")
        try:
            pdf_path = generator.generate_simulation_report(test_device, test_simulation)
            print(f"✅ 推演报告已生成: {pdf_path}")
        except Exception as e:
            print(f"❌ 生成失败: {e}")

        print("\n" + "=" * 70)
        print("PDF报告生成器测试完成")
        print("=" * 70)
