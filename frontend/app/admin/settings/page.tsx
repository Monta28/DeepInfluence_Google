'use client';

import React, { useEffect, useState } from 'react';
import ApiService from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  position: 'before' | 'after';
}

const PRESET_CURRENCIES = [
  { code: 'TND', symbol: 'TND', name: 'Dinar Tunisien', position: 'after' as const },
  { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' as const },
  { code: 'USD', symbol: '$', name: 'Dollar US', position: 'before' as const },
  { code: 'GBP', symbol: '£', name: 'Livre Sterling', position: 'before' as const },
  { code: 'MAD', symbol: 'MAD', name: 'Dirham Marocain', position: 'after' as const },
  { code: 'DZD', symbol: 'DZD', name: 'Dinar Algérien', position: 'after' as const },
];

export default function AdminSettingsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState<CurrencyConfig>({
    code: 'TND',
    symbol: 'TND',
    name: 'Dinar Tunisien',
    position: 'after'
  });

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getCurrency();
      if (res.success && res.data) {
        setCurrency(res.data);
      }
    } catch (e) {
      console.error('Erreur chargement devise:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: CurrencyConfig) => {
    setCurrency(preset);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await ApiService.updateCurrency(currency);
      if (res.success) {
        addToast('Devise mise à jour avec succès', 'success');
      } else {
        addToast(res.message || 'Erreur lors de la mise à jour', 'error');
      }
    } catch (e: any) {
      addToast(e?.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatExample = (amount: number) => {
    if (currency.position === 'before') {
      return `${currency.symbol}${amount}`;
    }
    return `${amount} ${currency.symbol}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Paramètres</h1>

      {/* Currency Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <i className="ri-money-dollar-circle-line text-green-600"></i>
          Configuration de la devise
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sélectionnez la devise utilisée pour afficher les prix dans l'application.
        </p>

        {/* Preset currencies */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Devises prédéfinies
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {PRESET_CURRENCIES.map((preset) => (
              <button
                key={preset.code}
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  currency.code === preset.code
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-semibold">{preset.symbol}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{preset.code}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code devise
            </label>
            <input
              type="text"
              value={currency.code}
              onChange={(e) => setCurrency({ ...currency, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
              placeholder="TND, EUR, USD..."
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Symbole
            </label>
            <input
              type="text"
              value={currency.symbol}
              onChange={(e) => setCurrency({ ...currency, symbol: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
              placeholder="€, $, TND..."
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              value={currency.name}
              onChange={(e) => setCurrency({ ...currency, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
              placeholder="Dinar Tunisien, Euro..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Position du symbole
            </label>
            <select
              value={currency.position}
              onChange={(e) => setCurrency({ ...currency, position: e.target.value as 'before' | 'after' })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
            >
              <option value="before">Avant le montant (€100)</option>
              <option value="after">Après le montant (100 TND)</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Aperçu
          </label>
          <div className="flex items-center gap-6 text-lg">
            <span className="text-gray-600 dark:text-gray-400">Prix:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatExample(99)}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatExample(1500)}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatExample(25000)}</span>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
              saving
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enregistrement...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <i className="ri-save-line"></i>
                Enregistrer
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-start gap-3">
          <i className="ri-information-line text-blue-600 text-xl mt-0.5"></i>
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-300">Note importante</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              La modification de la devise affecte uniquement l'affichage des prix dans l'application.
              Les utilisateurs devront rafraîchir leur page pour voir les changements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
