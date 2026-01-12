'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import ApiService from '../../../services/api';

// Composant réutilisable pour les cartes de statistiques
const StatCard = ({ label, value, icon }: { label: string, value: string | number, icon: string }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
            <i className={`${icon} text-blue-600 dark:text-blue-400 text-2xl`}></i>
        </div>
    </div>
);

const FileInput = ({ label, file, onFileChange, id }: { label: string, file: File | null, onFileChange: (file: File | null) => void, id: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <div className="flex items-center space-x-4">
            <input type="file" id={id} onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)} accept="image/*,.pdf" className="hidden" />
            <label htmlFor={id} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-sm rounded-lg cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                Choisir un fichier
            </label>
            {file && <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{file.name}</span>}
        </div>
    </div>
);

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { user, updateUser, isLoading: isAuthLoading } = useAuth();
    const { formatPrice, currency } = useCurrency();
    const router = useRouter();

    const [userInfo, setUserInfo] = useState({
        firstName: '', lastName: '', email: '', phone: '', bio: '', location: ''
    });
    const [expertInfo, setExpertInfo] = useState({
        specialty: '', hourlyRate: 0, pricePerMessage: 0, tags: [] as string[], languages: [] as string[], category: ''
    });
    const [userStats, setUserStats] = useState<any>(null);
    
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarFileUrl, setAvatarFileUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '');

    const userAvatarCandidates = useMemo(() => {
        const list: string[] = [];
        if (backendBase && user?.id) {
            list.push(`${backendBase}/api/assets/users/${user.id}`);
            ;['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/users/${user.id}.${ext}`));
            // Si l'utilisateur est un expert, certaines installations stockent la photo sous experts/<userId>
            list.push(`${backendBase}/api/assets/experts/${user.id}`);
            ;['jpg','jpeg','png','webp'].forEach(ext => list.push(`${backendBase}/images/experts/${user.id}.${ext}`));
        }
        if (user?.avatar) {
            const raw = String(user?.avatar).replace(/\\/g, '/');
            if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) list.push(raw);
            else if (backendBase) list.push(raw.startsWith('/') ? `${backendBase}${raw}` : `${backendBase}/${raw}`);
            else list.push(raw);
        }
        const name = `${user?.firstName||''} ${user?.lastName||''}`.trim();
        list.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(name||'User')}&size=96`);
        return Array.from(new Set(list));
    }, [backendBase, user?.id, user?.avatar, user?.firstName, user?.lastName]);
    const [avatarIdx, setAvatarIdx] = useState(0);
    useEffect(() => { setAvatarIdx(0); }, [user?.id, user?.avatar, backendBase]);

    const isFormValid = () => {
        const isUserPartValid = userInfo.phone && userInfo.location && userInfo.bio;
        if (user?.userType !== 'expert') return isUserPartValid;
        const isExpertPartValid = expertInfo.specialty && expertInfo.category && expertInfo.hourlyRate > 0;
        return isUserPartValid && isExpertPartValid;
    };

    const [docType, setDocType] = useState('CIN');
    const [docFront, setDocFront] = useState<File | null>(null);
    const [docBack, setDocBack] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);
    const [bankDetails, setBankDetails] = useState('');
    const [bankDocument, setBankDocument] = useState<File | null>(null);

    const isVerificationFormValid = docType && docFront && selfie && bankDetails && bankDocument && (docType === 'PASSPORT' || docBack);
    
    useEffect(() => {
        if (!isAuthLoading) {
            if (!user) { router.push('/signin'); return; }
            if (!user.profileCompleted) { setIsEditing(true); setActiveTab('personal'); }
            setUserInfo({
                firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: user.phone || '', bio: user.bio || '', location: user.location || ''
            });
            // Avatar actuel affiché via userAvatarCandidates
            if (user.userType === 'expert' && user.expert) {
                setExpertInfo({
                    specialty: user.expert.specialty || '',
                    hourlyRate: user.expert.hourlyRate || 0,
                    pricePerMessage: user.expert.pricePerMessage || 0,
                    tags: Array.isArray(user.expert.tags) ? user.expert.tags : (user.expert.tags ? JSON.parse(user.expert.tags as any) : []),
                    languages: Array.isArray(user.expert.languages) ? user.expert.languages : (user.expert.languages ? JSON.parse(user.expert.languages as any) : []),
                    category: user.expert.category || ''
                });
            }
            loadUserStats();
        }
    }, [user, isAuthLoading, router]);

    const loadUserStats = async () => { /* ... */ };
    const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUserInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleExpertInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setExpertInfo(prev => ({ ...prev, [name]: (name === 'tags' || name === 'languages') ? value.split(',').map((item: any) => item.trim()) : value }));
    };
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setAvatarFile(e.target.files[0]);
            try { setAvatarFileUrl(URL.createObjectURL(e.target.files[0])); } catch {}
        }
    };

    const handleSave = async () => {
        if (!isFormValid()) {
            setError("Veuillez remplir tous les champs obligatoires (marqués d'une *) pour continuer.");
            return;
        }
        setLoading(true); setError(''); setSuccess('');
        try {
            let avatarUrl = user?.avatar;
            if (avatarFile) {
                const uploadResponse = await ApiService.uploadAvatar(avatarFile);
                if (uploadResponse.success && uploadResponse.data?.url) {
                    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
                    avatarUrl = `${backendUrl}${uploadResponse.data.url}`;
                } else { throw new Error(uploadResponse.message || "Erreur de l'upload d'image."); }
            }
            const profileData = { ...userInfo, avatar: avatarUrl, ...expertInfo };
            const response = await ApiService.updateUserProfile(profileData);
            if (response.success && response.data) {
                updateUser(response.data);
                setSuccess('Profil mis à jour !'); setIsEditing(false); setAvatarFile(null); setAvatarFileUrl(null);
            } else { setError(response.message || 'Erreur de mise à jour.'); }
        } catch (err: any) { setError(err.message || 'Erreur de sauvegarde.'); } 
        finally { setLoading(false); }
    };

    const handleCancel = () => { /* ... */ };

    const handleVerificationSubmit = async () => {
        if (!isVerificationFormValid) {
            setError("Veuillez fournir tous les documents et informations requis.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('identityDocumentType', docType);
            formData.append('bankDetails', bankDetails);
            if(docFront) formData.append('identityDocumentFront', docFront);
            if(docBack) formData.append('identityDocumentBack', docBack);
            if(selfie) formData.append('selfieWithIdentity', selfie);
            if(bankDocument) formData.append('bankDocument', bankDocument);

            const response = await ApiService.submitVerification(formData);
            if (response.success) {
                setSuccess("Documents soumis avec succès ! Votre profil est en cours de vérification.");
                // Mettre à jour l'état local pour refléter le statut "PENDING"
                if (user?.expert) {
                    updateUser({ expert: { ...user.expert, verificationStatus: 'PENDING' } });
                }
            } else {
                setError(response.message || 'Erreur lors de la soumission.');
            }
        } catch (err: any) {
            setError(err.message || 'Erreur de soumission.');
        } finally {
            setLoading(false);
        }
    };

    if (isAuthLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AppHeader />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Suppression de l'avatar d'en-tête à la demande */}
                {!user.profileCompleted && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-lg shadow">
                        <div className="flex">
                            <div className="flex-shrink-0"><i className="ri-error-warning-fill text-yellow-500 text-xl"></i></div>
                            <div className="ml-3">
                                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Complétez votre profil pour continuer</p>
                                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">Veuillez remplir tous les champs marqués d'une * pour débloquer toutes les fonctionnalités.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-8">
                    <div className="px-6 pt-6">
                        <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
                            <button onClick={() => setActiveTab('overview')} className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Vue d'ensemble</button>
                            <button onClick={() => setActiveTab('personal')} className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'personal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Informations personelles</button>
                            <button onClick={() => setActiveTab('stats')} className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'stats' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Statistiques</button>
                            {user.userType === 'expert' && (
                             <button onClick={() => setActiveTab('verification')} className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'verification' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Vérification Expert</button>
                            )}
                        </nav>
                    </div>

                    {success && <div className="p-4 mx-6 mt-4 bg-green-50 text-green-700 rounded-lg">{success}</div>}
                    {error && <div className="p-4 mx-6 mt-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vue d'ensemble</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 text-white"><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold">Mes Coins</h3><p className="text-3xl font-bold">{user.coins || 0}</p></div><div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center"><i className="ri-coin-line text-3xl"></i></div></div></div>
                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 text-white"><h3 className="text-lg font-semibold mb-2">Statut du Profil</h3>{user.profileCompleted ? (<div className="flex items-center"><i className="ri-checkbox-circle-fill mr-2"></i><p>Profil Complet</p></div>) : (<div className="flex items-center"><i className="ri-error-warning-fill mr-2"></i><p>Profil Incomplet</p></div>)}</div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'personal' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Informations Personnelles</h2>
                                    {!isEditing ? (
                                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><i className="ri-edit-line mr-2"></i>Modifier</button>
                                    ) : (
                                        <div className="flex space-x-2">
                                            {user.profileCompleted && (<button onClick={handleCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Annuler</button>)}
                                            <button onClick={handleSave} disabled={loading || !isFormValid()} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Sauvegarde...' : 'Sauvegarder'}</button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-6 mb-6">
                                    <img
                                        src={avatarFileUrl || userAvatarCandidates[Math.min(avatarIdx, userAvatarCandidates.length - 1)]}
                                        alt="Avatar"
                                        className="w-24 h-24 rounded-full object-cover"
                                        onError={() => setAvatarIdx(i => i + 1)}
                                    />
                                    {isEditing && (
                                        <div><input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-sm rounded-lg">Changer d'image</button></div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-medium mb-2">Prénom</label><input type="text" name="firstName" value={userInfo.firstName} onChange={handleUserInputChange} disabled={!isEditing} className="w-full px-3 py-2 border rounded-lg" /></div>
                                    <div><label className="block text-sm font-medium mb-2">Nom</label><input type="text" name="lastName" value={userInfo.lastName} onChange={handleUserInputChange} disabled={!isEditing} className="w-full px-3 py-2 border rounded-lg" /></div>
                                    <div><label className="block text-sm font-medium mb-2">Email</label><input type="email" name="email" value={userInfo.email} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100" /></div>
                                    <div><label className="block text-sm font-medium mb-2">Téléphone*</label><input type="tel" name="phone" value={userInfo.phone} onChange={handleUserInputChange} disabled={!isEditing} className="w-full px-3 py-2 border rounded-lg" /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Localisation*</label><input type="text" name="location" value={userInfo.location} onChange={handleUserInputChange} disabled={!isEditing} className="w-full px-3 py-2 border rounded-lg" /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Biographie*</label><textarea name="bio" value={userInfo.bio} onChange={handleUserInputChange} disabled={!isEditing} rows={4} className="w-full px-3 py-2 border rounded-lg" /></div>
                                </div>

                                {user.userType === 'expert' && (
                                    <div className="mt-8">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-t pt-6">Profil Expert</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div><label className="block text-sm font-medium mb-2">Spécialité*</label><input type="text" name="specialty" value={expertInfo.specialty} onChange={handleExpertInputChange} disabled={!isEditing} className="w-full px-3 py-2 border rounded-lg" /></div>
                                            <div><label className="block text-sm font-medium mb-2">Catégorie*</label><select name="category" value={expertInfo.category} onChange={handleExpertInputChange} disabled={!isEditing} className="w-full px-3 py-2 border rounded-lg"><option value="">Sélectionnez...</option><option value="business">Business</option><option value="marketing">Marketing</option><option value="wellness">Bien-être</option><option value="tech">Technologie</option><option value="finance">Finance</option></select></div>
                                            <div><label className="block text-sm font-medium mb-2">Tarif par heure ({currency.symbol})*</label><input type="number" name="hourlyRate" value={expertInfo.hourlyRate} onChange={handleExpertInputChange} disabled={!isEditing} className="w-full px-3 py-2 border rounded-lg" /></div>
                                            <div><label className="block text-sm font-medium mb-2">Tarif par message ({currency.symbol})</label><input type="number" name="pricePerMessage" value={expertInfo.pricePerMessage} onChange={handleExpertInputChange} disabled={!isEditing} className="w-full px-3 py-2 border rounded-lg" /></div>
                                            <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Tags (séparés par virgule)</label><input type="text" name="tags" value={expertInfo.tags.join(', ')} onChange={handleExpertInputChange} disabled={!isEditing} className="w-full px-3 py-2 border rounded-lg" /></div>
                                            <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Langues (séparées par virgule)</label><input type="text" name="languages" value={expertInfo.languages.join(', ')} onChange={handleExpertInputChange} disabled={!isEditing} className="w-full px-3 py-2 border rounded-lg" /></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Statistiques Détaillées</h2>
                                {userStats ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        {user.userType === 'expert' ? (
                                            <><StatCard label="Etudiants Actifs" value={userStats.totalStudents ?? 0} icon="ri-group-line" /><StatCard label="Revenus (est.)" value={formatPrice(userStats.totalRevenue ?? 0)} icon="ri-money-euro-circle-line" /><StatCard label="Note Moyenne" value={`${userStats.averageRating ?? 'N/A'}/5`} icon="ri-star-line" /></>
                                        ) : (
                                            <><StatCard label="Sessions terminées" value={userStats.sessionsCompleted ?? 0} icon="ri-calendar-check-line" /><StatCard label="Formations suivies" value={userStats.formationsFollowed ?? 0} icon="ri-book-open-line" /><StatCard label="Experts suivis" value={userStats.expertsFollowed ?? 0} icon="ri-user-star-line" /></>
                                        )}
                                    </div>
                                ) : (<p className="text-gray-500">Chargement...</p>)}
                            </div>
                        )}

                        {activeTab === 'verification' && user.userType === 'expert' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-semibold mb-2">Vérification de votre profil Expert</h2>
                                <p className="text-gray-600 mb-6">Pour garantir la sécurité, nous devons vérifier votre identité.</p>

                                {user.expert?.verificationStatus === 'VERIFIED' ? (
                                    <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center"><i className="ri-checkbox-circle-fill mr-3"></i>Votre profil est vérifié !</div>
                                ) : user.expert?.verificationStatus === 'PENDING' ? (
                                    <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg flex items-center"><i className="ri-time-line mr-3"></i>Vos documents sont en cours de vérification.</div>
                                ) : (
                                    <div className="space-y-6">
                                        <div><label className="block text-sm font-medium mb-2">Pièce d'identité officielle*</label><select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full p-2 border rounded"><option value="CIN">Carte d'Identité</option><option value="PASSPORT">Passeport</option><option value="DRIVING_LICENSE">Permis de Conduire</option></select></div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FileInput label="Document (Recto)*" file={docFront} onFileChange={setDocFront} id="doc-front" />
                                            {docType !== 'PASSPORT' && <FileInput label="Document (Verso)*" file={docBack} onFileChange={setDocBack} id="doc-back" />}
                                        </div>
                                        <FileInput label="Selfie avec votre pièce d'identité*" file={selfie} onFileChange={setSelfie} id="selfie-doc" />
                                        <div><label className="block text-sm font-medium mb-2">Identité Bancaire (IBAN/RIB)*</label><textarea value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} rows={2} className="w-full p-2 border rounded" placeholder="Entrez votre IBAN ou RIB complet"></textarea></div>
                                        <FileInput label="Justificatif Bancaire (RIB, ...)*" file={bankDocument} onFileChange={setBankDocument} id="bank-doc" />
                                        
                                        <button onClick={handleVerificationSubmit} disabled={loading || !isVerificationFormValid} className="w-full py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50">Soumettre pour vérification</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
