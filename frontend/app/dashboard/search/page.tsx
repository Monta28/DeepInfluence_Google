
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import ExpertCard from '@/components/ExpertCard';
import FormationCard from '@/components/FormationCard';
import { useCurrency } from '@/contexts/CurrencyContext';
import ApiService, { Expert, Formation } from '@/services/api';

export default function Search() {
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [rating, setRating] = useState(0);
  const [availability, setAvailability] = useState('all');

  const categories = [
    { id: 'all', name: 'Tous' },
    { id: 'business', name: 'Business' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'wellness', name: 'Bien-être' },
    { id: 'tech', name: 'Tech' },
    { id: 'finance', name: 'Finance' },
  ];

  const [experts, setExperts] = useState<Expert[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // handle search using API
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      const [e, f] = await Promise.all([
        ApiService.getExperts({ category: selectedCategory !== 'all' ? selectedCategory : undefined, search: searchQuery || undefined, limit: 20 }),
        ApiService.getFormations({ category: selectedCategory !== 'all' ? selectedCategory : undefined, search: searchQuery || undefined, limit: 20 })
      ]);
      if (e.success) setExperts(e.data.experts || []); else setExperts([]);
      if (f.success) setFormations(f.data.formations || []); else setFormations([]);
    } catch (e) {
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleSearch(); }, []);

  // Données mock supprimées (experts/formations) pour éviter les conflits

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recherche Avancée
          </h1>
          <p className="text-gray-600">
            Trouvez l'expert ou la formation parfaite pour vos besoins
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Filtres</h3>

              {/* Search Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de recherche
                </label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="all">Tous</option>
                  <option value="experts">Experts seulement</option>
                  <option value="formations">Formations seulement</option>
                </select>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fourchette de prix
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatPrice(0)}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note minimum
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`w-6 h-6 flex items-center justify-center ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <i className="ri-star-fill"></i>
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disponibilité
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="all">Toutes</option>
                  <option value="online">En ligne maintenant</option>
                  <option value="today">Disponible aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                </select>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap">
                Appliquer les filtres
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher par nom, spécialité, ou mot-clé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Results */}
            <div className="space-y-10">
              {/* Experts Results */}
              {(searchType === 'all' || searchType === 'experts') && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Experts ({experts.length})
                  </h2>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {experts.filter((e) => e.verified !== false).map((expert) => (
                      <ExpertCard key={expert.id} expert={expert} />
                    ))}
                  </div>
                </div>
              )}

              {/* Formations Results */}
              {(searchType === 'all' || searchType === 'formations') && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Formations ({formations.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {formations.map((formation) => (
                      <FormationCard key={formation.id} formation={formation} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
