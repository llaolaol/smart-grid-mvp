# 代码规范与最佳实践

## 📋 目录

- [前端规范 (React/TypeScript)](#前端规范-reacttypescript)
- [后端规范 (Python/FastAPI)](#后端规范-pythonfastapi)
- [Git提交规范](#git提交规范)
- [文件命名规范](#文件命名规范)
- [注释规范](#注释规范)
- [常见模式](#常见模式)

---

## 前端规范 (React/TypeScript)

### 1. 组件命名

```typescript
// ✅ Good: PascalCase for components
const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  return <div>{device.name}</div>;
};

// ❌ Bad: camelCase or snake_case
const deviceCard = () => { ... };
const device_card = () => { ... };
```

### 2. 文件命名

```
✅ Good:
- DeviceCard.tsx          (组件文件)
- userPreferences.ts      (工具文件)
- api.ts                  (服务文件)
- device.ts               (类型文件)

❌ Bad:
- DeviceCard.jsx          (使用.tsx)
- user_preferences.ts     (使用camelCase)
- API.ts                  (避免全大写)
```

### 3. 接口与类型定义

```typescript
// ✅ Good: 使用type关键字导入类型
import type { Device } from '@/types/device';
import { getDevices } from '@/services/api';

// 接口命名：Props/Request/Response后缀
interface DeviceCardProps {
  device: Device;
  onClick?: (id: string) => void;
}

interface DiagnosisRequest {
  deviceId: string;
  gasConcentrations: GasData;
}

interface DiagnosisResponse {
  result: string;
  severity: 'normal' | 'warning' | 'critical';
}

// ✅ Good: 使用明确的类型而非any
const handleClick = (device: Device) => {
  console.log(device.id);
};

// ❌ Bad: 使用any
const handleClick = (device: any) => {
  console.log(device.id);
};
```

### 4. Props解构与默认值

```typescript
// ✅ Good: 解构props，使用可选参数
interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  size?: 'small' | 'medium' | 'large';  // 可选参数
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  onClose,
  size = 'medium'  // 默认值
}) => {
  if (!isOpen) return null;

  return (
    <div className={`modal modal-${size}`}>
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

// ❌ Bad: 不解构props
const Modal: React.FC<ModalProps> = (props) => {
  return <div>{props.title}</div>;  // 难以维护
};
```

### 5. 条件渲染

```typescript
// ✅ Good: 提前return处理不渲染情况
const DeviceList: React.FC<Props> = ({ devices, loading }) => {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (devices.length === 0) {
    return <EmptyState message="暂无设备" />;
  }

  return (
    <div>
      {devices.map(device => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  );
};

// ❌ Bad: 嵌套三元运算符
const DeviceList: React.FC<Props> = ({ devices, loading }) => {
  return (
    <div>
      {loading ? (
        <LoadingSkeleton />
      ) : devices.length === 0 ? (
        <EmptyState />
      ) : (
        devices.map(device => <DeviceCard key={device.id} device={device} />)
      )}
    </div>
  );
};
```

### 6. useState与useEffect

```typescript
// ✅ Good: 明确的类型注解
const [devices, setDevices] = useState<Device[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [selectedId, setSelectedId] = useState<string | null>(null);

// useEffect依赖项明确
useEffect(() => {
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await getDevices(scenarioId);
      setDevices(data);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  fetchDevices();
}, [scenarioId]);  // 明确依赖

// ❌ Bad: 缺少类型、依赖项不明确
const [devices, setDevices] = useState([]);
useEffect(() => {
  fetchDevices();
}, []);  // 可能遗漏依赖
```

### 7. 事件处理

```typescript
// ✅ Good: 明确的事件类型
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // 处理表单提交
};

const handleClick = (id: string) => {
  // 处理点击事件
};

// ✅ Good: 回调函数命名统一使用handle前缀
const handleDelete = () => { ... };
const handleSave = () => { ... };
const handleCancel = () => { ... };

// 传递给子组件时使用on前缀
<ChildComponent
  onDelete={handleDelete}
  onSave={handleSave}
/>
```

### 8. Tailwind CSS使用

```typescript
// ✅ Good: 语义化的class组合
<div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
  <h2 className="text-xl font-bold text-white mb-4">标题</h2>
  <p className="text-slate-400 text-sm">描述</p>
</div>

// ✅ Good: 使用模板字符串处理动态class
const getSeverityColor = (severity: string) => {
  const colors = {
    normal: 'bg-green-600',
    warning: 'bg-yellow-600',
    critical: 'bg-red-600',
  };
  return colors[severity as keyof typeof colors];
};

<div className={`px-3 py-1 rounded ${getSeverityColor(severity)}`}>
  {severity}
</div>

// ❌ Bad: 内联样式（除非动态值）
<div style={{ backgroundColor: '#1e293b', padding: '16px' }}>
  {/* 应使用Tailwind */}
</div>
```

### 9. API调用

```typescript
// ✅ Good: 使用try-catch，统一错误处理
const fetchDeviceDetail = async (id: string) => {
  setLoading(true);
  try {
    const response = await api.get<DeviceDetailResponse>(`/devices/${id}`);
    setDevice(response.data);
  } catch (error) {
    message.error('加载设备详情失败');
    console.error('Error fetching device:', error);
  } finally {
    setLoading(false);
  }
};

// ❌ Bad: 缺少错误处理
const fetchDeviceDetail = async (id: string) => {
  const response = await api.get(`/devices/${id}`);
  setDevice(response.data);
};
```

### 10. 组件导出

```typescript
// ✅ Good: 默认导出组件
const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  return <div>{device.name}</div>;
};

export default DeviceCard;

// ✅ Good: 导出类型定义（供外部使用）
export type { DeviceCardProps };

// ❌ Bad: 同时导出多个组件（除非是工具库）
export { ComponentA, ComponentB };  // 避免
```

---

## 后端规范 (Python/FastAPI)

### 1. 命名规范

```python
# ✅ Good: 遵循PEP 8
# 文件名: snake_case
device_service.py
diagnosis_service.py

# 类名: PascalCase
class DeviceService:
    pass

class DiagnosisRequest(BaseModel):
    pass

# 函数名: snake_case
def get_device_by_id(device_id: str) -> Device:
    pass

# 常量: UPPER_SNAKE_CASE
API_V1_STR = "/api/v1"
MAX_DEVICES = 100

# 私有方法: 前缀下划线
def _validate_gas_data(data: dict) -> bool:
    pass

# ❌ Bad: 混乱的命名
class deviceService:  # 应为PascalCase
    pass

def GetDevice(ID):  # 应为snake_case
    pass
```

### 2. Type Hints

```python
# ✅ Good: 完整的类型注解
from typing import List, Optional, Dict

def get_devices(
    scenario_id: str,
    limit: Optional[int] = None
) -> List[Device]:
    """获取设备列表"""
    pass

def calculate_severity(
    gas_data: Dict[str, float]
) -> tuple[str, float]:
    """返回严重程度和分数"""
    return "critical", 0.95

# ✅ Good: 使用Optional表示可选参数
def find_device(device_id: str) -> Optional[Device]:
    """可能返回None"""
    return device if exists else None

# ❌ Bad: 缺少类型注解
def get_devices(scenario_id, limit=None):
    pass
```

### 3. Pydantic模型

```python
# ✅ Good: 清晰的模型定义
from pydantic import BaseModel, Field, ConfigDict

class DeviceResponse(BaseModel):
    """设备响应模型"""
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="设备ID")
    name: str = Field(..., description="设备名称")
    status: str = Field(..., description="运行状态")
    severity: str = Field(default="normal", description="严重程度")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "T001",
                "name": "变压器1",
                "status": "运行",
                "severity": "normal"
            }
        }

# ❌ Bad: 缺少文档和默认值
class DeviceResponse(BaseModel):
    id: str
    name: str
    status: str
```

### 4. FastAPI路由

```python
# ✅ Good: 清晰的路由定义，包含文档
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/devices", tags=["devices"])

@router.get(
    "/scenarios/{scenario_id}",
    response_model=List[DeviceResponse],
    summary="获取场景下的设备列表",
    description="根据场景ID获取该场景下所有设备的详细信息"
)
async def get_scenario_devices(
    scenario_id: str,
    limit: Optional[int] = None
) -> List[DeviceResponse]:
    """
    获取场景设备列表

    Args:
        scenario_id: 场景ID
        limit: 限制返回数量

    Returns:
        设备列表

    Raises:
        HTTPException: 场景不存在时返回404
    """
    try:
        devices = device_service.get_devices(scenario_id, limit)
        return devices
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"场景 {scenario_id} 不存在"
        )

# ❌ Bad: 缺少文档和错误处理
@router.get("/scenarios/{scenario_id}")
def get_devices(scenario_id: str):
    return device_service.get_devices(scenario_id)
```

### 5. 异常处理

```python
# ✅ Good: 统一的异常处理
from fastapi import HTTPException, status

def get_device_by_id(device_id: str) -> Device:
    device = _find_device(device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"设备 {device_id} 不存在"
        )
    return device

def validate_gas_data(data: dict) -> None:
    required_gases = ['H2', 'CH4', 'C2H4', 'C2H6', 'C2H2', 'CO', 'CO2']
    missing = [g for g in required_gases if g not in data]

    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"缺少气体数据: {', '.join(missing)}"
        )

# ❌ Bad: 返回None或使用print
def get_device_by_id(device_id: str):
    device = _find_device(device_id)
    if not device:
        print(f"Device {device_id} not found")  # 不应使用print
        return None  # 应抛出异常
    return device
```

### 6. 服务层与路由层分离

```python
# ✅ Good: services/device_service.py
class DeviceService:
    """设备业务逻辑服务"""

    def get_devices(self, scenario_id: str) -> List[Device]:
        """获取设备列表"""
        # 业务逻辑
        pass

    def diagnose_device(self, device: Device) -> DiagnosisResult:
        """诊断设备"""
        # 业务逻辑
        pass

# ✅ Good: api/v1/devices.py
router = APIRouter()
device_service = DeviceService()

@router.get("/scenarios/{scenario_id}")
async def get_scenario_devices(scenario_id: str):
    """路由层仅处理HTTP相关逻辑"""
    try:
        devices = device_service.get_devices(scenario_id)
        return devices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ❌ Bad: 业务逻辑直接写在路由中
@router.get("/scenarios/{scenario_id}")
async def get_scenario_devices(scenario_id: str):
    # 大量业务逻辑代码...
    # 难以测试和维护
    pass
```

### 7. 日志记录

```python
# ✅ Good: 使用logging模块
import logging

logger = logging.getLogger(__name__)

def diagnose_device(device_id: str) -> DiagnosisResult:
    logger.info(f"开始诊断设备: {device_id}")

    try:
        result = _perform_diagnosis(device_id)
        logger.info(f"诊断完成: {device_id}, 结果: {result.severity}")
        return result
    except Exception as e:
        logger.error(f"诊断失败: {device_id}, 错误: {str(e)}", exc_info=True)
        raise

# ❌ Bad: 使用print
def diagnose_device(device_id: str):
    print(f"Diagnosing {device_id}")  # 不应使用print
    result = _perform_diagnosis(device_id)
    print(f"Done: {result}")
    return result
```

---

## Git提交规范

### Conventional Commits

```bash
# 格式
<type>(<scope>): <subject>

<body>

<footer>

# type类型:
feat:      新功能
fix:       修复bug
docs:      文档更新
style:     代码格式（不影响逻辑）
refactor:  重构（既不是新功能也不是bug修复）
perf:      性能优化
test:      测试
chore:     构建/工具配置
revert:    回滚

# ✅ Good: 示例
feat(diagnosis): add Duval triangle visualization
fix(api): resolve CORS issue for localhost:3003
docs(readme): update deployment instructions
style(frontend): format code with prettier
refactor(services): extract common validation logic
perf(report): optimize PDF generation performance
test(device): add unit tests for device service
chore(deps): upgrade React to 18.2.0

# 多行提交信息
feat(auth): implement JWT authentication

- Add login/logout endpoints
- Create JWT token generation utility
- Add authentication middleware
- Update API documentation

Closes #123

# ❌ Bad: 模糊的提交信息
fix: bug fix
update: changes
feat: new stuff
```

### 分支命名

```bash
# ✅ Good
feature/user-authentication
feature/websocket-realtime-data
bugfix/pdf-generation-timeout
bugfix/device-list-pagination
hotfix/critical-api-error
release/v4.0.0

# ❌ Bad
my-feature
fix
test-branch
branch1
```

---

## 文件命名规范

### 前端

```
frontend/src/
├── pages/
│   ├── Monitor.tsx           # PascalCase
│   ├── DeviceDetail.tsx
│   └── Diagnosis.tsx
│
├── components/
│   ├── DeviceCard.tsx        # PascalCase
│   ├── ConfirmModal.tsx
│   └── LoadingSkeleton.tsx
│
├── services/
│   └── api.ts                # camelCase
│
├── types/
│   └── device.ts             # camelCase
│
└── utils/
    ├── userPreferences.ts    # camelCase
    └── aiHistory.ts
```

### 后端

```
api/app/
├── main.py                   # snake_case
├── core/
│   └── config.py
├── schemas/
│   ├── device.py
│   └── diagnosis.py
├── services/
│   ├── device_service.py
│   └── diagnosis_service.py
└── api/v1/
    ├── devices.py
    └── diagnosis.py
```

---

## 注释规范

### 前端 (TypeScript)

```typescript
/**
 * 设备卡片组件
 *
 * 显示设备的基本信息和状态，支持点击跳转到详情页
 *
 * @example
 * ```tsx
 * <DeviceCard
 *   device={deviceData}
 *   onClick={(id) => navigate(`/device/${id}`)}
 * />
 * ```
 */
interface DeviceCardProps {
  /** 设备数据对象 */
  device: Device;
  /** 点击回调函数 */
  onClick?: (id: string) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onClick }) => {
  // 计算严重程度颜色（复杂逻辑需注释）
  const getSeverityColor = (severity: string): string => {
    const colorMap: Record<string, string> = {
      normal: 'bg-green-600',
      warning: 'bg-yellow-600',
      critical: 'bg-red-600',
    };
    return colorMap[severity] || 'bg-gray-600';
  };

  return (
    <div className={`card ${getSeverityColor(device.severity)}`}>
      {device.name}
    </div>
  );
};

// ❌ Bad: 无用注释
const handleClick = () => {
  // 处理点击  <-- 显而易见，无需注释
  onClick(device.id);
};
```

### 后端 (Python)

```python
def diagnose_device(device_id: str, gas_data: Dict[str, float]) -> DiagnosisResult:
    """
    执行DGA诊断分析

    使用IEC三比值法和Duval三角形法进行综合诊断，
    当两种方法结果不一致时，优先采用Duval三角形法的结果。

    Args:
        device_id: 设备唯一标识符
        gas_data: 气体浓度数据，包含H2、CH4等7种气体浓度(单位: ppm)

    Returns:
        DiagnosisResult: 包含故障类型、严重程度、建议措施

    Raises:
        ValueError: 当gas_data缺少必需的气体数据时
        HTTPException: 当设备不存在时返回404

    Example:
        >>> gas_data = {'H2': 150, 'CH4': 120, 'C2H4': 50, ...}
        >>> result = diagnose_device('T001', gas_data)
        >>> print(result.fault_type)
        '局部过热'
    """
    # 验证气体数据完整性
    _validate_gas_data(gas_data)

    # 执行IEC三比值诊断
    iec_result = _iec_three_ratio_method(gas_data)

    # 执行Duval三角形诊断
    duval_result = _duval_triangle_method(gas_data)

    # 综合两种方法的结果
    return _merge_diagnosis_results(iec_result, duval_result)
```

---

## 常见模式

### 1. 模态框组件模式

```typescript
// ✅ 标准模态框组件模式
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 其他props
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;  // 提前return

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg">
        <button onClick={onClose}>关闭</button>
        {/* 内容 */}
      </div>
    </div>
  );
};
```

### 2. 加载状态模式

```typescript
// ✅ 统一的加载状态处理
const DeviceList: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDevices();
        setDevices(data);
      } catch (err) {
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (devices.length === 0) return <EmptyState />;

  return <div>{/* 渲染设备列表 */}</div>;
};
```

### 3. API响应处理模式

```python
# ✅ 统一的API响应结构
@router.post("/diagnosis")
async def diagnose(request: DiagnosisRequest) -> DiagnosisResponse:
    try:
        result = diagnosis_service.diagnose(request)
        return DiagnosisResponse(
            success=True,
            data=result,
            message="诊断成功"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"诊断失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="诊断服务异常"
        )
```

---

## 检查清单

### 提交前检查

**前端:**
- [ ] 所有TypeScript类型正确，无any
- [ ] 组件有清晰的Props接口
- [ ] 使用Tailwind CSS而非内联样式
- [ ] 错误处理完善（try-catch + message提示）
- [ ] 代码格式化（npm run lint）

**后端:**
- [ ] 所有函数有Type Hints
- [ ] Pydantic模型定义清晰
- [ ] 异常处理使用HTTPException
- [ ] 业务逻辑在service层
- [ ] API文档完整（summary + description）

**通用:**
- [ ] Git提交信息符合Conventional Commits
- [ ] 无console.log/print调试代码
- [ ] 关键逻辑有注释
- [ ] 文件命名符合规范

---

**遵循这些规范可以确保代码质量和团队协作效率！** 🎯
