'use client';

export default function HowItWorks() {
  const steps = [
    {
      step: '1',
      title: 'Trouvez votre expert',
      description: 'Parcourez notre catalogue d\'experts vérifiés et utilisez nos filtres pour trouver le professionnel qui correspond à vos besoins.',
      icon: 'ri-search-2-line'
    },
    {
      step: '2',
      title: 'Réservez votre consultation',
      description: 'Choisissez un créneau disponible dans le calendrier de votre expert et réservez votre consultation individuelle ou de groupe.',
      icon: 'ri-calendar-check-line'
    },
    {
      step: '3',
      title: 'Préparez vos coins',
      description: 'Rechargez votre compte avec nos coins (1 coin = 500 millimes). Le paiement ne sera débité qu\'après la réponse de l\'expert.',
      icon: 'ri-coins-line'
    },
    {
      step: '4',
      title: 'Connectez-vous',
      description: 'Échangez avec votre expert via notre messagerie sécurisée ou rejoignez un appel vidéo pour une consultation en temps réel.',
      icon: 'ri-video-chat-line'
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Quatre étapes simples pour accéder à l'expertise dont vous avez besoin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={`${step.icon} text-white text-2xl`}></i>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-blue-600 font-bold text-sm">{step.step}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gray-300 transform -translate-y-1/2"></div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}