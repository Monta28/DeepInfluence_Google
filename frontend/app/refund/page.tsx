'use client';

import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Politique de Remboursement</h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Achats de coins</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>
                Les coins sont la monnaie virtuelle de DeepInfluence (deepinfluence.net). Ils permettent de payer les consultations, les formations et les messages aux experts.
              </p>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-4">Conditions de remboursement des coins</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Les coins non utilis&eacute;s peuvent faire l&apos;objet d&apos;une demande de remboursement dans les 14 jours suivant l&apos;achat, conform&eacute;ment au droit de r&eacute;tractation europ&eacute;en.</li>
                <li>Pass&eacute; ce d&eacute;lai, les coins achet&eacute;s ne sont pas remboursables.</li>
                <li>Les coins obtenus par parrainage, promotion ou bonus ne sont en aucun cas remboursables.</li>
                <li>Le remboursement s&apos;effectue sur le moyen de paiement utilis&eacute; lors de l&apos;achat.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Formations</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>Les formations achet&eacute;es sur DeepInfluence sont soumises aux conditions suivantes :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Avant le d&eacute;but de la formation :</strong> remboursement int&eacute;gral en coins sur demande.</li>
                <li><strong>Dans les 48 heures suivant le d&eacute;but :</strong> remboursement possible si moins de 20% du contenu a &eacute;t&eacute; consomm&eacute;.</li>
                <li><strong>Apr&egrave;s 48 heures ou 20% du contenu consomm&eacute; :</strong> aucun remboursement possible.</li>
                <li><strong>Formation annul&eacute;e par l&apos;expert :</strong> remboursement automatique et int&eacute;gral en coins.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Consultations</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>Les consultations avec les experts sont soumises aux conditions d&apos;annulation et de remboursement suivantes :</p>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-4">Annulation par l&apos;utilisateur</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Plus de 24h avant :</strong> remboursement int&eacute;gral en coins.</li>
                <li><strong>Entre 24h et 2h avant :</strong> remboursement de 50% en coins.</li>
                <li><strong>Moins de 2h avant ou absence :</strong> aucun remboursement.</li>
              </ul>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-4">Annulation par l&apos;expert</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Remboursement automatique et int&eacute;gral en coins, quel que soit le d&eacute;lai.</li>
                <li>Un bonus de compensation de 10% peut &ecirc;tre attribu&eacute; en coins selon les circonstances.</li>
              </ul>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-4">Probl&egrave;me technique</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>En cas de probl&egrave;me technique emp&ecirc;chant le bon d&eacute;roulement de la consultation, un remboursement int&eacute;gral en coins sera effectu&eacute; apr&egrave;s v&eacute;rification.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Proc&eacute;dure de remboursement</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>Pour effectuer une demande de remboursement :</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Connectez-vous &agrave; votre compte DeepInfluence.</li>
                <li>Rendez-vous dans la section &laquo; Param&egrave;tres &raquo; puis &laquo; Historique des transactions &raquo;.</li>
                <li>S&eacute;lectionnez la transaction concern&eacute;e et cliquez sur &laquo; Demander un remboursement &raquo;.</li>
                <li>Pr&eacute;cisez le motif de votre demande.</li>
                <li>Notre &eacute;quipe traitera votre demande dans les meilleurs d&eacute;lais.</li>
              </ol>
              <p className="mt-4">
                Vous pouvez &eacute;galement nous contacter directement &agrave; : <strong className="text-purple-600 dark:text-purple-400">support@deepinfluence.net</strong>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. D&eacute;lais</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Traitement de la demande :</strong> sous 48 heures ouvr&eacute;es apr&egrave;s r&eacute;ception.</li>
                <li><strong>Remboursement en coins :</strong> imm&eacute;diat apr&egrave;s validation de la demande.</li>
                <li><strong>Remboursement en euros (achat de coins) :</strong> 5 &agrave; 10 jours ouvr&eacute;s selon votre banque.</li>
                <li><strong>Droit de r&eacute;tractation :</strong> 14 jours &agrave; compter de l&apos;achat pour les coins non utilis&eacute;s.</li>
              </ul>
              <p className="mt-4">
                En cas de d&eacute;saccord avec notre d&eacute;cision, vous pouvez faire appel en contactant notre service client ou saisir le m&eacute;diateur de la consommation comp&eacute;tent.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Contact</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-2">
              <p>Pour toute question relative &agrave; cette politique de remboursement :</p>
              <p><strong>Email :</strong> support@deepinfluence.net</p>
              <p><strong>Adresse :</strong> DeepInfluence, Paris, France</p>
            </div>
          </section>

          <div className="text-center text-gray-500 dark:text-gray-400 text-sm pt-8 border-t border-gray-200 dark:border-gray-700">
            Derni&egrave;re mise &agrave; jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
