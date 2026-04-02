'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

interface Verification {
  id: number;
  name: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt: string | null;
  diplomaUrl: string | null;
  identityDocumentUrl: string | null;
  rejectionReason: string | null;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture: string;
  };
}

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedVerif, setSelectedVerif] = useState<Verification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    action: 'approve' as 'approve' | 'reject',
    rejectionReason: '',
    verificationNote: ''
  });

  useEffect(() => {
    loadVerifications();
  }, [filter]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'PENDING' ? '/admin/verifications/pending' : '/admin/verifications';
      const params: any = {};
      if (filter !== 'all' && filter !== 'PENDING') params.status = filter;

      const response = await api.get(endpoint, { params });
      setVerifications(response.data.data.verifications);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement vérifications:', error);
      setLoading(false);
    }
  };

  const handleViewDetails = async (verification: Verification) => {
    try {
      const response = await api.get(`/admin/verifications/${verification.id}`);
      setSelectedVerif(response.data.data.expert);
      setShowModal(true);
      setReviewForm({
        action: 'approve',
        rejectionReason: '',
        verificationNote: ''
      });
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    }
  };

  const handleReview = async () => {
    if (reviewForm.action === 'reject' && !reviewForm.rejectionReason.trim()) {
      alert('Veuillez indiquer un motif de refus');
      return;
    }

    setReviewing(true);
    try {
      await api.post(`/admin/verifications/${selectedVerif?.id}/review`, reviewForm);
      alert(`Demande ${reviewForm.action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`);
      setShowModal(false);
      loadVerifications();
    } catch (error: any) {
      console.error('Erreur validation:', error);
      alert(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-semibold">En attente</span>;
      case 'APPROVED':
        return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold">Approuvée</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-semibold">Rejetée</span>;
      default:
        return null;
    }
  };

  const stats = {
    pending: verifications.filter(v => v.verificationStatus === 'PENDING').length,
    approved: verifications.filter(v => v.verificationStatus === 'APPROVED').length,
    rejected: verifications.filter(v => v.verificationStatus === 'REJECTED').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Validations KYC
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les demandes de vérification des experts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">En attente</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Approuvées</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Rejetées</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'PENDING'
                ? 'bg-yellow-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            En attente ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'APPROVED'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Approuvées ({stats.approved})
          </button>
          <button
            onClick={() => setFilter('REJECTED')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'REJECTED'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Rejetées ({stats.rejected})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Toutes
          </button>
        </div>

        {/* Liste */}
        {verifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Aucune demande
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Aucune demande de vérification à afficher
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date soumission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {verifications.map((verification) => (
                  <tr key={verification.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={verification.user.profilePicture || '/default-avatar.png'}
                          alt={verification.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{verification.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {verification.user.firstName} {verification.user.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {verification.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(verification.verificationStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(verification.submittedAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(verification)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
                      >
                        Voir détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal détails */}
      {showModal && selectedVerif && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Détails de la demande
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Expert info */}
              <div className="flex items-start gap-4">
                <img
                  src={selectedVerif.user.profilePicture || '/default-avatar.png'}
                  alt={selectedVerif.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedVerif.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {selectedVerif.user.firstName} {selectedVerif.user.lastName}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedVerif.user.email}
                  </p>
                </div>
                {getStatusBadge(selectedVerif.verificationStatus)}
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedVerif.diplomaUrl && (
                    <a
                      href={selectedVerif.diplomaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Diplôme</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cliquez pour voir</p>
                      </div>
                    </a>
                  )}
                  {selectedVerif.identityDocumentUrl && (
                    <a
                      href={selectedVerif.identityDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">CIN</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cliquez pour voir</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Review Form (only for PENDING) */}
              {selectedVerif.verificationStatus === 'PENDING' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Valider la demande
                  </h3>

                  {/* Action */}
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => setReviewForm({ ...reviewForm, action: 'approve' })}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                        reviewForm.action === 'approve'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      ✓ Approuver
                    </button>
                    <button
                      onClick={() => setReviewForm({ ...reviewForm, action: 'reject' })}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                        reviewForm.action === 'reject'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      ✕ Rejeter
                    </button>
                  </div>

                  {/* Rejection reason */}
                  {reviewForm.action === 'reject' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Motif de refus <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={reviewForm.rejectionReason}
                        onChange={(e) => setReviewForm({ ...reviewForm, rejectionReason: e.target.value })}
                        placeholder="Expliquez pourquoi la demande est rejetée..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                      />
                    </div>
                  )}

                  {/* Internal note */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Note interne (optionnelle)
                    </label>
                    <textarea
                      value={reviewForm.verificationNote}
                      onChange={(e) => setReviewForm({ ...reviewForm, verificationNote: e.target.value })}
                      placeholder="Note interne pour l'équipe admin..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleReview}
                    disabled={reviewing}
                    className={`w-full py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      reviewForm.action === 'approve'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {reviewing ? 'Traitement...' : `Confirmer ${reviewForm.action === 'approve' ? 'l\'approbation' : 'le rejet'}`}
                  </button>
                </div>
              )}

              {/* Rejection reason (if rejected) */}
              {selectedVerif.verificationStatus === 'REJECTED' && selectedVerif.rejectionReason && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Motif du refus
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedVerif.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
