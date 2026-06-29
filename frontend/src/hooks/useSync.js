import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { supabase } from "../services/supabase";
import db from "../services/offline";
import toast from "react-hot-toast";

export function useSync() {
  const { online, setVehicles } = useStore();

  useEffect(() => {
    (async () => {
      if (online) {
        const { data } = await supabase.from("vehicles").select("*");
        if (data) {
          setVehicles(data);
          await db.vehiclesCache.clear();
          await db.vehiclesCache.bulkAdd(data);
        }
      } else {
        const cached = await db.vehiclesCache.toArray();
        if (cached.length > 0) setVehicles(cached);
      }
    })();
  }, [online, setVehicles]);

  useEffect(() => {
    if (!online) return;
    (async () => {
      const queue = await db.syncQueue.orderBy("created_at").toArray();
      for (const item of queue) {
        try {
          await supabase.from(item.table).insert(item.data);
          await db.syncQueue.delete(item.id);
        } catch (e) {
          console.error("Sync fallo:", item, e);
        }
      }
      if (queue.length > 0) toast.success("Datos sincronizados");
    })();
  }, [online]);

  useEffect(() => {
    if (!online) return;
    const sub = supabase
      .channel("vehicles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" },
        (payload) => {
          const vehicles = useStore.getState().vehicles;
          if (payload.eventType === "INSERT") {
            setVehicles([...vehicles, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setVehicles(vehicles.map((v) => v.id === payload.new.id ? payload.new : v));
          }
        }
      )
      .subscribe();
    return () => sub.unsubscribe();
  }, [online, setVehicles]);
}

export async function offlineInsert(table, data) {
  if (navigator.onLine) {
    const { error } = await supabase.from(table).insert(data);
    if (error) throw error;
  } else {
    await db.syncQueue.add({ table, data, created_at: new Date().toISOString() });
    toast("Operacion guardada - se sincronizara cuando haya conexion");
  }
}
