import fs from 'fs';
import path from 'path';

const SYNC_FILE_PATH = path.resolve(process.cwd(), 'app/lib/blog-sync-data.json');

interface SyncData {
  lastSyncTime: number;
  pendingSyncTime?: number; // Optional, da es nicht immer gesetzt ist
}

// Initialisiere die Sync-Daten aus der Datei
let syncData: SyncData = { lastSyncTime: 0, pendingSyncTime: undefined };

function loadSyncData(): void {
  try {
    if (fs.existsSync(SYNC_FILE_PATH)) {
      const data = fs.readFileSync(SYNC_FILE_PATH, 'utf8');
      syncData = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading sync data:', error);
    // Setze auf Standardwerte zurück, wenn das Laden fehlschlägt
    syncData = { lastSyncTime: 0, pendingSyncTime: undefined };
  }
}

function saveSyncData(): void {
  try {
    fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(syncData), 'utf8');
  } catch (error) {
    console.error('Error saving sync data:', error);
  }
}

// Lade die Daten beim Start des Moduls
loadSyncData();

/**
 * Get the timestamp of the last blog sync/cache invalidation
 * @returns {number} Timestamp in milliseconds
 */
export function getLastSyncTime(): number {
  return syncData.lastSyncTime;
}

/**
 * Set the timestamp of the last blog sync/cache invalidation
 * @param {number} timestamp - Timestamp in milliseconds
 */
export function setLastSyncTime(timestamp: number): void {
  syncData.lastSyncTime = timestamp;
  syncData.pendingSyncTime = undefined; // Lösche pendingSyncTime, wenn der Sync durchgeführt wird
  saveSyncData(); // Speichere die Daten nach jeder Aktualisierung
}

/**
 * Setzt den Zeitstempel für eine ausstehende Cache-Invalidierung.
 * @param {number} timestamp - Zeitstempel in Millisekunden, wann die Invalidierung frühestens erfolgen soll.
 */
export function setPendingSyncTime(timestamp: number): void {
  syncData.pendingSyncTime = timestamp;
  saveSyncData();
}

/**
 * Get the timestamp of the next allowed sync/cache invalidation
 * @returns {number | undefined} Timestamp in milliseconds or undefined if no pending sync
 */
export function getPendingSyncTime(): number | undefined {
  return syncData.pendingSyncTime;
}

/**
 * Check if the cache should be invalidated based on sync time
 * @param {number} lastFetch - Timestamp of last cache fetch
 * @param {number} cacheDuration - Cache duration in milliseconds
 * @returns {boolean} True if cache should be invalidated
 */
export function shouldInvalidateCache(lastFetch: number, cacheDuration: number): boolean {
  const now = Date.now();
  const lastSync = getLastSyncTime();
  const pendingSync = getPendingSyncTime();

  // Wenn eine ausstehende Synchronisierung vorhanden ist und die Verzögerungszeit abgelaufen ist,
  // führen wir die tatsächliche Synchronisierung jetzt durch.
  if (pendingSync !== undefined && now >= pendingSync) {
    console.log(`Delayed sync triggered. Invalidating cache now.`);
    setLastSyncTime(now); // Führt die tatsächliche Invalidierung durch und löscht pendingSyncTime
    return true; // Cache ist jetzt ungültig
  }
  
  // Cache ist ungültig, wenn:
  // 1. Cache-Dauer abgelaufen ist, ODER
  // 2. Eine Synchronisierung nach dem letzten Abruf ausgelöst wurde (und die Verzögerung bereits verarbeitet wurde)
  return (now - lastFetch) >= cacheDuration || lastSync > lastFetch;
}
