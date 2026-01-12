
'use client';

export default function Features() {
  const features = [
    {
      icon: 'ri-search-line',
      title: 'Recherche avancée',
      description: 'Trouvez facilement des experts grâce à notre système de recherche par domaine et filtres avancés.'
    },
    {
      icon: 'ri-calendar-line',
      title: 'Réservation simple',
      description: 'Réservez vos consultations individuelles ou de groupe via notre calendrier intégré.'
    },
    {
      icon: 'ri-message-line',
      title: 'Messagerie sécurisée',
      description: 'Communiquez en toute sécurité avec vos experts via notre système de messagerie cryptée.'
    },
    {
      icon: 'ri-video-line',
      title: 'Appels vidéo',
      description: 'Profitez d\'appels vidéo haute qualité avec facturation à la minute et suivi en temps réel.'
    },
    {
      icon: 'ri-coins-line',
      title: 'Système de coins',
      description: 'Payez simplement avec nos coins (1 coin = 500 millimes), débités uniquement après la réponse de l\'expert.'
    },
    {
      icon: 'ri-book-line',
      title: 'Bibliothèque de formations',
      description: 'Accédez à des mini-formations vidéo créées par nos experts certifiés.'
    }
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pourquoi choisir DeepInfluence ?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Une plateforme complète et sécurisée pour accéder à l'expertise qualifiée et développer vos compétences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-700 rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                <i className={`${feature.icon} text-white text-xl`}></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
