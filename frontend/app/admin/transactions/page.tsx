'use client';

import React, { useEffect, useState } from 'react';
import ApiService from '@/services/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Transaction {
  id: number;
  userId: number;
  type: 'purchase' | 'spend' | 'refund' | 'bonus';
  amount: number;
  coins: number;
  description: string;
  relatedId?: number;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AdminTransactionsPage() {
  const { formatPrice } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'spend' | 'refund' | 'bonus'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSpent: 0,
    totalRefunded: 0,
    totalBonus: 0,
  });
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await ApiService.adminListTransactions({ page, limit, type: filter === 'all' ? undefined : filter });
      if (res.success) {
        setTransactions(res.data.items || []);
        setTotal(res.data.total || 0);
        setStats(res.data.stats || stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, filter]);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'purchase':
        return { label: 'Achat', icon: 'ri-add-circle-line', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
      case 'spend':
        return { label: 'Dépense', icon: 'ri-subtract-line', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
      case 'refund':
        return { label: 'Remboursement', icon: 'ri-refund-2-line', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' };
      case 'bonus':
        return { label: 'Bonus', icon: 'ri-gift-line', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' };
      default:
        return { label: type, icon: 'ri-exchange-line', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700' };
    }
  };

  const statsCards = [
    { label: 'Revenus', value: stats.totalRevenue, icon: 'ri-money-dollar-circle-line', color: 'green', format: true },
    { label: 'Coins dépensés', value: stats.totalSpent, icon: 'ri-coin-line', color: 'red', format: false },
    { label: 'Remboursés', value: stats.totalRefunded, icon: 'ri-refund-2-line', color: 'orange', format: false },
    { label: 'Bonus distribués', value: stats.totalBonus, icon: 'ri-gift-line', color: 'purple', format: false },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-xl flex items-center justify-center`}>
                <i className={`${stat.icon} text-xl text-${stat.color}-600 dark:text-${stat.color}-400`}></i>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.format ? formatPrice(stat.value / 100) : stat.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Toutes' },
            { value: 'purchase', label: 'Achats' },
            { value: 'spend', label: 'Dépenses' },
            { value: 'refund', label: 'Remboursements' },
            { value: 'bonus', label: 'Bonus' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value as any);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <i className="ri-exchange-funds-line text-4xl mb-2"></i>
            <p>Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">ID</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Utilisateur</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Type</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Montant</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Coins</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Description</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600 dark:text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((tx) => {
                  const typeConfig = getTypeConfig(tx.type);
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">#{tx.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {tx.user?.firstName?.charAt(0)}{tx.user?.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {tx.user?.firstName} {tx.user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{tx.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                          <i className={typeConfig.icon}></i>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tx.amount > 0 && (
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatPrice(tx.amount / 100)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${tx.type === 'spend' ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.type === 'spend' ? '-' : '+'}{tx.coins}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} sur {Math.ceil(total / limit)} ({total} transactions)
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
    </div>
  );
}
