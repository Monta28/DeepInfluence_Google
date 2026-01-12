'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import ApiService, { PublicStats } from '../services/api';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentText, setCurrentText] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  const textRotation = [
    "Experts vérifiés",
    "Mentors de confiance",
    "Coachs qualifiés",
    "Leaders de l'industrie"
  ];

  const floatingElements = [
    { id: 1, size: 97.7, left: 55.9, top: 14.4, delay: 1.3, duration: 4.2 },
    { id: 2, size: 114.9, left: 79.3, top: 5.0, delay: 0.7, duration: 5.5 },
    { id: 3, size: 98.5, left: 35.5, top: 55.0, delay: 0.8, duration: 4.3 },
    { id: 4, size: 118.2, left: 4.6, top: 98.6, delay: 0.3, duration: 7.0 },
    { id: 5, size: 128.7, left: 46.9, top: 88.5, delay: 0.7, duration: 5.5 },
    { id: 6, size: 122.2, left: 77.6, top: 17.5, delay: 1.8, duration: 4.7 },
    { id: 7, size: 50.4, left: 9.3, top: 10.0, delay: 0.6, duration: 4.8 },
    { id: 8, size: 114.3, left: 67.4, top: 22.7, delay: 2.0, duration: 4.7 },
    { id: 9, size: 136.4, left: 14.0, top: 66.4, delay: 1.6, duration: 4.4 },
    { id: 10, size: 123.6, left: 41.5, top: 54.7, delay: 0.2, duration: 4.1 },
    { id: 11, size: 117.2, left: 59.2, top: 42.3, delay: 1.2, duration: 4.7 },
    { id: 12, size: 71.9, left: 24.7, top: 67.5, delay: 1.1, duration: 5.6 },
    { id: 13, size: 60.3, left: 52.5, top: 31.9, delay: 1.8, duration: 6.7 },
    { id: 14, size: 79.7, left: 78.3, top: 15.8, delay: 1.3, duration: 6.0 },
    { id: 15, size: 145.8, left: 26.9, top: 10.0, delay: 1.4, duration: 4.7 },
    { id: 16, size: 89.4, left: 11.0, top: 57.9, delay: 1.5, duration: 4.7 },
    { id: 17, size: 147.0, left: 63.3, top: 57.4, delay: 0.8, duration: 6.1 },
    { id: 18, size: 93.3, left: 44.0, top: 27.1, delay: 0.4, duration: 5.4 },
    { id: 19, size: 121.3, left: 99.7, top: 89.7, delay: 1.4, duration: 4.5 },
    { id: 20, size: 133.4, left: 85.0, top: 46.1, delay: 0.7, duration: 7.0 }
  ];

  useEffect(() => {
    setIsClient(true);
    setIsVisible(true);
    
    const fetchStats = async () => {
      try {
        const response = await ApiService.getPublicStats();
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Erreur de chargement des statistiques:", error);
        setStats({ totalExperts: 1000, happyClients: '50k+', successRate: 95 });
      }
    };
    fetchStats();

    const interval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % textRotation.length);
    }, 3000);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleActionClick = (path: string) => {
    if (user) {
      router.push(path);
    } else {
      sessionStorage.setItem('returnUrl', path);
      router.push('/signin');
    }
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10"></div>
        
        {isClient && floatingElements.map((element) => (
          <div
            key={element.id}
            className="absolute rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-300/10 dark:to-purple-300/10 blur-xl animate-pulse"
            style={{
              width: element.size,
              height: element.size,
              left: `${element.left}%`,
              top: `${element.top}%`,
              animationDelay: `${element.delay}s`,
              animationDuration: `${element.duration}s`,
            }}
          />
        ))}

        {isClient && (
          <div
            className="absolute w-96 h-96 bg-gradient-to-br from-blue-500/30 to-purple-500/30 dark:from-blue-400/20 dark:to-purple-400/20 rounded-full blur-3xl transition-all duration-1000 ease-out"
            style={{
              left: mousePosition.x / 10,
              top: mousePosition.y / 10,
            }}
          />
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`space-y-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium shadow-sm backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>{stats ? `${stats.totalExperts}+ experts disponibles` : 'Chargement...'}</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  <span className="whitespace-nowrap">Connectez-vous avec</span>
                  <span className="text-3xl md:text-4xl lg:text-5xl block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative min-h-[4rem] md:min-h-[5rem] lg:min-h-[6rem]">
                    <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent blur-xs">{textRotation[currentText]}</span>
                    <span className="relative">{textRotation[currentText]}</span>
                  </span>
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                  DeepInfluence vous donne accès à une plateforme exclusive d'experts, influenceurs, et formateurs certifiés dans tous les domaines.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => handleActionClick('/experts')} className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-14 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <span className="relative z-10 flex items-center justify-center">
                    Trouver un Expert
                    <i className="ri-arrow-right-line ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <button onClick={() => handleActionClick('/dashboard/explorer')} className="group relative overflow-hidden border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 px-14 py-4 rounded-full text-lg font-semibold hover:bg-blue-600 dark:hover:bg-blue-400 hover:text-white transition-all duration-300 transform hover:scale-105">
                  <span className="relative z-10 flex items-center justify-center">
                    <i className="ri-play-circle-line mr-2 group-hover:scale-110 transition-transform duration-300"></i>
                    Voir les Vidéos
                  </span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-8">
                <div className="flex items-center space-x-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 flex-shrink-0">
                    <i className="ri-shield-check-line text-white text-lg"></i>
                  </div>
                  <div>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">Experts Vérifiés</span>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">100% authentifiés</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 flex-shrink-0">
                    <i className="ri-secure-payment-line text-white text-lg"></i>
                  </div>
                  <div>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">Paiement Sécurisé</span>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Transactions protégées</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 flex-shrink-0">
                    <i className="ri-customer-service-line text-white text-lg"></i>
                  </div>
                  <div>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">Support 24/7</span>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Toujours là pour aider</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats ? `${stats.totalExperts}+` : '...'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Experts Vérifiés</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats ? `${stats.happyClients}` : '...'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Clients Satisfaits</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats ? `${stats.successRate}%` : '...'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Taux de Réussite</div>
                </div>
              </div>
            </div>

            {/* Right side - Animated Illustrations */}
            <div className={`relative transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <div className="relative">
                {/* Main Hero Image */}
                <div className="rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-all duration-500">
                  <img
                    src="https://readdy.ai/api/search-image?query=Modern%20professional%20business%20consultation%20meeting%20with%20diverse%20team%2C%20high-tech%20office%20environment%2C%20natural%20lighting%2C%20contemporary%20design%2C%20confident%20business%20professionals%20collaborating%2C%20futuristic%20workspace%2C%20clean%20minimalist%20aesthetic%2C%20professional%20atmosphere%2C%20innovative%20technology%20integration&width=600&height=700&seq=hero-main-new&orientation=portrait"
                    alt="Professional consultation"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                </div>

                {/* Floating Cards */}
                <div className="absolute -top-8 -right-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20 dark:border-gray-700/20 animate-bounce">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <i className="ri-star-fill text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">5.0 Rating</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">from 2,847 reviews</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-8 -left-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20 dark:border-gray-700/20 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <i className="ri-message-2-fill text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Live Chat</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Available 24/7</p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 -left-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20 dark:border-gray-700/20 animate-bounce delay-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                      <i className="ri-shield-check-fill text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Verified</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">100% authentic</p>
                    </div>
                  </div>
                </div>

                {/* Animated Rings */}
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-blue-200 dark:border-blue-800 rounded-full animate-ping opacity-20"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-purple-200 dark:border-purple-800 rounded-full animate-ping opacity-30 delay-1000"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-pink-200 dark:border-pink-800 rounded-full animate-ping opacity-40 delay-2000"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-20 fill-white dark:fill-gray-900" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="animate-pulse"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="animate-pulse delay-1000"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="animate-pulse delay-2000"></path>
        </svg>
      </div>
    </section>
  );
}