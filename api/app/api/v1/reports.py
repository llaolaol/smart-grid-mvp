"""
Reports API Endpoints
报告相关API接口
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from app.schemas.diagnosis import DiagnosisRequest
from app.schemas.device import Device
from app.services.diagnosis_service import diagnosis_service
from app.services.device_service import device_service
from typing import List
from pydantic import BaseModel
import os
import zipfile
import io
import tempfile

# Add backend to path for PDF generator import
backend_path = Path(__file__).parent.parent.parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from reports.pdf_generator import PDFReportGenerator

router = APIRouter()

# PDF生成器实例
pdf_generator = PDFReportGenerator()


# 批量报告请求schema
class BatchReportRequest(BaseModel):
    scenario_id: str


@router.post(
    "/diagnosis/{device_id}",
    summary="生成诊断报告PDF",
    description="为指定设备生成诊断报告PDF"
)
async def generate_diagnosis_report(
    device_id: str,
    device_data: Device,
    diagnosis_request: DiagnosisRequest
):
    """
    生成诊断报告PDF

    Args:
        device_id: 设备ID
        device_data: 设备完整数据
        diagnosis_request: 诊断请求（DGA数据）

    Returns:
        FileResponse: PDF文件
    """
    try:
        # 执行诊断
        diagnosis_result = diagnosis_service.diagnose(diagnosis_request)

        # 转换为字典格式
        diagnosis_dict = {
            'fault_type': diagnosis_result.fault_type,
            'severity': diagnosis_result.severity,
            'confidence': diagnosis_result.confidence,
            'ratios': diagnosis_result.ratios,
            'recommendations': diagnosis_result.recommendations
        }

        # 生成PDF
        pdf_path = pdf_generator.generate_diagnosis_report(
            device_data=device_data.dict(),
            diagnosis_result=diagnosis_dict
        )

        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=500, detail="PDF生成失败")

        return FileResponse(
            path=pdf_path,
            media_type='application/pdf',
            filename=f"diagnosis_{device_id}.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成诊断报告失败: {str(e)}")


@router.post(
    "/batch-diagnosis",
    summary="批量生成诊断报告",
    description="为场景中的所有设备生成诊断报告，并打包为ZIP文件"
)
async def generate_batch_diagnosis_reports(request: BatchReportRequest):
    """
    批量生成诊断报告

    Args:
        request: 包含scenario_id的请求

    Returns:
        StreamingResponse: ZIP文件包含所有设备的PDF报告
    """
    try:
        # 获取场景下的所有设备
        devices_response = device_service.get_scenario_devices(request.scenario_id)
        devices = devices_response["devices"]

        if not devices:
            raise HTTPException(status_code=404, detail="场景中没有设备")

        # 创建内存ZIP文件
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            success_count = 0
            failed_devices = []

            for device in devices:
                try:
                    # 执行诊断
                    diagnosis_request = DiagnosisRequest(dga_data=device["dga"])
                    diagnosis_result = diagnosis_service.diagnose(diagnosis_request)

                    # 转换为字典格式
                    diagnosis_dict = {
                        'fault_type': diagnosis_result.fault_type,
                        'severity': diagnosis_result.severity,
                        'confidence': diagnosis_result.confidence,
                        'ratios': diagnosis_result.ratios,
                        'recommendations': diagnosis_result.recommendations
                    }

                    # 生成PDF
                    pdf_path = pdf_generator.generate_diagnosis_report(
                        device_data=device,
                        diagnosis_result=diagnosis_dict
                    )

                    if os.path.exists(pdf_path):
                        # 添加到ZIP
                        zip_file.write(
                            pdf_path,
                            f"diagnosis_{device['device_id']}_{device['device_name']}.pdf"
                        )
                        success_count += 1

                        # 删除临时PDF文件
                        try:
                            os.remove(pdf_path)
                        except:
                            pass
                    else:
                        failed_devices.append(device['device_id'])

                except Exception as e:
                    print(f"生成设备 {device.get('device_id', 'unknown')} 报告失败: {str(e)}")
                    failed_devices.append(device.get('device_id', 'unknown'))

            # 添加一个总结文件
            summary = f"""批量诊断报告生成总结

场景ID: {request.scenario_id}
总设备数: {len(devices)}
成功生成: {success_count}
失败设备: {len(failed_devices)}

{'失败设备列表: ' + ', '.join(failed_devices) if failed_devices else '全部成功'}
"""
            zip_file.writestr("summary.txt", summary)

        # 重置指针到开始
        zip_buffer.seek(0)

        return StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=diagnosis_reports_{request.scenario_id}.zip"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量生成报告失败: {str(e)}")


@router.get(
    "/health",
    summary="报告服务健康检查"
)
async def reports_health():
    """报告服务健康检查"""
    return {
        "status": "healthy",
        "service": "reports",
        "generator": "ReportLab PDF Generator"
    }
