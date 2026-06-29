import { useStore } from "../../store/useStore";

export default function OfflineBanner() {
  const online = useStore((s) => s.online);
  if (online) return null;
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 font-bold z-50">
      Sin conexion - los datos se sincronizaran cuando vuelva internet
    </div>
  );
}
