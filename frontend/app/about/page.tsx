'use client';

import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">&Agrave; propos de DeepInfluence</h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Notre mission</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>
                DeepInfluence a pour mission de d&eacute;mocratiser l&apos;acc&egrave;s &agrave; l&apos;expertise. Nous croyons que chacun m&eacute;rite de b&eacute;n&eacute;ficier de conseils personnalis&eacute;s de la part de professionnels qualifi&eacute;s, quel que soit son lieu de r&eacute;sidence ou son budget.
              </p>
              <p>
                Notre plateforme connecte des utilisateurs du monde entier avec des experts v&eacute;rifi&eacute;s dans de nombreux domaines : business, marketing digital, d&eacute;veloppement personnel, finance, technologie, et bien plus encore.
              </p>
              <p>
                Nous nous engageons &agrave; cr&eacute;er un &eacute;cosyst&egrave;me de confiance o&ugrave; la qualit&eacute; des &eacute;changes est au c&oelig;ur de chaque interaction.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Comment &ccedil;a marche</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-search-line text-blue-600 dark:text-blue-400 text-xl"></i>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">1. Trouvez votre expert</h3>
                  <p className="text-sm">Parcourez notre catalogue d&apos;experts v&eacute;rifi&eacute;s et trouvez celui qui correspond &agrave; vos besoins.</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-calendar-check-line text-purple-600 dark:text-purple-400 text-xl"></i>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">2. R&eacute;servez</h3>
                  <p className="text-sm">R&eacute;servez une consultation en ligne ou envoyez un message &agrave; l&apos;expert de votre choix.</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-vidicon-line text-green-600 dark:text-green-400 text-xl"></i>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">3. &Eacute;changez</h3>
                  <p className="text-sm">Participez &agrave; votre consultation en vid&eacute;o et b&eacute;n&eacute;ficiez de conseils personnalis&eacute;s.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">L&apos;&eacute;quipe</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>
                DeepInfluence est port&eacute; par une &eacute;quipe passionn&eacute;e de professionnels du digital, de l&apos;&eacute;ducation et de la technologie. Bas&eacute;e en France, notre &eacute;quipe travaille chaque jour pour am&eacute;liorer l&apos;exp&eacute;rience de nos utilisateurs et de nos experts.
              </p>
              <p>
                Nous sommes convaincus que l&apos;innovation technologique, combin&eacute;e &agrave; l&apos;expertise humaine, peut transformer la mani&egrave;re dont les gens apprennent et se d&eacute;veloppent professionnellement.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Nos valeurs</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-shield-check-line text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Confiance</h3>
                    <p>Tous nos experts sont v&eacute;rifi&eacute;s. Nous garantissons la qualit&eacute; et l&apos;authenticit&eacute; de chaque profil pr&eacute;sent sur la plateforme.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-hand-heart-line text-purple-600 dark:text-purple-400"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Accessibilit&eacute;</h3>
                    <p>Nous rendons l&apos;expertise accessible &agrave; tous, avec des tarifs transparents et un syst&egrave;me de coins flexible.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-star-line text-green-600 dark:text-green-400"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Excellence</h3>
                    <p>Nous visons l&apos;excellence dans tout ce que nous faisons, de la s&eacute;lection des experts &agrave; l&apos;exp&eacute;rience utilisateur.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-lightbulb-line text-orange-600 dark:text-orange-400"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Innovation</h3>
                    <p>Nous utilisons les derni&egrave;res technologies pour offrir une exp&eacute;rience fluide et enrichissante : visioconf&eacute;rence int&eacute;gr&eacute;e, messagerie en temps r&eacute;el, contenus exclusifs.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact</h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>
                Vous avez une question, une suggestion ou souhaitez collaborer avec nous ? N&apos;h&eacute;sitez pas &agrave; nous contacter.
              </p>
              <p><strong>Email :</strong> contact@deepinfluence.net</p>
              <p><strong>Site web :</strong> <a href="https://deepinfluence.net" className="text-purple-600 dark:text-purple-400 hover:underline">deepinfluence.net</a></p>
              <div className="mt-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <i className="ri-mail-line mr-2"></i>
                  Nous contacter
                </Link>
              </div>
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
