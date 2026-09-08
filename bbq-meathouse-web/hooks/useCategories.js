'use client';
import { useState, useEffect, useCallback } from 'react';
import { sb, BARRO_CONFIGURED } from '@/lib/supabaseClient';

export function demoCategories() {
  return [
    { id: 'c1', name: 'Ahumados', icon: 'flame', tint: 'manana', sort_order: 1 },
    { id: 'c2', name: 'Parrilla', icon: 'meat', tint: 'tarde', sort_order: 2 },
    { id: 'c3', name: 'Guarniciones', icon: 'side', tint: 'salado', sort_order: 3 },
    { id: 'c4', name: 'Bebidas', icon: 'drink', tint: 'experiencia', sort_order: 4 },
  ];
}

export const TINT_KEYS = ['manana', 'salado', 'tarde', 'experiencia'];

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (!BARRO_CONFIGURED) { setCategories(demoCategories()); setLoading(false); return; }
    const { data, error } = await sb.from('categories').select('*').order('sort_order', { ascending: true });
    // Solo si la tabla no existe todavía (no se ha corrido la migración) usamos
    // las categorías de muestra; si de verdad no hay ninguna, respeta eso.
    if (error) { setCategories(demoCategories()); setLoading(false); return; }
    setCategories(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { categories, loading, reload: load };
}
