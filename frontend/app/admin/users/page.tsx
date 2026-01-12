'use client';

import React, { useEffect, useState } from 'react';
import ApiService from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/contexts/ToastContext';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  coins: number;
  banned: boolean;
  isVerified: boolean;
  createdAt: string;
  avatar?: string;
}

export default function AdminUsersPage() {
  const socket = useSocket();
  const { addToast } = useToast();
  const [items, setItems] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'user' | 'expert' | 'admin' | 'banned'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [coinsToAdd, setCoinsToAdd] = useState('');
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await ApiService.adminListUsers({ query, limit, page });
      if (res.success) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

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

  const filteredItems = items.filter((u) => {
    if (filter === 'all') return true;
    if (filter === 'banned') return u.banned;
    return u.userType === filter;
  });

  const handleBan = async (user: User) => {
    const action = user.banned ? 'débannir' : 'bannir';
    if (!confirm(`Voulez-vous vraiment ${action} ${user.firstName} ${user.lastName} ?`)) return;

    const r = await ApiService.adminSetUserBanned(user.id, !user.banned);
    if (r.success) {
      setItems((prev) => prev.map((x) => (x.id === user.id ? { ...x, banned: !user.banned } : x)));
      addToast(`Utilisateur ${user.banned ? 'débanni' : 'banni'} avec succès`, 'success');
    }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    const r = await ApiService.adminSetUserRole(user.id, newRole as any);
    if (r.success) {
      setItems((prev) => prev.map((x) => (x.id === user.id ? { ...x, userType: newRole } : x)));
      addToast('Rôle mis à jour', 'success');
    }
  };

  const handleAddCoins = async () => {
    if (!selectedUser || !coinsToAdd) return;
    const coins = parseInt(coinsToAdd, 10);
    if (isNaN(coins)) return;

    try {
      const r = await ApiService.adminAddCoins(selectedUser.id, coins);
      if (r.success) {
        setItems((prev) => prev.map((x) => (x.id === selectedUser.id ? { ...x, coins: x.coins + coins } : x)));
        addToast(`${coins} coins ajoutés`, 'success');
        setShowModal(false);
        setCoinsToAdd('');
        setSelectedUser(null);
      }
    } catch (e: any) {
      addToast(e?.message || 'Erreur', 'error');
    }
  };

  const stats = {
    total: items.length,
    users: items.filter((u) => u.userType === 'user').length,
    experts: items.filter((u) => u.userType === 'expert').length,
    admins: items.filter((u) => u.userType === 'admin').length,
    banned: items.filter((u) => u.banned).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: total, color: 'blue', filter: 'all' as const },
          { label: 'Utilisateurs', value: stats.users, color: 'gray', filter: 'user' as const },
          { label: 'Experts', value: stats.experts, color: 'purple', filter: 'expert' as const },
          { label: 'Admins', value: stats.admins, color: 'green', filter: 'admin' as const },
          { label: 'Bannis', value: stats.banned, color: 'red', filter: 'banned' as const },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setFilter(stat.filter)}
            className={`p-4 rounded-xl border transition-all ${
              filter === stat.filter
                ? `bg-${stat.color}-50 dark:bg-${stat.color}-900/20 border-${stat.color}-500`
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
                placeholder="Rechercher par nom ou email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={load}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <i className="ri-search-line"></i>
            </button>
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/export/users.csv`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="ri-download-2-line"></i>
            <span>Exporter CSV</span>
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <i className="ri-user-search-line text-4xl mb-2"></i>
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Utilisateur</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Email</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Rôle</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Coins</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Statut</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Inscrit le</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.userType}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer ${
                          user.userType === 'admin'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : user.userType === 'expert'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <option value="user">Utilisateur</option>
                        <option value="expert">Expert</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
                      >
                        <i className="ri-coin-line"></i>
                        <span className="font-medium">{user.coins}</span>
                        <i className="ri-add-circle-line text-sm"></i>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.banned
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.banned ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        {user.banned ? 'Banni' : 'Actif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleBan(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.banned
                              ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                              : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title={user.banned ? 'Débannir' : 'Bannir'}
                        >
                          <i className={`ri-${user.banned ? 'user-follow' : 'user-forbid'}-line text-lg`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} sur {Math.ceil(total / limit)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <i className="ri-arrow-left-s-line"></i>
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <i className="ri-arrow-right-s-line"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Coins Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ajouter des coins</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                  setCoinsToAdd('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Utilisateur: <span className="font-medium text-gray-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Solde actuel: <span className="font-medium text-yellow-600">{selectedUser.coins} coins</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de coins à ajouter
              </label>
              <input
                type="number"
                value={coinsToAdd}
                onChange={(e) => setCoinsToAdd(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                  setCoinsToAdd('');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCoins}
                disabled={!coinsToAdd || isNaN(parseInt(coinsToAdd, 10))}
                className="flex-1 px-4 py-2.5 rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
