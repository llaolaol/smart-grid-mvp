# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

智能电网运维平台 - 基于 React + FastAPI 的变压器数字孪生系统，提供 DGA 诊断、What-if 推演、AI 辅助分析等功能。

**当前版本:** v3.0.0
**技术栈:** React 18 + TypeScript 5 + FastAPI 0.109 + Pydantic v2

## 常用命令

### 开发环境启动

```bash
# 后端启动（端口 8080）
cd api
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# 前端启动（端口 3003）
cd frontend
npm run dev
```

### 依赖安装

```bash
# 后端依赖
cd api
pip3 install -r requirements.txt

# 前端依赖
cd frontend
npm install
```

### 构建与检查

```bash
# 前端构建
cd frontend
npm run build

# 前端代码检查
npm run lint

# 前端预览构建产物
npm run preview
```

### 环境变量配置

```bash
# 创建环境变量文件
cp .env.example .env

# 必需配置 DeepSeek API 密钥
echo "DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx" > .env
```

### API 文档访问

- **Swagger UI:** http://localhost:8080/docs
- **ReDoc:** http://localhost:8080/redoc
- **健康检查:** http://localhost:8080/health
- **前端应用:** http://localhost:3003

## 架构设计

### 三层架构

```
frontend/           → React UI 层
api/app/           → FastAPI Web 层（路由 + schemas + services）
backend/           → 业务逻辑层（DGA诊断器、热模型、老化模型、LLM代理）
```

**重要:** `backend/models/` 包含核心领域知识（IEC 60599、Duval Triangle、IEEE 老化模型），**不应重构或删除**。

### 前端架构（frontend/src/）

- **pages/** - 路由页面组件，对应 React Router 路由
- **components/** - 可复用 UI 组件（Modal、Loading、Empty State）
- **services/api.ts** - Axios HTTP 客户端，所有 API 调用统一入口
- **types/** - TypeScript 类型定义
- **utils/** - 工具函数（用户偏好、导出数据、AI 历史记录）

**状态管理:** 未使用 Redux/Zustand，使用 React Hooks (useState/useEffect)

**样式系统:** Tailwind CSS + Ant Design 深度定制（工业 SCADA 深色主题）

### 后端架构（api/app/）

- **main.py** - FastAPI 应用入口，CORS 配置
- **core/config.py** - 环境变量管理（使用 pydantic-settings）
- **schemas/** - Pydantic v2 数据模型（请求/响应验证）
- **services/** - 业务服务层，调用 `backend/models` 核心逻辑
- **api/v1/** - API 路由定义（RESTful 接口）

**数据存储:** 当前使用 `backend/data/scenarios.json`（无数据库依赖）

**API 版本:** 所有接口使用 `/api/v1` 前缀

### 关键模块

**DGA 诊断引擎** (`backend/models/dga_diagnoser.py`)
- IEC 60599 三比值法
- Duval 三角形法
- Rogers 比值法
- 投票机制综合诊断

**热模型** (`backend/models/thermal_model.py`)
- 基于 IEC 60076 标准
- 油温和热点温度计算
- 冷却系统故障模拟

**老化模型** (`backend/models/aging_model.py`)
- Arrhenius 老化方程
- IEEE 寿命损失因子（FAA）
- DP 值和剩余寿命预测

**What-if 推演** (`backend/models/simulator.py`)
- 多物理场耦合（热 + 化学 + 老化）
- A/B 场景对比
- 时间线演化预测

**AI 代理** (`backend/llm/llm_agent.py`)
- DeepSeek API 封装（gpt-4o-mini）
- 自然语言诊断建议
- 函数调用支持

**PDF 报告生成** (`backend/reports/pdf_generator.py`)
- ReportLab 库生成专业报告
- 支持单设备和批量导出

## 开发规范

### 代码规范

**前端 TypeScript:**
- 组件使用 PascalCase（`DeviceCard.tsx`）
- 工具文件使用 camelCase（`userPreferences.ts`）
- 严格类型注解，避免使用 `any`
- Props 接口命名使用 `Props` 后缀（`DeviceCardProps`）
- 事件处理函数使用 `handle` 前缀（`handleClick`）

**后端 Python:**
- 遵循 PEP 8 规范
- 文件名使用 snake_case（`device_service.py`）
- 类名使用 PascalCase（`DeviceService`）
- 函数名使用 snake_case（`get_device_by_id`）
- 所有函数必须有 Type Hints
- Pydantic 模型使用 v2 语法（`model_config = ConfigDict(...)`）

### Git 提交规范

遵循 Conventional Commits：

```
feat(scope): 新功能
fix(scope): Bug 修复
docs: 文档更新
refactor: 代码重构
perf: 性能优化
test: 测试
chore: 构建/工具配置
```

示例:
```bash
feat(diagnosis): add Duval triangle visualization
fix(api): resolve CORS issue for localhost:3003
docs(readme): update deployment instructions
```

### 分支命名

```
feature/feature-name
bugfix/bug-description
hotfix/critical-fix
release/vX.Y.Z
```

## 重要文件与配置

### 环境变量（.env）

```bash
# DeepSeek API（AI 功能必需）
DEEPSEEK_API_KEY=sk-xxxxx

# 后端配置（可选，有默认值）
API_HOST=0.0.0.0
API_PORT=8080
API_DEBUG=true
```

### 数据文件

- `backend/data/scenarios.json` - 场景和设备数据（正常、混合、多故障场景）
- `backend/data/full_dataset.json` - 完整数据集（可选）

### 配置文件

- `frontend/vite.config.ts` - Vite 构建配置，Proxy 代理配置
- `frontend/tailwind.config.js` - Tailwind 主题配置
- `api/app/core/config.py` - 后端环境变量管理
- `docker-compose.yml` - Docker 部署配置

## 常见任务

### 添加新的 API 端点

1. 在 `api/app/schemas/` 创建 Pydantic 模型（请求/响应）
2. 在 `api/app/services/` 实现业务逻辑
3. 在 `api/app/api/v1/` 创建路由，注册到 `main.py`
4. 访问 `/docs` 验证 API 文档自动生成

### 添加新的前端页面

1. 在 `frontend/src/pages/` 创建组件
2. 在 `frontend/src/App.tsx` 添加路由
3. 在 `frontend/src/services/api.ts` 添加 API 调用函数
4. 在 `frontend/src/types/` 添加 TypeScript 类型定义

### 调试 API 调用

1. 检查浏览器 DevTools Network 标签
2. 检查后端终端日志（uvicorn 输出）
3. 使用 Swagger UI (`/docs`) 手动测试 API
4. 检查 CORS 配置（`api/app/main.py`）

### 修改深色主题样式

所有 Ant Design 组件样式覆盖在 `frontend/src/index.css` 中，搜索对应组件类名修改。

工业 SCADA 配色方案：
- 背景色: `#0f172a` (slate-900)
- 边框色: `#334155` (slate-700)
- 文字色: `#f1f5f9` (slate-100)
- 强调色: `#3b82f6` (blue-500)

## 已知限制与技术债务

### 当前限制

1. **无持久化存储** - 数据存储在 JSON 文件，重启后用户偏好丢失
2. **无用户认证** - 未实现 JWT 认证，所有接口公开访问
3. **无实时数据推送** - 未使用 WebSocket，数据需手动刷新
4. **无单元测试** - 测试覆盖率 0%

### v4.0 规划（后续版本）

- [ ] PostgreSQL 持久化存储
- [ ] JWT 用户认证与授权
- [ ] Redis 缓存层
- [ ] WebSocket 实时数据推送
- [ ] 单元测试覆盖 (>80%)
- [ ] E2E 测试（Playwright）
- [ ] CI/CD 流程（GitHub Actions）

详见 `PROJECT_STATUS.md` 和 `ROADMAP.md`

## 参考文档

**必读文档:**
- `HANDOVER.md` - 完整移交指南（技术架构、设计决策、已知问题）
- `DEVELOPMENT.md` - 开发环境配置、调试技巧、常见问题
- `CODE_STANDARDS.md` - 代码规范与最佳实践

**API 文档:**
- `API_DOCUMENTATION.md` - 详细接口文档
- http://localhost:8080/docs - 交互式 Swagger UI

**其他文档:**
- `README.md` - 项目介绍与快速开始
- `QUICKSTART.md` - MVP 快速启动指南
- `CHANGELOG.md` - 版本更新日志

## 特殊注意事项

### 不要修改的模块

- `backend/models/dga_diagnoser.py` - 包含专业 DGA 诊断算法（IEC 标准）
- `backend/models/thermal_model.py` - 包含 IEEE 热模型标准实现
- `backend/models/aging_model.py` - 包含 Arrhenius 老化模型
- `backend/data/scenarios.json` - 测试数据，修改需谨慎

### Pydantic v2 迁移完成

项目已迁移到 Pydantic v2，注意：

```python
# ✅ 正确写法（v2）
class Device(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# ❌ 错误写法（v1，已废弃）
class Device(BaseModel):
    class Config:
        orm_mode = True
```

### CORS 配置

开发时前端运行在 `localhost:3003`，后端 CORS 已配置允许。如修改前端端口，需同步更新 `api/app/main.py` 中的 `allow_origins`。

### AI 功能调试

如果 DeepSeek API 调用失败：
1. 检查环境变量 `DEEPSEEK_API_KEY` 是否正确
2. 检查 API 密钥余额和速率限制
3. 临时禁用 AI 功能可在前端隐藏 AI 助手页面

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问 http://localhost:80（Nginx 反向代理）

## 联系与支持

- **API 错误** - 检查 `http://localhost:8080/docs` 和后端终端日志
- **前端错误** - 检查浏览器 Console 和 Network 标签
- **环境问题** - 参考 `DEVELOPMENT.md` 常见问题部分

**项目文档总量:** 19 篇，101,000+ 字
