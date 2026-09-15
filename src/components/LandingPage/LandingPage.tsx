import React from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '../../store';

const SILHOUETTE_STEPS = [
  { id: 'empty', label: 'EMPTY SPACE', subtitle: '고요한 터의 시작' },
  { id: 'foundation', label: 'FOUNDATION', subtitle: '기단과 초석의 놓임' },
  { id: 'pillars', label: 'PILLARS', subtitle: '수직의 질서, 기둥' },
  { id: 'beams', label: 'BEAMS', subtitle: '도리와 보의 결구' },
  { id: 'roof', label: 'ROOF', subtitle: '처마의 유려한 곡선' },
];

export const LandingPage: React.FC = () => {
  const setIsStarted = useUIStore((state) => state.setIsStarted);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--color-ink)',
        color: 'var(--color-ivory)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '3rem 2rem',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Background Subtle Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60vw',
          height: '60vw',
          maxHeight: '600px',
          maxWidth: '600px',
          background: 'radial-gradient(circle, rgba(92, 143, 135, 0.12) 0%, rgba(21, 24, 26, 0) 70%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />

      {/* Top Meta Bar */}
      <header
        style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.82rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          opacity: 0.65,
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '1.25rem',
        }}
      >
        <span>Digital Hanok Pavilion</span>
        <span>Crafting Architecture In Code</span>
      </header>

      {/* Center Hero Content */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 2,
          maxWidth: '960px',
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{
            fontSize: '0.9rem',
            letterSpacing: '0.45em',
            color: 'var(--color-celadon)',
            marginBottom: '1rem',
            fontWeight: 500,
          }}
        >
          BUILD KOREAN HERITAGE
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          style={{
            fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
            fontWeight: 200,
            letterSpacing: '0.15em',
            margin: '0 0 2.5rem 0',
            lineHeight: 1.1,
            color: 'var(--color-ivory)',
          }}
        >
          HANOK MAKER
        </motion.h1>

        {/* Sequential Fade-in Silhouette Step Graphic */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            margin: '1.5rem 0 2rem 0',
          }}
        >
          {SILHOUETTE_STEPS.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.5 + idx * 0.35,
                ease: 'easeOut',
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div
                style={{
                  width: idx === 4 ? '56px' : '44px',
                  height: idx === 0 ? '12px' : `${16 + idx * 8}px`,
                  border: '1px solid rgba(239, 231, 214, 0.3)',
                  backgroundColor: idx === 4 ? 'rgba(92, 143, 135, 0.25)' : 'rgba(32, 37, 38, 0.6)',
                  borderRadius: idx === 4 ? '12px 12px 2px 2px' : '3px',
                  transition: 'all 0.3s ease',
                  boxShadow: idx === 4 ? '0 0 16px rgba(92, 143, 135, 0.3)' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  opacity: 0.7,
                  fontFamily: 'monospace',
                }}
              >
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Bottom CTA */}
      <footer
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 2,
        }}
      >
        <motion.button
          onClick={() => setIsStarted(true)}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{
            scale: 1.05,
            backgroundColor: '#6da69c',
            boxShadow: '0 8px 30px rgba(92, 143, 135, 0.4)',
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundColor: 'var(--color-celadon)',
            color: 'var(--color-ink)',
            padding: '1.1rem 3.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '0.25em',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            border: 'none',
            boxShadow: 'var(--shadow-soft)',
            transition: 'all 0.25s ease',
          }}
        >
          시작하기
        </motion.button>
        <p style={{ fontSize: '0.75rem', opacity: 0.4, letterSpacing: '0.1em' }}>
          CLICK TO ENTER INTERACTIVE WORKSPACE
        </p>
      </footer>
    </motion.div>
  );
};
