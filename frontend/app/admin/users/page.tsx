"use client";
import React, { useEffect, useState } from "react";
import ApiService from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";

export default function AdminUsersPage() {
  const socket = useSocket();
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ApiService.adminListUsers({ query, limit: 50 });
      if (res.success) setItems(res.data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Live updates when banned status changes elsewhere
  useEffect(() => {
    if (!socket) return;
    const handler = (e: any) => {
      if (!e || typeof e.userId !== 'number') return;
      setItems((prev) => prev.map((u) => (u.id === e.userId ? { ...u, banned: !!e.banned } : u)));
    };
    socket.on('userBannedChanged', handler);
    return () => {
      socket.off('userBannedChanged', handler);
    };
  }, [socket]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Utilisateurs</h1>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Recherche (email, nom)"
            className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
          />
          <button onClick={load} className="px-3 py-2 rounded-lg bg-blue-600 text-white">
            Rechercher
          </button>
        </div>
      </div>
      <div className="mb-4">
        <a
          className="text-sm text-blue-600 underline"
          href={(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api") + "/admin/export/users.csv"}
          target="_blank"
          rel="noreferrer"
        >
          Exporter CSV
        </a>
      </div>
      {loading ? (
        <div className="text-gray-600">Chargement…</div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-3">Nom</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Rôle</th>
                <th className="text-left p-3">Coins</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Créé le</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.userType}</td>
                  <td className="p-3">{u.coins}</td>
                  <td className="p-3">
                    {u.banned ? (
                      <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Banni</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Actif</span>
                    )}
                  </td>
                  <td className="p-3">
                    {u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}
                  </td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={async () => {
                        const r = await ApiService.adminSetUserBanned(u.id, !u.banned);
                        if (r.success) {
                          setItems((prev) => prev.map((x) => (x.id === u.id ? { ...x, banned: !u.banned } : x)));
                        }
                      }}
                      className={`px-3 py-1 rounded ${u.banned ? "bg-green-600" : "bg-red-600"} text-white`}
                    >
                      {u.banned ? "Débannir" : "Bannir"}
                    </button>
                    <select
                      defaultValue={u.userType}
                      onChange={async (e) => {
                        const r = await ApiService.adminSetUserRole(u.id, e.target.value as any);
                        if (r.success) {
                          setItems((prev) => prev.map((x) => (x.id === u.id ? { ...x, userType: e.target.value } : x)));
                        }
                      }}
                      className="border rounded px-2 py-1 bg-white dark:bg-gray-800"
                    >
                      <option value="user">user</option>
                      <option value="expert">expert</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
