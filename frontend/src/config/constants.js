export const COLORS = {
  primary: "#009B77",
  primaryLight: "#00B894",
  primaryDark: "#007B5E",
  secondary: "#DAA520",
  danger: "#dc3545",
  success: "#28a745",
  warning: "#ffc107",
  info: "#17a2b8",
};

export const VEHICLE_STATUS = {
  ACTIVO: { label: "Activo", color: "#28a745" },
  INACTIVO: { label: "Inactivo", color: "#dc3545" },
  REPARACION: { label: "En Reparación", color: "#ffc107" },
};

export const PART_STATUS = {
  PENDIENTE: { label: "Pendiente", color: "#dc3545" },
  PEDIDO: { label: "Pedido", color: "#DAA520" },
  DISPONIBLE: { label: "Disponible", color: "#28a745" },
  CERRADO: { label: "Cerrado", color: "#6c757d" },
};

export const FLUID_CATEGORIES = {
  ACEITE_MOTOR: { unit: "Litros", opts: ["15W40", "10W40", "5W30", "SAE40", "5W40"] },
  TRANSMISION: { unit: "Litros", opts: ["80W90", "85W140", "75W90", "ATF", "STOU/UTTO"] },
  HIDRAULICO: { unit: "Litros", opts: ["ISO68", "ISO46", "ISO32"] },
  REFRIGERANTE: { unit: "Litros", opts: ["Orgánico", "Inorgánico", "Agua Destilada"] },
  ADITIVOS_LIQ: { unit: "Litros", opts: ["AdBlue", "Líquido de Frenos", "Límpiaparabrisas"] },
  ADITIVOS_SOL: { unit: "Kilos", opts: ["Grasa de Litio"] },
};

export const FUEL_TYPES = ["DIESEL (GASOIL)", "NAFTA", "GNC"];

export const AUDIT_SECTIONS = [
  {
    title: "1. EXTERIOR & CHASIS",
    items: ["Neumáticos (Presión/Desgaste)", "Luces (Giro, Freno, Altas/Bajas)", "Carrocería y Suspensión visible"],
  },
  {
    title: "2. INTERIOR CABINA",
    items: ["Frenos (Prueba de pedal)", "Tablero (Testigos, Combustible)", "Dirección (Juego libre)"],
  },
  {
    title: "3. MOTOR (APAGADO)",
    items: ["Nivel Aceite", "Refrigerante", "Correas y Mangueras", "Fugas visibles"],
  },
];
