"""
机理模型模块

所有模型都实现统一接口，便于升级替换。
"""

from .dga_diagnoser import DGADiagnoser
from .thermal_model import ThermalModel
from .aging_model import AgingModel
from .simulator import Simulator

__all__ = [
    "DGADiagnoser",
    "ThermalModel",
    "AgingModel",
    "Simulator",
]
