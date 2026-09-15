import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DUMMY_GALLERY_ITEMS, type AIGalleryCardData } from './galleryData';

type FilterCategory = 'ALL' | 'HANOK' | 'ARCHITECTURE' | 'DETAIL' | 'LANDSCAPE' | 'MATERIAL' | 'CONCEPT';

const CATEGORIES: FilterCategory[] = [
  'ALL',
  'HANOK',
  'ARCHITECTURE',
  'DETAIL',
  'LANDSCAPE',
  'MATERIAL',
  'CONCEPT',
];

interface AIGalleryProps {
  onClose?: () => void;
}

export const AIGallery: React.FC<AIGalleryProps> = ({ onClose }) => {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [, setSelectedCard] = useState<AIGalleryCardData | null>(null);

  const filteredItems =
    activeFilter === 'ALL'
      ? DUMMY_GALLERY_ITEMS
      : DUMMY_GALLERY_ITEMS.filter((item) => item.category === activeFilter);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        backgroundColor: 'rgba(21, 24, 26, 0.95)',
        backdropFilter: 'blur(30px)',
        overflowY: 'auto',
        padding: '3rem 2rem',
        color: 'var(--color-ivory)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-celadon)',
                letterSpacing: '0.25em',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Generative Heritage Archive
            </span>
            <h2
              style={{
                fontSize: '2.4rem',
                fontWeight: 300,
                letterSpacing: '0.1em',
                margin: '0.3rem 0 0 0',
              }}
            >
              AI GALLERY
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
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              ✕ CLOSE ARCHIVE
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '2.5rem',
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--color-celadon)' : 'rgba(32, 37, 38, 0.6)',
                  color: isActive ? 'var(--color-ink)' : 'var(--color-ivory)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.8rem',
                  letterSpacing: '0.1em',
                  border: isActive ? 'none' : '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Gallery Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              onClick={() => setSelectedCard(item)}
              whileHover={{ y: -6 }}
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-soft)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Image Preview Box (Stylized Architectural Graphic) */}
              <div
                style={{
                  height: '210px',
                  backgroundColor: item.imagePlaceholderColor,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  position: 'relative',
                  backgroundImage:
                    'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 60%)',
                }}
              >
                <span
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    backgroundColor: 'rgba(21, 24, 26, 0.75)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    color: 'var(--color-ivory)',
                  }}
                >
                  {item.category}
                </span>

                <div
                  style={{
                    textAlign: 'center',
                    opacity: 0.25,
                    fontSize: '3rem',
                    letterSpacing: '0.2em',
                    fontFamily: 'serif',
                  }}
                >
                  韓屋
                </div>

                <span
                  style={{
                    alignSelf: 'flex-end',
                    fontSize: '0.72rem',
                    backgroundColor: 'rgba(92, 143, 135, 0.85)',
                    color: 'var(--color-ink)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  {item.aiTool}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: 'var(--color-ivory)',
                  }}
                >
                  {item.title}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-copper)', fontWeight: 500 }}>
                  STYLE: {item.style}
                </div>
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'rgba(239, 231, 214, 0.65)',
                    lineHeight: 1.5,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  <strong>Prompt:</strong> {item.prompt}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
