# Smart Grid Operation Platform - API Documentation

## 📋 Overview

This document provides comprehensive documentation for the FastAPI backend that powers the Smart Grid Operation Platform. The backend provides RESTful APIs for device management, DGA diagnosis, what-if simulation, and PDF report generation.

**Base URL:** `http://localhost:8080`
**API Version:** v1
**API Prefix:** `/api/v1`

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Planned)                 │
│              Ant Design + TypeScript + ECharts              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                         │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   API Layer  │  │ Service Layer│  │    Models    │      │
│  │              │  │              │  │              │      │
│  │ • diagnosis  │→ │ diagnosis_   │→ │ DGADiagnoser │      │
│  │ • simulation │→ │   service    │→ │ Simulator    │      │
│  │ • devices    │→ │ device_      │→ │ DataLoader   │      │
│  │ • reports    │→ │   service    │→ │ PDFGenerator │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│                     Pydantic Schemas                         │
│         (Request/Response Validation & Serialization)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Data Files     │
                    │ • scenarios.json │
                    │ • devices/*.json │
                    └──────────────────┘
```

### Key Design Principles

1. **Service Layer Pattern**: Business logic is encapsulated in service classes, separating it from API routing
2. **Existing Model Integration**: All existing Python models (DGADiagnoser, Simulator, etc.) are preserved and wrapped
3. **Schema Validation**: Pydantic v2 provides automatic request/response validation
4. **RESTful Design**: Resources are organized following REST conventions
5. **CORS Support**: Configured to support React dev servers (ports 3000, 5173)

## 📚 API Endpoints

### 1. Root & Health Check

#### GET `/`
Returns API status and version information.

**Response:**
```json
{
  "message": "Smart Grid Operation Platform API",
  "version": "1.0.0",
  "status": "running",
  "docs": "/docs"
}
```

#### GET `/health`
Global health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:30:00"
}
```

---

### 2. Device Management

#### GET `/api/v1/devices/scenarios`
Get list of available scenarios.

**Response:**
```json
[
  {
    "scenario_id": "all_normal",
    "scenario_name": "所有设备正常",
    "description": "全部设备运行正常，无故障",
    "device_count": 10
  },
  {
    "scenario_id": "mixed",
    "scenario_name": "混合场景",
    "description": "部分设备正常，部分设备存在故障",
    "device_count": 5
  },
  {
    "scenario_id": "multiple_faults",
    "scenario_name": "多故障场景",
    "description": "多台设备存在不同类型故障",
    "device_count": 8
  }
]
```

#### GET `/api/v1/devices/scenarios/{scenario_id}`
Get all devices in a specific scenario.

**Path Parameters:**
- `scenario_id` (string): Scenario ID (all_normal, mixed, multiple_faults)

**Response:**
```json
{
  "total": 5,
  "devices": [
    {
      "device_id": "T001",
      "device_name": "1号主变",
      "device_type": "Transformer",
      "rated_capacity": 100.0,
      "severity": 3,
      "fault_type": "high_energy_discharge",
      "dga": {
        "H2": 301.8,
        "CH4": 76.1,
        "C2H6": 15.9,
        "C2H4": 54.3,
        "C2H2": 50.4,
        "CO": 619.7,
        "CO2": 4315.3
      },
      "thermal": {
        "oil_temp": 85.3,
        "hotspot_temp": 98.7,
        "ambient_temp": 35.0
      },
      "aging": {
        "current_dp": 450,
        "device_age": 15,
        "aging_rate": 2.1
      },
      "operating_condition": {
        "load_percent": 95.0,
        "voltage": 220.0,
        "frequency": 50.0
      },
      "manufacturer": "ABB",
      "installation_date": "2010-03-15"
    }
  ]
}
```

#### GET `/api/v1/devices/scenarios/{scenario_id}/devices/{device_id}`
Get detailed information for a specific device.

**Path Parameters:**
- `scenario_id` (string): Scenario ID
- `device_id` (string): Device ID (e.g., "T001")

**Response:** Single Device object (same structure as above)

**Error Response (404):**
```json
{
  "detail": "设备 T999 在场景 mixed 中不存在"
}
```

#### GET `/api/v1/devices/health`
Device service health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "devices",
  "data_source": "scenario files"
}
```

---

### 3. DGA Diagnosis

#### POST `/api/v1/diagnosis/`
Perform DGA diagnosis on device based on dissolved gas analysis data.

**Request Body:**
```json
{
  "dga_data": {
    "H2": 150.0,
    "CH4": 25.0,
    "C2H6": 10.0,
    "C2H4": 50.0,
    "C2H2": 5.0,
    "CO": 300.0,
    "CO2": 2500.0
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "fault_type": "thermal_medium",
    "severity": 1,
    "confidence": 0.85,
    "ratios": {
      "C2H2/C2H4": 0.1,
      "CH4/H2": 0.167,
      "C2H4/C2H6": 5.0
    },
    "recommendations": [
      "继续监测油中气体浓度变化",
      "检查设备冷却系统",
      "建议1个月后复测DGA",
      "监控负载和温度"
    ]
  },
  "message": "诊断完成"
}
```

**Fault Types:**
- `normal` - 正常
- `partial_discharge` - 局部放电
- `low_energy_discharge` - 低能量放电
- `high_energy_discharge` - 高能量放电
- `thermal_low` - 低温过热 (<300°C)
- `thermal_medium` - 中温过热 (300-700°C)
- `thermal_high` - 高温过热 (>700°C)

**Severity Levels:**
- `0` - 正常
- `1` - 注意
- `2` - 异常
- `3` - 严重

**Error Response (500):**
```json
{
  "detail": "诊断失败: [error message]"
}
```

#### GET `/api/v1/diagnosis/health`
Diagnosis service health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "diagnosis",
  "model": "DGA Diagnoser"
}
```

---

### 4. What-if Simulation

#### POST `/api/v1/simulation/compare`
Compare two operating scenarios and predict device lifespan and degradation.

**Request Body:**
```json
{
  "scenario_a": {
    "name": "当前工况",
    "load_percent": 85,
    "ambient_temp": 35
  },
  "scenario_b": {
    "name": "降载工况",
    "load_percent": 60,
    "ambient_temp": 35
  },
  "initial_state": {
    "dga": {
      "H2": 150,
      "CH4": 25,
      "C2H6": 10,
      "C2H4": 50,
      "C2H2": 5,
      "CO": 300,
      "CO2": 2500
    },
    "dp": 600,
    "operation_years": 10
  }
}
```

**Field Constraints:**
- `load_percent`: 20-130% (validates load is within acceptable range)
- `ambient_temp`: -10 to 45°C (validates temperature is reasonable)
- `dp`: Degree of Polymerization (initial value, typically 200-1200)
- `operation_years`: Device age in years

**Response:**
```json
{
  "success": true,
  "scenario_a": {
    "name": "当前工况",
    "years_to_eol": 8.5,
    "final_dp": 200,
    "hotspot_temp": 98.0,
    "aging_rate": 2.3,
    "dga_trend": {
      "H2": 180,
      "CH4": 30,
      "C2H4": 60
    }
  },
  "scenario_b": {
    "name": "降载工况",
    "years_to_eol": 12.3,
    "final_dp": 250,
    "hotspot_temp": 85.0,
    "aging_rate": 1.5,
    "dga_trend": {
      "H2": 155,
      "CH4": 26,
      "C2H4": 52
    }
  },
  "improvements": {
    "lifespan_extension_years": 3.8,
    "lifespan_extension_percent": 44.7,
    "aging_rate_reduction_percent": 34.8,
    "temperature_reduction": 13.0
  },
  "message": "推演完成"
}
```

**Error Response (500):**
```json
{
  "detail": "推演失败: [error message]"
}
```

#### GET `/api/v1/simulation/health`
Simulation service health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "simulation",
  "model": "Thermal-Electrical-Chemical Simulator"
}
```

---

### 5. Report Generation

#### POST `/api/v1/reports/diagnosis/{device_id}`
Generate PDF diagnosis report for a specific device.

**Path Parameters:**
- `device_id` (string): Device ID

**Request Body:**
```json
{
  "device_data": {
    "device_id": "T001",
    "device_name": "1号主变",
    "device_type": "Transformer",
    "rated_capacity": 100.0,
    "severity": 2,
    "fault_type": "thermal_medium",
    "dga": { ... },
    "thermal": { ... },
    "aging": { ... },
    "operating_condition": { ... }
  },
  "diagnosis_request": {
    "dga_data": { ... }
  }
}
```

**Response:**
- **Content-Type:** `application/pdf`
- **Filename:** `diagnosis_{device_id}.pdf`
- PDF file download

**Error Response (500):**
```json
{
  "detail": "生成诊断报告失败: [error message]"
}
```

#### GET `/api/v1/reports/health`
Reports service health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "reports",
  "generator": "ReportLab PDF Generator"
}
```

---

## 🔧 Testing the API

### Using cURL

```bash
# Test root endpoint
curl http://localhost:8080/

# Get all scenarios
curl http://localhost:8080/api/v1/devices/scenarios

# Get devices in mixed scenario
curl http://localhost:8080/api/v1/devices/scenarios/mixed

# Get specific device
curl http://localhost:8080/api/v1/devices/scenarios/mixed/devices/T001

# Perform DGA diagnosis
curl -X POST http://localhost:8080/api/v1/diagnosis/ \
  -H "Content-Type: application/json" \
  -d '{
    "dga_data": {
      "H2": 150.0,
      "CH4": 25.0,
      "C2H6": 10.0,
      "C2H4": 50.0,
      "C2H2": 5.0,
      "CO": 300.0,
      "CO2": 2500.0
    }
  }'

# Run simulation comparison
curl -X POST http://localhost:8080/api/v1/simulation/compare \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_a": {
      "name": "当前工况",
      "load_percent": 85,
      "ambient_temp": 35
    },
    "scenario_b": {
      "name": "降载工况",
      "load_percent": 60,
      "ambient_temp": 35
    },
    "initial_state": {
      "dga": {
        "H2": 150, "CH4": 25, "C2H6": 10,
        "C2H4": 50, "C2H2": 5, "CO": 300, "CO2": 2500
      },
      "dp": 600,
      "operation_years": 10
    }
  }'
```

### Using Swagger UI

FastAPI provides interactive API documentation:

**Swagger UI:** http://localhost:8080/docs
**ReDoc:** http://localhost:8080/redoc

The Swagger UI allows you to:
- View all endpoints with detailed descriptions
- Try out API calls directly in the browser
- See request/response schemas
- View validation requirements

---

## 🚀 Running the API

### Start the Development Server

```bash
cd api
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

**Options:**
- `--reload`: Enable auto-reload on code changes
- `--host 0.0.0.0`: Allow connections from any IP
- `--port 8080`: Run on port 8080

**Server Output:**
```
INFO:     Will watch for changes in these directories: ['/path/to/api']
INFO:     Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Environment Variables

Required environment variables (set in `.env` or system):

```bash
# LLM API Keys (for AI-powered recommendations)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Override default paths
DATA_DIR=/path/to/data
REPORTS_DIR=/path/to/reports
```

---

## 📊 Data Models

### DGAData
Dissolved Gas Analysis data in ppm (parts per million).

```python
{
  "H2": float,      # 氢气浓度 (ppm)
  "CH4": float,     # 甲烷浓度 (ppm)
  "C2H6": float,    # 乙烷浓度 (ppm)
  "C2H4": float,    # 乙烯浓度 (ppm)
  "C2H2": float,    # 乙炔浓度 (ppm)
  "CO": float,      # 一氧化碳浓度 (ppm)
  "CO2": float      # 二氧化碳浓度 (ppm)
}
```

### ThermalData
Thermal parameters in Celsius.

```python
{
  "oil_temp": float,      # 油温 (°C)
  "hotspot_temp": float,  # 热点温度 (°C)
  "ambient_temp": float   # 环境温度 (°C)
}
```

### AgingData
Aging parameters for transformer insulation.

```python
{
  "current_dp": float,   # 当前聚合度 DP值
  "device_age": float,   # 设备使用年限 (年)
  "aging_rate": float    # 老化速率 (DP/天)
}
```

### OperatingCondition
Operating conditions for the device.

```python
{
  "load_percent": float,  # 负载率 (%)
  "voltage": float,       # 电压 (kV), default: 220.0
  "frequency": float      # 频率 (Hz), default: 50.0
}
```

---

## 🔒 CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (React dev server - Create React App)
- `http://localhost:5173` (Vite dev server)
- `http://localhost:8501` (Streamlit - during transition)

**Allowed Methods:** All
**Allowed Headers:** All
**Credentials:** Enabled

---

## 📈 Migration Status

### ✅ Completed (Week 1-2: FastAPI Backend)

- [x] Project structure created
- [x] Dependencies configured (requirements.txt)
- [x] Pydantic schemas implemented
- [x] Service layer wrapping existing models
- [x] API routes created and tested
- [x] CORS middleware configured
- [x] Auto-generated OpenAPI documentation
- [x] Health check endpoints
- [x] Error handling

### ⏳ In Progress

- [ ] Comprehensive API testing (diagnosis and simulation endpoints)
- [ ] API documentation (this file)

### 📋 Next Steps (Week 3-4: React Frontend)

1. **Frontend Setup**
   - Initialize React project with Vite + TypeScript
   - Install Ant Design Pro components
   - Configure ECharts integration
   - Set up Axios for API calls

2. **Core Pages**
   - Device list view with filtering
   - Device detail view with charts
   - DGA diagnosis interface
   - What-if simulation interface

3. **Integration**
   - Connect frontend to backend APIs
   - Implement real-time data updates
   - Add loading states and error handling

4. **Deployment (Week 5-6)**
   - Docker containerization
   - Nginx reverse proxy
   - Production environment setup

---

## 🐛 Known Issues & Solutions

### Issue 1: Port 8000 Already in Use
**Error:** `ERROR: [Errno 48] Address already in use`
**Solution:** Use port 8080 instead:
```bash
python3 -m uvicorn app.main:app --port 8080 --reload
```

### Issue 2: Pydantic Validation Errors
**Error:** `Field required [type=missing]`
**Solution:** Check that all required fields are provided in request body. Use Swagger UI to see exact schema requirements.

### Issue 3: Module Import Errors
**Error:** `ModuleNotFoundError: No module named 'app'`
**Solution:** Ensure you're running uvicorn from the `api` directory and using the correct module path:
```bash
cd api
python3 -m uvicorn app.main:app --reload
```

---

## 📞 Support

- **Swagger Documentation:** http://localhost:8080/docs
- **API Health Check:** http://localhost:8080/health
- **Service Health Checks:**
  - Devices: http://localhost:8080/api/v1/devices/health
  - Diagnosis: http://localhost:8080/api/v1/diagnosis/health
  - Simulation: http://localhost:8080/api/v1/simulation/health
  - Reports: http://localhost:8080/api/v1/reports/health

---

## 📝 Changelog

### Version 1.0.0 (2025-11-14)

**Initial Release**
- FastAPI backend with RESTful API design
- Device management endpoints
- DGA diagnosis functionality
- What-if simulation with A/B scenario comparison
- PDF report generation
- Comprehensive Pydantic validation
- Auto-generated OpenAPI documentation
- Service layer architecture preserving existing models
