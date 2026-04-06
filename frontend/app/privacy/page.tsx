'use client';

import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Politique de Confidentialit&eacute;</h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Collecte des donn&eacute;es</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>
                DeepInfluence (deepinfluence.net) collecte des donn&eacute;es personnelles dans le cadre de l&apos;utilisation de sa plateforme. Les donn&eacute;es collect&eacute;es incluent :
              </p>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-4">Donn&eacute;es fournies par l&apos;utilisateur</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Informations d&apos;identification : nom, pr&eacute;nom, adresse e-mail, mot de passe</li>
                <li>Informations de profil : photo, biographie, sp&eacute;cialit&eacute; (pour les experts)</li>
                <li>Informations de paiement : d&eacute;tails de carte bancaire (stock&eacute;s de mani&egrave;re s&eacute;curis&eacute;e via nos prestataires)</li>
                <li>Contenu g&eacute;n&eacute;r&eacute; : messages, avis, commentaires, &eacute;valuations</li>
              </ul>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-4">Donn&eacute;es collect&eacute;es automatiquement</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Donn&eacute;es techniques : adresse IP, type de navigateur, syst&egrave;me d&apos;exploitation</li>
                <li>Donn&eacute;es d&apos;utilisation : pages visit&eacute;es, dur&eacute;e de visite, actions effectu&eacute;es</li>
                <li>Donn&eacute;es de connexion : date et heure des acc&egrave;s, logs de s&eacute;curit&eacute;</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Utilisation des donn&eacute;es</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>Nous utilisons vos donn&eacute;es personnelles pour :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cr&eacute;er et g&eacute;rer votre compte utilisateur</li>
                <li>Faciliter les consultations entre utilisateurs et experts</li>
                <li>Traiter les paiements et pr&eacute;venir la fraude</li>
                <li>Am&eacute;liorer notre plateforme et personnaliser votre exp&eacute;rience</li>
                <li>Vous envoyer des notifications relatives &agrave; vos r&eacute;servations</li>
                <li>Vous informer de nos nouveaut&eacute;s et offres (avec votre consentement)</li>
                <li>Assurer le support client</li>
                <li>Respecter nos obligations l&eacute;gales et r&eacute;glementaires</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Cookies</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>
                Notre site utilise des cookies pour am&eacute;liorer votre exp&eacute;rience de navigation. Les cookies sont de petits fichiers texte stock&eacute;s sur votre appareil.
              </p>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-4">Types de cookies utilis&eacute;s</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Cookies essentiels :</strong> n&eacute;cessaires au fonctionnement du site (authentification, s&eacute;curit&eacute;)</li>
                <li><strong>Cookies de performance :</strong> nous aident &agrave; comprendre comment vous utilisez le site</li>
                <li><strong>Cookies de fonctionnalit&eacute; :</strong> m&eacute;morisent vos pr&eacute;f&eacute;rences (langue, th&egrave;me sombre)</li>
              </ul>
              <p>
                Vous pouvez g&eacute;rer vos pr&eacute;f&eacute;rences de cookies &agrave; tout moment via les param&egrave;tres de votre navigateur.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Partage des donn&eacute;es</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>Nous ne vendons jamais vos donn&eacute;es personnelles. Nous pouvons partager vos informations avec :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Les experts :</strong> informations n&eacute;cessaires &agrave; la r&eacute;alisation des consultations (nom, photo de profil)</li>
                <li><strong>Prestataires de services :</strong> h&eacute;bergement, paiement, outils d&apos;analyse (sous contrat strict de confidentialit&eacute;)</li>
                <li><strong>Autorit&eacute;s l&eacute;gales :</strong> si requis par la loi ou pour prot&eacute;ger nos droits</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Droits des utilisateurs</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>Conform&eacute;ment au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Droit d&apos;acc&egrave;s :</strong> obtenir une copie de vos donn&eacute;es personnelles</li>
                <li><strong>Droit de rectification :</strong> corriger vos donn&eacute;es inexactes ou incompl&egrave;tes</li>
                <li><strong>Droit &agrave; l&apos;effacement :</strong> demander la suppression de vos donn&eacute;es (droit &agrave; l&apos;oubli)</li>
                <li><strong>Droit &agrave; la limitation :</strong> restreindre le traitement de vos donn&eacute;es</li>
                <li><strong>Droit &agrave; la portabilit&eacute; :</strong> r&eacute;cup&eacute;rer vos donn&eacute;es dans un format structur&eacute;</li>
                <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos donn&eacute;es</li>
                <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement &agrave; tout moment</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, contactez notre D&eacute;l&eacute;gu&eacute; &agrave; la Protection des Donn&eacute;es : <strong className="text-purple-600 dark:text-purple-400">dpo@deepinfluence.net</strong>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. S&eacute;curit&eacute;</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>Nous mettons en place des mesures de s&eacute;curit&eacute; techniques et organisationnelles pour prot&eacute;ger vos donn&eacute;es :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chiffrement SSL/TLS pour toutes les communications</li>
                <li>Hachage s&eacute;curis&eacute; des mots de passe avec bcrypt</li>
                <li>Serveurs s&eacute;curis&eacute;s avec pare-feu et syst&egrave;mes de d&eacute;tection d&apos;intrusion</li>
                <li>Sauvegardes r&eacute;guli&egrave;res et redondantes</li>
                <li>Acc&egrave;s restreint aux donn&eacute;es par le personnel autoris&eacute;</li>
                <li>Audits de s&eacute;curit&eacute; r&eacute;guliers</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Contact</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-2">
              <p>Pour toute question relative &agrave; cette politique de confidentialit&eacute; :</p>
              <p><strong>D&eacute;l&eacute;gu&eacute; &agrave; la Protection des Donn&eacute;es (DPO)</strong></p>
              <p>Email : dpo@deepinfluence.net</p>
              <p>Adresse : DeepInfluence, Paris, France</p>
              <p className="mt-4">
                <strong>Autorit&eacute; de contr&ocirc;le :</strong> Vous pouvez d&eacute;poser une plainte aupr&egrave;s de la CNIL (Commission Nationale de l&apos;Informatique et des Libert&eacute;s) si vous estimez que vos droits ne sont pas respect&eacute;s.
              </p>
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
