import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Mentions Légales</h1>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Éditeur du site</h2>
            <div className="text-gray-700 space-y-2">
              <p><strong>Raison sociale :</strong> DeepInfluence SAS</p>
              <p><strong>Capital social :</strong> 50 000 €</p>
              <p><strong>Siège social :</strong> 123 Avenue des Champs-Élysées, 75008 Paris, France</p>
              <p><strong>RCS :</strong> Paris B 123 456 789</p>
              <p><strong>SIRET :</strong> 123 456 789 00010</p>
              <p><strong>TVA intracommunautaire :</strong> FR12 123456789</p>
              <p><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
              <p><strong>Email :</strong> contact@deepinfluence.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Directeur de la publication</h2>
            <div className="text-gray-700">
              <p><strong>Nom :</strong> Jean Dupont</p>
              <p><strong>Fonction :</strong> Président</p>
              <p><strong>Email :</strong> direction@deepinfluence.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Hébergement</h2>
            <div className="text-gray-700 space-y-2">
              <p><strong>Hébergeur :</strong> Vercel Inc.</p>
              <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
              <p><strong>Site web :</strong> https://vercel.com</p>
            </div>
            <div className="text-gray-700 space-y-2 mt-4">
              <p><strong>Base de données :</strong> Railway Corp.</p>
              <p><strong>Adresse :</strong> 548 Market St, San Francisco, CA 94104, USA</p>
              <p><strong>Site web :</strong> https://railway.app</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Propriété intellectuelle</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Le site DeepInfluence et l\'ensemble de son contenu (textes, images, vidéos, logos, icônes) sont la propriété exclusive de DeepInfluence SAS, sauf mention contraire.
              </p>
              <p>
                Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces différents éléments est strictement interdite sans l\'accord exprès par écrit de DeepInfluence SAS.
              </p>
              <p>
                Les marques et logos DeepInfluence sont des marques déposées. Toute reproduction non autorisée de ces marques constitue une contrefaçon passible de sanctions pénales.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Protection des données personnelles</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d\'un droit d\'accès, de rectification, de suppression et de portabilité de vos données personnelles.
              </p>
              <p>
                Pour exercer ces droits, vous pouvez nous contacter à l\'adresse : <strong>dpo@deepinfluence.com</strong>
              </p>
              <p>
                Pour plus d\'informations, consultez notre <a href="/confidentialite" className="text-purple-600 hover:underline">Politique de Confidentialité</a>.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
            <div className="text-gray-700">
              <p>
                Le site utilise des cookies pour améliorer l\'expérience utilisateur. Pour en savoir plus, consultez notre <a href="/cookies" className="text-purple-600 hover:underline">Politique de Cookies</a>.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Responsabilité</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                DeepInfluence s\'efforce d\'assurer l\'exactitude et la mise à jour des informations diffusées sur ce site, dont elle se réserve le droit de corriger le contenu à tout moment et sans préavis.
              </p>
              <p>
                Toutefois, DeepInfluence ne peut garantir l\'exactitude, la précision ou l\'exhaustivité des informations mises à disposition sur ce site.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Loi applicable</h2>
            <div className="text-gray-700">
              <p>
                Les présentes mentions légales sont régies par le droit français. En cas de litige, et après échec de toute tentative de résolution amiable, les tribunaux français seront seuls compétents.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Médiation</h2>
            <div className="text-gray-700">
              <p>
                Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, nous proposons un dispositif de médiation de la consommation. L\'entité de médiation retenue est : CNPM - MÉDIATION DE LA CONSOMMATION.
              </p>
              <p className="mt-2">En cas de litige, vous pouvez déposer votre réclamation sur son site : <a href="https://cnpm-mediation-consommation.eu" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">https://cnpm-mediation-consommation.eu</a></p>
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
