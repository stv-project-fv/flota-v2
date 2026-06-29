import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { offlineInsert } from "../hooks/useSync";
import toast from "react-hot-toast";

export default function KioskPage() {
  const [step, setStep] = useState("nfc");
  const [vehicle, setVehicle] = useState(null);
  const [action, setAction] = useState("");
  const [motive, setMotive] = useState("");
  const nfcRef = useRef(null);
  const navigate = useNavigate();

  const handleNfcScan = async (e) => {
    const nfcKey = e.target.value.trim().toUpperCase();
    if (!nfcKey) return;
    const { data } = await supabase.from("vehicles").select("*").eq("nfc_key", nfcKey).single();
    if (data) {
      setVehicle(data);
      setStep("action");
      toast.success(`Unidad ${data.code} identificada`);
    } else {
      toast.error("Llave NFC no reconocida");
    }
    e.target.value = "";
  };

  const handleAction = async () => {
    if (action === "ENTRADA" || action === "SALIDA") {
      await offlineInsert("movements", { vehicle_code: vehicle.code, action, motive: "" });
      toast.success(`${action} registrada para ${vehicle.code}`);
      setStep("nfc");
      setVehicle(null);
      setAction("");
    } else {
      setStep("confirm");
    }
  };

  const handleIrregularidad = async () => {
    const data = { vehicle_code: vehicle.code, action: "NOVEDAD", motive };
    await offlineInsert("movements", data);
    if (motive.toLowerCase().includes("inactiv")) {
      await offlineInsert("part_requests", { vehicle_code: vehicle.code, note: motive });
    }
    toast.success("Novedad registrada");
    setStep("nfc");
    setVehicle(null);
    setAction("");
    setMotive("");
  };

  const focusNfc = () => { if (nfcRef.current) nfcRef.current.focus(); };

  return (
    <div className="max-w-lg mx-auto" onClick={focusNfc}>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Puesto de Control</h1>

      {step === "nfc" && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-5xl mb-4">📡</p>
          <h2 className="text-lg font-bold mb-2">Esperando llave NFC</h2>
          <p className="text-sm text-gray-500">Acerque el llavero NFC al lector</p>
          <input ref={nfcRef} type="text" name="nfc" autoFocus
            onChange={handleNfcScan}
            className="opacity-0 absolute" autoComplete="off" />
        </div>
      )}

      {step === "action" && vehicle && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500">Unidad identificada</p>
            <p className="text-3xl font-bold" style={{ color: "#009B77" }}>{vehicle.code}</p>
            <p className="text-sm">{vehicle.brand} {vehicle.model}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { setAction("ENTRADA"); handleAction(); }}
              className="py-6 rounded-xl text-white font-bold text-lg hover:opacity-90"
              style={{ backgroundColor: "#28a745" }}>
              📥 ENTRADA
            </button>
            <button onClick={() => { setAction("SALIDA"); handleAction(); }}
              className="py-6 rounded-xl text-white font-bold text-lg hover:opacity-90"
              style={{ backgroundColor: "#007bff" }}>
              📤 SALIDA
            </button>
          </div>
          <button onClick={() => setStep("confirm")}
            className="w-full mt-4 py-4 rounded-xl text-white font-bold hover:opacity-90"
            style={{ backgroundColor: "#fd7e14" }}>
            Reportar irregularidad
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold mb-3">Detalle del reporte</h3>
          <textarea value={motive} onChange={(e) => setMotive(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm mb-4" rows={3}
            placeholder="Describa el problema..." />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleIrregularidad}
              className="py-3 rounded-xl text-white font-bold" style={{ backgroundColor: "#28a745" }}>
              Confirmar
            </button>
            <button onClick={() => setStep("action")}
              className="py-3 rounded-xl text-gray-700 font-bold bg-gray-200">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
