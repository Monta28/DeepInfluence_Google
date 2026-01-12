import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Conditions Générales d'Utilisation</h1>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Objet</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme DeepInfluence, accessible à l'adresse deepinfluence.com.
              </p>
              <p>
                En accédant et en utilisant la plateforme, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description du service</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                DeepInfluence est une plateforme de mise en relation entre des experts dans divers domaines et des utilisateurs recherchant des conseils personnalisés.
              </p>
              <p>
                La plateforme permet de :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Consulter les profils des experts</li>
                <li>Réserver des consultations en ligne</li>
                <li>Accéder à des formations et du contenu exclusif</li>
                <li>Échanger avec les experts via messagerie</li>
                <li>Participer à la communauté (avis, commentaires)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Inscription et compte utilisateur</h2>
            <div className="text-gray-700 space-y-3">
              <h3 className="font-bold text-lg text-gray-900 mt-4">3.1. Conditions d'inscription</h3>
              <p>
                Pour utiliser certaines fonctionnalités de la plateforme, vous devez créer un compte. Vous devez :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Être âgé de 18 ans ou plus</li>
                <li>Fournir des informations exactes, à jour et complètes</li>
                <li>Maintenir et mettre à jour régulièrement vos informations</li>
                <li>Garder votre mot de passe confidentiel</li>
              </ul>

              <h3 className="font-bold text-lg text-gray-900 mt-4">3.2. Responsabilité du compte</h3>
              <p>
                Vous êtes seul responsable de toutes les activités effectuées depuis votre compte. En cas d'utilisation non autorisée, vous devez immédiatement nous en informer.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Monnaie virtuelle "Coins"</h2>
            <div className="text-gray-700 space-y-3">
              <h3 className="font-bold text-lg text-gray-900 mt-4">4.1. Fonctionnement</h3>
              <p>
                Les "coins" sont la monnaie virtuelle de la plateforme. 1 coin = 1 euro. Ils servent à payer les consultations et formations.
              </p>

              <h3 className="font-bold text-lg text-gray-900 mt-4">4.2. Achat</h3>
              <p>
                Les coins peuvent être achetés via les moyens de paiement proposés sur la plateforme. Ils sont crédités immédiatement après validation du paiement.
              </p>

              <h3 className="font-bold text-lg text-gray-900 mt-4">4.3. Non-remboursabilité</h3>
              <p>
                Les coins achetés ne sont pas remboursables. Ils n'ont pas de date d'expiration et restent disponibles tant que votre compte est actif.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Consultations et réservations</h2>
            <div className="text-gray-700 space-y-3">
              <h3 className="font-bold text-lg text-gray-900 mt-4">5.1. Réservation</h3>
              <p>
                Vous pouvez réserver une consultation avec un expert en fonction de ses disponibilités. La réservation est confirmée dès le paiement en coins.
              </p>

              <h3 className="font-bold text-lg text-gray-900 mt-4">5.2. Annulation</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Annulation gratuite jusqu'à 24h avant la consultation</li>
                <li>Annulation moins de 24h avant : retenue de 50% des coins</li>
                <li>Absence sans annulation : retenue de 100% des coins</li>
              </ul>

              <h3 className="font-bold text-lg text-gray-900 mt-4">5.3. Déroulement</h3>
              <p>
                Les consultations se déroulent en ligne via notre système de visioconférence intégré. Vous devez disposer d'une connexion internet stable et d'un équipement compatible.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Obligations des utilisateurs</h2>
            <div className="text-gray-700 space-y-3">
              <p>Vous vous engagez à :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Respecter les lois et règlements en vigueur</li>
                <li>Ne pas tenir de propos diffamatoires, injurieux ou discriminatoires</li>
                <li>Ne pas usurper l'identité d'autrui</li>
                <li>Ne pas perturber le fonctionnement de la plateforme</li>
                <li>Ne pas diffuser de virus ou code malveillant</li>
                <li>Ne pas collecter les données d'autres utilisateurs</li>
                <li>Respecter les droits de propriété intellectuelle</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Obligations des experts</h2>
            <div className="text-gray-700 space-y-3">
              <p>Les experts s'engagent en plus à :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fournir des informations exactes sur leurs qualifications</li>
                <li>Honorer les consultations réservées</li>
                <li>Maintenir un niveau de service professionnel</li>
                <li>Respecter la confidentialité des échanges</li>
                <li>Ne pas solliciter de paiements en dehors de la plateforme</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Propriété intellectuelle</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Tous les éléments de la plateforme (design, textes, images, logos, code source) sont protégés par les droits de propriété intellectuelle et appartiennent à DeepInfluence ou à ses partenaires.
              </p>
              <p>
                Toute reproduction, distribution ou utilisation non autorisée est interdite.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Responsabilité et garanties</h2>
            <div className="text-gray-700 space-y-3">
              <h3 className="font-bold text-lg text-gray-900 mt-4">9.1. Rôle d'intermédiaire</h3>
              <p>
                DeepInfluence agit en tant qu'intermédiaire technique entre les utilisateurs et les experts. Nous ne sommes pas responsables du contenu des consultations ni de la qualité des conseils fournis.
              </p>

              <h3 className="font-bold text-lg text-gray-900 mt-4">9.2. Disponibilité</h3>
              <p>
                Nous nous efforçons d'assurer une disponibilité continue de la plateforme, mais ne pouvons garantir un accès ininterrompu. Des maintenances peuvent être effectuées.
              </p>

              <h3 className="font-bold text-lg text-gray-900 mt-4">9.3. Limitation de responsabilité</h3>
              <p>
                DeepInfluence ne pourra être tenue responsable des dommages indirects résultant de l'utilisation de la plateforme.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Suspension et résiliation</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Nous nous réservons le droit de suspendre ou supprimer votre compte en cas de violation des présentes CGU, sans préavis ni indemnité.
              </p>
              <p>
                Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modification des CGU</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Nous pouvons modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur la plateforme. Votre utilisation continue de la plateforme vaut acceptation des nouvelles conditions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Loi applicable et juridiction</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou exécution relève de la compétence exclusive des tribunaux français.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact</h2>
            <div className="text-gray-700 space-y-2">
              <p>Pour toute question concernant les présentes CGU :</p>
              <p><strong>Email :</strong> legal@deepinfluence.com</p>
              <p><strong>Adresse :</strong> DeepInfluence SAS, 123 Avenue des Champs-Élysées, 75008 Paris, France</p>
            </div>
          </section>

          <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
