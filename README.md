# 智能电网运维平台

一个基于 React + FastAPI 的现代化智能电网设备监控与诊断平台，提供 DGA 诊断、What-if 推演等核心功能。

## 📋 项目移交

**工程化开发团队请优先阅读：** [HANDOVER.md](./HANDOVER.md)

该文档包含：
- 完整的技术架构说明
- 关键设计决策与权衡
- 环境配置与启动指南
- 已知问题与技术债务
- 后续规划与移交清单

**开发指南：** [DEVELOPMENT.md](./DEVELOPMENT.md) | **代码规范：** [CODE_STANDARDS.md](./CODE_STANDARDS.md)

## 🌟 核心功能

- **设备监控** - 实时查看设备状态、多场景切换、数据可视化
- **DGA 诊断** - 溶解气体分析，智能故障诊断与建议
- **What-if 推演** - A/B 场景对比，设备寿命预测
- **报告生成** - 一键导出专业 PDF 诊断报告

## 🏗️ 技术架构

```
┌─────────────────────────────────────┐
│   React 18 + TypeScript + Vite     │
│   Ant Design Pro 5 + ECharts 5     │
└─────────────────────────────────────┘
              ↓ REST API
┌─────────────────────────────────────┐
│       FastAPI + Pydantic v2         │
│    OpenAPI 3.0 + Auto Docs          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Business Logic (Preserved)       │
│  DGA Diagnoser | Simulator | LLM   │
└─────────────────────────────────────┘
```

## 📦 项目结构

```
smart-grid-mvp/
├── api/                    # FastAPI 后端
│   ├── app/
│   │   ├── core/          # 配置
│   │   ├── schemas/       # 数据模型
│   │   ├── services/      # 业务逻辑
│   │   └── api/v1/        # API 路由
│   └── requirements.txt
│
├── frontend/              # React 前端
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── components/   # 可复用组件
│   │   ├── services/     # API 客户端
│   │   └── types/        # TypeScript 类型
│   └── package.json
│
├── backend/               # 业务模型（保留）
│   ├── models/           # DGA、热模型、老化模型
│   └── llm/              # LLM 代理
│
└── data/                  # 数据文件
    └── scenarios.json
```

## 🚀 快速开始

### 前提条件

- Python 3.9+
- Node.js 18+
- npm 或 yarn

### 1. 安装依赖

**后端：**
```bash
cd api
pip3 install -r requirements.txt
```

**前端：**
```bash
cd frontend
npm install
```

### 2. 配置环境变量

```bash
# 创建 .env 文件
cp .env.example .env

# 编辑 .env 文件，添加必要的 API 密钥
DEEPSEEK_API_KEY=your_api_key_here
```

### 3. 启动服务

**启动后端（终端1）：**
```bash
cd api
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

**启动前端（终端2）：**
```bash
cd frontend
npm run dev
```

### 4. 访问应用

- **前端应用：** http://localhost:3003
- **API 文档：** http://localhost:8080/docs
- **ReDoc：** http://localhost:8080/redoc

## 📖 API 文档

完整的 API 文档请查看：
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - 详细接口文档
- [Swagger UI](http://localhost:8080/docs) - 交互式 API 测试

### 主要接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/devices/scenarios` | GET | 获取场景列表 |
| `/api/v1/devices/scenarios/{id}` | GET | 获取场景设备 |
| `/api/v1/diagnosis/` | POST | DGA 诊断 |
| `/api/v1/simulation/compare` | POST | What-if 推演 |
| `/api/v1/reports/diagnosis/{id}` | POST | 生成诊断报告 |

## 🎯 功能特性

### 设备监控
- ✅ 多场景切换（正常、混合、多故障）
- ✅ 设备列表表格（排序、分页、筛选）
- ✅ 严重程度标识（正常、注意、异常、严重）
- ✅ 一键跳转设备详情

### 设备详情
- ✅ DGA 气体浓度柱状图
- ✅ 热点温度仪表盘
- ✅ 运行参数分组展示
- ✅ 自动诊断结果
- ✅ PDF 报告下载

### DGA 诊断
- ✅ 手动输入 7 种气体浓度
- ✅ 示例数据快速加载
- ✅ 实时诊断执行
- ✅ 故障类型识别
- ✅ 建议措施生成

### What-if 推演
- ✅ A/B 场景对比
- ✅ 寿命预测
- ✅ 改善指标统计
- ✅ 雷达图可视化

## 🛠️ 开发指南

### 技术栈

**前端：**
- React 18.2
- TypeScript 5.2
- Ant Design Pro 5.12
- ECharts 5.4
- React Router 6
- Axios 1.6
- Vite 5.0

**后端：**
- FastAPI 0.109
- Pydantic v2.5
- Uvicorn 0.27
- Python 3.9+

### 代码规范

**前端：**
- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 遵循 ESLint 规则

**后端：**
- 遵循 PEP 8 规范
- 使用 Type Hints
- API 路由遵循 RESTful 设计

### 项目脚本

**前端：**
```bash
npm run dev      # 开发模式
npm run build    # 生产构建
npm run preview  # 预览构建
npm run lint     # 代码检查
```

**后端：**
```bash
# 开发模式
uvicorn app.main:app --reload

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

## 🐳 Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 📊 项目状态

### v3.0.0 已完成功能
- ✅ FastAPI 后端架构
- ✅ React 前端架构 + TypeScript
- ✅ 设备监控模块 (实时监控/多设备对比)
- ✅ DGA 诊断模块 (IEC + Duval)
- ✅ What-if 推演模块 (A/B对比)
- ✅ AI智能助手 (DeepSeek集成)
- ✅ PDF 报告生成 (单设备/批量)
- ✅ 数据上传与导出
- ✅ 用户偏好设置
- ✅ 历史记录管理
- ✅ 工业SCADA深色主题
- ✅ API 自动文档 (Swagger + ReDoc)
- ✅ 完整类型定义 (TypeScript + Pydantic v2)

### 后续规划 (v4.0.0)
- [ ] 数据持久化 (PostgreSQL)
- [ ] 用户认证与授权 (JWT)
- [ ] 数据缓存层 (Redis)
- [ ] 实时数据推送 (WebSocket)
- [ ] 单元测试覆盖 (>80%)
- [ ] E2E测试 (Playwright)
- [ ] CI/CD 流程 (GitHub Actions)
- [ ] 性能监控与日志聚合

详细规划请查看 [PROJECT_STATUS.md](./PROJECT_STATUS.md)

## 📝 更新日志

### v3.0.0 (2025-11-17) - **Current**
- 📚 项目移交文档包完成
  - HANDOVER.md - 完整移交指南
  - DEVELOPMENT.md - 开发环境与工作流
  - CODE_STANDARDS.md - 代码规范与最佳实践
- 📚 文档总量：19篇，101,000+字

### v3.0.0 (2025-11-14)
- ✨ AI功能完整集成 (DeepSeek API)
- ✨ PDF报告生成完成 (单设备/批量)
- ✨ 多设备对比分析功能
- ✨ UX细节全面优化 (字体/颜色/交互)
- ✨ MarkdownDisplay深色主题优化
- ✨ 历史记录管理完善
- 🎨 工业SCADA主题完善
- 📚 项目文档全面更新

### v2.0.0 (2025-11-14)
- ✨ 完成 Streamlit → React 迁移
- ✨ 工业SCADA深色主题设计
- ✨ 所有核心功能对等实现
- 📚 完整 API 文档

### v1.0.0 (2025-11-13)
- ✨ Streamlit MVP初始版本
- ✨ 实现设备监控、诊断、推演核心功能
- 🎨 基础 UI 界面

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 License

MIT License

## 📞 联系方式

- 项目文档：[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- 迁移总结：[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)

---

**Built with ❤️ using React + FastAPI**
