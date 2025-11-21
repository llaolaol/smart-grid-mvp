# 🚀 快速运行Demo指南

## 一键启动（推荐）

### Step 1: 安装依赖

```bash
cd "/Users/chinafocus/Obsidian Vault/claude code/projects/smart-grid-mvp"

# 安装Streamlit和基础依赖
pip3 install streamlit plotly pandas numpy scipy pyyaml
```

### Step 2: 运行Demo

```bash
streamlit run demo_app.py
```

浏览器会自动打开 `http://localhost:8501`

---

## 🎯 Demo功能演示

###  1. **诊断分析页面**
- **机理诊断**: 显示热点温度、产气速率、失效时间
- **传统诊断**: DGA数据表、IEC三比值、杜瓦尔三角图
- **方法对比**: 传统方法 vs 机理模型的对比

### 2. **数字沙盘页面**（核心功能）
- **快捷推演**:
  - 点击"如果我降低30%负载？"
  - 点击"如果冷却系统故障？"
- **自定义推演**:
  - 调整负载率（0-120%）
  - 调整环境温度（-20-50°C）
  - 选择推演时长（7天/30天）

### 3. **对比报告页面**
- A/B工况对比表
- 关键指标改善（温度↓、产气↓、寿命↑）
- 时间线演化图表
- 导出报告/采纳方案

---

## 📸 Demo演示流程（5分钟）

### 场景：1号主变高能放电缺陷，如何处理？

#### 1️⃣ 诊断（1分钟）
1. 打开Demo，选择"1号主变"
2. 查看"诊断分析"页面
3. 看到：
   - 热点温度105°C（超标）
   - C₂H₂ 78ppm（严重超标）
   - 预计35天失效

#### 2️⃣ 推演（2分钟）
1. 切换到"数字沙盘"页面
2. 点击"如果我降低30%负载？"
3. 等待3-5秒（模拟计算）
4. 看到推演完成提示："✅ 推演完成！请切换到「📊 对比报告」标签页查看详细结果 →"

#### 3️⃣ 决策（2分钟）
1. **按照提示切换到"对比报告"页面**
2. 看到对比结果：
   - 温度：105°C → 82°C（↓23°C）
   - 产气速率：↓85%
   - 失效时间：35天 → 180天
3. 点击"采纳此方案"

**结论**：降载30%可有效延长180天，为检修争取时间！

---

## 🎨 对比React Mockup

### 已实现的功能：
✅ 三标签页布局（诊断/沙盘/报告）
✅ 机理诊断 vs 传统诊断对比
✅ DGA数据表 + IEC三比值 + 杜瓦尔
✅ What-if快捷推演
✅ A/B工况对比表
✅ 时间线演化图表
✅ 关键指标卡片

### 与React版本的差异：
- 🔺 3D可视化：Streamlit用2D图表代替（可升级）
- 🔺 推演向导：简化为滑块控制（更快迭代）
- 🔺 实时动画：静态展示（Streamlit限制）
- ✅ 核心功能：100%覆盖

---

## ⚡ 快速测试清单

```bash
# 1. 测试DGA诊断
cd backend/models
python3 -c "import sys; sys.path.insert(0, '.'); from dga_diagnoser import quick_diagnose; print(quick_diagnose(H2=145, CH4=32, C2H6=8, C2H4=45, C2H2=78, CO=420, CO2=3200))"

# 2. 测试热模型
python3 -c "import sys; sys.path.insert(0, '.'); from thermal_model import quick_thermal_check; print(quick_thermal_check(85, 25))"

# 3. 测试老化模型
python3 -c "import sys; sys.path.insert(0, '.'); from aging_model import quick_life_check; print(quick_life_check(105, 450, 10))"

# 4. 运行完整Demo
cd ../..
streamlit run demo_app.py
```

---

## 🐛 常见问题

### 问题1：ModuleNotFoundError
```bash
# 确保在项目根目录
cd "/Users/chinafocus/Obsidian Vault/claude code/projects/smart-grid-mvp"

# 重新安装依赖
pip3 install -r requirements.txt
```

### 问题2：端口占用
```bash
# 指定其他端口
streamlit run demo_app.py --server.port 8502
```

### 问题3：Streamlit未安装
```bash
pip3 install streamlit
```

---

## 🎉 完成度检查

- [x] DGA诊断引擎 ✅
- [x] 热模型 ✅
- [x] 老化模型 ✅
- [x] What-if推演 ✅
- [x] Streamlit界面 ✅
- [x] A/B对比 ✅
- [x] 时间线图表 ✅
- [x] Demo测试 ✅
- [x] UX优化 ✅
- [ ] LLM对话（下一步）
- [ ] PDF导出（下一步）
- [ ] 真实数据接入（下一步）

**当前进度：56% ✅**（Day 16工作量）

Day 1-2: ✅ 后端核心模块
Day 3-5: ✅ 推演引擎
Day 6-10: ✅ 完整Demo应用
Day 11: ✅ Demo测试 + UX优化

---

## 📞 下一步

1. **运行Demo**：`streamlit run demo_app.py`
2. **测试功能**：按照演示流程走一遍
3. **反馈问题**：告诉我需要调整的地方
4. **继续开发**：
   - 添加LLM对话功能
   - 接入真实SCADA数据
   - 部署到服务器

**让我知道Demo运行结果！**
