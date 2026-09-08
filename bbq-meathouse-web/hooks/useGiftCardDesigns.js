'use client';
import { useState, useEffect, useCallback } from 'react';
import { sb, BARRO_CONFIGURED } from '@/lib/supabaseClient';

export function demoDesigns() {
  return [
    { id: 'gd1', name: 'Ahumado clásico', image_url: 'https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=1200&auto=format&fit=crop', scope: 'global' },
    { id: 'gd2', name: 'Noche de parrilla', image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop', scope: 'global' },
  ];
}

export function useGiftCardDesigns() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (!BARRO_CONFIGURED) { setDesigns(demoDesigns()); setLoading(false); return; }
    const { data, error } = await sb.from('gift_card_designs').select('*').order('sort_order', { ascending: true });
    if (error) { setDesigns(demoDesigns()); setLoading(false); return; }
    setDesigns(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { designs, loading, reload: load };
}
