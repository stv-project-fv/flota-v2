import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { Search } from "lucide-react";

export default function FleetPage() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("vehicles").select("*").then(({ data }) => {
      if (data) setVehicles(data);
    });
  }, []);

  const filtered = vehicles.filter((v) =>
    Object.values(v).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Flota</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Buscar unidad, tipo, marca..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 outline-none focus:ring-2 focus:ring-[#009B77]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => (
          <div key={v.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition"
            onClick={() => navigate(`/fleet/${v.code}`)}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl font-bold text-[#009B77]">
                {v.code?.split("-")[1] || v.code?.[0]}
              </div>
              <div>
                <p className="font-bold text-gray-800">{v.code}</p>
                <p className="text-xs text-gray-500">{v.type}</p>
              </div>
              <span className="ml-auto px-2 py-1 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: v.status === "ACTIVO" ? "#28a745" : "#dc3545" }}>
                {v.status}
              </span>
            </div>
            <p className="text-sm font-medium">{v.brand} {v.model}</p>
            <p className="text-xs text-gray-500">{v.area} - {v.plate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
