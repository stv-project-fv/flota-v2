import { NavLink } from "react-router-dom";
import { LayoutDashboard, Truck, Wrench, ClipboardCheck, BarChart3, ScanLine } from "lucide-react";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/fleet", icon: Truck, label: "Flota" },
  { to: "/kiosk", icon: ScanLine, label: "Puesto NFC" },
  { to: "/workshop", icon: Wrench, label: "Taller" },
  { to: "/audit", icon: ClipboardCheck, label: "Auditoria" },
  { to: "/reports", icon: BarChart3, label: "Reportes" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition
               ${isActive ? "text-white" : "text-gray-600 hover:bg-gray-100"}`
            }
            style={({ isActive }) => isActive ? { backgroundColor: "#009B77" } : {}}
          >
            <l.icon size={18} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
