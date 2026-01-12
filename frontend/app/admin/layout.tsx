'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Tableau de bord', icon: 'ri-dashboard-3-line' },
  { href: '/admin/users', label: 'Utilisateurs', icon: 'ri-team-line' },
  { href: '/admin/experts', label: 'Experts', icon: 'ri-user-star-line' },
  { href: '/admin/content', label: 'Contenu', icon: 'ri-folder-2-line' },
  { href: '/admin/appointments', label: 'Rendez-vous', icon: 'ri-calendar-check-line' },
  { href: '/admin/transactions', label: 'Transactions', icon: 'ri-exchange-funds-line' },
  { href: '/admin/reviews', label: 'Avis', icon: 'ri-star-smile-line' },
  { href: '/admin/notifications', label: 'Diffusion', icon: 'ri-notification-3-line' },
  { href: '/admin/logs', label: 'Journaux', icon: 'ri-file-list-3-line' },
  { href: '/admin/settings', label: 'Paramètres', icon: 'ri-settings-3-line' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.userType !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoading || !user || user.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i className={`ri-${mobileMenuOpen ? 'close' : 'menu'}-line text-xl`}></i>
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="ri-admin-line text-white text-sm"></i>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Admin</span>
          </Link>
        </div>
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
          <i className="ri-external-link-line mr-1"></i>
          Site
        </Link>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="ri-admin-line text-white text-lg"></i>
            </div>
            {sidebarOpen && (
              <div>
                <span className="font-bold text-gray-900 dark:text-white">DeepInfluence</span>
                <p className="text-xs text-gray-500">Administration</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <i className={`ri-${sidebarOpen ? 'menu-fold' : 'menu-unfold'}-line`}></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive(item.href)
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <i className={`${item.icon} text-lg ${!isActive(item.href) && 'group-hover:text-blue-600'}`}></i>
              {sidebarOpen && (
                <>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      isActive(item.href) ? 'bg-white/20' : 'bg-red-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <i className="ri-external-link-line text-lg"></i>
            {sidebarOpen && <span className="font-medium">Voir le site</span>}
          </Link>
          <div className={`flex items-center gap-3 mt-2 px-3 py-2 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Bar */}
        <header className="hidden lg:flex h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {navItems.find(item => isActive(item.href))?.label || 'Administration'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <i className="ri-dashboard-line"></i>
              Dashboard User
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
