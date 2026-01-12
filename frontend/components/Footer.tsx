
'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-2xl font-bold" style={{ fontFamily: 'Pacifico, serif' }}>
                DeepInfluence
              </span>
            </Link>
            <p className="text-gray-400 dark:text-gray-500 leading-relaxed">
              La plateforme qui connecte les utilisateurs avec des experts vérifiés pour un développement professionnel et personnel optimal.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-gray-800 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                <i className="ri-facebook-fill text-sm"></i>
              </div>
              <div className="w-8 h-8 bg-gray-800 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                <i className="ri-twitter-fill text-sm"></i>
              </div>
              <div className="w-8 h-8 bg-gray-800 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                <i className="ri-linkedin-fill text-sm"></i>
              </div>
              <div className="w-8 h-8 bg-gray-800 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                <i className="ri-instagram-fill text-sm"></i>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Plateforme</h3>
            <ul className="space-y-2">
              <li><Link href="/experts" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">Experts</Link></li>
              <li><Link href="/formations" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">Formations</Link></li>
              <li><Link href="/bibliotheque" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">Bibliothèque</Link></li>
              <li><Link href="/parrainage" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">Parrainage</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/aide" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">Centre d'aide</Link></li>
              <li><Link href="/contact" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">Contact</Link></li>
              <li><Link href="/faq" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">FAQ</Link></li>
              <li><Link href="/securite" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">Sécurité</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Légal</h3>
            <ul className="space-y-2">
              <li><Link href="/mentions-legales" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">Confidentialité</Link></li>
              <li><Link href="/cgu" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">CGU</Link></li>
              <li><Link href="/cookies" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 dark:border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-400 dark:text-gray-500">
            © 2024 DeepInfluence. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
