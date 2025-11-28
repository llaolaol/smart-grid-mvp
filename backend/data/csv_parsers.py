"""
CSV数据解析器 - 支持油色谱、机控、智巡三类数据源

用于将CSV格式的历史数据转换为统一的DeviceHistorySnapshot格式
支持后期扩展为Excel上传功能的数据处理引擎
"""

import csv
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime


class CSVParserBase:
    """
    CSV解析器基类

    所有具体解析器都需要继承此类并实现 parse() 方法
    """

    def __init__(self, csv_path: Path):
        """
        初始化解析器

        Args:
            csv_path: CSV文件路径
        """
        self.csv_path = csv_path

        if not self.csv_path.exists():
            raise FileNotFoundError(f"CSV文件不存在: {csv_path}")

    def parse(self) -> List[Dict]:
        """
        解析CSV文件为统一格式

        Returns:
            List[Dict]: 设备历史快照列表

        Raises:
            NotImplementedError: 子类必须实现此方法
        """
        raise NotImplementedError("子类必须实现 parse() 方法")

    def _safe_float(self, value: str) -> Optional[float]:
        """
        安全转换为float，处理空值和异常

        Args:
            value: 字符串值

        Returns:
            float值或None
        """
        if not value or value.strip() == "":
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    def _safe_int(self, value: str) -> Optional[int]:
        """
        安全转换为int，处理空值和异常

        Args:
            value: 字符串值

        Returns:
            int值或None
        """
        if not value or value.strip() == "":
            return None
        try:
            return int(float(value))  # 先转float再转int，兼容 "3.0"
        except (ValueError, TypeError):
            return None


class OilChromatographyParser(CSVParserBase):
    """
    油色谱数据解析器

    数据源示例：
    - equip_no: 12M00000159733143
    - acquisitiontime: 2023-04-03 08:43:00
    - DGA字段: h2, ch4, c2h6, c2h4, c2h2, co, co2
    - source: 中台
    """

    def parse(self) -> List[Dict]:
        """
        解析油色谱CSV数据

        CSV格式: 第1行中文标题, 第2行英文字段名, 第3行开始数据

        Returns:
            List[Dict]: 标准化的设备历史快照列表
        """
        records = []

        with open(self.csv_path, 'r', encoding='utf-8-sig') as f:
            # 跳过第一行中文标题
            f.readline()
            # 第二行是英文字段名，由 DictReader 自动读取
            reader = csv.DictReader(f)

            for row in reader:
                # 跳过无效行
                if not row.get("equip_no") or not row.get("acquisitiontime"):
                    continue

                record = {
                    # 基础字段
                    "timestamp": self._parse_oil_timestamp(row["acquisitiontime"]),
                    "device_id": row["equip_no"],
                    "equip_no": row["equip_no"],

                    # DGA 数据（ppm）
                    "h2": self._safe_float(row.get("h2")),
                    "ch4": self._safe_float(row.get("ch4")),
                    "c2h6": self._safe_float(row.get("c2h6")),
                    "c2h4": self._safe_float(row.get("c2h4")),
                    "c2h2": self._safe_float(row.get("c2h2")),
                    "co": self._safe_float(row.get("co")),
                    "co2": self._safe_float(row.get("co2")),
                    "o2": self._safe_float(row.get("o2")),
                    "n2": self._safe_float(row.get("n2")),
                    "totalhydrocarbon": self._safe_float(row.get("totalhydrocarbon")),

                    # 元数据
                    "source": row.get("source", "中台"),
                    "fault_type": "normal",  # 默认正常，需后续诊断确定
                    "severity": 0,           # 默认严重程度0
                    "device_name": None,     # 从设备映射表获取
                }

                records.append(record)

        return records

    def _parse_oil_timestamp(self, time_str: str) -> str:
        """
        解析油色谱时间格式：2023-04-03 08:43:00 → ISO 8601

        Args:
            time_str: 原始时间字符串

        Returns:
            ISO 8601格式时间字符串
        """
        try:
            dt = datetime.strptime(time_str.strip(), "%Y-%m-%d %H:%M:%S")
            return dt.isoformat()
        except ValueError as e:
            # 如果解析失败，尝试其他格式
            try:
                dt = datetime.strptime(time_str.strip(), "%Y/%m/%d %H:%M:%S")
                return dt.isoformat()
            except ValueError:
                raise ValueError(f"无法解析时间格式: {time_str}") from e


class ControlRunParser(CSVParserBase):
    """
    机控数据解析器

    数据源示例：
    - equip_no: 12M00000044543998
    - date_time: 25/05/2024 0:50
    - 温度字段: oil_temp1, oil_temp2, temp
    - 电气字段: p_high, q_high, i_high
    - source: 集控
    """

    def parse(self) -> List[Dict]:
        """
        解析机控CSV数据

        CSV格式: 第1行中文标题, 第2行英文字段名, 第3行开始数据

        Returns:
            List[Dict]: 标准化的设备历史快照列表
        """
        records = []

        with open(self.csv_path, 'r', encoding='gbk') as f:
            # 跳过第一行中文标题
            f.readline()
            # 第二行是英文字段名，由 DictReader 自动读取
            reader = csv.DictReader(f)

            for row in reader:
                # 跳过无效行
                if not row.get("equip_no") or not row.get("date_time"):
                    continue

                record = {
                    # 基础字段
                    "timestamp": self._parse_control_timestamp(row["date_time"]),
                    "device_id": row["equip_no"],
                    "equip_no": row["equip_no"],

                    # 温度数据（℃）
                    "oil_temp1": self._safe_float(row.get("oil_temp1")),
                    "oil_temp2": self._safe_float(row.get("oil_temp2")),
                    "winding_temperature": self._safe_float(row.get("temp")),
                    "temp": self._safe_float(row.get("temp")),

                    # 电气数据
                    "el_p": self._safe_float(row.get("p_high")),      # 有功功率
                    "el_q": self._safe_float(row.get("q_high")),      # 无功功率
                    "el_i": self._safe_float(row.get("i_high")),      # 电流值

                    # 分接头位置
                    "tap_high": self._safe_int(row.get("tap_high")),

                    # 相别信息
                    "phase_name": row.get("phase_name"),

                    # 元数据
                    "source": row.get("source", "集控"),
                    "fault_type": "normal",
                    "severity": 0,
                    "device_name": row.get("equip_name"),
                }

                records.append(record)

        return records

    def _parse_control_timestamp(self, time_str: str) -> str:
        """
        解析机控时间格式：25/05/2024 0:50 → ISO 8601

        Args:
            time_str: 原始时间字符串

        Returns:
            ISO 8601格式时间字符串
        """
        try:
            dt = datetime.strptime(time_str.strip(), "%d/%m/%Y %H:%M")
            return dt.isoformat()
        except ValueError as e:
            raise ValueError(f"无法解析时间格式: {time_str}") from e


class InspectDataParser(CSVParserBase):
    """
    智巡数据解析器

    数据源示例：
    - pms_device_code: 12M00000044543998
    - inspect_time: 2025-10-20 12:00:00
    - 温度字段: temperature（R01/R02/R03格式）, oil_temperature
    - 设备信息: device_name, station_name
    - source: local
    """

    def parse(self) -> List[Dict]:
        """
        解析智巡CSV数据

        CSV格式: 第1行中文标题, 第2行英文字段名, 第3行开始数据

        Returns:
            List[Dict]: 标准化的设备历史快照列表
        """
        records = []

        with open(self.csv_path, 'r', encoding='utf-8-sig') as f:
            # 跳过第一行中文标题
            f.readline()
            # 第二行是英文字段名，由 DictReader 自动读取
            reader = csv.DictReader(f)

            for row in reader:
                # 跳过无效行
                if not row.get("pms_device_code") or not row.get("inspect_time"):
                    continue

                record = {
                    # 基础字段
                    "timestamp": self._parse_inspect_timestamp(row["inspect_time"]),
                    "device_id": row["pms_device_code"],
                    "pms_device_code": row["pms_device_code"],

                    # 设备信息
                    "device_name": row.get("device_name"),
                    "device_code": row.get("device_code"),

                    # 站点信息
                    "station_name": row.get("station_name"),
                    "station_code": row.get("station_code"),

                    # 温度数据（原始字符串，包含R01/R02/R03）
                    "temperature": row.get("temperature"),
                    "oil_temperature": self._safe_float(row.get("oil_temperature")),
                    "winding_temperature": self._safe_float(row.get("winding_temperature")),

                    # 油位
                    "oil_level": self._safe_float(row.get("oil_level")),

                    # 照片路径
                    "photo_path": row.get("photo_path"),
                    "infrared_photo_path": row.get("infrared_photo_path"),

                    # 元数据
                    "source": row.get("data_source", "local"),
                    "fault_type": "normal",
                    "severity": 0,
                }

                records.append(record)

        return records

    def _parse_inspect_timestamp(self, time_str: str) -> str:
        """
        解析智巡时间格式：2025-10-20 12:00:00 → ISO 8601

        Args:
            time_str: 原始时间字符串

        Returns:
            ISO 8601格式时间字符串
        """
        try:
            # 移除 " local" 后缀（如果存在）
            time_str = time_str.replace(" local", "").strip()
            dt = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")
            return dt.isoformat()
        except ValueError as e:
            raise ValueError(f"无法解析时间格式: {time_str}") from e


# 解析器工厂函数
def get_parser(csv_path: Path, parser_type: str) -> CSVParserBase:
    """
    获取对应类型的解析器实例

    Args:
        csv_path: CSV文件路径
        parser_type: 解析器类型 ("oil" | "control" | "inspect")

    Returns:
        CSVParserBase: 解析器实例

    Raises:
        ValueError: 不支持的解析器类型
    """
    parsers = {
        "oil": OilChromatographyParser,
        "control": ControlRunParser,
        "inspect": InspectDataParser,
    }

    parser_class = parsers.get(parser_type)
    if not parser_class:
        raise ValueError(f"不支持的解析器类型: {parser_type}，可选: {list(parsers.keys())}")

    return parser_class(csv_path)
