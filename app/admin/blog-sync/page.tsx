'use client';

import React, { useState, useEffect } from 'react';

interface SyncStatus {
  lastSyncTime: string | null;
  pendingSyncTime: string | null;
  message: string;
  success: boolean;
  error?: string;
}

export default function BlogSyncAdminPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/blog/status');
      const data: SyncStatus = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching sync status:', error);
      setStatus({
        success: false,
        message: 'Failed to load sync status.',
        lastSyncTime: null,
        pendingSyncTime: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncMessage('Synchronisierung wird gestartet...');
    setSyncError('');
    setLoading(true);
    try {
      // For manual sync, we can use the BLOG_SYNC_SECRET as a query parameter
      // In a real application, this should be handled more securely (e.g., via session token)
      // For this task, we'll use a simple query param for demonstration/testing
      const syncSecret = process.env.NEXT_PUBLIC_BLOG_SYNC_SECRET; // Assuming it's exposed for client-side testing
      if (!syncSecret) {
        setSyncError('BLOG_SYNC_SECRET not configured for client-side sync.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/blog/sync?auth=${syncSecret}`, {
        method: 'GET', // Or POST if preferred, but GET is simpler for manual trigger
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data.success) {
        setSyncMessage('Synchronisierung erfolgreich ausgelöst!');
        fetchStatus(); // Refresh status after sync
      } else {
        setSyncError(`Synchronisierung fehlgeschlagen: ${data.error || data.message}`);
      }
    } catch (error) {
      console.error('Error during manual sync:', error);
      setSyncError(`Fehler beim Auslösen der Synchronisierung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Optional: Poll for updates every few seconds
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Blog-Synchronisierung Admin</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Synchronisierungsstatus</h2>
        {loading && !status ? (
          <p>Status wird geladen...</p>
        ) : status ? (
          <div>
            <p><strong>Letzte Synchronisierung:</strong> {status.lastSyncTime || 'Nie'}</p>
            <p><strong>Ausstehende Synchronisierung:</strong> {status.pendingSyncTime || 'Keine'}</p>
            {status.error && <p className="text-red-500">Fehler: {status.error}</p>}
          </div>
        ) : (
          <p className="text-red-500">Status konnte nicht geladen werden.</p>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">Manuelle Synchronisierung</h2>
        <button
          onClick={handleManualSync}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {loading ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
        </button>
        {syncMessage && <p className="mt-2 text-green-600">{syncMessage}</p>}
        {syncError && <p className="mt-2 text-red-500">{syncError}</p>}
      </div>
    </div>
  );
}
