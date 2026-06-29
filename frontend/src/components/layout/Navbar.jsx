import { useStore } from "../../store/useStore";
import { supabase } from "../../services/supabase";
import { LogOut, Wifi, WifiOff } from "lucide-react";

export default function Navbar() {
  const { user, online, setUser, setSession } = useStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold" style={{ color: "#009B77" }}>GI Flota</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">v2</span>
      </div>
      <div className="flex items-center gap-4">
        {online ? <Wifi size={16} className="text-green-500" /> : <WifiOff size={16} className="text-red-500" />}
        <span className="text-sm text-gray-600">{user?.email}</span>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
