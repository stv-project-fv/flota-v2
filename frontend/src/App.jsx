import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useSync } from "./hooks/useSync";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import FleetPage from "./pages/FleetPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import KioskPage from "./pages/KioskPage";
import WorkshopPage from "./pages/WorkshopPage";
import AuditPage from "./pages/AuditPage";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
  useOnlineStatus();
  useSync();

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/fleet/:code" element={<VehicleDetailPage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/workshop" element={<WorkshopPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
