'use client';
import React, { useEffect, useState } from 'react';
import ApiService from '@/services/api';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await ApiService.adminOverview();
        if (res.success && res.data) setData(res.data);
      } catch (e) {
        setError('Erreur de chargement');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-gray-600">Chargement...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Tableau de bord Administrateur</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <div className="text-sm text-gray-500">Utilisateurs</div>
          <div className="text-2xl font-bold">{data?.users ?? 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <div className="text-sm text-gray-500">Experts</div>
          <div className="text-2xl font-bold">{data?.experts?.total ?? 0}</div>
          <div className="text-xs text-gray-500">Vérifiés: {data?.experts?.verified ?? 0}, En attente: {data?.experts?.pending ?? 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <div className="text-sm text-gray-500">Formations</div>
          <div className="text-2xl font-bold">{data?.formations ?? 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <div className="text-sm text-gray-500">Vidéos</div>
          <div className="text-2xl font-bold">{data?.videos ?? 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <div className="text-sm text-gray-500">Avis</div>
          <div className="text-2xl font-bold">{data?.reviews ?? 0}</div>
        </div>
      </div>

      <QuickLinks />
      <ExportBlock />
      <TrendsBlock />
    </div>
  );
}



function TrendsBlock() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await ApiService.adminTrends(days);
        if (r.success) setData(r.data.data || []);
      } catch (e) { setError('Erreur de chargement'); }
      finally { setLoading(false); }
    })();
  }, [days]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Tendances ({days} jours)</h2>
        <div className="space-x-2">
          <button onClick={()=>setDays(7)} className={`px-3 py-1 rounded ${days===7?'bg-blue-600 text-white':'bg-gray-100 dark:bg-gray-700'}`}>7j</button>
          <button onClick={()=>setDays(30)} className={`px-3 py-1 rounded ${days===30?'bg-blue-600 text-white':'bg-gray-100 dark:bg-gray-700'}`}>30j</button>
        </div>
      </div>
      {loading ? <div className="text-gray-600">Chargement…</div> : error ? <div className="text-red-600">{error}</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" name="Nouveaux utilisateurs" />
                <Line type="monotone" dataKey="reviews" stroke="#f59e0b" name="Avis" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="appt_pending" stackId="1" stroke="#fbbf24" fill="#fbbf24" name="RDV en attente" />
                <Area type="monotone" dataKey="appt_confirmed" stackId="1" stroke="#10b981" fill="#10b981" name="RDV confirmés" />
                <Area type="monotone" dataKey="appt_completed" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="RDV complétés" />
                <Area type="monotone" dataKey="appt_cancelled" stackId="1" stroke="#ef4444" fill="#ef4444" name="RDV annulés" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}


function QuickLinks() {
  const links = [
    { href: '/admin/experts', label: 'Experts', icon: 'ri-user-star-line' },
    { href: '/admin/users', label: 'Utilisateurs', icon: 'ri-team-line' },
    { href: '/admin/reviews', label: 'Avis', icon: 'ri-star-smile-line' },
    { href: '/admin/content', label: 'Contenu', icon: 'ri-folder-2-line' },
    { href: '/admin/appointments', label: 'Rendez-vous', icon: 'ri-calendar-check-line' },
    { href: '/admin/notifications', label: 'Diffusion', icon: 'ri-notification-3-line' },
  ];
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Navigation rapide</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((l: any) => (
          <Link key={l.href} href={l.href} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow">
            <i className={`${l.icon} text-xl`}></i>
            <span className="font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}


function ExportBlock() {
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');
  const links = [
    { href: `${base}/admin/export/users.csv`, label: 'Exporter utilisateurs' },
    { href: `${base}/admin/export/experts.csv`, label: 'Exporter experts' },
    { href: `${base}/admin/export/reviews.csv`, label: 'Exporter avis' },
    { href: `${base}/admin/export/appointments.csv`, label: 'Exporter rendez-vous' },
    { href: `${base}/admin/export/videos.csv`, label: 'Exporter vidéos' },
    { href: `${base}/admin/export/formations.csv`, label: 'Exporter formations' },
  ];
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Exports CSV</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((l: any) => (
          <a key={l.href} href={l.href} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border hover:shadow" target="_blank" rel="noreferrer">
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
