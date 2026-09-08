'use client';
import { motion } from 'framer-motion';
import { useBranch, BRANCHES } from '@/context/BranchContext';
import GlowCard from './GlowCard';

export default function BranchGate({ onClose, allowClose = false }) {
  const { setBranch } = useBranch();

  function choose(id) {
    setBranch(id);
    if (onClose) onClose();
  }

  return (
    <motion.div
      className="branch-gate"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {allowClose && (
        <button type="button" className="modal-close branch-gate-close" onClick={onClose} aria-label="Cerrar">
          <svg className="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      )}
      <motion.div
        className="branch-gate-inner"
        initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <p className="eyebrow branch-gate-eyebrow">BBQ Meathouse</p>
        <h2 className="branch-gate-title">¿Cuál sucursal quieres?</h2>
        <p className="branch-gate-sub">Puedes cambiarla cuando quieras desde tu cuenta.</p>

        <div className="branch-gate-cards">
          {BRANCHES.map((b) => (
            <GlowCard key={b.id} hue={b.hue} onClick={() => choose(b.id)}>
              <h3>{b.name}</h3>
              <p>{b.full}</p>
              <span className="branch-gate-cta">Elegir esta sucursal <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
            </GlowCard>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
