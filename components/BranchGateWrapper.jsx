'use client';
import { AnimatePresence } from 'framer-motion';
import { useBranch } from '@/context/BranchContext';
import BranchGate from './BranchGate';

export default function BranchGateWrapper() {
  const { branch, ready } = useBranch();

  if (!ready) return null;
  const show = !branch;

  return (
    <AnimatePresence>
      {show && <BranchGate />}
    </AnimatePresence>
  );
}
