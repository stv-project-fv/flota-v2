import { useState } from "react";
import { supabase } from "../services/supabase";
import { useStore } from "../store/useStore";
import { AUDIT_SECTIONS } from "../config/constants";
import toast from "react-hot-toast";

export default function AuditPage() {
  const [vehicleCode, setVehicleCode] = useState("");
  const [tab, setTab] = useState("checklist");
  const vehicles = useStore((s) => s.vehicles);
  const [checks, setChecks] = useState({});
  const [observations, setObservations] = useState("");

  const handleChecklist = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("audits").insert({
      vehicle_code: vehicleCode,
      type: "DIARIA / PRE-VIAJE",
      checklist_data: checks,
      observations,
    });
    if (error) return toast.error(error.message);
    toast.success("Checklist guardado");
    setChecks({});
    setObservations("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Auditoria de Mantenimiento</h1>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("checklist")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "checklist" ? "text-white" : "text-gray-500 bg-white border"}`}
          style={tab === "checklist" ? { backgroundColor: "#009B77" } : {}}>
          Checklist
        </button>
        <button onClick={() => setTab("schedule")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "schedule" ? "text-white" : "text-gray-500 bg-white border"}`}
          style={tab === "schedule" ? { backgroundColor: "#009B77" } : {}}>
          Preventivos
        </button>
      </div>

      {tab === "checklist" && (
        <form onSubmit={handleChecklist} className="bg-white rounded-xl shadow-sm border p-6 max-w-lg space-y-4">
          <select value={vehicleCode} onChange={(e) => setVehicleCode(e.target.value)} required
            className="w-full px-4 py-3 border rounded-lg text-sm">
            <option value="">Seleccionar unidad</option>
            {vehicles.map((v) => <option key={v.id} value={v.code}>{v.code}</option>)}
          </select>
          {AUDIT_SECTIONS.map((section) => (
            <div key={section.title} className="border rounded-lg p-4" style={{ borderLeftColor: "#DAA520", borderLeftWidth: 4 }}>
              <h3 className="font-bold text-sm mb-2">{section.title}</h3>
              {section.items.map((item) => (
                <label key={item} className="flex items-center gap-2 py-1 text-sm">
                  <input type="checkbox"
                    onChange={(e) => setChecks({ ...checks, [item]: e.target.checked })} />
                  {item}
                </label>
              ))}
            </div>
          ))}
          <textarea value={observations} onChange={(e) => setObservations(e.target.value)}
            placeholder="Observaciones" rows={3} className="w-full px-4 py-3 border rounded-lg text-sm" />
          <button type="submit" className="w-full py-3 rounded-lg text-white font-bold" style={{ backgroundColor: "#009B77" }}>
            Guardar revision
          </button>
        </form>
      )}
    </div>
  );
}
