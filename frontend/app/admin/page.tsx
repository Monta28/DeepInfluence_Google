'use client';

import React, { useEffect, useState } from 'react';
import ApiService from '@/services/api';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface StatsData {
  users: number;
  experts: { total: number; verified: number; pending: number };
  formations: number;
  videos: number;
  reviews: number;
  appointments: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
  transactions: { total: number; totalAmount: number };
  recentUsers: any[];
  recentExperts: any[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminDashboardPage() {
  const [data, setData] = useState<StatsData | null>(null);
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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
        {error}
      </div>
    );
  }

  const statsCards = [
    {
      label: 'Utilisateurs',
      value: data?.users ?? 0,
      icon: 'ri-team-line',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      href: '/admin/users'
    },
    {
      label: 'Experts',
      value: data?.experts?.total ?? 0,
      subLabel: `${data?.experts?.verified ?? 0} vérifiés`,
      icon: 'ri-user-star-line',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      href: '/admin/experts'
    },
    {
      label: 'Formations',
      value: data?.formations ?? 0,
      icon: 'ri-graduation-cap-line',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      href: '/admin/content'
    },
    {
      label: 'Vidéos',
      value: data?.videos ?? 0,
      icon: 'ri-play-circle-line',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      textColor: 'text-pink-600 dark:text-pink-400',
      href: '/admin/content'
    },
    {
      label: 'Rendez-vous',
      value: data?.appointments?.total ?? 0,
      subLabel: `${data?.appointments?.pending ?? 0} en attente`,
      icon: 'ri-calendar-check-line',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      href: '/admin/appointments'
    },
    {
      label: 'Avis',
      value: data?.reviews ?? 0,
      icon: 'ri-star-smile-line',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      href: '/admin/reviews'
    },
  ];

  const appointmentData = data?.appointments ? [
    { name: 'En attente', value: data.appointments.pending, color: '#F59E0B' },
    { name: 'Confirmés', value: data.appointments.confirmed, color: '#10B981' },
    { name: 'Complétés', value: data.appointments.completed, color: '#3B82F6' },
    { name: 'Annulés', value: data.appointments.cancelled, color: '#EF4444' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <i className={`${stat.icon} text-xl ${stat.textColor}`}></i>
              </div>
              <i className="ri-arrow-right-up-line text-gray-400 group-hover:text-blue-600 transition-colors"></i>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            {stat.subLabel && (
              <div className="text-xs text-gray-500 mt-1">{stat.subLabel}</div>
            )}
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <TrendsChart />

        {/* Appointments Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition des Rendez-vous
          </h2>
          {appointmentData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {appointmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Aucune donnée
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actions Rapides
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/experts"
              className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <i className="ri-user-add-line text-xl"></i>
              <span className="font-medium">Vérifier les experts</span>
              {(data?.experts?.pending ?? 0) > 0 && (
                <span className="ml-auto bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                  {data?.experts?.pending}
                </span>
              )}
            </Link>
            <Link
              href="/admin/appointments"
              className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <i className="ri-calendar-todo-line text-xl"></i>
              <span className="font-medium">Gérer les RDV</span>
              {(data?.appointments?.pending ?? 0) > 0 && (
                <span className="ml-auto bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                  {data?.appointments?.pending}
                </span>
              )}
            </Link>
            <Link
              href="/admin/reviews"
              className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <i className="ri-chat-check-line text-xl"></i>
              <span className="font-medium">Modérer les avis</span>
            </Link>
            <Link
              href="/admin/notifications"
              className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <i className="ri-notification-badge-line text-xl"></i>
              <span className="font-medium">Envoyer une notification</span>
            </Link>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Derniers Utilisateurs
            </h2>
            <Link href="/admin/users" className="text-sm text-blue-600 hover:text-blue-700">
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.recentUsers || []).slice(0, 5).map((user: any) => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.userType === 'expert'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {user.userType}
                </span>
              </div>
            ))}
            {(!data?.recentUsers || data.recentUsers.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Aucun utilisateur récent</p>
            )}
          </div>
        </div>

        {/* Export Data */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Exporter les Données
          </h2>
          <div className="space-y-2">
            {[
              { label: 'Utilisateurs', endpoint: 'users', icon: 'ri-team-line' },
              { label: 'Experts', endpoint: 'experts', icon: 'ri-user-star-line' },
              { label: 'Formations', endpoint: 'formations', icon: 'ri-graduation-cap-line' },
              { label: 'Vidéos', endpoint: 'videos', icon: 'ri-play-circle-line' },
              { label: 'Rendez-vous', endpoint: 'appointments', icon: 'ri-calendar-line' },
              { label: 'Avis', endpoint: 'reviews', icon: 'ri-star-line' },
            ].map((item) => (
              <a
                key={item.endpoint}
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/export/${item.endpoint}.csv`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
              >
                <i className={`${item.icon} text-lg`}></i>
                <span className="flex-1">{item.label}</span>
                <i className="ri-download-2-line text-gray-400"></i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendsChart() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await ApiService.adminTrends(days);
        if (r.success) setData(r.data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [days]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tendances
        </h2>
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                days === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {d}j
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorUsers)"
                name="Nouveaux utilisateurs"
              />
              <Area
                type="monotone"
                dataKey="reviews"
                stroke="#F59E0B"
                fillOpacity={1}
                fill="url(#colorReviews)"
                name="Avis"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
