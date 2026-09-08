'use client';
import { useState, useEffect, useCallback } from 'react';
import { sb, BARRO_CONFIGURED } from '@/lib/supabaseClient';

export function demoMenu() {
  return [
    { id: 'd1', name: 'Brisket ahumado 14 horas', category: 'Ahumados', price: 480, featured: true, tags: 'Ahumado,Res,Especialidad', image_url: 'https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=700&h=700&fit=crop&crop=entropy&auto=format' },
    { id: 'd2', name: 'Costillas de cerdo BBQ', category: 'Ahumados', price: 420, featured: false, tags: 'Ahumado,Cerdo', image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=700&h=700&fit=crop&crop=entropy&auto=format' },
    { id: 'd3', name: 'Pollo a la parrilla', category: 'Parrilla', price: 320, featured: false, tags: 'Parrilla,Pollo', image_url: 'https://images.unsplash.com/photo-1558030089-02acba3c214e?q=80&w=700&h=700&fit=crop&crop=entropy&auto=format' },
    { id: 'd4', name: 'Hamburguesa Meathouse', category: 'Parrilla', price: 350, featured: false, tags: 'Res,Parrilla', image_url: 'https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=700&h=700&fit=crop&crop=entropy&auto=format' },
    { id: 'd5', name: 'Mac and cheese ahumado', category: 'Guarniciones', price: 220, featured: false, tags: 'Guarnición,Vegetariano', image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=700&h=700&fit=crop&crop=entropy&auto=format' },
    { id: 'd6', name: 'Papas con especias de la casa', category: 'Guarniciones', price: 180, featured: false, tags: 'Guarnición', image_url: 'https://images.unsplash.com/photo-1558030089-02acba3c214e?q=80&w=700&h=700&fit=crop&crop=entropy&auto=format' },
    { id: 'd7', name: 'Limonada de la casa', category: 'Bebidas', price: 150, featured: false, tags: 'Refrescante,Sin alcohol', image_url: 'https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=700&h=700&fit=crop&crop=entropy&auto=format' },
    { id: 'd8', name: 'Cerveza artesanal', category: 'Bebidas', price: 220, featured: false, tags: 'Artesanal,Fría', image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=700&h=700&fit=crop&crop=entropy&auto=format' },
  ];
}

export function money(n) { return Number(n).toLocaleString('es-DO') + '$'; }

export function useMenuItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (!BARRO_CONFIGURED) { setItems(demoMenu()); setLoading(false); return; }
    const { data, error } = await sb.from('menu_items').select('*').order('created_at', { ascending: true });
    if (error) { setItems(demoMenu()); setLoading(false); return; }
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { items, loading, reload: load };
}
