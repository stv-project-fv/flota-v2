import { useState } from "react";
import { supabase } from "../services/supabase";
import { useStore } from "../store/useStore";
import toast from "react-hot-toast";

const FLUID_OPTS = {
  ACEITE_MOTOR: { unit: "Litros", opts: ["15W40","10W40","5W30","SAE40","5W40"] },
  TRANSMISION: { unit: "Litros", opts: ["80W90","85W140","75W90","ATF","STOU/UTTO"] },
  HIDRAULICO: { unit: "Litros", opts: ["ISO68","ISO46","ISO32"] },
  REFRIGERANTE: { unit: "Litros", opts: ["Organico","Inorganico","Agua Destilada"] },
  ADITIVOS_LIQ: { unit: "Litros", opts: ["AdBlue","Liquido de Frenos","Limpiaparabrisas"] },
  ADITIVOS_SOL: { unit: "Kilos", opts: ["Grasa de Litio"] },
};

export default function WorkshopPage() {
  const [tab, setTab] = useState("maintenance");
  const [vehicleCode, setVehicleCode] = useState("");
  const vehicles = useStore((s) => s.vehicles);

  const handleMaintenance = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from("maintenance_logs").insert({
      vehicle_code: fd.get("vehicle_code"),
      type: fd.get("type"),
      detail: fd.get("detail"),
    });
    if (error) return toast.error(error.message);
    toast.success("Mantenimiento registrado");
    e.target.reset();
  };

  const handleFuel = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from("fuel_logs").insert({
      vehicle_code: fd.get("vehicle_code"),
      fuel_type: fd.get("fuel_type"),
      liters: parseFloat(fd.get("liters")),
      odometer: parseInt(fd.get("odometer")),
    });
    if (error) return toast.error(error.message);
    toast.success("Combustible registrado");
    e.target.reset();
  };

  const handleFluid = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from("fluids_logs").insert({
      vehicle_code: fd.get("vehicle_code"),
      category: fd.get("category"),
      subtype: fd.get("subtype"),
      quantity: parseFloat(fd.get("quantity")),
    });
    if (error) return toast.error(error.message);
    toast.success("Fluido registrado");
    e.target.reset();
  };

  const tabs = [
    { id: "maintenance", label: "Reparacion" },
    { id: "fuel", label: "Combustible" },
    { id: "fluids", label: "Fluidos" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Taller</h1>
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${tab === t.id ? "text-white" : "text-gray-500 bg-white border"}`}
            style={tab === t.id ? { backgroundColor: "#009B77" } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {tab === "maintenance" && (
          <form onSubmit={handleMaintenance} className="space-y-4 max-w-md">
            <select name="vehicle_code" required
              className="w-full px-4 py-3 border rounded-lg text-sm" value={vehicleCode}
              onChange={(e) => setVehicleCode(e.target.value)}>
              <option value="">Seleccionar unidad</option>
              {vehicles.map((v) => <option key={v.id} value={v.code}>{v.code} - {v.brand}</option>)}
            </select>
            <select name="type" required className="w-full px-4 py-3 border rounded-lg text-sm">
              <option value="INTERNA">Reparacion interna (exitosa)</option>
              <option value="EXTERNA">Solicitar repuesto</option>
            </select>
            <textarea name="detail" required rows={3} placeholder="Descripcion del trabajo..."
              className="w-full px-4 py-3 border rounded-lg text-sm" />
            <button type="submit" className="w-full py-3 rounded-lg text-white font-bold" style={{ backgroundColor: "#009B77" }}>
              Registrar
            </button>
          </form>
        )}

        {tab === "fuel" && (
          <form onSubmit={handleFuel} className="space-y-4 max-w-md">
            <select name="vehicle_code" required className="w-full px-4 py-3 border rounded-lg text-sm">
              <option value="">Seleccionar unidad</option>
              {vehicles.map((v) => <option key={v.id} value={v.code}>{v.code}</option>)}
            </select>
            <select name="fuel_type" className="w-full px-4 py-3 border rounded-lg text-sm">
              <option>DIESEL (GASOIL)</option>
              <option>NAFTA</option>
              <option>GNC</option>
            </select>
            <input type="number" name="liters" step="0.1" placeholder="Litros" required
              className="w-full px-4 py-3 border rounded-lg text-sm" />
            <input type="number" name="odometer" placeholder="Odometro (KM)" required
              className="w-full px-4 py-3 border rounded-lg text-sm" />
            <button type="submit" className="w-full py-3 rounded-lg text-white font-bold" style={{ backgroundColor: "#DAA520" }}>
              Cargar combustible
            </button>
          </form>
        )}

        {tab === "fluids" && (
          <form onSubmit={handleFluid} className="space-y-4 max-w-md">
            <select name="vehicle_code" required className="w-full px-4 py-3 border rounded-lg text-sm">
              <option value="">Seleccionar unidad</option>
              {vehicles.map((v) => <option key={v.id} value={v.code}>{v.code}</option>)}
            </select>
            <select name="category" id="fluidCat" required
              className="w-full px-4 py-3 border rounded-lg text-sm"
              onChange={(e) => {
                const opts = FLUID_OPTS[e.target.value];
                const sub = document.getElementById("fluidSub");
                if (sub && opts) {
                  sub.innerHTML = opts.opts.map((o) => `<option>${o}</option>`).join("");
                }
              }}>
              <option value="">Seleccionar fluido</option>
              {Object.keys(FLUID_OPTS).map((k) => <option key={k} value={k}>{k.replace(/_/g, " ")}</option>)}
            </select>
            <select name="subtype" id="fluidSub" required className="w-full px-4 py-3 border rounded-lg text-sm" />
            <input type="number" name="quantity" step="0.1" placeholder="Cantidad" required
              className="w-full px-4 py-3 border rounded-lg text-sm" />
            <button type="submit" className="w-full py-3 rounded-lg text-white font-bold" style={{ backgroundColor: "#6f42c1" }}>
              Registrar fluido
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
