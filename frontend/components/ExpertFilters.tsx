'use client';

import { useState, useEffect, useRef } from 'react';
import EXPERT_CATEGORIES from '@/data/expertCategories';

interface ExpertFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function ExpertFilters({
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange
}: ExpertFiltersProps) {
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = EXPERT_CATEGORIES.filter((cat) =>
    cat.label.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400"></i>
            <input
              type="text"
              placeholder="Rechercher un expert ou une spécialité..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-start">
          <button
            onClick={() => onCategoryChange('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Toutes
          </button>
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                selectedCategory !== 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {selectedCategory !== 'all'
                ? EXPERT_CATEGORIES.find(c => c.label === selectedCategory)?.label || selectedCategory
                : 'Choisir une catégorie'}
              <i className={`ri-arrow-${categoryDropdownOpen ? 'up' : 'down'}-s-line`}></i>
            </button>
            {categoryDropdownOpen && (
              <div className="absolute z-50 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
                <div className="p-2">
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Rechercher une catégorie..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        onCategoryChange(cat.label);
                        setCategoryDropdownOpen(false);
                        setCategorySearch('');
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedCategory === cat.label
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                          : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                  {filteredCategories.length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">Aucune catégorie trouvée</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
            <i className="ri-filter-line"></i>
            <span className="text-sm">Filtres avancés</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
            <i className="ri-sort-desc"></i>
            <span className="text-sm">Trier par</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Experts en ligne</span>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}