import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useStore } from "../store/useStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser, setSession } = useStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) return setError(err.message);
    setUser(data.user);
    setSession(data.session);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#009B77" }}>
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "#009B77" }}>GI Flota</h1>
          <p className="text-gray-500 text-sm mt-1">Municipalidad de Florencio Varela</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#009B77] focus:border-transparent outline-none" required />
          <input type="password" placeholder="Contrasena" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#009B77] focus:border-transparent outline-none" required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit"
            className="w-full py-3 rounded-lg text-white font-bold text-sm transition hover:opacity-90"
            style={{ backgroundColor: "#009B77" }}>
            INGRESAR
          </button>
        </form>
      </div>
    </div>
  );
}
