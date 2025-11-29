import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Monitor from './pages/Monitor';
import DataCenter from './pages/DataCenter';
import ReportManagement from './pages/ReportManagement';
import DeviceList from './pages/DeviceList';
import DeviceDetail from './pages/DeviceDetail';
import Diagnosis from './pages/Diagnosis';
import Simulation from './pages/Simulation';
import AIAssistant from './pages/AIAssistant';
import Comparison from './pages/Comparison';
import PDFReportGenerator from './pages/PDFReportGenerator';
import KnowledgeReasoning from './pages/KnowledgeReasoning';
import Test from './pages/Test';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 测试路由 - 不使用Layout */}
        <Route path="/test" element={<Test />} />

        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          {/* 新增工业SCADA风格页面 */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="monitor" element={<Monitor />} />
          <Route path="data" element={<DataCenter />} />
          <Route path="report" element={<ReportManagement />} />
          <Route path="comparison" element={<Comparison />} />
          {/* 保留所有原有功能页面 */}
          <Route path="devices" element={<DeviceList />} />
          <Route path="devices/:scenarioId/:deviceId" element={<DeviceDetail />} />
          <Route path="diagnosis" element={<Diagnosis />} />
          <Route path="simulation" element={<Simulation />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="pdf-generator" element={<PDFReportGenerator />} />
          {/* 知识推理系统 */}
          <Route path="knowledge-reasoning" element={<KnowledgeReasoning />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
