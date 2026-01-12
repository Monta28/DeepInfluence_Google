'use client';

import Link from 'next/link';

export default function ExpertCategories() {
  const categories = [
    {
      name: 'Business',
      icon: 'ri-briefcase-line',
      expertCount: 127,
      image: 'https://readdy.ai/api/search-image?query=Professional%20business%20consultant%20in%20modern%20office%2C%20clean%20minimalist%20background%2C%20business%20strategy%20consultation%2C%20professional%20attire%2C%20confident%20posture%2C%20modern%20workspace%2C%20natural%20lighting%2C%20high-quality%20business%20environment&width=400&height=300&seq=cat-business-001&orientation=landscape',
      color: 'from-blue-600 to-blue-700'
    },
    {
      name: 'Bien-être',
      icon: 'ri-heart-line',
      expertCount: 89,
      image: 'https://readdy.ai/api/search-image?query=Wellness%20coach%20in%20serene%20environment%2C%20meditation%20and%20mindfulness%20setting%2C%20calming%20atmosphere%2C%20natural%20elements%2C%20peaceful%20background%2C%20health%20and%20wellness%20consultation%2C%20professional%20wellness%20expert%2C%20tranquil%20space&width=400&height=300&seq=cat-wellness-001&orientation=landscape',
      color: 'from-green-600 to-green-700'
    },
    {
      name: 'Développement personnel',
      icon: 'ri-user-star-line',
      expertCount: 156,
      image: 'https://readdy.ai/api/search-image?query=Personal%20development%20coach%20in%20inspiring%20environment%2C%20motivational%20setting%2C%20growth%20mindset%20consultation%2C%20professional%20development%20expert%2C%20inspiring%20workspace%2C%20positive%20atmosphere%2C%20clean%20modern%20background&width=400&height=300&seq=cat-personal-001&orientation=landscape',
      color: 'from-purple-600 to-purple-700'
    },
    {
      name: 'Marketing',
      icon: 'ri-megaphone-line',
      expertCount: 94,
      image: 'https://readdy.ai/api/search-image?query=Marketing%20expert%20in%20creative%20workspace%2C%20digital%20marketing%20consultation%2C%20modern%20creative%20environment%2C%20professional%20marketing%20strategist%2C%20innovative%20workspace%2C%20contemporary%20design%2C%20bright%20professional%20setting&width=400&height=300&seq=cat-marketing-001&orientation=landscape',
      color: 'from-orange-600 to-orange-700'
    },
    {
      name: 'Technologie',
      icon: 'ri-code-line',
      expertCount: 78,
      image: 'https://readdy.ai/api/search-image?query=Technology%20expert%20in%20modern%20tech%20environment%2C%20software%20development%20consultation%2C%20clean%20tech%20workspace%2C%20professional%20developer%2C%20modern%20technology%20setting%2C%20innovative%20workspace%2C%20high-tech%20atmosphere&width=400&height=300&seq=cat-tech-001&orientation=landscape',
      color: 'from-indigo-600 to-indigo-700'
    },
    {
      name: 'Finance',
      icon: 'ri-money-dollar-circle-line',
      expertCount: 112,
      image: 'https://readdy.ai/api/search-image?query=Financial%20advisor%20in%20professional%20office%2C%20financial%20consultation%20setting%2C%20modern%20banking%20environment%2C%20professional%20financial%20expert%2C%20clean%20office%20background%2C%20trustworthy%20atmosphere%2C%20business%20financial%20setting&width=400&height=300&seq=cat-finance-001&orientation=landscape',
      color: 'from-emerald-600 to-emerald-700'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Explorez nos domaines d'expertise
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez notre catalogue d'experts vérifiés dans tous les domaines qui vous intéressent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <Link key={index} href={`/experts/${category.name.toLowerCase().replace(' ', '-')}`} className="group cursor-pointer">
              <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-20`}></div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                      <i className={`${category.icon} text-white text-lg`}></i>
                    </div>
                    <span className="text-sm text-gray-500">{category.expertCount} experts</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600 text-sm">
                    Consultez nos experts certifiés en {category.name.toLowerCase()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/experts" className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap">
            Voir tous les experts
          </Link>
        </div>
      </div>
    </section>
  );
}