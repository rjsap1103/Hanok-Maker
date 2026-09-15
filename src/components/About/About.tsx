import React from 'react';

interface AboutProps {
  onClose?: () => void;
}

const TECH_STACK = [
  { category: 'Frontend Core', tech: ['React 19', 'TypeScript', 'Vite'] },
  { category: '3D & Graphics', tech: ['Three.js', 'React Three Fiber (R3F)', '@react-three/drei'] },
  { category: 'State & Motion', tech: ['Zustand (Multi-slice)', 'Framer Motion'] },
  { category: 'Backend & Edge DB', tech: ['Express.js', 'Turso (LibSQL SQLite)', 'Drizzle ORM'] },
  { category: 'AI Generation Pipeline', tech: ['Midjourney v6.1', 'Google Veo', 'Flux.1 Schnell', 'Runway Gen-3'] },
];

export const About: React.FC<AboutProps> = ({ onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 95,
        backgroundColor: 'rgba(21, 24, 26, 0.96)',
        backdropFilter: 'blur(30px)',
        overflowY: 'auto',
        padding: '3rem 2rem',
        color: 'var(--color-ivory)',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '1.5rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-celadon)',
                letterSpacing: '0.25em',
                fontWeight: 600,
              }}
            >
              DIGITAL MUSEUM & ARCHITECTURE STUDIO
            </span>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 300,
                letterSpacing: '0.1em',
                margin: '0.25rem 0 0 0',
              }}
            >
              ABOUT / PORTFOLIO
            </h1>
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

        {/* Section 1: Statement / Intention */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            lineHeight: 1.8,
            fontSize: '0.95rem',
            color: 'rgba(239, 231, 214, 0.85)',
          }}
        >
          <h2
            style={{
              fontSize: '1.1rem',
              letterSpacing: '0.15em',
              color: 'var(--color-copper)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            PROJECT STATEMENT
          </h2>
          <p>
            <strong>HANOK MAKER</strong>는 수백 년간 이어져 내려온 한국 전통 건축의 과학적인 목구조 결구 방식과
            비례의 미학을 현대적인 웹 3D 기술과 생성형 AI 비주얼로 재해석한 인터랙티브 아키텍처 플랫폼입니다.
          </p>
          <p>
            흔히 박제된 전통으로만 여겨지던 한옥의 기단(Foundation), 기둥(Pillar), 보(Beam), 창호(Window), 지붕(Roof)을
            단계별로 조립하며, 흙과 돌, 나무와 종이가 이루어내는 유려한 건축의 호흡을 직접 경험할 수 있습니다.
          </p>
        </section>

        {/* Section 2: Creator Profile */}
        <section
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.1rem',
              letterSpacing: '0.15em',
              color: 'var(--color-celadon)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            CREATOR & DIRECTION
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-ivory)' }}>
              Creative Technologist & Architectural Designer
            </div>
            <p style={{ fontSize: '0.88rem', color: 'rgba(239, 231, 214, 0.7)', margin: 0 }}>
              전통 한국 문화 자산의 디지털 트랜스포메이션과 WebGL/WebGPU 실시간 3D 인터랙션을 연구합니다.
              디지털 박물관 및 아키텍처 스튜디오와의 협업을 통해 차세대 유산 보존 경험을 제작하고 있습니다.
            </p>
          </div>
        </section>

        {/* Section 3: Tech Stack */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2
            style={{
              fontSize: '1.1rem',
              letterSpacing: '0.15em',
              color: 'var(--color-copper)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            TECHNOLOGY STACK
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {TECH_STACK.map((item) => (
              <div
                key={item.category}
                style={{
                  backgroundColor: 'rgba(32, 37, 38, 0.6)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(239, 231, 214, 0.1)',
                  padding: '1.25rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-celadon)',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    marginBottom: '0.75rem',
                  }}
                >
                  {item.category}
                </div>
                <ul
                  style={{
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                    color: 'var(--color-ivory)',
                  }}
                >
                  {item.tech.map((t) => (
                    <li key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--color-border)' }}>—</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Footer info */}
        <footer
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1.5rem',
            fontSize: '0.75rem',
            color: 'rgba(239, 231, 214, 0.4)',
            letterSpacing: '0.1em',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>HANOK MAKER • DIGITAL HERITAGE INITIATIVE</span>
          <span>© 2026 ALL RIGHTS RESERVED.</span>
        </footer>
      </div>
    </div>
  );
};
