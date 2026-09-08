'use client';
import { useState, useEffect, useCallback } from 'react';
import { sb, BARRO_CONFIGURED } from '@/lib/supabaseClient';

export function demoCategories() {
  return [
    { id: 'c1', name: 'Cervezas', icon: 'drink', tint: 'manana', sort_order: 1 },
    { id: 'c2', name: 'Cócteles', icon: 'drink', tint: 'salado', sort_order: 2 },
    { id: 'c3', name: 'Refrescos', icon: 'drink', tint: 'tarde', sort_order: 3 },
    { id: 'c4', name: 'Café', icon: 'drink', tint: 'experiencia', sort_order: 4 },
    { id: 'c5', name: 'Agua', icon: 'drink', tint: 'manana', sort_order: 5 },
    { id: 'c6', name: 'Tg. Ron', icon: 'drink', tint: 'salado', sort_order: 6 },
    { id: 'c7', name: 'Tg. Vodka', icon: 'drink', tint: 'tarde', sort_order: 7 },
    { id: 'c8', name: 'Tg. Whisky', icon: 'drink', tint: 'experiencia', sort_order: 8 },
    { id: 'c9', name: 'Tg. Ginebra', icon: 'drink', tint: 'manana', sort_order: 9 },
    { id: 'c10', name: 'Rest. Guarniciones', icon: 'side', tint: 'salado', sort_order: 10 },
    { id: 'c11', name: 'Tg. Tequila', icon: 'drink', tint: 'tarde', sort_order: 11 },
    { id: 'c12', name: 'Rest. Salsas', icon: 'sauce', tint: 'experiencia', sort_order: 12 },
    { id: 'c13', name: 'Jugos', icon: 'drink', tint: 'manana', sort_order: 13 },
    { id: 'c14', name: 'Postres', icon: 'dessert', tint: 'salado', sort_order: 14 },
    { id: 'c15', name: 'Ofertas Delivery y Pick Up', icon: 'flame', tint: 'tarde', sort_order: 15 },
    { id: 'c16', name: 'Congelados Pollo', icon: 'meat', tint: 'experiencia', sort_order: 16 },
    { id: 'c17', name: 'Congelados Res', icon: 'meat', tint: 'manana', sort_order: 17 },
    { id: 'c18', name: 'Congelados Entre Panes', icon: 'meat', tint: 'salado', sort_order: 18 },
    { id: 'c19', name: 'Congelados Cerdo', icon: 'ribs', tint: 'tarde', sort_order: 19 },
    { id: 'c20', name: 'Congelados del Mar', icon: 'meat', tint: 'experiencia', sort_order: 20 },
    { id: 'c21', name: 'Congelados Guarniciones', icon: 'side', tint: 'manana', sort_order: 21 },
    { id: 'c22', name: 'Carbón', icon: 'flame', tint: 'salado', sort_order: 22 },
    { id: 'c23', name: 'Rest. Entradas', icon: 'side', tint: 'tarde', sort_order: 23 },
    { id: 'c24', name: 'Rest. Niños', icon: 'meat', tint: 'experiencia', sort_order: 24 },
    { id: 'c25', name: 'Rest. Ensaladas', icon: 'side', tint: 'manana', sort_order: 25 },
    { id: 'c26', name: 'Rest. Res', icon: 'meat', tint: 'salado', sort_order: 26 },
    { id: 'c27', name: 'Rest. Cerdo', icon: 'ribs', tint: 'tarde', sort_order: 27 },
    { id: 'c28', name: 'Rest. Pollo', icon: 'meat', tint: 'experiencia', sort_order: 28 },
    { id: 'c29', name: 'Rest. del Mar', icon: 'meat', tint: 'manana', sort_order: 29 },
    { id: 'c30', name: 'Rest. Entre Panes (Hamburguesas)', icon: 'meat', tint: 'salado', sort_order: 30 },
    { id: 'c31', name: 'Rest. Platones', icon: 'flame', tint: 'tarde', sort_order: 31 },
    { id: 'c32', name: 'Casabe', icon: 'side', tint: 'experiencia', sort_order: 32 },
    { id: 'c33', name: 'Congelado Salsas', icon: 'sauce', tint: 'manana', sort_order: 33 },
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
