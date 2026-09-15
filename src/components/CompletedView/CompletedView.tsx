import React from 'react';
import { motion } from 'framer-motion';
import { useBuildStore } from '../../store';

interface CompletedViewProps {
  onOpenGallery?: () => void;
}

export const CompletedView: React.FC<CompletedViewProps> = ({ onOpenGallery }) => {
  const setIsComplete = useBuildStore((state) => state.setIsComplete);
  const placedParts = useBuildStore((state) => state.placedParts);

  const handleViewHanok = () => {
    console.log('[ACTION] VIEW HANOK clicked - inspection mode');
    setIsComplete(false);
  };

  const handleCinematicMode = () => {
    console.log('[ACTION] CINEMATIC MODE clicked - cinematic camera animation initiated');
  };

  const handleSaveDesign = () => {
    console.log('[ACTION] SAVE DESIGN clicked - saved parts payload:', placedParts);
    alert('현재 한옥 결구 설계가 저장되었습니다. (콘솔 로그 확인)');
  };

  const handleAIGallery = () => {
    console.log('[ACTION] AI GALLERY clicked');
    if (onOpenGallery) {
      onOpenGallery();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(21, 24, 26, 0.88)',
        backdropFilter: 'blur(28px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.8 }}
        style={{
          maxWidth: '680px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        {/* Accent emblem */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(92, 143, 135, 0.15)',
            border: '1px solid var(--color-celadon)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-celadon)',
            fontSize: '1.8rem',
          }}
        >
          ✓
        </div>

        <div>
          <span
            style={{
              fontSize: '0.85rem',
              letterSpacing: '0.3em',
              color: 'var(--color-copper)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            TRADITIONAL CRAFTSMANSHIP ACCOMPLISHED
          </span>
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 300,
              letterSpacing: '0.12em',
              color: 'var(--color-ivory)',
              margin: '0.5rem 0 0.25rem 0',
            }}
          >
            BUILD COMPLETE
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              letterSpacing: '0.15em',
              color: 'rgba(239, 231, 214, 0.75)',
              fontWeight: 300,
            }}
          >
            YOUR HANOK IS READY.
          </p>
        </div>

        {/* 4 Core Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            width: '100%',
            marginTop: '1.5rem',
          }}
        >
          <button
            onClick={handleViewHanok}
            style={{
              padding: '1.1rem',
              backgroundColor: 'var(--color-celadon)',
              color: 'var(--color-ink)',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(92, 143, 135, 0.3)',
              transition: 'transform 0.2s',
            }}
          >
            [VIEW HANOK]
          </button>

          <button
            onClick={handleCinematicMode}
            style={{
              padding: '1.1rem',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-ivory)',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            [CINEMATIC MODE]
          </button>

          <button
            onClick={handleSaveDesign}
            style={{
              padding: '1.1rem',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-ivory)',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            [SAVE DESIGN]
          </button>

          <button
            onClick={handleAIGallery}
            style={{
              padding: '1.1rem',
              backgroundColor: 'var(--color-copper)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(197, 106, 61, 0.3)',
            }}
          >
            [AI GALLERY]
          </button>
        </div>

        <button
          onClick={() => setIsComplete(false)}
          style={{
            marginTop: '1rem',
            fontSize: '0.8rem',
            letterSpacing: '0.1em',
            color: 'rgba(239, 231, 214, 0.5)',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          빌드 화면으로 돌아가서 계속 수정하기
        </button>
      </motion.div>
    </motion.div>
  );
};
