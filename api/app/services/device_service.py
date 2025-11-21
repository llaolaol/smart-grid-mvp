"""
Device Service
设备服务 - 处理设备和场景数据
"""

from data.data_loader import DataLoader
from app.schemas.device import Device, DeviceListResponse, ScenarioInfo
from typing import List, Optional


class DeviceService:
    """设备服务"""

    def __init__(self):
        """初始化数据加载器"""
        self.data_loader = DataLoader()

    def list_scenarios(self) -> List[ScenarioInfo]:
        """
        获取所有场景列表

        Returns:
            List[ScenarioInfo]: 场景信息列表
        """
        scenarios = self.data_loader.list_available_scenarios()

        scenario_info_list = []
        scenario_names = {
            "all_normal": "全部正常",
            "mixed": "混合场景",
            "multiple_faults": "多设备故障"
        }
        scenario_descs = {
            "all_normal": "所有设备运行正常",
            "mixed": "包含正常和异常设备",
            "multiple_faults": "多个设备存在严重故障"
        }

        for scenario_id in scenarios:
            devices = self.data_loader.load_scenario(scenario_id)
            scenario_info_list.append(ScenarioInfo(
                scenario_id=scenario_id,
                scenario_name=scenario_names.get(scenario_id, scenario_id),
                description=scenario_descs.get(scenario_id, ""),
                device_count=len(devices)
            ))

        return scenario_info_list

    def get_scenario_devices(self, scenario_id: str) -> DeviceListResponse:
        """
        获取指定场景的所有设备

        Args:
            scenario_id: 场景ID

        Returns:
            DeviceListResponse: 设备列表响应
        """
        devices_data = self.data_loader.load_scenario(scenario_id)

        devices = [Device(**device) for device in devices_data]

        return DeviceListResponse(
            total=len(devices),
            devices=devices
        )

    def get_device(self, scenario_id: str, device_id: str) -> Optional[Device]:
        """
        获取指定设备详情

        Args:
            scenario_id: 场景ID
            device_id: 设备ID

        Returns:
            Device: 设备详情，如果不存在返回None
        """
        devices_data = self.data_loader.load_scenario(scenario_id)

        device_data = next(
            (d for d in devices_data if d['device_id'] == device_id),
            None
        )

        if device_data:
            return Device(**device_data)

        return None


# Global instance
device_service = DeviceService()
