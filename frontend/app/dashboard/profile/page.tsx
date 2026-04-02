'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import ApiService from '../../../services/api';

const DAYS_OF_WEEK = [
    { value: 0, label: 'Dimanche', short: 'Dim' },
    { value: 1, label: 'Lundi', short: 'Lun' },
    { value: 2, label: 'Mardi', short: 'Mar' },
    { value: 3, label: 'Mercredi', short: 'Mer' },
    { value: 4, label: 'Jeudi', short: 'Jeu' },
    { value: 5, label: 'Vendredi', short: 'Ven' },
    { value: 6, label: 'Samedi', short: 'Sam' },
];

interface TimeSlot {
    start: string;
    end: string;
}

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
        specialty: '', hourlyRate: 0, minuteRate: 0, pricePerMessage: 0, videoMessageRate: 0, tags: [] as string[], languages: [] as string[], category: '', categories: [] as string[], country: '', linkedinUrl: '', rnePatente: ''
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
        const isExpertPartValid = expertInfo.specialty && (expertInfo.category || (expertInfo.categories && expertInfo.categories.length > 0)) && (expertInfo.minuteRate > 0 || expertInfo.hourlyRate > 0);
        return isUserPartValid && isExpertPartValid;
    };

    const [docType, setDocType] = useState('CIN');
    const [docFront, setDocFront] = useState<File | null>(null);
    const [docBack, setDocBack] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);
    const [bankDetails, setBankDetails] = useState('');
    const [bankDocument, setBankDocument] = useState<File | null>(null);

    // Availability state - per-day slots
    const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [daySlots, setDaySlots] = useState<Record<number, TimeSlot[]>>({
        1: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
        2: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
        3: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
        4: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
        5: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    });
    // Keep legacy for backward compat
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' }
    ]);
    const [vacationDays, setVacationDays] = useState<string[]>([]);
    const [appointmentInterval, setAppointmentInterval] = useState<number>(30);
    const [newVacationStartDate, setNewVacationStartDate] = useState('');
    const [newVacationEndDate, setNewVacationEndDate] = useState('');
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilitySuccess, setAvailabilitySuccess] = useState('');

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
                const exp = user.expert as any;
                let cats: string[] = [];
                try { cats = exp.categories ? (typeof exp.categories === 'string' ? JSON.parse(exp.categories) : exp.categories) : []; } catch { cats = []; }
                setExpertInfo({
                    specialty: exp.specialty || '',
                    hourlyRate: exp.hourlyRate || 0,
                    minuteRate: exp.minuteRate || 0,
                    pricePerMessage: exp.pricePerMessage || 0,
                    videoMessageRate: exp.videoMessageRate || 0,
                    tags: Array.isArray(exp.tags) ? exp.tags : (exp.tags ? JSON.parse(exp.tags as any) : []),
                    languages: Array.isArray(exp.languages) ? exp.languages : (exp.languages ? JSON.parse(exp.languages as any) : []),
                    category: exp.category || '',
                    categories: cats,
                    country: exp.country || '',
                    linkedinUrl: exp.linkedinUrl || '',
                    rnePatente: exp.rnePatente || ''
                });
            }
            loadUserStats();
        }
    }, [user, isAuthLoading, router]);

    const loadUserStats = async () => { /* ... */ };

    // Availability functions
    const loadAvailability = useCallback(async () => {
        if (user?.userType !== 'expert') return;
        try {
            const response = await ApiService.getMyAvailability();
            if (response.success && response.data) {
                if (response.data.availableDays && response.data.availableDays.length > 0) {
                    setAvailableDays(response.data.availableDays);
                }
                // Load per-day slots if available
                const availData = response.data as any;
                if (availData.daySlots && typeof availData.daySlots === 'object') {
                    const parsed: Record<number, TimeSlot[]> = {};
                    for (const [key, val] of Object.entries(availData.daySlots)) {
                        parsed[Number(key)] = val as TimeSlot[];
                    }
                    setDaySlots(parsed);
                } else if (response.data.availableTimeSlots && response.data.availableTimeSlots.length > 0) {
                    // Legacy: apply same slots to all available days
                    const legacy: Record<number, TimeSlot[]> = {};
                    for (const day of (response.data.availableDays || [1,2,3,4,5])) {
                        legacy[day] = response.data.availableTimeSlots;
                    }
                    setDaySlots(legacy);
                }
                if (response.data.availableTimeSlots && response.data.availableTimeSlots.length > 0) {
                    setTimeSlots(response.data.availableTimeSlots);
                }
                if (response.data.vacationDays) {
                    setVacationDays(response.data.vacationDays);
                }
                if (response.data.appointmentInterval) {
                    setAppointmentInterval(response.data.appointmentInterval);
                }
            }
        } catch (err) {
            console.error('Error loading availability:', err);
        }
    }, [user?.userType]);

    useEffect(() => {
        if (user?.userType === 'expert') {
            loadAvailability();
        }
    }, [user?.userType, loadAvailability]);

    const toggleDay = (dayValue: number) => {
        setAvailableDays(prev => {
            if (prev.includes(dayValue)) {
                // Remove day and its slots
                setDaySlots(ds => { const copy = { ...ds }; delete copy[dayValue]; return copy; });
                return prev.filter(d => d !== dayValue);
            } else {
                // Add day with default slots
                setDaySlots(ds => ({ ...ds, [dayValue]: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] }));
                return [...prev, dayValue].sort((a, b) => a - b);
            }
        });
    };

    const addDaySlot = (dayValue: number) => {
        setDaySlots(prev => ({
            ...prev,
            [dayValue]: [...(prev[dayValue] || []), { start: '09:00', end: '17:00' }]
        }));
    };

    const removeDaySlot = (dayValue: number, index: number) => {
        setDaySlots(prev => ({
            ...prev,
            [dayValue]: (prev[dayValue] || []).filter((_, i) => i !== index)
        }));
    };

    const updateDaySlot = (dayValue: number, index: number, field: 'start' | 'end', value: string) => {
        setDaySlots(prev => {
            const slots = [...(prev[dayValue] || [])];
            slots[index] = { ...slots[index], [field]: value };
            return { ...prev, [dayValue]: slots };
        });
    };

    // Legacy functions for backward compat
    const addTimeSlot = () => {
        setTimeSlots(prev => [...prev, { start: '09:00', end: '17:00' }]);
    };

    const removeTimeSlot = (index: number) => {
        setTimeSlots(prev => prev.filter((_, i) => i !== index));
    };

    const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
        setTimeSlots(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Générer toutes les dates entre deux dates
    const generateDateRange = (startDate: string, endDate: string): string[] => {
        const dates: string[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        const current = new Date(start);
        while (current <= end) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    const addVacationPeriod = () => {
        if (!newVacationStartDate) return;

        // Si pas de date de fin, ajouter juste la date de début
        const endDate = newVacationEndDate || newVacationStartDate;
        const newDates = generateDateRange(newVacationStartDate, endDate);

        // Ajouter les nouvelles dates sans doublons
        setVacationDays(prev => {
            const combined = [...prev, ...newDates];
            const unique = [...new Set(combined)];
            return unique.sort();
        });

        setNewVacationStartDate('');
        setNewVacationEndDate('');
    };

    const removeVacationDay = (date: string) => {
        setVacationDays(prev => prev.filter(d => d !== date));
    };

    // Supprimer une période entière
    const removeVacationPeriod = (startDate: string, endDate: string) => {
        const datesToRemove = generateDateRange(startDate, endDate);
        setVacationDays(prev => prev.filter(d => !datesToRemove.includes(d)));
    };

    const formatVacationDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Grouper les jours de congé en périodes consécutives
    const groupVacationDays = (days: string[]): { start: string, end: string }[] => {
        if (days.length === 0) return [];

        const sorted = [...days].sort();
        const periods: { start: string, end: string }[] = [];

        let periodStart = sorted[0];
        let periodEnd = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
            const currentDate = new Date(sorted[i]);
            const previousDate = new Date(sorted[i - 1]);

            // Vérifier si les dates sont consécutives
            const diffDays = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);

            if (diffDays === 1) {
                // Continuer la période
                periodEnd = sorted[i];
            } else {
                // Nouvelle période
                periods.push({ start: periodStart, end: periodEnd });
                periodStart = sorted[i];
                periodEnd = sorted[i];
            }
        }

        // Ajouter la dernière période
        periods.push({ start: periodStart, end: periodEnd });

        return periods;
    };

    const formatPeriod = (period: { start: string, end: string }) => {
        const startDate = new Date(period.start);
        const endDate = new Date(period.end);

        if (period.start === period.end) {
            return formatVacationDate(period.start);
        }

        // Calculer le nombre de jours
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const startStr = startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        const endStr = endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

        return `${startStr} - ${endStr} (${diffDays} jours)`;
    };

    const handleSaveAvailability = async () => {
        try {
            setAvailabilityLoading(true);
            setError('');
            setAvailabilitySuccess('');

            if (availableDays.length === 0) {
                setError('Veuillez sélectionner au moins un jour disponible');
                return;
            }

            // Validate per-day slots
            for (const day of availableDays) {
                const slots = daySlots[day] || [];
                if (slots.length === 0) {
                    const dayName = DAYS_OF_WEEK.find(d => d.value === day)?.label || '';
                    setError(`Veuillez ajouter au moins un créneau pour ${dayName}`);
                    return;
                }
                for (const slot of slots) {
                    if (slot.start >= slot.end) {
                        const dayName = DAYS_OF_WEEK.find(d => d.value === day)?.label || '';
                        setError(`L'heure de fin doit être après l'heure de début (${dayName})`);
                        return;
                    }
                }
            }

            // Build flat timeSlots from daySlots for backward compat
            const allSlots: TimeSlot[] = [];
            for (const day of availableDays) {
                for (const slot of (daySlots[day] || [])) {
                    if (!allSlots.find(s => s.start === slot.start && s.end === slot.end)) {
                        allSlots.push(slot);
                    }
                }
            }

            const response = await (ApiService as any).updateMyAvailability({
                availableDays,
                availableTimeSlots: allSlots,
                daySlots,
                vacationDays,
                appointmentInterval
            });

            if (response.success) {
                setAvailabilitySuccess('Disponibilité mise à jour avec succès');
                setTimeout(() => setAvailabilitySuccess(''), 3000);
            } else {
                setError(response.message || 'Erreur lors de la sauvegarde');
            }
        } catch (err: any) {
            setError(err?.message || 'Erreur lors de la sauvegarde');
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const generateTimeOptions = () => {
        const options = [];
        for (let h = 6; h <= 22; h++) {
            for (let m = 0; m < 60; m += 30) {
                const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                options.push(time);
            }
        }
        return options;
    };

    const timeOptions = generateTimeOptions();

    const generatePreviewSlots = () => {
        const slots: string[] = [];
        timeSlots.forEach(slot => {
            let [startH, startM] = slot.start.split(':').map(Number);
            const [endH, endM] = slot.end.split(':').map(Number);
            const endMinutes = endH * 60 + endM;

            while (startH * 60 + startM < endMinutes) {
                const time = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
                slots.push(time);
                startM += appointmentInterval;
                if (startM >= 60) {
                    startH += Math.floor(startM / 60);
                    startM = startM % 60;
                }
            }
        });
        return slots.sort();
    };

    const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUserInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleExpertInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['hourlyRate', 'minuteRate', 'pricePerMessage', 'videoMessageRate'];
        if (numericFields.includes(name)) {
            setExpertInfo(prev => ({ ...prev, [name]: Number(value) || 0 }));
        } else if (name === 'tags' || name === 'languages') {
            setExpertInfo(prev => ({ ...prev, [name]: value.split(',').map((item: any) => item.trim()) }));
        } else {
            setExpertInfo(prev => ({ ...prev, [name]: value }));
        }
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
                        <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                            <button onClick={() => setActiveTab('overview')} className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'overview' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Vue d'ensemble</button>
                            <button onClick={() => setActiveTab('personal')} className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'personal' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Informations personelles</button>
                            <button onClick={() => setActiveTab('stats')} className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'stats' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Statistiques</button>
                            {user.userType === 'expert' && (
                                <>
                                    <button onClick={() => setActiveTab('availability')} className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'availability' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Disponibilité</button>
                                    <button onClick={() => setActiveTab('verification')} className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'verification' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Vérification Expert</button>
                                </>
                            )}
                        </nav>
                    </div>

                    {success && <div className="p-4 mx-6 mt-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">{success}</div>}
                    {error && <div className="p-4 mx-6 mt-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">{error}</div>}

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
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prénom</label><input type="text" name="firstName" value={userInfo.firstName} onChange={handleUserInputChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom</label><input type="text" name="lastName" value={userInfo.lastName} onChange={handleUserInputChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label><input type="email" name="email" value={userInfo.email} disabled className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone*</label><input type="tel" name="phone" value={userInfo.phone} onChange={handleUserInputChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Localisation*</label><input type="text" name="location" value={userInfo.location} onChange={handleUserInputChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Biographie*</label><textarea name="bio" value={userInfo.bio} onChange={handleUserInputChange} disabled={!isEditing} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                                </div>

                                {user.userType === 'expert' && (
                                    <div className="mt-8">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-t border-gray-200 dark:border-gray-700 pt-6">Profil Expert</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Spécialité*</label><input type="text" name="specialty" value={expertInfo.specialty} onChange={handleExpertInputChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie*</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Rechercher une catégorie..."
                                                        disabled={!isEditing}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                                                        onChange={(e) => {
                                                            const searchVal = e.target.value.toLowerCase();
                                                            const el = document.getElementById('category-dropdown');
                                                            if (el) {
                                                                const options = el.querySelectorAll('[data-cat-option]');
                                                                options.forEach((opt: any) => {
                                                                    opt.style.display = opt.textContent.toLowerCase().includes(searchVal) ? '' : 'none';
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <div id="category-dropdown" className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                                                        {(['Comptabilité','Addiction','Publicité','Conseil','Agriculture','Intelligence Artificielle (IA)','Airbnb','Architecture','Art','Automatisation','Automobile','Aviation','Beauté','Biologie','Bitcoin','Business','Coaching','Communication','Construction','Création de contenu','Cuisine','Crypto','Cybersécurité','Danse','Design graphique','Développement personnel','Développement web','Dropshipping','E-commerce','Économie','Éducation','Énergie','Entrepreneuriat','Environnement','Finance','Freelance','Gaming','Immobilier','Informatique','Ingénierie logicielle','Investissement','Juridique','Leadership','Machine Learning','Marketing','Médical','Méditation','Mode','Musique','Photographie','Podcasting','Politique','Psychologie','Réseaux sociaux','Robotique','Santé','Santé mentale','Sport','Startups','Supply Chain','Technologie','Trading','Transport & Logistique','Voyage','Yoga']).sort().map(cat => (
                                                            <label key={cat} data-cat-option className="flex items-center px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={expertInfo.categories.includes(cat)}
                                                                    disabled={!isEditing}
                                                                    onChange={() => {
                                                                        setExpertInfo(prev => ({
                                                                            ...prev,
                                                                            categories: prev.categories.includes(cat)
                                                                                ? prev.categories.filter(c => c !== cat)
                                                                                : [...prev.categories, cat],
                                                                            category: prev.categories.includes(cat) ? prev.category : cat
                                                                        }));
                                                                    }}
                                                                    className="mr-2 rounded"
                                                                />
                                                                <span className="text-gray-700 dark:text-gray-300">{cat}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    {expertInfo.categories.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {expertInfo.categories.map(cat => (
                                                                <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                                    {cat}
                                                                    {isEditing && <button type="button" onClick={() => setExpertInfo(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }))} className="ml-1 text-blue-500 hover:text-red-500"><i className="ri-close-line text-xs"></i></button>}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tarif par minute ({currency.symbol})*</label><input type="number" name="minuteRate" value={expertInfo.minuteRate} onChange={handleExpertInputChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tarif par message ({currency.symbol})</label><input type="number" name="pricePerMessage" value={expertInfo.pricePerMessage} onChange={handleExpertInputChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tarif réponse vidéo ({currency.symbol})</label><input type="number" name="videoMessageRate" value={expertInfo.videoMessageRate} onChange={handleExpertInputChange} disabled={!isEditing} placeholder="0 = gratuit" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pays</label><input type="text" name="country" value={expertInfo.country} onChange={handleExpertInputChange} disabled={!isEditing} placeholder="Ex: Tunisie" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                                            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags (séparés par virgule)</label><input type="text" name="tags" value={expertInfo.tags.join(', ')} onChange={handleExpertInputChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                                            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Langues (séparées par virgule)</label><input type="text" name="languages" value={expertInfo.languages.join(', ')} onChange={handleExpertInputChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
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
                                ) : (<p className="text-gray-500 dark:text-gray-400">Chargement...</p>)}
                            </div>
                        )}

                        {activeTab === 'availability' && user.userType === 'expert' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Disponibilité</h2>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Configurez vos jours et horaires disponibles pour les rendez-vous</p>
                                    </div>
                                </div>

                                {availabilitySuccess && (
                                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <i className="ri-checkbox-circle-line text-green-600 dark:text-green-400 mr-3"></i>
                                            <p className="text-green-800 dark:text-green-200">{availabilitySuccess}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Days Selection */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Jours disponibles</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Sélectionnez les jours où vous êtes disponible</p>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS_OF_WEEK.map((day) => (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => toggleDay(day.value)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                                    availableDays.includes(day.value)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500'
                                                }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-3">
                                        {availableDays.length === 0 ? 'Aucun jour sélectionné' : `${availableDays.length} jour(s) sélectionné(s)`}
                                    </p>
                                </div>

                                {/* Per-Day Time Slots */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Plages horaires par jour</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Définissez vos créneaux horaires pour chaque jour</p>

                                    <div className="space-y-4">
                                        {availableDays.sort((a,b) => a-b).map(dayValue => {
                                            const dayInfo = DAYS_OF_WEEK.find(d => d.value === dayValue);
                                            const slots = daySlots[dayValue] || [];
                                            return (
                                                <div key={dayValue} className="bg-white dark:bg-gray-600 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{dayInfo?.label}</h4>
                                                        <button type="button" onClick={() => addDaySlot(dayValue)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors cursor-pointer flex items-center">
                                                            <i className="ri-add-line mr-1"></i>Ajouter
                                                        </button>
                                                    </div>
                                                    {slots.length === 0 ? (
                                                        <p className="text-gray-400 text-sm">Aucun créneau configuré</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {slots.map((slot, index) => (
                                                                <div key={index} className="flex items-center gap-2">
                                                                    <select value={slot.start} onChange={(e) => updateDaySlot(dayValue, index, 'start', e.target.value)} className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 dark:text-white text-sm">
                                                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                                    </select>
                                                                    <span className="text-gray-400 text-sm">à</span>
                                                                    <select value={slot.end} onChange={(e) => updateDaySlot(dayValue, index, 'end', e.target.value)} className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 dark:text-white text-sm">
                                                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                                    </select>
                                                                    <button type="button" onClick={() => removeDaySlot(dayValue, index)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded cursor-pointer">
                                                                        <i className="ri-delete-bin-line"></i>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {availableDays.length === 0 && (
                                            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Sélectionnez au moins un jour ci-dessus</p>
                                        )}
                                    </div>
                                </div>

                                {/* Legacy time slots hidden */}

                                {/* Appointment Interval */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Durée des rendez-vous</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Définissez l'intervalle entre chaque créneau de rendez-vous</p>
                                    <div className="flex items-center gap-4">
                                        <select
                                            value={appointmentInterval}
                                            onChange={(e) => setAppointmentInterval(parseInt(e.target.value))}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value={15}>15 minutes</option>
                                            <option value={30}>30 minutes</option>
                                            <option value={45}>45 minutes</option>
                                            <option value={60}>1 heure</option>
                                            <option value={90}>1h30</option>
                                            <option value={120}>2 heures</option>
                                        </select>
                                        <span className="text-gray-500 dark:text-gray-400 text-sm">par rendez-vous</span>
                                    </div>
                                </div>

                                {/* Vacation Days */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Périodes de congé</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                        Ajoutez des périodes de congé (un jour, une semaine, un mois...)
                                    </p>

                                    <div className="bg-white dark:bg-gray-600 rounded-lg p-4 mb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date de début</label>
                                                <input
                                                    type="date"
                                                    value={newVacationStartDate}
                                                    onChange={(e) => setNewVacationStartDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date de fin (optionnel)</label>
                                                <input
                                                    type="date"
                                                    value={newVacationEndDate}
                                                    onChange={(e) => setNewVacationEndDate(e.target.value)}
                                                    min={newVacationStartDate || new Date().toISOString().split('T')[0]}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addVacationPeriod}
                                            disabled={!newVacationStartDate}
                                            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        >
                                            <i className="ri-calendar-close-line mr-2"></i>
                                            {newVacationEndDate && newVacationStartDate !== newVacationEndDate
                                                ? 'Ajouter cette période de congé'
                                                : 'Ajouter ce jour de congé'}
                                        </button>
                                    </div>

                                    {vacationDays.length > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                {vacationDays.length} jour(s) de congé configuré(s)
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {groupVacationDays(vacationDays).map((period, index) => (
                                                    <div key={index} className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg">
                                                        <i className="ri-calendar-close-line"></i>
                                                        <span className="text-sm">{formatPeriod(period)}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVacationPeriod(period.start, period.end)}
                                                            className="ml-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 cursor-pointer"
                                                            title="Supprimer cette période"
                                                        >
                                                            <i className="ri-close-line"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune période de congé configurée</p>
                                    )}
                                </div>

                                {/* Preview */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Aperçu des créneaux</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Voici les créneaux de {appointmentInterval} minutes qui seront proposés aux clients</p>
                                    <div className="flex flex-wrap gap-2">
                                        {generatePreviewSlots().map((time, index) => (
                                            <span key={index} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                                                {time}
                                            </span>
                                        ))}
                                    </div>
                                    {generatePreviewSlots().length === 0 && (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun créneau disponible</p>
                                    )}
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSaveAvailability}
                                        disabled={availabilityLoading}
                                        className={`px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                                            availabilityLoading
                                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {availabilityLoading ? (
                                            <>
                                                <i className="ri-loader-4-line animate-spin mr-2"></i>
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-save-line mr-2"></i>
                                                Enregistrer
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'verification' && user.userType === 'expert' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Vérification de votre profil Expert</h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">Pour garantir la sécurité, nous devons vérifier votre identité.</p>

                                {user.expert?.verificationStatus === 'VERIFIED' ? (
                                    <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-lg flex items-center"><i className="ri-checkbox-circle-fill mr-3"></i>Votre profil est vérifié !</div>
                                ) : user.expert?.verificationStatus === 'PENDING' ? (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 p-4 rounded-lg flex items-center"><i className="ri-time-line mr-3"></i>Vos documents sont en cours de vérification.</div>
                                ) : (
                                    <div className="space-y-6">
                                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pièce d'identité officielle*</label><select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"><option value="CIN">Carte d'Identité</option><option value="PASSPORT">Passeport</option><option value="DRIVING_LICENSE">Permis de Conduire</option></select></div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FileInput label="Document (Recto)*" file={docFront} onFileChange={setDocFront} id="doc-front" />
                                            {docType !== 'PASSPORT' && <FileInput label="Document (Verso)*" file={docBack} onFileChange={setDocBack} id="doc-back" />}
                                        </div>
                                        <FileInput label="Selfie avec votre pièce d'identité*" file={selfie} onFileChange={setSelfie} id="selfie-doc" />
                                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Identité Bancaire (IBAN/RIB)*</label><textarea value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} rows={2} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Entrez votre IBAN ou RIB complet"></textarea></div>
                                        <FileInput label="Justificatif Bancaire (RIB, ...)*" file={bankDocument} onFileChange={setBankDocument} id="bank-doc" />

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informations complémentaires</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profil LinkedIn</label><input type="url" value={expertInfo.linkedinUrl} onChange={(e) => setExpertInfo(prev => ({ ...prev, linkedinUrl: e.target.value }))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="https://linkedin.com/in/votre-profil" /></div>
                                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">RNE / Patente (optionnel)</label><input type="text" value={expertInfo.rnePatente} onChange={(e) => setExpertInfo(prev => ({ ...prev, rnePatente: e.target.value }))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Numéro RNE ou Patente" /></div>
                                            </div>
                                        </div>

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
