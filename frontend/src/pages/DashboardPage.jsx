import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useStore } from "../store/useStore";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const vehicles = useStore((s) => s.vehicles);
  const setVehicles = useStore((s) => s.setVehicles);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("vehicles").select("*").then(({ data }) => {
      if (data) setVehicles(data);
    });
  }, [setVehicles]);

  const total = vehicles.length;
  const activos = vehicles.filter((v) => v.status === "ACTIVO").length;
  const inactivos = total - activos;
  const pct = total ? Math.round((activos / total) * 100) : 0;

  const cards = [
    { label: "Unidades", value: total, color: "#009B77" },
    { label: "Activas", value: activos, color: "#28a745" },
    { label: "Inactivas", value: inactivos, color: "#dc3545" },
    { label: "Operatividad", value: `${pct}%`, color: "#DAA520" },
  ];

  const statusData = [
    { name: "Activos", value: activos, color: "#28a745" },
    { name: "Inactivos", value: inactivos, color: "#dc3545" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-gray-500 text-sm mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">Distribucion por estado</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Flota completa</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">Unidad</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Marca</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Area</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/fleet/${v.code}`)}>
                  <td className="py-3 font-bold">{v.code}</td>
                  <td className="py-3">{v.type}</td>
                  <td className="py-3">{v.brand} {v.model}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: v.status === "ACTIVO" ? "#28a745" : "#dc3545" }}>
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3">{v.area}</td>
                  <td className="py-3 text-right">
                    <span className="text-[#009B77] font-medium text-xs">Ver detalle -&gt;</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
