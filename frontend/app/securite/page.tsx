import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

export default function SecuritePage() {
  const securityMeasures = [
    {
      title: 'Chiffrement SSL/TLS',
      description: 'Toutes les données transmises entre votre navigateur et nos serveurs sont chiffrées avec un certificat SSL 256 bits.',
      icon: 'ri-shield-check-line',
    },
    {
      title: 'Authentification sécurisée',
      description: 'Nous utilisons des tokens JWT et des hash bcrypt pour protéger vos identifiants et sessions.',
      icon: 'ri-lock-password-line',
    },
    {
      title: 'Paiements sécurisés',
      description: 'Tous les paiements sont traités via des passerelles conformes PCI DSS (Stripe, PayPal).',
      icon: 'ri-secure-payment-line',
    },
    {
      title: 'Protection des données',
      description: 'Vos données personnelles sont stockées sur des serveurs sécurisés conformes RGPD.',
      icon: 'ri-database-2-line',
    },
    {
      title: 'Audit de sécurité',
      description: 'Notre plateforme fait l\'objet d\'audits de sécurité réguliers par des experts indépendants.',
      icon: 'ri-search-eye-line',
    },
    {
      title: 'Sauvegarde automatique',
      description: 'Vos données sont sauvegardées quotidiennement sur des serveurs redondants géographiquement distribués.',
      icon: 'ri-cloud-line',
    },
  ];

  const bestPractices = [
    {
      title: 'Utilisez un mot de passe fort',
      description: 'Minimum 8 caractères avec majuscules, minuscules, chiffres et caractères spéciaux.',
    },
    {
      title: 'Activez la double authentification',
      description: 'Ajoutez une couche de sécurité supplémentaire avec l\'authentification à deux facteurs.',
    },
    {
      title: 'Ne partagez jamais vos identifiants',
      description: 'DeepInfluence ne vous demandera jamais votre mot de passe par email ou téléphone.',
    },
    {
      title: 'Vérifiez l\'URL',
      description: 'Assurez-vous toujours que l\'URL commence par https://deepinfluence.com',
    },
    {
      title: 'Déconnectez-vous après utilisation',
      description: 'Surtout sur les ordinateurs partagés ou publics.',
    },
    {
      title: 'Signalez toute activité suspecte',
      description: 'Contactez immédiatement notre support si vous remarquez quelque chose d\'inhabituel.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 py-20 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-shield-check-line text-6xl"></i>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">Sécurité & Protection</h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Votre sécurité et la protection de vos données sont notre priorité absolue
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Security Measures */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Nos mesures de sécurité</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityMeasures.map((measure, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                    <i className={`${measure.icon} text-white text-3xl`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{measure.title}</h3>
                  <p className="text-gray-600">{measure.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Certifications */}
          <section className="mb-20">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Certifications & Conformité</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl mb-2">🔒</div>
                  <h3 className="font-bold text-gray-900 mb-2">SSL/TLS</h3>
                  <p className="text-sm text-gray-600">Certificat de sécurité</p>
                </div>
                <div>
                  <div className="text-4xl mb-2">🛡️</div>
                  <h3 className="font-bold text-gray-900 mb-2">RGPD</h3>
                  <p className="text-sm text-gray-600">Conforme européen</p>
                </div>
                <div>
                  <div className="text-4xl mb-2">💳</div>
                  <h3 className="font-bold text-gray-900 mb-2">PCI DSS</h3>
                  <p className="text-sm text-gray-600">Paiements sécurisés</p>
                </div>
                <div>
                  <div className="text-4xl mb-2">✅</div>
                  <h3 className="font-bold text-gray-900 mb-2">ISO 27001</h3>
                  <p className="text-sm text-gray-600">Gestion de la sécurité</p>
                </div>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Bonnes pratiques de sécurité</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bestPractices.map((practice, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="ri-check-line text-green-600 text-xl"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">{practice.title}</h3>
                    <p className="text-gray-600 text-sm">{practice.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Report Security Issue */}
          <section>
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-error-warning-line text-red-600 text-3xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Signaler un problème de sécurité</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Si vous avez découvert une faille de sécurité ou une activité suspecte, merci de nous en informer immédiatement.
              </p>
              <a
                href="mailto:security@deepinfluence.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                <i className="ri-mail-line"></i>
                security@deepinfluence.com
              </a>
            </div>
          </section>

          {/* Last Update */}
          <div className="text-center mt-12 text-gray-500 text-sm">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
