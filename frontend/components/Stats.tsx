
'use client';

import { useEffect, useState } from 'react';

export default function Stats() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const stats = [
    { number: '2,500+', label: 'Experts vérifiés' },
    { number: '50,000+', label: 'Consultations réalisées' },
    { number: '25+', label: 'Domaines d\'expertise' },
    { number: '98%', label: 'Taux de satisfaction' }
  ];

  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Des chiffres qui parlent
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui font confiance à DeepInfluence pour leur développement professionnel et personnel.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl font-bold text-white mb-2">{stat.number}</div>
              <div className="text-blue-100 text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
