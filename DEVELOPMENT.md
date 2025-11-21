# 开发指南

## 📋 目录

- [开发环境准备](#开发环境准备)
- [项目启动](#项目启动)
- [开发工作流](#开发工作流)
- [调试技巧](#调试技巧)
- [常见问题](#常见问题)
- [工具推荐](#工具推荐)

---

## 开发环境准备

### 系统要求

- **操作系统:** macOS / Linux / Windows (WSL2推荐)
- **Python:** 3.9+
- **Node.js:** 18+
- **包管理器:** npm / yarn / pnpm
- **IDE:** VSCode (推荐) / PyCharm / WebStorm

### 必需软件安装

#### 1. Python环境

```bash
# macOS (使用Homebrew)
brew install python@3.9

# Ubuntu/Debian
sudo apt install python3.9 python3-pip

# 验证安装
python3 --version  # 应输出 Python 3.9.x
pip3 --version
```

#### 2. Node.js环境

```bash
# macOS
brew install node@18

# Ubuntu/Debian (使用nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 验证安装
node --version  # 应输出 v18.x.x
npm --version
```

#### 3. Git

```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt install git

# 配置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### IDE配置

#### VSCode推荐插件

```json
{
  "recommendations": [
    // Python
    "ms-python.python",
    "ms-python.vscode-pylance",

    // JavaScript/TypeScript
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",

    // React
    "dsznajder.es7-react-js-snippets",

    // Git
    "eamodio.gitlens",

    // 工具
    "streetsidesoftware.code-spell-checker",
    "EditorConfig.EditorConfig"
  ]
}
```

保存为 `.vscode/extensions.json`

#### VSCode设置

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "tailwindCSS.experimental.classRegex": [
    ["className=\"([^\"]*)\"", "([^\"]*)", "([\\w-]+)"]
  ]
}
```

保存为 `.vscode/settings.json`

---

## 项目启动

### 1. 克隆项目

```bash
git clone <repository-url>
cd smart-grid-mvp
```

### 2. 后端安装与启动

```bash
# 进入后端目录
cd api

# 创建虚拟环境（可选但推荐）
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip3 install -r requirements.txt

# 配置环境变量
cp ../.env.example ../.env
# 编辑.env文件，添加DeepSeek API密钥
echo "DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" > ../.env

# 启动开发服务器（默认端口8080）
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# 或使用环境变量方式
export DEEPSEEK_API_KEY='sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

**成功启动后访问：**
- Swagger文档: http://localhost:8080/docs
- ReDoc文档: http://localhost:8080/redoc
- Health check: http://localhost:8080/api/v1/health

### 3. 前端安装与启动

```bash
# 新开终端，进入前端目录
cd frontend

# 安装依赖（首次）
npm install

# 启动开发服务器（默认端口3003）
npm run dev

# 或指定端口
npm run dev -- --port 3000
```

**成功启动后访问：**
- 前端应用: http://localhost:3003

### 4. 验证启动成功

**后端验证：**
```bash
# 测试API健康检查
curl http://localhost:8080/api/v1/health

# 测试获取场景列表
curl http://localhost:8080/api/v1/devices/scenarios

# 应返回JSON数据
```

**前端验证：**
1. 浏览器打开 http://localhost:3003
2. 应看到工业SCADA深色主题界面
3. 尝试切换场景，查看设备列表

---

## 开发工作流

### 功能开发流程

#### 1. 创建功能分支

```bash
# 从develop分支创建新分支
git checkout develop
git pull origin develop
git checkout -b feature/new-feature-name
```

#### 2. 前端开发

```bash
cd frontend

# 创建新组件
# frontend/src/components/NewComponent.tsx

import React from 'react';

interface NewComponentProps {
  // props定义
}

const NewComponent: React.FC<NewComponentProps> = ({ ...props }) => {
  return <div>New Component</div>;
};

export default NewComponent;

# 创建新页面
# frontend/src/pages/NewPage.tsx

# 添加路由
# 编辑 frontend/src/App.tsx
<Route path="/new-page" element={<NewPage />} />

# 创建API服务
# 编辑 frontend/src/services/api.ts
export const getNewData = async () => {
  return api.get('/api/v1/new-endpoint');
};
```

#### 3. 后端开发

```bash
cd api

# 1. 创建Pydantic模型（schemas）
# api/app/schemas/new_schema.py
from pydantic import BaseModel

class NewRequest(BaseModel):
    field: str

class NewResponse(BaseModel):
    result: str

# 2. 创建业务服务（services）
# api/app/services/new_service.py
class NewService:
    def process(self, data: NewRequest) -> NewResponse:
        # 业务逻辑
        return NewResponse(result="success")

# 3. 创建API路由（api/v1）
# api/app/api/v1/new_routes.py
from fastapi import APIRouter

router = APIRouter(prefix="/new", tags=["new"])

@router.post("/", response_model=NewResponse)
async def create_new(request: NewRequest):
    service = NewService()
    return service.process(request)

# 4. 注册路由
# 编辑 api/app/api/v1/__init__.py
from .new_routes import router as new_router
api_router.include_router(new_router)
```

#### 4. 实时开发

```bash
# 前端 - Vite热更新（自动刷新）
# 修改代码后保存，浏览器自动刷新

# 后端 - Uvicorn自动重载
# 修改Python代码后保存，服务器自动重启
# 查看终端日志确认重启成功
```

#### 5. 测试功能

**前端测试：**
```bash
# 浏览器中手动测试
# 打开DevTools查看网络请求和控制台日志

# 检查TypeScript错误
npm run build
```

**后端测试：**
```bash
# 使用Swagger UI测试API
# http://localhost:8080/docs

# 或使用curl
curl -X POST http://localhost:8080/api/v1/new \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'

# 或使用Python测试脚本
python3 -c "
import requests
response = requests.post('http://localhost:8080/api/v1/new', json={'field': 'value'})
print(response.json())
"
```

#### 6. 提交代码

```bash
# 查看修改
git status
git diff

# 添加文件
git add .

# 提交（遵循Conventional Commits）
git commit -m "feat(new): add new feature"

# 推送到远程
git push origin feature/new-feature-name
```

#### 7. 创建Pull Request

1. 前往Git平台（GitHub/GitLab）
2. 创建PR从 `feature/new-feature-name` → `develop`
3. 填写PR描述（功能说明、测试步骤）
4. 等待代码审查

---

## 调试技巧

### 前端调试

#### 1. Chrome DevTools

```typescript
// 使用console.log调试（开发阶段）
console.log('Device data:', device);
console.table(devices);  // 表格形式展示数组
console.error('Error occurred:', error);

// 使用debugger断点
const handleClick = () => {
  debugger;  // 代码执行到这里会暂停
  processData();
};
```

#### 2. React DevTools

- 安装Chrome扩展: React Developer Tools
- 查看组件树和Props/State
- 追踪组件渲染性能

#### 3. 网络请求调试

```typescript
// 在api.ts中添加请求/响应拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data);
    return Promise.reject(error);
  }
);
```

### 后端调试

#### 1. 日志调试

```python
# 使用logging模块
import logging

logger = logging.getLogger(__name__)

def process_data(data):
    logger.debug(f"Input data: {data}")  # 详细日志
    logger.info(f"Processing started")   # 常规日志

    try:
        result = complex_operation(data)
        logger.info(f"Processing completed: {result}")
        return result
    except Exception as e:
        logger.error(f"Processing failed: {e}", exc_info=True)  # 包含堆栈信息
        raise
```

#### 2. pdb调试器

```python
# 在代码中插入断点
def diagnose_device(device_id: str):
    import pdb; pdb.set_trace()  # 执行到这里会暂停

    # 常用命令：
    # n - next (下一行)
    # s - step (进入函数)
    # c - continue (继续执行)
    # p variable - print (打印变量)
    # l - list (显示代码)
    # q - quit (退出)

    result = perform_diagnosis(device_id)
    return result
```

#### 3. FastAPI日志输出

```bash
# 启动时启用详细日志
uvicorn app.main:app --reload --log-level debug

# 查看所有API请求
# 每次请求都会在终端输出：
# INFO:     127.0.0.1:54321 - "GET /api/v1/devices HTTP/1.1" 200 OK
```

#### 4. 使用IPython

```bash
# 安装IPython
pip3 install ipython

# 在代码中使用
def complex_function():
    from IPython import embed
    embed()  # 打开交互式shell，可以检查变量

    # 或使用更简洁的方式
    breakpoint()  # Python 3.7+
```

### API调试工具

#### 1. Swagger UI

访问 http://localhost:8080/docs

- 直接测试所有API端点
- 查看请求/响应模型
- 自动生成示例代码

#### 2. curl命令

```bash
# GET请求
curl http://localhost:8080/api/v1/devices/scenarios

# POST请求（DGA诊断）
curl -X POST http://localhost:8080/api/v1/diagnosis/ \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "T001",
    "gas_concentrations": {
      "H2": 150,
      "CH4": 120,
      "C2H4": 50,
      "C2H6": 65,
      "C2H2": 1,
      "CO": 400,
      "CO2": 2500
    }
  }'
```

#### 3. Postman/Insomnia

- 导入OpenAPI规范: http://localhost:8080/openapi.json
- 保存常用请求到Collection
- 环境变量管理

---

## 常见问题

### 前端问题

#### Q1: 端口3003被占用

```bash
# 查找占用端口的进程
lsof -ti:3003

# 杀死进程
lsof -ti:3003 | xargs kill -9

# 或使用其他端口
npm run dev -- --port 3000
```

#### Q2: npm install失败

```bash
# 清除缓存
npm cache clean --force

# 删除node_modules和package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 如果仍失败，尝试使用yarn
npm install -g yarn
yarn install
```

#### Q3: TypeScript类型错误

```bash
# 检查类型错误
npm run build

# 重启TypeScript服务器（VSCode）
Cmd+Shift+P -> TypeScript: Restart TS Server
```

#### Q4: Tailwind样式不生效

```bash
# 确认tailwind.config.js配置正确
# content应包含所有组件文件
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
],

# 重启开发服务器
npm run dev
```

### 后端问题

#### Q1: 端口8080被占用

```bash
# 查找并杀死进程
lsof -ti:8080 | xargs kill -9

# 或使用其他端口
uvicorn app.main:app --port 8081 --reload
```

#### Q2: DeepSeek API调用失败

```bash
# 检查环境变量
echo $DEEPSEEK_API_KEY

# 验证API密钥有效性
curl https://api.deepseek.com/v1/models \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY"

# 临时禁用AI功能（修改代码使用mock数据）
```

#### Q3: 模块导入错误

```bash
# 确认在正确的目录启动
cd api
python3 -m uvicorn app.main:app --reload

# 而不是
cd api/app
python3 -m uvicorn main:app  # 错误！
```

#### Q4: Pydantic v2迁移问题

```python
# v1写法（已废弃）
class Device(BaseModel):
    class Config:
        orm_mode = True

# v2写法（正确）
class Device(BaseModel):
    model_config = ConfigDict(from_attributes=True)
```

### 通用问题

#### Q1: CORS错误

前端控制台显示：`Access to XMLHttpRequest blocked by CORS policy`

**解决方案：**
```python
# 确认api/app/main.py中CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003"],  # 确保包含前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Q2: Git冲突解决

```bash
# 拉取最新代码时出现冲突
git pull origin develop

# 查看冲突文件
git status

# 手动编辑冲突文件，移除冲突标记
<<<<<<< HEAD
你的修改
=======
别人的修改
>>>>>>> branch-name

# 解决后添加并提交
git add .
git commit -m "fix: resolve merge conflicts"
```

---

## 工具推荐

### 代码质量

```bash
# 前端 - ESLint + Prettier
npm install --save-dev eslint prettier
npm run lint

# 后端 - Black + Flake8
pip3 install black flake8
black api/app
flake8 api/app
```

### 性能分析

```bash
# 前端 - Lighthouse（Chrome DevTools）
# 后端 - py-spy性能分析
pip3 install py-spy
py-spy top --pid <uvicorn-pid>
```

### 数据库工具（v4.0需要）

- **PostgreSQL客户端:** TablePlus / DBeaver
- **Redis客户端:** RedisInsight / Medis

### API文档

- **在线Mock:** [Mockoon](https://mockoon.com/)
- **API测试:** [Postman](https://www.postman.com/) / [Insomnia](https://insomnia.rest/)

---

## 开发建议

### 每日工作流程

1. **早上启动：**
   ```bash
   git pull origin develop  # 拉取最新代码
   cd api && python3 -m uvicorn app.main:app --reload
   cd frontend && npm run dev
   ```

2. **开发过程：**
   - 频繁保存，利用热更新
   - 每完成一个小功能就提交一次
   - 使用浏览器DevTools和API文档调试

3. **下班前：**
   ```bash
   git status  # 检查未提交的修改
   git add . && git commit -m "chore: save work in progress"
   git push origin feature/xxx
   ```

### 提高效率技巧

1. **使用代码片段：** VSCode snippets加速开发
2. **快捷键：** 掌握IDE快捷键（重构、跳转定义）
3. **终端复用：** 使用tmux或VSCode集成终端
4. **自动化脚本：** 编写shell脚本简化重复操作

---

**祝开发顺利！遇到问题优先查看文档和日志，必要时在团队中提问。** 🚀
