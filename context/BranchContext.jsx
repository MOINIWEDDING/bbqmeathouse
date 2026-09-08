'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const BRANCHES = [
  { id: 'rafael_vidal', name: 'Rafael Vidal', full: 'BBQ Meathouse · Rafael Vidal', hue: 25 },
  { id: 'los_jardines', name: 'Los Jardines', full: 'BBQ Meathouse · Los Jardines', hue: 140 },
];

const BranchContext = createContext(null);
const KEY = 'bm-branch';

export function BranchProvider({ children }) {
  const [branch, setBranchState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(KEY);
      if (saved) setBranchState(saved);
    } catch (e) { /* ignore */ }
    setReady(true);
  }, []);

  const setBranch = useCallback((id) => {
    setBranchState(id);
    try { window.sessionStorage.setItem(KEY, id); } catch (e) { /* ignore */ }
  }, []);

  const branchInfo = BRANCHES.find((b) => b.id === branch) || null;

  return (
    <BranchContext.Provider value={{ branch, branchInfo, setBranch, ready }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch debe usarse dentro de <BranchProvider>');
  return ctx;
}
