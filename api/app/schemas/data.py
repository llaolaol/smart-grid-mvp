"""
Data Upload Schemas
数据上传相关的Pydantic模型
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TestDataItem(BaseModel):
    """单条测试数据项"""
    parameter: str = Field(..., description="测试参数名称")
    value: str = Field(..., description="测试值")
    unit: str = Field(..., description="单位")
    standard: str = Field(..., description="标准值/范围")


class DataUploadRequest(BaseModel):
    """数据上传请求"""
    data_type: str = Field(..., description="数据类型: routine/preventive/dga/pd/defect/emergency")
    device_id: str = Field(..., description="设备ID")
    operator: str = Field(..., description="操作员姓名")
    test_datetime: Optional[str] = Field(None, description="测试时间")
    test_data: List[TestDataItem] = Field(default=[], description="测试数据列表")
    remarks: Optional[str] = Field(None, description="备注")


class FileUploadInfo(BaseModel):
    """文件上传信息"""
    filename: str = Field(..., description="文件名")
    size: int = Field(..., description="文件大小(字节)")
    content_type: str = Field(..., description="文件类型")
    saved_path: str = Field(..., description="保存路径")


class DataUploadResponse(BaseModel):
    """数据上传响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(..., description="响应消息")
    upload_id: Optional[str] = Field(None, description="上传记录ID")
    files: Optional[List[FileUploadInfo]] = Field(None, description="已上传文件列表")
    timestamp: str = Field(..., description="上传时间戳")
