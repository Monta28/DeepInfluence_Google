"use client";
import React, { useEffect, useState } from "react";
import ApiService from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

type ListFn = (args: any) => Promise<any>;

declare global {
  interface ApiServiceAug {
    adminListVideos?: ListFn;
    adminListFormations?: ListFn;
    adminDeleteVideo?: (id: number) => Promise<any>;
    adminDeleteFormation?: (id: number) => Promise<any>;
  }
}

export default function AdminContentPage() {
  const [tab, setTab] = useState<"videos" | "formations">("videos");
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const svc: ApiServiceAug = (ApiService as unknown) as ApiServiceAug;
      if (tab === "videos") {
        const r = await svc.adminListVideos?.({ search, limit: 50 });
        if ((r as any)?.success) setItems((r as any).data.items || []);
      } else {
        const r = await svc.adminListFormations?.({ search, limit: 50 });
        if ((r as any)?.success) setItems((r as any).data.items || []);
      }
    } catch {
      addToast("Erreur de chargement du contenu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const remove = async (id: number) => {
    if (!confirm("Confirmer la suppression ?")) return;
    try {
      const svc: ApiServiceAug = (ApiService as unknown) as ApiServiceAug;
      const r =
        tab === "videos"
          ? await svc.adminDeleteVideo?.(id)
          : await svc.adminDeleteFormation?.(id);
      if ((r as any)?.success) {
        addToast("Élément supprimé", "success");
        load();
      }
    } catch {
      addToast("Erreur lors de la suppression", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Contenu</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("videos")}
            className={`px-3 py-2 rounded-lg ${
              tab === "videos"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            Vidéos
          </button>
          <button
            onClick={() => setTab("formations")}
            className={`px-3 py-2 rounded-lg ${
              tab === "formations"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            Formations
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche"
            className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
          />
          <button onClick={load} className="px-3 py-2 rounded-lg bg-blue-600 text-white">
            Rechercher
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-gray-600">Chargement…</div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              className="bg-white dark:bg-gray-800 rounded-xl border p-4 flex items-start justify-between"
            >
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-xs text-gray-500">
                  {tab === "videos"
                    ? (typeof it.expert === 'string'
                        ? it.expert
                        : (it.expert?.name || it.expertRel?.name || 'N/A'))
                    : (it.instructor || 'N/A')}
                  {' '}• ID {it.id}
                </div>
              </div>
              <button onClick={() => remove(it.id)} className="px-3 py-1 rounded bg-red-600 text-white">
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
