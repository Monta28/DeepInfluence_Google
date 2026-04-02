'use client';

import { useState, useEffect } from 'react';
import { adminListPayouts, adminProcessPayout } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

interface Payout {
  id: number;
  expertId: number;
  amount: string;
  commission: string;
  netAmount: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  period: string;
  processedAt: string | null;
  expert: {
    id: number;
    name: string;
    user: {
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

export default function AdminPayoutsPage() {
  const { addToast } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');
  const [processing, setProcessing] = useState<number | null>(null);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const response = await adminListPayouts({ status: filter, page: 1, limit: 50 });
      setPayouts(response.data.payouts || []);
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Erreur lors du chargement des payouts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, [filter]);

  const handleProcessPayout = async (payoutId: number) => {
    if (!confirm('Confirmer le traitement de ce payout ?')) return;

    try {
      setProcessing(payoutId);
      await adminProcessPayout(payoutId, { notes: `Traité le ${new Date().toLocaleDateString('fr-FR')}` });
      addToast('Payout traité avec succès', 'success');
      loadPayouts();
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Erreur lors du traitement', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Payouts Experts</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Gérez les paiements des experts</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          {['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md font-medium transition ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Aucun payout trouvé pour le statut "{filter}"
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Montant Brut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Montant Net
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {payout.expert.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {payout.expert.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {payout.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {parseFloat(payout.amount).toFixed(2)} TND
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                    -{parseFloat(payout.commission).toFixed(2)} TND
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                    {parseFloat(payout.netAmount).toFixed(2)} TND
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(payout.status)}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payout.status === 'PENDING' && (
                      <button
                        onClick={() => handleProcessPayout(payout.id)}
                        disabled={processing === payout.id}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing === payout.id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Traitement...
                          </>
                        ) : (
                          'Traiter le payout'
                        )}
                      </button>
                    )}
                    {payout.status === 'COMPLETED' && payout.processedAt && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Traité le {new Date(payout.processedAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
