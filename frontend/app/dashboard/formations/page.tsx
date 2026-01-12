'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import FormationCard from '@/components/FormationCard';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import ApiService, { Formation } from '../../../services/api';
import Link from 'next/link';

// Composant réutilisable pour les cartes de statistiques
const StatCard = ({ icon, color, label, value }: { icon: string, color: string, label: string, value: string | number }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
            <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg flex items-center justify-center`}>
                <i className={`${icon} text-${color}-600 dark:text-${color}-400 text-xl`}></i>
            </div>
        </div>
    </div>
);

export default function FormationsPage() {
    const [formations, setFormations] = useState<Formation[]>([]);
    const [enrolledFormations, setEnrolledFormations] = useState<Formation[]>([]);
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [activeTab, setActiveTab] = useState('all');
    const [expertTab, setExpertTab] = useState<'created'|'enrolled'>('created');
    const [searchTerm, setSearchTerm] = useState('');

    const { user, isLoading: isAuthLoading } = useAuth();
    const socket = useSocket();
    const { formatPrice } = useCurrency();
    const router = useRouter();
    const downloadAllEnrollments = async () => {
        try {
            const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const resp = await fetch(`${base}/formations/enrollments/export.csv`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined
            });
            if (!resp.ok) throw new Error('Export impossible');
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `formations_inscrits_tous.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            alert(e?.message || 'Erreur export CSV');
        }
    };

    useEffect(() => {
        if (!isAuthLoading) {
            if (!user) {
                router.push('/signin');
            } else {
                loadPageData();
            }
        }
    }, [user, isAuthLoading, router]);

    const loadPageData = async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const formationPromise = user.userType === 'expert'
                ? Promise.all([ApiService.getExpertFormations(), ApiService.getEnrolledFormations()])
                : ApiService.getEnrolledFormations();

            const statsPromise = user.userType === 'expert'
                ? ApiService.getExpertDashboardStats()
                : ApiService.getUserStats();

            const [statsResponse, formationsResponse] = await Promise.all([
                statsPromise,
                formationPromise
            ]);

            if (statsResponse.success && statsResponse.data){
                setStatsData(statsResponse.data);
            }

            if (user.userType === 'expert') {
                const [createdResp, enrolledResp]: any = formationsResponse;
                if (createdResp?.success) {
                    const createdList = (createdResp.data.formations || []).map((f: any) => ({ ...f, isOwner: true }));
                    setFormations(createdList);
                } else setFormations([]);
                if (enrolledResp?.success) {
                    const enr = enrolledResp.data.map((enrollment: any) => ({
                        ...enrollment.formation,
                        isEnrolled: true,
                        progress: enrollment.progress,
                        completed: enrollment.completed,
                    }));
                    setEnrolledFormations(enr);
                } else setEnrolledFormations([]);
            } else {
                if (formationsResponse.success) {
                    const formationList = formationsResponse.data.map((enrollment: any) => ({
                        ...enrollment.formation,
                        isEnrolled: true,
                        progress: enrollment.progress,
                        completed: enrollment.completed,
                    }));
                    setFormations(formationList);
                } else setFormations([]);
            }
        } catch (err) {
            setError("Une erreur est survenue lors du chargement des données.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Mise à jour en temps réel après inscription
    useEffect(() => {
        if (!socket) return;
        const handler = () => { if (user?.userType === 'user') loadPageData(); };
        socket.on('formationEnrolled', handler);
        const handlerExpert = () => { if (user?.userType === 'expert') loadPageData(); };
        socket.on('formationEnrollmentCreated', handlerExpert);
        return () => {
            socket.off('formationEnrolled', handler);
            socket.off('formationEnrollmentCreated', handlerExpert);
        };
    }, [socket, user]);
    
    const sourceList = user?.userType === 'expert' ? (expertTab === 'created' ? formations : enrolledFormations) : formations;
    const filteredFormations = sourceList.filter((f: any) => {
        const matchesFilter = activeTab === 'all' || 
            (user?.userType === 'user' ? (activeTab === 'in-progress' ? !f.completed : f.completed) : f.type === activeTab);
        const matchesSearch = !searchTerm || f.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (isAuthLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    // Vue pour les Experts
    if (user.userType === 'expert') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <AppHeader />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Formations</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Gérez toutes les formations que vous avez créées.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/dashboard/formations/create" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <i className="ri-add-line mr-2"></i>Créer une formation
                            </Link>
                            {expertTab === 'created' && (
                                <button onClick={downloadAllEnrollments} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                                    Exporter tous les inscrits
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="inline-flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                            <button onClick={() => setExpertTab('created')} className={`px-4 py-2 rounded-md text-sm font-medium ${expertTab === 'created' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Mes formations</button>
                            <button onClick={() => setExpertTab('enrolled')} className={`px-4 py-2 rounded-md text-sm font-medium ${expertTab === 'enrolled' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Mes inscriptions</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard icon="ri-group-line" color="green" label="Total Étudiants" value={statsData?.totalStudents ?? 0} />
                        <StatCard icon="ri-money-euro-circle-line" color="yellow" label="Revenus (Formations)" value={formatPrice(statsData?.formationRevenue ?? 0)} />
                        <StatCard icon="ri-star-line" color="purple" label="Note Moyenne" value={`${statsData?.averageRating ?? 0}/5`} />
                        <StatCard icon="ri-book-open-line" color="blue" label="Formations Actives" value={formations.length} />
                    </div>
                    
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full md:w-auto">
                                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Rechercher par titre..."
                                    className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800"
                                />
                            </div>
                            <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                                <button onClick={() => setActiveTab('all')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'all' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Toutes</button>
                                <button onClick={() => setActiveTab('live')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'live' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>En direct</button>
                                <button onClick={() => setActiveTab('presentiel')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'presentiel' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Présentiel</button>
                            </div>
                        </div>
                    </div>

                    {loading ? <p>Chargement...</p> : error ? <p className="text-red-500">{error}</p> : (
                        filteredFormations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredFormations.map((f: any) => <FormationCard key={f.id} formation={f} ownerActions={expertTab === 'created'} />)}
                            </div>
                        ) : (
                            <div className="text-center py-16"><p className="text-gray-500">Aucune formation ne correspond à vos filtres.</p></div>
                        )
                    )}
                </main>
            </div>
        );
    }

    // Vue pour les Utilisateurs Standards
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AppHeader />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Mes Formations</h1>
                    <p className="text-xl text-gray-600 mt-4 max-w-3xl mx-auto">Suivez votre progression et accédez à toutes vos formations inscrites.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard icon="ri-book-open-line" color="green" label="Formations suivies" value={statsData?.formationsFollowed ?? 0} />
                    <StatCard icon="ri-time-line" color="yellow" label="Heures d'apprentissage" value={`${statsData?.learningHours ?? 0}h`} />
                    <StatCard icon="ri-award-line" color="purple" label="Certificats Obtenus" value={formations.filter((f: any) => f.completed).length} />
                    <StatCard icon="ri-line-chart-line" color="blue" label="Progression Moyenne" value={`${Math.round(formations.reduce((acc, f) => acc + (f.progress || 0), 0) / (formations.length || 1))}%`} />
                </div>

                <div className="mb-8">
                    <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg max-w-md mx-auto">
                        <button onClick={() => setActiveTab('all')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'all' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Inscrites ({formations.length})</button>
                        <button onClick={() => setActiveTab('in-progress')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'in-progress' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>En cours ({formations.filter((f: any) => !f.completed).length})</button>
                        <button onClick={() => setActiveTab('completed')} className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'completed' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>Terminées ({formations.filter((f: any) => f.completed).length})</button>
                    </div>
                </div>

                {loading ? <p>Chargement...</p> : error ? <p className="text-red-500">{error}</p> : (
                    filteredFormations.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredFormations.map((f: any) => <FormationCard key={f.id} formation={f} />)}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-gray-500">{activeTab === 'all' ? "Vous n'êtes inscrit à aucune formation." : `Vous n'avez aucune formation ${activeTab === 'completed' ? 'terminée' : 'en cours'}.`}</p>
                            <Link href="/formations" className="mt-4 inline-block text-blue-600 font-semibold">Parcourir le catalogue →</Link>
                        </div>
                    )
                )}
            </main>
        </div>
    );
}
