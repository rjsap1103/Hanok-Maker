import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DUMMY_VIDEOS, type AIVideoCardData } from '../AIGallery/galleryData';

interface AIVideoViewerProps {
  onClose?: () => void;
}

export const AIVideoViewer: React.FC<AIVideoViewerProps> = ({ onClose }) => {
  const [, setActiveVideo] = useState<AIVideoCardData | null>(null);

  const handlePlay = (vid: AIVideoCardData) => {
    setActiveVideo(vid);
    console.log(`[ACTION] PLAY video: ${vid.title} (${vid.tool})`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 92,
        backgroundColor: 'rgba(21, 24, 26, 0.96)',
        backdropFilter: 'blur(28px)',
        overflowY: 'auto',
        padding: '3rem 2rem',
        color: 'var(--color-ivory)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '1.5rem',
            marginBottom: '2.5rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-copper)',
                letterSpacing: '0.2em',
                fontWeight: 600,
              }}
            >
              CINEMATIC MOTION ARCHIVE
            </span>
            <h2
              style={{
                fontSize: '2.2rem',
                fontWeight: 300,
                letterSpacing: '0.1em',
                margin: '0.25rem 0 0 0',
              }}
            >
              AI VIDEO VIEWER
            </h2>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(32, 37, 38, 0.8)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ivory)',
                cursor: 'pointer',
              }}
            >
              ✕ CLOSE
            </button>
          )}
        </div>

        {/* Video Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {DUMMY_VIDEOS.map((vid) => (
            <motion.div
              key={vid.id}
              whileHover={{ y: -5 }}
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-soft)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Video Thumbnail Frame */}
              <div
                style={{
                  height: '180px',
                  background: vid.bgGradient,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                }}
              >
                {/* [VIDEO] Label */}
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(21, 24, 26, 0.8)',
                    color: 'var(--color-ivory)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(239, 231, 214, 0.15)',
                  }}
                >
                  [{vid.tag}]
                </span>

                {/* Duration */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(21, 24, 26, 0.85)',
                    color: 'var(--color-ivory)',
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {vid.duration}
                </span>

                {/* Center Play Icon Circle */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlay(vid)}
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(92, 143, 135, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    color: 'var(--color-ink)',
                    fontSize: '1.2rem',
                    paddingLeft: '3px',
                  }}
                >
                  ▶
                </motion.div>
              </div>

              {/* Video Info & Play Button */}
              <div
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      color: 'var(--color-ivory)',
                    }}
                  >
                    {vid.title}
                  </h4>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'rgba(239, 231, 214, 0.5)',
                      marginTop: '2px',
                    }}
                  >
                    AI Generator: <span style={{ color: 'var(--color-celadon)' }}>{vid.tool}</span>
                  </div>
                </div>

                <button
                  onClick={() => handlePlay(vid)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: 'var(--color-celadon)',
                    color: 'var(--color-ink)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  [PLAY]
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
