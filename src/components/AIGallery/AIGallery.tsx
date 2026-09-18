import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DUMMY_GALLERY_ITEMS, type AIGalleryCardData } from './galleryData';
import { getDesigns, getDesignById, restoreBuildFromDesign, deleteDesign, type HanokDesignItem } from '../../api/designs';

type MainTab = 'SAVED_DESIGNS' | 'AI_ARCHIVE';
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
  const [activeTab, setActiveTab] = useState<MainTab>('SAVED_DESIGNS');
  const [savedDesigns, setSavedDesigns] = useState<HanokDesignItem[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [, setSelectedCard] = useState<AIGalleryCardData | null>(null);

  // DB에서 저장된 사용자 설계 작품 목록 불러오기
  const fetchSavedDesigns = async () => {
    setIsLoadingDesigns(true);
    try {
      const list = await getDesigns();
      setSavedDesigns(list);
    } catch (err) {
      console.error('[AIGallery] Failed to fetch saved designs:', err);
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  useEffect(() => {
    fetchSavedDesigns();
  }, []);

  // 특정 작품 클릭 시 4-3 스펙에 따라 불러와 3D Scene에 복원
  const handleLoadDesign = async (id: string, title: string) => {
    try {
      const design = await getDesignById(id);
      if (!design || !design.design_data) {
        alert('작품 데이터가 비어있습니다.');
        return;
      }
      restoreBuildFromDesign(design.design_data);
      alert(`🏛 "${title}" 작품을 3D 뷰에 성공적으로 불러왔습니다!`);
      if (onClose) onClose();
    } catch (err: any) {
      console.error('[AIGallery Load Error]:', err);
      alert(`작품 불러오기 실패: ${err.message}`);
    }
  };

  // 작품 삭제
  const handleDeleteDesign = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!confirm(`정말로 "${title}" 작품을 삭제하시겠습니까?`)) return;
    try {
      await deleteDesign(id);
      await fetchSavedDesigns();
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

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

        {/* Main Tabs: 내 한옥 저장 목록 vs AI 생성 아카이브 */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('SAVED_DESIGNS')}
            style={{
              padding: '0.85rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'SAVED_DESIGNS' ? '3px solid var(--color-celadon)' : '3px solid transparent',
              color: activeTab === 'SAVED_DESIGNS' ? 'var(--color-celadon)' : 'rgba(239, 231, 214, 0.6)',
              fontSize: '1rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🏛 내 저장 작품 ({savedDesigns.length})
          </button>
          <button
            onClick={() => setActiveTab('AI_ARCHIVE')}
            style={{
              padding: '0.85rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'AI_ARCHIVE' ? '3px solid var(--color-celadon)' : '3px solid transparent',
              color: activeTab === 'AI_ARCHIVE' ? 'var(--color-celadon)' : 'rgba(239, 231, 214, 0.6)',
              fontSize: '1rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ✨ AI 헤리티지 아카이브
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* [TAB 1]: SAVED DESIGNS (Turso DB 저장 작품 목록 및 클릭 시 Scene 복원) */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'SAVED_DESIGNS' && (
          <div>
            {isLoadingDesigns ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(239, 231, 214, 0.6)' }}>
                저장된 한옥 작품 목록을 불러오는 중입니다...
              </div>
            ) : savedDesigns.length === 0 ? (
              <div
                style={{
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  backgroundColor: 'rgba(32, 37, 38, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-border)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏛</div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--color-ivory)', marginBottom: '0.5rem' }}>
                  아직 저장된 한옥 설계 작품이 없습니다.
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(239, 231, 214, 0.6)' }}>
                  한옥을 완성한 후 [SAVE DESIGN] 버튼을 눌러 나만의 결구 작품을 DB에 저장해보세요.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.75rem',
                }}
              >
                {savedDesigns.map((design) => (
                  <motion.div
                    key={design.id}
                    onClick={() => handleLoadDesign(design.id, design.title)}
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
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {/* Thumbnail Box */}
                    <div
                      style={{
                        height: '180px',
                        backgroundColor: '#202526',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(92, 143, 135, 0.15) 0%, transparent 80%)',
                      }}
                    >
                      <span
                        style={{
                          alignSelf: 'flex-start',
                          fontSize: '0.7rem',
                          letterSpacing: '0.1em',
                          backgroundColor: 'rgba(92, 143, 135, 0.85)',
                          color: 'var(--color-ink)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        HANOK DESIGN
                      </span>
                      <div style={{ textAlign: 'center', fontSize: '2.5rem', opacity: 0.35 }}>
                        🏯
                      </div>
                      <span style={{ alignSelf: 'flex-end', fontSize: '0.72rem', color: 'rgba(239, 231, 214, 0.5)' }}>
                        클릭하여 3D 복원 ➔
                      </span>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-ivory)', margin: 0 }}>
                          {design.title}
                        </h3>
                        <button
                          onClick={(e) => handleDeleteDesign(e, design.id, design.title)}
                          title="작품 삭제"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            padding: '4px',
                          }}
                        >
                          🗑
                        </button>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(239, 231, 214, 0.7)', margin: 0, lineHeight: 1.4 }}>
                        {design.description || '상세 설명이 없는 한옥 설계입니다.'}
                      </p>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(239, 231, 214, 0.4)', marginTop: '0.4rem' }}>
                        저장일시: {new Date(design.updated_at || design.created_at).toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* [TAB 2]: AI GENERATIVE ARCHIVE */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'AI_ARCHIVE' && (
          <div>
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
        )}
      </div>
    </div>
  );
};
