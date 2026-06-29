import Dexie from "dexie";

const db = new Dexie("flota-offline");

db.version(1).stores({
  syncQueue: "++id, table, action, created_at",
  vehiclesCache: "&code",
  movementsCache: "++id, vehicle_code, created_at",
  fuelLogsCache: "++id, vehicle_code, created_at",
  fluidsLogsCache: "++id, vehicle_code, created_at",
  maintenanceLogsCache: "++id, vehicle_code, created_at",
  partRequestsCache: "++id, vehicle_code, status",
  auditsCache: "++id, vehicle_code, created_at",
  schedulesCache: "++id, vehicle_code, scheduled_date",
});

export async function addToSyncQueue(table, action, data) {
  return db.syncQueue.add({
    table,
    action,
    data,
    created_at: new Date().toISOString(),
    synced: false,
  });
}

export async function getSyncQueue() {
  return db.syncQueue.orderBy("created_at").toArray();
}

export async function removeFromSyncQueue(id) {
  return db.syncQueue.delete(id);
}

export async function cacheVehicles(vehicles) {
  await db.vehiclesCache.clear();
  return db.vehiclesCache.bulkAdd(vehicles);
}

export async function getCachedVehicles() {
  return db.vehiclesCache.toArray();
}

export default db;
