import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { ArrowLeft } from "lucide-react";

export default function VehicleDetailPage() {
  const { code } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [movements, setMovements] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [activeTab, setActiveTab] = useState("info");
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    supabase.from("vehicles").select("*").eq("code", code).single().then(({ data }) => {
      if (data) setVehicle(data);
    });
    supabase.from("movements").select("*").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setMovements(data); });
    supabase.from("fuel_logs").select("*").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setFuel(data); });
  }, [code]);

  if (!vehicle) return <div className="text-center py-20 text-gray-400">Cargando...</div>;

  return (
    <div>
      <Link to="/fleet" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#009B77] mb-4">
        <ArrowLeft size={16} /> Volver a flota
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{vehicle.code} - {vehicle.type}</h1>
        <div className="flex gap-2">
          <img src={`${apiUrl}/qr/${vehicle.code}`} alt="QR" className="w-16 h-16 border rounded" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            ["Marca", vehicle.brand], ["Modelo", vehicle.model],
            ["Patente", vehicle.plate], ["Ano", vehicle.year],
            ["Estado", vehicle.status], ["Area", vehicle.area],
            ["Motor", vehicle.engine], ["Chasis", vehicle.chassis],
            ["Chofer", vehicle.driver], ["DNI", vehicle.dni],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-gray-500 uppercase">{k}</p>
              <p className="font-medium">{v || "-"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {["info", "movements", "fuel"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${activeTab === tab ? "text-white" : "text-gray-500 bg-white border"}`}
            style={activeTab === tab ? { backgroundColor: "#009B77" } : {}}>
            {tab === "info" ? "Info" : tab === "movements" ? "Movimientos" : "Combustible"}
          </button>
        ))}
      </div>

      {activeTab === "movements" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {movements.map((m) => (
            <div key={m.id} className="flex items-center gap-4 py-2 border-b border-gray-100">
              <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
              <span className="font-bold text-sm">{m.action}</span>
              <span className="text-sm text-gray-500">{m.motive}</span>
            </div>
          ))}
          {movements.length === 0 && <p className="text-gray-400 text-sm">Sin movimientos</p>}
        </div>
      )}

      {activeTab === "fuel" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {fuel.map((f) => (
            <div key={f.id} className="flex items-center gap-4 py-2 border-b border-gray-100">
              <span className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString()}</span>
              <span className="font-bold text-sm">{f.liters}L</span>
              <span className="text-sm text-gray-500">{f.fuel_type}</span>
              <span className="text-sm text-gray-500">KM: {f.odometer}</span>
            </div>
          ))}
          {fuel.length === 0 && <p className="text-gray-400 text-sm">Sin cargas de combustible</p>}
        </div>
      )}
    </div>
  );
}
