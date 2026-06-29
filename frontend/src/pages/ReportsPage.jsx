import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function ReportsPage() {
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0, fuelTotal: 0 });

  useEffect(() => {
    (async () => {
      const { data: vehicles } = await supabase.from("vehicles").select("*");
      const { data: fuel } = await supabase.from("fuel_logs").select("liters");
      if (vehicles) {
        setStats({
          total: vehicles.length,
          activos: vehicles.filter((v) => v.status === "ACTIVO").length,
          inactivos: vehicles.filter((v) => v.status !== "ACTIVO").length,
          fuelTotal: fuel ? fuel.reduce((sum, f) => sum + (f.liters || 0), 0) : 0,
        });
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reportes</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-3xl font-bold" style={{ color: "#009B77" }}>{stats.total}</p>
          <p className="text-gray-500 text-sm">Total unidades</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-3xl font-bold" style={{ color: "#28a745" }}>{stats.activos}</p>
          <p className="text-gray-500 text-sm">Unidades activas</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-3xl font-bold" style={{ color: "#DAA520" }}>{stats.fuelTotal.toFixed(0)}L</p>
          <p className="text-gray-500 text-sm">Combustible total cargado</p>
        </div>
      </div>
    </div>
  );
}
