import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useStore } from "../store/useStore";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_COLORS = { ACTIVO: "#28a745", INACTIVO: "#dc3545", IRRECUPERABLE: "#6c757d" };

function aggregate(arr, key) {
  const m = {};
  for (const item of arr) {
    const k = item[key] || "Sin datos";
    m[k] = (m[k] || 0) + 1;
  }
  return Object.entries(m)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

const TYPE_COLORS = [
  "#009B77", "#DAA520", "#007bff", "#6f42c1", "#fd7e14",
  "#20c997", "#e83e8c", "#17a2b8", "#6c757d", "#28a745",
  "#dc3545", "#ffc107", "#343a40", "#6610f2",
];

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
  const inactivos = vehicles.filter((v) => v.status === "INACTIVO").length;
  const irrecuperables = vehicles.filter((v) => v.status === "IRRECUPERABLE").length;
  const pct = total ? Math.round((activos / total) * 100) : 0;

  const statusData = useMemo(() => {
    const m = {};
    for (const v of vehicles) {
      const s = v.status || "SIN DATOS";
      m[s] = (m[s] || 0) + 1;
    }
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  const typeData = useMemo(() => aggregate(vehicles, "type"), [vehicles]);
  const areaData = useMemo(() => aggregate(vehicles, "area"), [vehicles]);

  const cards = [
    { label: "Unidades", value: total, color: "#009B77" },
    { label: "Activas", value: activos, color: "#28a745" },
    { label: "Inactivas", value: inactivos, color: "#dc3545" },
    { label: "Operatividad", value: `${pct}%`, color: "#DAA520" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">Distribuci&oacute;n por estado</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {statusData.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.name] || "#6c757d"} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">Unidades por tipo</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={typeData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {typeData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">Unidades por &aacute;rea</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={areaData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {areaData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[(i + 3) % TYPE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">Resumen</h3>
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Operatividad</span>
              <span className="text-2xl font-bold" style={{ color: "#009B77" }}>{pct}%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Unidades activas</span>
              <span className="text-2xl font-bold" style={{ color: "#28a745" }}>{activos}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Unidades inactivas</span>
              <span className="text-2xl font-bold" style={{ color: "#dc3545" }}>{inactivos}</span>
            </div>
            {irrecuperables > 0 && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Irrecuperables</span>
                <span className="text-2xl font-bold" style={{ color: "#6c757d" }}>{irrecuperables}</span>
              </div>
            )}
          </div>
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
                <th className="pb-3 font-medium">&Aacute;rea</th>
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
                      style={{ backgroundColor: STATUS_COLORS[v.status] || "#6c757d" }}>
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
