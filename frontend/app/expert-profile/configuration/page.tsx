
'use client';

import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';

export default function ExpertConfigurationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // États pour les différentes sections
  const [expertInfo, setExpertInfo] = useState({
    name: 'Dr. Sarah Martin',
    specialty: 'Psychologue clinique',
    category: 'Santé & Bien-être',
    experience: '12 ans',
    languages: ['Français', 'Anglais', 'Espagnol'],
    bio: 'Psychologue clinique spécialisée en thérapie cognitivo-comportementale avec plus de 12 ans d\'expérience. Je vous accompagne dans votre développement personnel et professionnel.',
    education: [
      'Doctorat en Psychologie - Université de Paris',
      'Master en Psychologie Clinique - Sorbonne',
      'Formation en TCC - Institut Français'
    ],
    certifications: [
      'Psychologue clinicienne certifiée',
      'Spécialiste en TCC',
      'Coach professionnel certifié'
    ],
    skills: ['Thérapie individuelle', 'Coaching d\'équipe', 'Gestion du stress', 'Développement personnel']
  });

  const [pricing, setPricing] = useState({
    textMessage: 8,
    videoMessage: 20,
    videoCallPerMinute: 3
  });

  const [availability, setAvailability] = useState({
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: false, start: '10:00', end: '16:00' },
    sunday: { enabled: false, start: '10:00', end: '16:00' }
  });

  const [notifications, setNotifications] = useState({
    newBookings: true,
    cancellations: true,
    payments: true,
    reviews: true,
    messages: true,
    marketing: false
  });

  const [newFormation, setNewFormation] = useState({
    title: '',
    description: '',
    duration: '',
    price: '',
    level: 'beginner',
    category: '',
    type: 'live',
    maxStudents: '',
    sections: [{ title: '', content: '', duration: '' }]
  });

  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    duration: '',
    category: '',
    type: 'free',
    price: ''
  });

  const [referralCodes, setReferralCodes] = useState({
    expertCode: 'SARAH-EXP-2024',
    userCode: 'SARAH-USER-2024'
  });

  const [referralSettings, setReferralSettings] = useState({
    emailRequired: true,
    activationDelay: 48, // heures
    expertCommission: 5, // %
    userCommission: 2.5 // %
  });

  // Données mockées
  const stats = {
    totalEarnings: 15680,
    monthlyEarnings: 2340,
    totalSessions: 234,
    totalStudents: 1847,
    rating: 4.9,
    responseRate: 96,
    completionRate: 94,
    totalFormations: 12,
    totalVideos: 45,
    totalReferrals: 23,
    referralEarnings: 1200,
    expertReferrals: 8,
    userReferrals: 15
  };

  const recentActivity = [
    { id: 1, type: 'booking', title: 'Nouvelle réservation', user: 'Marie Dubois', time: '2 min' },
    { id: 2, type: 'payment', title: 'Paiement reçu', amount: '35 coins', time: '1h' },
    { id: 3, type: 'review', title: 'Nouvel avis', rating: 5, time: '3h' },
    { id: 4, type: 'message', title: 'Nouveau message', user: 'Pierre L.', time: '5h' }
  ];

  const formations = [
    {
      id: 1,
      title: 'Gestion du stress au travail',
      students: 145,
      maxStudents: 200,
      revenue: 2175,
      status: 'active',
      type: 'live',
      sessions: 8,
      sections: [
        { title: 'Introduction au stress', content: 'Comprendre les mécanismes du stress', duration: '1h30' },
        { title: 'Techniques de relaxation', content: 'Méthodes pratiques de gestion', duration: '2h' }
      ]
    },
    {
      id: 2,
      title: 'Développement de la confiance en soi',
      students: 89,
      maxStudents: 150,
      revenue: 1335,
      status: 'active',
      type: 'recorded',
      sessions: 12,
      sections: [
        { title: 'Bases de la confiance', content: 'Fondements psychologiques', duration: '1h' },
        { title: 'Exercices pratiques', content: 'Mise en application', duration: '1h30' }
      ]
    },
    {
      id: 3,
      title: 'Communication efficace',
      students: 67,
      maxStudents: 100,
      revenue: 1005,
      status: 'draft',
      type: 'live',
      sessions: 6,
      sections: [
        { title: 'Principes de communication', content: 'Théorie de base', duration: '1h' }
      ]
    }
  ];

  const videos = [
    {
      id: 1,
      title: 'Techniques de relaxation rapide',
      views: 2340,
      likes: 187,
      type: 'free',
      status: 'published'
    },
    {
      id: 2,
      title: 'Gérer l\'anxiété au quotidien',
      views: 1890,
      likes: 145,
      type: 'premium',
      price: 15,
      status: 'published'
    },
    {
      id: 3,
      title: 'Améliorer sa concentration',
      views: 0,
      likes: 0,
      type: 'free',
      status: 'draft'
    }
  ];

  const appointments = [
    {
      id: 1,
      user: 'Marie Dubois',
      date: '2024-01-16',
      time: '14:00',
      duration: 60,
      status: 'pending',
      type: 'video'
    },
    {
      id: 2,
      user: 'Pierre Laurent',
      date: '2024-01-16',
      time: '16:00',
      duration: 30,
      status: 'confirmed',
      type: 'video'
    },
    {
      id: 3,
      user: 'Sophie Martin',
      date: '2024-01-17',
      time: '10:00',
      duration: 45,
      status: 'confirmed',
      type: 'video'
    }
  ];

  const earnings = [
    { month: 'Janvier 2024', amount: 2340, sessions: 28, status: 'current' },
    { month: 'Décembre 2023', amount: 2180, sessions: 25, status: 'paid' },
    { month: 'Novembre 2023', amount: 1950, sessions: 23, status: 'paid' },
    { month: 'Octobre 2023', amount: 2250, sessions: 27, status: 'paid' }
  ];

  const referralHistory = [
    {
      id: 1,
      type: 'expert',
      name: 'Dr. Marc Dubois',
      email: 'marc.dubois@email.com',
      joinDate: '2024-01-10',
      status: 'active',
      earnings: 245,
      transactions: 12
    },
    {
      id: 2,
      type: 'user',
      name: 'Sophie Laurent',
      email: 'sophie.laurent@email.com',
      joinDate: '2024-01-08',
      status: 'active',
      earnings: 67,
      transactions: 8
    },
    {
      id: 3,
      type: 'expert',
      name: 'Marie Petit',
      email: 'marie.petit@email.com',
      joinDate: '2024-01-05',
      status: 'pending',
      earnings: 0,
      transactions: 0
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: 'ri-dashboard-line' },
    { id: 'bio', label: 'Bio', icon: 'ri-user-line' },
    { id: 'pricing', label: 'Tarifs', icon: 'ri-price-tag-line' },
    { id: 'formations', label: 'Formations', icon: 'ri-graduation-cap-line' },
    { id: 'videos', label: 'Vidéos', icon: 'ri-video-line' },
    { id: 'availability', label: 'Disponibilités', icon: 'ri-calendar-line' },
    { id: 'appointments', label: 'Rendez-vous', icon: 'ri-calendar-check-line' },
    { id: 'earnings', label: 'Gains', icon: 'ri-money-dollar-circle-line' },
    { id: 'commissions', label: 'Commissions', icon: 'ri-hand-coin-line' },
    { id: 'referral', label: 'Parrainage', icon: 'ri-share-line' },
    { id: 'statistics', label: 'Statistiques', icon: 'ri-bar-chart-line' },
    { id: 'settings', label: 'Paramètres', icon: 'ri-settings-line' }
  ];

  const handleSubmitFormation = () => {
    if (newFormation.title && newFormation.description && newFormation.maxStudents) {
      // Logique pour créer la formation
      setShowModal('');
      setNewFormation({
        title: '',
        description: '',
        duration: '',
        price: '',
        level: 'beginner',
        category: '',
        type: 'live',
        maxStudents: '',
        sections: [{ title: '', content: '', duration: '' }]
      });
    }
  };

  const handleSubmitVideo = () => {
    if (newVideo.title && newVideo.description) {
      // Logique pour créer la vidéo
      setShowModal('');
      setNewVideo({ title: '', description: '', duration: '', category: '', type: 'free', price: '' });
    }
  };

  const handleAppointmentAction = (appointmentId: number, action: string) => {
    console.log(`Action ${action} pour rendez-vous ${appointmentId}`);
  };

  const addFormationSection = () => {
    setNewFormation({
      ...newFormation,
      sections: [...newFormation.sections, { title: '', content: '', duration: '' }]
    });
  };

  const removeFormationSection = (index: number) => {
    const newSections = newFormation.sections.filter((_, i) => i !== index);
    setNewFormation({ ...newFormation, sections: newSections });
  };

  const updateFormationSection = (index: number, field: string, value: string) => {
    const newSections = [...newFormation.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setNewFormation({ ...newFormation, sections: newSections });
  };

  const generateReferralCode = (type: 'expert' | 'user') => {
    const newCode = `SARAH-${type.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setReferralCodes({
      ...referralCodes,
      [type === 'expert' ? 'expertCode' : 'userCode']: newCode
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/expert-profile" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
              <i className="ri-arrow-left-line text-gray-600"></i>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuration Expert</h1>
              <p className="text-gray-600 mt-2">Gérez votre profil expert et vos services</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="border-b p-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center space-x-2 ${
                    activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <i className={`${tab.icon} text-lg`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Gains totaux</p>
                        <p className="text-2xl font-bold">{stats.totalEarnings.toLocaleString('fr-FR')} coins</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                        <i className="ri-money-dollar-circle-line text-2xl"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Sessions totales</p>
                        <p className="text-2xl font-bold">{stats.totalSessions}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                        <i className="ri-calendar-check-line text-2xl"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Étudiants</p>
                        <p className="text-2xl font-bold">{stats.totalStudents.toLocaleString('fr-FR')}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
                        <i className="ri-group-line text-2xl"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Note moyenne</p>
                        <p className="text-2xl font-bold">{stats.rating}/5</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
                        <i className="ri-star-line text-2xl"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowModal('formation')}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <i className="ri-add-line"></i>
                        <span>Créer une formation</span>
                      </button>
                      <button
                        onClick={() => setShowModal('video')}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <i className="ri-video-add-line"></i>
                        <span>Ajouter une vidéo</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('availability')}
                        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                      >
                        <i className="ri-calendar-line"></i>
                        <span>Gérer les disponibilités</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
                    <div className="space-y-3">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                              activity.type === 'booking' ? 'bg-blue-500' :
                                activity.type === 'payment' ? 'bg-green-500' :
                                  activity.type === 'review' ? 'bg-yellow-500' : 'bg-purple-500'
                            }`}
                          >
                            <i
                              className={`${activity.type === 'booking' ? 'ri-calendar-line' :
                                activity.type === 'payment' ? 'ri-money-dollar-circle-line' :
                                  activity.type === 'review' ? 'ri-star-line' : 'ri-message-line'
                              } text-sm`}
                            ></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500">
                              {activity.user || activity.amount} • Il y a {activity.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bio' && (
              <div className="space-y-6">
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                      <input
                        type="text"
                        value={expertInfo.name}
                        onChange={(e) => setExpertInfo({ ...expertInfo, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Spécialité</label>
                      <input
                        type="text"
                        value={expertInfo.specialty}
                        onChange={(e) => setExpertInfo({ ...expertInfo, specialty: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                      <select
                        value={expertInfo.category}
                        onChange={(e) => setExpertInfo({ ...expertInfo, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                      >
                        <option value="Santé & Bien-être">Santé & Bien-être</option>
                        <option value="Business & Entrepreneuriat">Business & Entrepreneuriat</option>
                        <option value="Développement Personnel">Développement Personnel</option>
                        <option value="Marketing & Communication">Marketing & Communication</option>
                        <option value="Finance & Investissement">Finance & Investissement</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expérience</label>
                      <input
                        type="text"
                        value={expertInfo.experience}
                        onChange={(e) => setExpertInfo({ ...expertInfo, experience: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Biographie</h3>
                  <textarea
                    value={expertInfo.bio}
                    onChange={(e) => setExpertInfo({ ...expertInfo, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Décrivez votre parcours et votre approche..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Formation</h3>
                    <div className="space-y-3">
                      {expertInfo.education.map((edu, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <i className="ri-graduation-cap-line text-blue-600 mt-1"></i>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={edu}
                              onChange={(e) => {
                                const newEducation = [...expertInfo.education];
                                newEducation[index] = e.target.value;
                                setExpertInfo({ ...expertInfo, education: newEducation });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ))}
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                        <i className="ri-add-line"></i>
                        <span>Ajouter une formation</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
                    <div className="space-y-3">
                      {expertInfo.certifications.map((cert, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <i className="ri-award-line text-green-600 mt-1"></i>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={cert}
                              onChange={(e) => {
                                const newCertifications = [...expertInfo.certifications];
                                newCertifications[index] = e.target.value;
                                setExpertInfo({ ...expertInfo, certifications: newCertifications });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ))}
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1">
                        <i className="ri-add-line"></i>
                        <span>Ajouter une certification</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Compétences</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {expertInfo.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-2">
                        <span>{skill}</span>
                        <button
                          onClick={() => {
                            const newSkills = expertInfo.skills.filter((_, i) => i !== index);
                            setExpertInfo({ ...expertInfo, skills: newSkills });
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <i className="ri-close-line text-xs"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                    <i className="ri-add-line"></i>
                    <span>Ajouter une compétence</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarifs des services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <i className="ri-message-line text-white text-2xl"></i>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Réponse par message</h4>
                        <p className="text-sm text-gray-600">Format texte</p>
                      </div>
                      <div className="text-center mb-4">
                        <input
                          type="number"
                          value={pricing.textMessage}
                          onChange={(e) => setPricing({ ...pricing, textMessage: parseInt(e.target.value) })}
                          className="w-20 text-center text-2xl font-bold border-2 border-blue-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-sm text-gray-600 mt-1">coins par message</p>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1 mb-4">
                        <li>• Réponse détaillée par écrit</li>
                        <li>• Conseils personnalisés</li>
                        <li>• Suivi de conversation</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <i className="ri-video-line text-white text-2xl"></i>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Réponse par message</h4>
                        <p className="text-sm text-gray-600">Format vidéo</p>
                      </div>
                      <div className="text-center mb-4">
                        <input
                          type="number"
                          value={pricing.videoMessage}
                          onChange={(e) => setPricing({ ...pricing, videoMessage: parseInt(e.target.value) })}
                          className="w-20 text-center text-2xl font-bold border-2 border-green-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-sm text-gray-600 mt-1">coins par message</p>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1 mb-4">
                        <li>• Réponse vidéo personnalisée</li>
                        <li>• Explications détaillées</li>
                        <li>• Connexion plus humaine</li>
                        <li>• Durée: 2-5 minutes</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <i className="ri-vidicon-line text-white text-2xl"></i>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Rendez-vous en ligne</h4>
                        <p className="text-sm text-gray-600">Tarif par minute</p>
                      </div>
                      <div className="text-center mb-4">
                        <input
                          type="number"
                          value={pricing.videoCallPerMinute}
                          onChange={(e) => setPricing({ ...pricing, videoCallPerMinute: parseInt(e.target.value) })}
                          className="w-20 text-center text-2xl font-bold border-2 border-purple-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-sm text-gray-600 mt-1">coins par minute</p>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1 mb-4">
                        <li>• Consultation en temps réel</li>
                        <li>• Échange interactif</li>
                        <li>• Séance personnalisée</li>
                        <li>• Minimum 10 minutes</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres de tarification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Remise pour pack de sessions</label>
                      <input
                        type="number"
                        placeholder="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">% de remise pour 5 sessions ou plus</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Frais d\'annulation</label>
                      <input
                        type="number"
                        placeholder="25"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">% du tarif en cas d\'annulation tardive</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'formations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Mes formations</h3>
                  <button
                    onClick={() => setShowModal('formation')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <i className="ri-add-line"></i>
                    <span>Créer une formation</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {formations.map((formation) => (
                    <div key={formation.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            formation.status === 'active' ? 'bg-green-100 text-green-800' :
                              formation.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {formation.status === 'active' ? 'Actif' :
                            formation.status === 'draft' ? 'Brouillon' : 'En pause'}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            formation.type === 'live' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {formation.type === 'live' ? 'Live' : 'Enregistré'}
                        </span>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-2">{formation.title}</h4>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center justify-between">
                          <span>Étudiants:</span>
                          <span className="font-medium">{formation.students}/{formation.maxStudents}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(formation.students / formation.maxStudents) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Sessions:</span>
                          <span className="font-medium">{formation.sessions}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Sections:</span>
                          <span className="font-medium">{formation.sections.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Revenus:</span>
                          <span className="font-medium text-green-600">{formation.revenue.toLocaleString('fr-FR')} coins</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          Modifier
                        </button>
                        <button className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                          Statistiques
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Mes vidéos</h3>
                  <button
                    onClick={() => setShowModal('video')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <i className="ri-video-add-line"></i>
                    <span>Ajouter une vidéo</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <div key={video.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative">
                        <img
                          src={`https://readdy.ai/api/search-image?query=Professional%20therapy%20session%20or%20psychology%20consultation%2C%20calming%20environment%2C%20wellness%20and%20mental%20health%20theme&width=300&height=200&seq=video-${video.id}&orientation=landscape`}
                          alt={video.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              video.type === 'free' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {video.type === 'free' ? 'Gratuit' : `${video.price} coins`}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              video.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {video.status === 'published' ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{video.title}</h4>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <span className="flex items-center">
                            <i className="ri-eye-line mr-1"></i>
                            {video.views.toLocaleString('fr-FR')}
                          </span>
                          <span className="flex items-center">
                            <i className="ri-thumb-up-line mr-1"></i>
                            {video.likes.toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                            Modifier
                          </button>
                          <button className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                            Stats
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'availability' && (
              <div className="space-y-6">
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Disponibilités hebdomadaires</h3>
                  <div className="space-y-4">
                    {Object.entries(availability).map(([day, schedule]) => (
                      <div key={day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-24">
                          <span className="font-medium text-gray-900 capitalize">
                            {day === 'monday' ? 'Lundi' :
                              day === 'tuesday' ? 'Mardi' :
                                day === 'wednesday' ? 'Mercredi' :
                                  day === 'thursday' ? 'Jeudi' :
                                    day === 'friday' ? 'Vendredi' :
                                      day === 'saturday' ? 'Samedi' : 'Dimanche'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={schedule.enabled}
                              onChange={(e) => setAvailability({
                                ...availability,
                                [day]: { ...schedule, enabled: e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        {schedule.enabled && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">De</span>
                            <input
                              type="time"
                              value={schedule.start}
                              onChange={(e) => setAvailability({
                                ...availability,
                                [day]: { ...schedule, start: e.target.value }
                              })}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">à</span>
                            <input
                              type="time"
                              value={schedule.end}
                              onChange={(e) => setAvailability({
                                ...availability,
                                [day]: { ...schedule, end: e.target.value }
                              })}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration avancée</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Durée minimum (minutes)</label>
                      <input
                        type="number"
                        defaultValue="30"
                        min="15"
                        max="180"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Temps de pause (minutes)</label>
                      <input
                        type="number"
                        defaultValue="15"
                        min="0"
                        max="60"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Réservation à l\'avance (jours)</label>
                      <input
                        type="number"
                        defaultValue="7"
                        min="1"
                        max="90"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maximum par jour</label>
                      <input
                        type="number"
                        defaultValue="8"
                        min="1"
                        max="20"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Gestion des rendez-vous</h3>
                  <div className="flex space-x-2">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      En attente ({appointments.filter((a: any) => a.status === 'pending').length})
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Confirmés ({appointments.filter((a: any) => a.status === 'confirmed').length})
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="bg-white border rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <i className="ri-user-line text-blue-600"></i>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{appointment.user}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(appointment.date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })} à {appointment.time}
                            </p>
                            <p className="text-sm text-gray-500">
                              Durée: {appointment.duration} minutes • {appointment.type === 'video' ? 'Vidéo' : 'Audio'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                            }`}
                          >
                            {appointment.status === 'pending' ? 'En attente' :
                              appointment.status === 'confirmed' ? 'Confirmé' : 'Refusé'}
                          </span>
                          {appointment.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'accept')}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                Accepter
                              </button>
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'reschedule')}
                                className="bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                              >
                                Reporter
                              </button>
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'decline')}
                                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm"
                              >
                                Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Gains totaux</p>
                        <p className="text-2xl font-bold">{stats.totalEarnings.toLocaleString('fr-FR')} coins</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                        <i className="ri-money-dollar-circle-line text-2xl"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Ce mois</p>
                        <p className="text-2xl font-bold">{stats.monthlyEarnings.toLocaleString('fr-FR')} coins</p>
                      </div>
                      <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                        <i className="ri-calendar-line text-2xl"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Gains moyens</p>
                        <p className="text-2xl font-bold">{Math.round(stats.totalEarnings / stats.totalSessions)} coins</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
                        <i className="ri-bar-chart-line text-2xl"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des gains</h3>
                  <div className="space-y-4">
                    {earnings.map((earning, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{earning.month}</h4>
                          <p className="text-sm text-gray-600">{earning.sessions} sessions</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{earning.amount.toLocaleString('fr-FR')} coins</p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              earning.status === 'paid' ? 'bg-green-100 text-green-800' :
                                earning.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {earning.status === 'paid' ? 'Payé' :
                              earning.status === 'pending' ? 'En attente' : 'Actuel'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'commissions' && (
              <div className="space-y-6">
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Structure des commissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Services standards</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Messages et appels:</span>
                          <span className="font-medium">15%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Formations:</span>
                          <span className="font-medium">20%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vidéos premium:</span>
                          <span className="font-medium">10%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Parrainage</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Premier niveau:</span>
                          <span className="font-medium">5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Deuxième niveau:</span>
                          <span className="font-medium">2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bonus inscription:</span>
                          <span className="font-medium">50 coins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Calcul des gains</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Exemple de calcul</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Consultation 60 min à 35 coins/min:</span>
                          <span>2100 coins</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Commission plateforme (15%):</span>
                          <span>-315 coins</span>
                        </div>
                        <div className="flex justify-between font-medium text-green-600">
                          <span>Vos gains:</span>
                          <span>1785 coins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'referral' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Programme de parrainage</h3>
                      <p className="text-purple-100">Invitez des experts et utilisateurs et gagnez des commissions</p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <i className="ri-share-line text-3xl"></i>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Code de parrainage - Experts</h3>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-1 bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                        <p className="text-2xl font-bold text-center text-green-600">{referralCodes.expertCode}</p>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(referralCodes.expertCode)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Copier
                      </button>
                    </div>
                    <div className="text-center mb-4">
                      <button
                        onClick={() => generateReferralCode('expert')}
                        className="text-green-600 hover:text-green-700 text-sm"
                      >
                        Générer un nouveau code
                      </button>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Commission: {referralSettings.expertCommission}%</h4>
                      <p className="text-sm text-green-700">Gagnez {referralSettings.expertCommission}% sur toutes les transactions des experts parrainés</p>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Code de parrainage - Utilisateurs</h3>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                        <p className="text-2xl font-bold text-center text-blue-600">{referralCodes.userCode}</p>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(referralCodes.userCode)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Copier
                      </button>
                    </div>
                    <div className="text-center mb-4">
                      <button
                        onClick={() => generateReferralCode('user')}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Générer un nouveau code
                      </button>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Commission: {referralSettings.userCommission}%</h4>
                      <p className="text-sm text-blue-700">Gagnez {referralSettings.userCommission}% sur toutes les transactions des utilisateurs parrainés</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres de parrainage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={referralSettings.emailRequired}
                          onChange={(e) => setReferralSettings({ ...referralSettings, emailRequired: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Email requis pour le parrainage</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">L\'utilisateur doit fournir un email valide</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Délai d\'activation (heures)</label>
                      <input
                        type="number"
                        value={referralSettings.activationDelay}
                        onChange={(e) => setReferralSettings({ ...referralSettings, activationDelay: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Temps avant activation du parrainage après inscription</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-vip-crown-line text-green-600 text-xl"></i>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-1">{stats.expertReferrals}</h4>
                    <p className="text-gray-600">Experts parrainés</p>
                  </div>

                  <div className="bg-white border rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-group-line text-blue-600 text-xl"></i>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-1">{stats.userReferrals}</h4>
                    <p className="text-gray-600">Utilisateurs parrainés</p>
                  </div>

                  <div className="bg-white border rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-money-dollar-circle-line text-purple-600 text-xl"></i>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-1">{stats.referralEarnings.toLocaleString('fr-FR')}</h4>
                    <p className="text-gray-600">Gains du parrainage</p>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des parrainages</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Nom</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Date d\'inscription</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Gains</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralHistory.map((referral) => (
                          <tr key={referral.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  referral.type === 'expert' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {referral.type === 'expert' ? 'Expert' : 'Utilisateur'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-900">{referral.name}</td>
                            <td className="py-3 px-4 text-gray-600">{referral.email}</td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(referral.joinDate).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  referral.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {referral.status === 'active' ? 'Actif' : 'En attente'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-green-600">
                              {referral.earnings.toLocaleString('fr-FR')} coins
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'statistics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white border rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-chat-check-line text-blue-600 text-xl"></i>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-1">{stats.responseRate}%</h4>
                    <p className="text-gray-600">Taux de réponse</p>
                  </div>

                  <div className="bg-white border rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-check-double-line text-green-600 text-xl"></i>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-1">{stats.completionRate}%</h4>
                    <p className="text-gray-600">Taux de complétion</p>
                  </div>

                  <div className="bg-white border rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-star-line text-purple-600 text-xl"></i>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-1">{stats.rating}</h4>
                    <p className="text-gray-600">Note moyenne</p>
                  </div>

                  <div className="bg-white border rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-trending-up-line text-orange-600 text-xl"></i>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-1">+12%</h4>
                    <p className="text-gray-600">Croissance mensuelle</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance par service</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Messages</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <span className="text-sm font-medium">85%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Appels vidéo</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                          </div>
                          <span className="text-sm font-medium">92%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Formations</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                          </div>
                          <span className="text-sm font-medium">78%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des gains</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Janvier</span>
                        <span className="font-medium text-green-600">+15%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Décembre</span>
                        <span className="font-medium text-green-600">+8%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Novembre</span>
                        <span className="font-medium text-red-600">-3%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Octobre</span>
                        <span className="font-medium text-green-600">+12%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <label className="font-medium text-gray-900">
                            {key === 'newBookings' ? 'Nouvelles réservations' :
                              key === 'cancellations' ? 'Annulations' :
                                key === 'payments' ? 'Paiements' :
                                  key === 'reviews' ? 'Avis' :
                                    key === 'messages' ? 'Messages' : 'Marketing'}
                          </label>
                          <p className="text-sm text-gray-600">
                            {key === 'newBookings' ? 'Être notifié des nouvelles demandes' :
                              key === 'cancellations' ? 'Notifications d\'annulation' :
                                key === 'payments' ? 'Confirmations de paiement' :
                                  key === 'reviews' ? 'Nouveaux avis clients' :
                                    key === 'messages' ? 'Nouveaux messages' : 'Offres et promotions'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email professionnel</label>
                      <input
                        type="email"
                        defaultValue="sarah.martin@email.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        defaultValue="+33 6 12 34 56 78"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                      <input
                        type="url"
                        placeholder="https://www.monsite.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/sarah-martin"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">Zone dangereuse</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                      <div>
                        <h4 className="font-medium text-gray-900">Suspendre le profil expert</h4>
                        <p className="text-sm text-gray-600">Désactiver temporairement votre profil</p>
                      </div>
                      <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                        Suspendre
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                      <div>
                        <h4 className="font-medium text-gray-900">Supprimer le profil expert</h4>
                        <p className="text-sm text-gray-600">Suppression définitive du profil expert</p>
                      </div>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Formation */}
      {showModal === 'formation' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Créer une formation</h3>
              <button
                onClick={() => setShowModal('')}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre de la formation</label>
                  <input
                    type="text"
                    value={newFormation.title}
                    onChange={(e) => setNewFormation({ ...newFormation, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Gestion du stress au travail"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre maximum d'inscrits</label>
                  <input
                    type="number"
                    value={newFormation.maxStudents}
                    onChange={(e) => setNewFormation({ ...newFormation, maxStudents: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newFormation.description}
                  onChange={(e) => setNewFormation({ ...newFormation, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez votre formation..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durée totale</label>
                  <input
                    type="text"
                    value={newFormation.duration}
                    onChange={(e) => setNewFormation({ ...newFormation, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 8 heures"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix (coins)</label>
                  <input
                    type="number"
                    value={newFormation.price}
                    onChange={(e) => setNewFormation({ ...newFormation, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
                  <select
                    value={newFormation.level}
                    onChange={(e) => setNewFormation({ ...newFormation, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  >
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Sections de la formation</h4>
                  <button
                    onClick={addFormationSection}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
                  >
                    <i className="ri-add-line"></i>
                    <span>Ajouter une section</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {newFormation.sections.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">Section {index + 1}</h5>
                        {newFormation.sections.length > 1 && (
                          <button
                            onClick={() => removeFormationSection(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateFormationSection(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Titre de la section"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                          <input
                            type="text"
                            value={section.content}
                            onChange={(e) => updateFormationSection(index, 'content', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Description du contenu"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                          <input
                            type="text"
                            value={section.duration}
                            onChange={(e) => updateFormationSection(index, 'duration', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 1h30"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setShowModal('')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitFormation}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer la formation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vidéo */}
      {showModal === 'video' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Ajouter une vidéo</h3>
              <button
                onClick={() => setShowModal('')}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre de la vidéo</label>
                <input
                  type="text"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Techniques de relaxation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez votre vidéo..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durée</label>
                  <input
                    type="text"
                    value={newVideo.duration}
                    onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 05:30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                  <input
                    type="text"
                    value={newVideo.category}
                    onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Relaxation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newVideo.type}
                    onChange={(e) => setNewVideo({ ...newVideo, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  >
                    <option value="free">Gratuit</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                {newVideo.type === 'premium' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prix (coins)</label>
                    <input
                      type="number"
                      value={newVideo.price}
                      onChange={(e) => setNewVideo({ ...newVideo, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="15"
                    />
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Fichier vidéo</h4>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
                  <i className="ri-upload-cloud-line text-4xl text-blue-400 mb-2"></i>
                  <p className="text-blue-600 mb-2">Cliquez pour télécharger ou glissez-déposez</p>
                  <p className="text-sm text-blue-500">MP4, MOV, AVI jusqu\'à 500MB</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setShowModal('')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitVideo}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
              >
                Ajouter la vidéo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-error-warning-line text-red-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer le profil expert</h3>
                <p className="text-gray-600 text-sm">Cette action est irréversible</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement votre profil expert ? Toutes vos données seront perdues.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
