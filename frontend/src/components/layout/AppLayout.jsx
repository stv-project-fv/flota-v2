import { Outlet, Navigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import OfflineBanner from "./OfflineBanner";

export default function AppLayout() {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col min-h-screen">
      <OfflineBanner />
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
