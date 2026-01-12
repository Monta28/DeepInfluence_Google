'use client';

import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import VideoCard from '@/components/VideoCard';

export default function ExperioPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const videos = [
    {
      id: 1,
      title: 'Les 3 clés du succès en business',
      expert: 'Dr. Sarah Martinez',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20businesswoman%20portrait%2C%20confident%20female%20business%20strategist%2C%20modern%20business%20attire%2C%20professional%20headshot%2C%20clean%20background%2C%20trustworthy%20appearance&width=60&height=60&seq=experio-sarah-001&orientation=squarish',
      thumbnail: 'https://readdy.ai/api/search-image?query=Professional%20business%20success%20presentation%2C%20modern%20office%20background%2C%20business%20strategy%20visual%2C%20clean%20professional%20environment%2C%20success%20concept%20illustration%2C%20contemporary%20business%20setting&width=300&height=400&seq=video-business-001&orientation=portrait',
      category: 'business',
      duration: '2:45',
      views: '12.3K',
      likes: 892,
      isLiked: false,
      description: 'Découvrez les 3 stratégies essentielles pour réussir en business moderne...'
    },
    {
      id: 2,
      title: 'Comment gérer le stress au quotidien',
      expert: 'Marie Lefebvre',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20wellness%20coach%20portrait%2C%20confident%20female%20wellness%20expert%2C%20modern%20professional%20attire%2C%20professional%20headshot%2C%20clean%20background%2C%20trustworthy%20appearance&width=60&height=60&seq=experio-marie-001&orientation=squarish',
      thumbnail: 'https://readdy.ai/api/search-image?query=Stress%20management%20wellness%20session%2C%20peaceful%20meditation%20environment%2C%20calming%20atmosphere%2C%20wellness%20coaching%20setting%2C%20serene%20background%2C%20mindfulness%20concept%2C%20relaxation%20techniques&width=300&height=400&seq=video-wellness-001&orientation=portrait',
      category: 'bien-etre',
      duration: '3:12',
      views: '8.7K',
      likes: 654,
      isLiked: true,
      description: 'Techniques efficaces pour gérer le stress et retrouver votre équilibre...'
    },
    {
      id: 3,
      title: 'Marketing digital : tendances 2024',
      expert: 'Thomas Dubois',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20businessman%20portrait%2C%20confident%20male%20marketing%20expert%2C%20modern%20business%20attire%2C%20professional%20headshot%2C%20clean%20background%2C%20trustworthy%20appearance&width=60&height=60&seq=experio-thomas-001&orientation=squarish',
      thumbnail: 'https://readdy.ai/api/search-image?query=Digital%20marketing%20trends%20presentation%2C%20modern%20marketing%20workspace%2C%20social%20media%20strategy%20visual%2C%20contemporary%20marketing%20environment%2C%20digital%20innovation%20concept%2C%20creative%20marketing%20setting&width=300&height=400&seq=video-marketing-001&orientation=portrait',
      category: 'marketing',
      duration: '4:28',
      views: '15.2K',
      likes: 1205,
      isLiked: false,
      description: 'Les tendances marketing qui vont dominer 2024 et comment les utiliser...'
    },
    {
      id: 4,
      title: 'IA et automatisation : le futur',
      expert: 'Alexandre Chen',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20technology%20expert%20portrait%2C%20confident%20male%20tech%20specialist%2C%20modern%20business%20attire%2C%20professional%20headshot%2C%20clean%20background%2C%20trustworthy%20appearance&width=60&height=60&seq=experio-alex-001&orientation=squarish',
      thumbnail: 'https://readdy.ai/api/search-image?query=Artificial%20intelligence%20technology%20presentation%2C%20modern%20tech%20workspace%2C%20AI%20innovation%20concept%2C%20futuristic%20technology%20environment%2C%20digital%20transformation%20visual%2C%20contemporary%20tech%20setting&width=300&height=400&seq=video-tech-001&orientation=portrait',
      category: 'technologie',
      duration: '5:15',
      views: '22.1K',
      likes: 1876,
      isLiked: true,
      description: 'Comment l\'IA transforme notre façon de travailler et les opportunités...'
    },
    {
      id: 5,
      title: 'Investir intelligemment en 2024',
      expert: 'Dr. Emma Wilson',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20finance%20expert%20portrait%2C%20confident%20female%20financial%20advisor%2C%20modern%20business%20attire%2C%20professional%20headshot%2C%20clean%20background%2C%20trustworthy%20appearance&width=60&height=60&seq=experio-emma-001&orientation=squarish',
      thumbnail: 'https://readdy.ai/api/search-image?query=Financial%20investment%20strategy%20presentation%2C%20modern%20finance%20office%2C%20investment%20planning%20visual%2C%20professional%20financial%20environment%2C%20wealth%20management%20concept%2C%20contemporary%20finance%20setting&width=300&height=400&seq=video-finance-001&orientation=portrait',
      category: 'finance',
      duration: '3:54',
      views: '18.9K',
      likes: 1432,
      isLiked: false,
      description: 'Stratégies d\'investissement adaptées au climat économique actuel...'
    },
    {
      id: 6,
      title: 'Nutrition optimale pour performers',
      expert: 'Lucas Martin',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20fitness%20coach%20portrait%2C%20confident%20male%20wellness%20expert%2C%20modern%20athletic%20attire%2C%20professional%20headshot%2C%20clean%20background%2C%20trustworthy%20appearance&width=60&height=60&seq=experio-lucas-001&orientation=squarish',
      thumbnail: 'https://readdy.ai/api/search-image?query=Fitness%20nutrition%20coaching%20session%2C%20healthy%20lifestyle%20environment%2C%20sports%20nutrition%20concept%2C%20wellness%20coaching%20setting%2C%20athletic%20performance%20visual%2C%20modern%20fitness%20environment&width=300&height=400&seq=video-fitness-001&orientation=portrait',
      category: 'bien-etre',
      duration: '2:33',
      views: '9.4K',
      likes: 712,
      isLiked: false,
      description: 'Les secrets d\'une nutrition optimale pour améliorer vos performances...'
    },
    {
      id: 7,
      title: 'Leadership moderne et équipes',
      expert: 'Dr. Sarah Martinez',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20businesswoman%20portrait%2C%20confident%20female%20business%20strategist%2C%20modern%20business%20attire%2C%20professional%20headshot%2C%20clean%20background%2C%20trustworthy%20appearance&width=60&height=60&seq=experio-sarah-002&orientation=squarish',
      thumbnail: 'https://readdy.ai/api/search-image?query=Modern%20leadership%20training%20session%2C%20team%20management%20concept%2C%20professional%20leadership%20environment%2C%20contemporary%20workplace%2C%20leadership%20development%20visual%2C%20business%20team%20setting&width=300&height=400&seq=video-leadership-001&orientation=portrait',
      category: 'business',
      duration: '4:07',
      views: '11.8K',
      likes: 923,
      isLiked: true,
      description: 'Comment devenir un leader inspirant dans le monde du travail moderne...'
    },
    {
      id: 8,
      title: 'Méditation pour entrepreneurs',
      expert: 'Marie Lefebvre',
      avatar: 'https://readdy.ai/api/search-image?query=Professional%20wellness%20coach%20portrait%2C%20confident%20female%20wellness%20expert%2C%20modern%20professional%20attire%2C%20professional%20headshot%2C%20clean%20background%2C%20trustworthy%20appearance&width=60&height=60&seq=experio-marie-002&orientation=squarish',
      thumbnail: 'https://readdy.ai/api/search-image?query=Meditation%20for%20entrepreneurs%20session%2C%20peaceful%20business%20environment%2C%20mindfulness%20in%20workplace%2C%20serene%20professional%20setting%2C%20wellness%20for%20business%2C%20contemporary%20meditation%20space&width=300&height=400&seq=video-meditation-001&orientation=portrait',
      category: 'bien-etre',
      duration: '3:22',
      views: '7.3K',
      likes: 567,
      isLiked: false,
      description: 'Techniques de méditation spécialement adaptées aux entrepreneurs...'
    }
  ];

  const categories = [
    { id: 'all', name: 'Pour vous', icon: 'ri-heart-line' },
    { id: 'business', name: 'Business', icon: 'ri-briefcase-line' },
    { id: 'bien-etre', name: 'Bien-être', icon: 'ri-heart-pulse-line' },
    { id: 'marketing', name: 'Marketing', icon: 'ri-megaphone-line' },
    { id: 'technologie', name: 'Tech', icon: 'ri-code-line' },
    { id: 'finance', name: 'Finance', icon: 'ri-money-dollar-circle-line' }
  ];

  const filteredVideos = selectedCategory === 'all' 
    ? videos 
    : videos.filter((video: any) => video.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Experio
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Découvrez des vidéos courtes et inspirantes de nos experts. 
            Apprenez, inspirez-vous et développez vos compétences en quelques minutes.
          </p>
        </div>

        <div className="flex space-x-4 mb-8 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`${category.icon}`}></i>
              </div>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">
              Devenez un expert sur Experio
            </h2>
            <p className="text-gray-300 mb-6">
              Partagez votre expertise avec notre communauté et générez des revenus supplémentaires.
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap">
              Créer du contenu
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}