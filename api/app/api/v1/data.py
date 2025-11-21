"""
Data Upload API Router
数据上传API路由
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
import json
from datetime import datetime
from pathlib import Path
import shutil
import uuid

from app.schemas.data import (
    DataUploadResponse,
    FileUploadInfo,
    TestDataItem
)

router = APIRouter()

# 文件上传目录
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", response_model=DataUploadResponse)
async def upload_data(
    data_type: str = Form(..., description="数据类型"),
    device_id: str = Form(..., description="设备ID"),
    operator: str = Form(..., description="操作员姓名"),
    test_datetime: Optional[str] = Form(None, description="测试时间"),
    test_data: str = Form(default="[]", description="测试数据JSON字符串"),
    remarks: Optional[str] = Form(None, description="备注"),
    files: List[UploadFile] = File(default=[], description="上传文件列表")
):
    """
    数据上传接口

    接收multipart/form-data格式的数据上传请求，包括：
    - 表单数据（设备ID、操作员、测试数据等）
    - 文件附件（可选，支持多文件）

    Args:
        data_type: 数据类型 (routine/preventive/dga/pd/defect/emergency)
        device_id: 设备ID
        operator: 操作员姓名
        test_datetime: 测试时间（可选）
        test_data: 测试数据列表（JSON字符串）
        remarks: 备注（可选）
        files: 上传的文件列表（可选）

    Returns:
        DataUploadResponse: 上传结果响应
    """
    try:
        # 验证数据类型
        valid_types = ["routine", "preventive", "dga", "pd", "defect", "emergency"]
        if data_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data_type. Must be one of: {', '.join(valid_types)}"
            )

        # 解析测试数据
        try:
            test_data_list = json.loads(test_data)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid test_data format. Must be valid JSON."
            )

        # 生成唯一的上传ID
        upload_id = f"{data_type}_{device_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"

        # 创建上传记录目录
        upload_record_dir = UPLOAD_DIR / upload_id
        upload_record_dir.mkdir(exist_ok=True)

        # 保存表单数据为JSON
        metadata = {
            "upload_id": upload_id,
            "data_type": data_type,
            "device_id": device_id,
            "operator": operator,
            "test_datetime": test_datetime or datetime.now().isoformat(),
            "test_data": test_data_list,
            "remarks": remarks,
            "upload_timestamp": datetime.now().isoformat()
        }

        metadata_path = upload_record_dir / "metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        # 处理文件上传
        uploaded_files_info = []
        if files:
            files_dir = upload_record_dir / "files"
            files_dir.mkdir(exist_ok=True)

            for file in files:
                # 保存文件
                file_path = files_dir / file.filename
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)

                # 记录文件信息
                file_info = FileUploadInfo(
                    filename=file.filename,
                    size=file_path.stat().st_size,
                    content_type=file.content_type or "application/octet-stream",
                    saved_path=str(file_path.relative_to(UPLOAD_DIR))
                )
                uploaded_files_info.append(file_info)

        return DataUploadResponse(
            success=True,
            message=f"数据上传成功！记录ID: {upload_id}",
            upload_id=upload_id,
            files=uploaded_files_info if uploaded_files_info else None,
            timestamp=datetime.now().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"数据上传失败: {str(e)}"
        )


@router.get("/uploads/{upload_id}")
async def get_upload_record(upload_id: str):
    """
    获取上传记录详情

    Args:
        upload_id: 上传记录ID

    Returns:
        上传记录的元数据
    """
    upload_record_dir = UPLOAD_DIR / upload_id

    if not upload_record_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Upload record not found: {upload_id}"
        )

    metadata_path = upload_record_dir / "metadata.json"
    if not metadata_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Metadata not found for upload: {upload_id}"
        )

    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    return {
        "success": True,
        "data": metadata
    }


@router.get("/uploads")
async def list_uploads(
    data_type: Optional[str] = None,
    device_id: Optional[str] = None,
    limit: int = 50
):
    """
    列出上传记录

    Args:
        data_type: 按数据类型过滤（可选）
        device_id: 按设备ID过滤（可选）
        limit: 返回记录数量限制

    Returns:
        上传记录列表
    """
    if not UPLOAD_DIR.exists():
        return {
            "success": True,
            "total": 0,
            "records": []
        }

    records = []
    for upload_dir in sorted(UPLOAD_DIR.iterdir(), reverse=True):
        if not upload_dir.is_dir():
            continue

        metadata_path = upload_dir / "metadata.json"
        if not metadata_path.exists():
            continue

        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)

            # 应用过滤器
            if data_type and metadata.get("data_type") != data_type:
                continue
            if device_id and metadata.get("device_id") != device_id:
                continue

            records.append(metadata)

            if len(records) >= limit:
                break
        except Exception:
            continue

    return {
        "success": True,
        "total": len(records),
        "records": records
    }
