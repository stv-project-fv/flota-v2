import { create } from "zustand";

const initialState = {
  user: null,
  session: null,
  vehicles: [],
  movements: [],
  fuelLogs: [],
  fluidsLogs: [],
  maintenanceLogs: [],
  partRequests: [],
  audits: [],
  schedules: [],
  online: navigator.onLine,
  syncQueue: [],
};

export const useStore = create((set, get) => ({
  ...initialState,

  setOnline: (online) => set({ online }),

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),

  setVehicles: (vehicles) => set({ vehicles }),
  setMovements: (movements) => set({ movements }),

  addToSyncQueue: (item) =>
    set((state) => ({ syncQueue: [...state.syncQueue, item] })),

  clearSyncQueue: () => set({ syncQueue: [] }),

  reset: () => set(initialState),
}));
