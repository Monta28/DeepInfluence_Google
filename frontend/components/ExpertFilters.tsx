'use client';

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
  const categories = [
    { id: 'all', name: 'Tous les experts', count: 656 },
    { id: 'business', name: 'Business', count: 127 },
    { id: 'bien-etre', name: 'Bien-être', count: 89 },
    { id: 'developpement', name: 'Développement personnel', count: 156 },
    { id: 'marketing', name: 'Marketing', count: 94 },
    { id: 'technologie', name: 'Technologie', count: 78 },
    { id: 'finance', name: 'Finance', count: 112 }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Rechercher un expert ou une spécialité..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">
            <i className="ri-filter-line"></i>
            <span className="text-sm">Filtres avancés</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">
            <i className="ri-sort-desc"></i>
            <span className="text-sm">Trier par</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Experts en ligne</span>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}