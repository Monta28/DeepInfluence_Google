import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Politique de Confidentialité</h1>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Chez DeepInfluence, nous accordons une grande importance à la protection de vos données personnelles. Cette politique de confidentialité vous informe sur la manière dont nous collectons, utilisons, stockons et protégeons vos informations personnelles.
              </p>
              <p>
                En utilisant notre plateforme, vous acceptez les pratiques décrites dans cette politique.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Données collectées</h2>
            <div className="text-gray-700 space-y-3">
              <h3 className="font-bold text-lg text-gray-900 mt-4">2.1. Données que vous nous fournissez</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Informations d\'identification : nom, prénom, email, mot de passe</li>
                <li>Informations de profil : photo, biographie, spécialité (pour les experts)</li>
                <li>Informations de paiement : détails de carte bancaire (stockés de manière sécurisée)</li>
                <li>Informations de communication : messages échangés avec les experts</li>
                <li>Contenu créé : avis, commentaires, évaluations</li>
              </ul>

              <h3 className="font-bold text-lg text-gray-900 mt-4">2.2. Données collectées automatiquement</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Données techniques : adresse IP, type de navigateur, système d\'exploitation</li>
                <li>Données d\'utilisation : pages visitées, durée de visite, actions effectuées</li>
                <li>Cookies et technologies similaires (voir notre Politique de Cookies)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Utilisation des données</h2>
            <div className="text-gray-700 space-y-3">
              <p>Nous utilisons vos données personnelles pour :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Créer et gérer votre compte utilisateur</li>
                <li>Faciliter les consultations entre utilisateurs et experts</li>
                <li>Traiter les paiements et prévenir la fraude</li>
                <li>Améliorer notre plateforme et personnaliser votre expérience</li>
                <li>Vous envoyer des notifications importantes sur vos réservations</li>
                <li>Vous informer de nos nouveautés et offres (avec votre consentement)</li>
                <li>Assurer le support client</li>
                <li>Respecter nos obligations légales et réglementaires</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Partage des données</h2>
            <div className="text-gray-700 space-y-3">
              <p>Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations avec :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Les experts :</strong> pour faciliter les consultations (nom, photo de profil)</li>
                <li><strong>Prestataires de services :</strong> hébergement, paiement, analytics (sous contrat strict)</li>
                <li><strong>Autorités légales :</strong> si requis par la loi ou pour protéger nos droits</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Sécurité des données</h2>
            <div className="text-gray-700 space-y-3">
              <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chiffrement SSL/TLS pour toutes les communications</li>
                <li>Hachage des mots de passe avec bcrypt</li>
                <li>Serveurs sécurisés avec pare-feu et systèmes de détection d\'intrusion</li>
                <li>Sauvegardes régulières et redondantes</li>
                <li>Accès limité aux données par le personnel autorisé</li>
                <li>Audits de sécurité réguliers</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Conservation des données</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Compte actif :</strong> pendant toute la durée d\'utilisation</li>
                <li><strong>Données de paiement :</strong> 5 ans (obligations légales comptables)</li>
                <li><strong>Compte supprimé :</strong> 30 jours avant suppression définitive</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Vos droits (RGPD)</h2>
            <div className="text-gray-700 space-y-3">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Droit d\'accès :</strong> obtenir une copie de vos données</li>
                <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
                <li><strong>Droit à l\'effacement :</strong> supprimer vos données (droit à l\'oubli)</li>
                <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
                <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
                <li><strong>Droit d\'opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong>Droit de retrait du consentement :</strong> à tout moment</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à : <strong className="text-purple-600">dpo@deepinfluence.com</strong>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Transferts internationaux</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Vos données peuvent être transférées et traitées en dehors de l\'Espace Économique Européen (EEE). Dans ce cas, nous nous assurons que des garanties appropriées sont en place (clauses contractuelles types de la Commission européenne).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Mineurs</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Notre service est destiné aux personnes âgées de 18 ans et plus. Nous ne collectons pas sciemment de données personnelles d\'enfants de moins de 18 ans.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Nous pouvons mettre à jour cette politique de confidentialité occasionnellement. La date de dernière modification est indiquée ci-dessous. Nous vous encourageons à consulter régulièrement cette page.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact</h2>
            <div className="text-gray-700 space-y-2">
              <p><strong>Délégué à la Protection des Données (DPO) :</strong></p>
              <p>Email : dpo@deepinfluence.com</p>
              <p>Adresse : DeepInfluence SAS, 123 Avenue des Champs-Élysées, 75008 Paris, France</p>
              <p className="mt-4">
                <strong>Autorité de contrôle :</strong> Vous avez le droit de déposer une plainte auprès de la CNIL (Commission Nationale de l\'Informatique et des Libertés) si vous estimez que vos droits ne sont pas respectés.
              </p>
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
