-- =============================================================================
-- Hanok Maker: Turso (SQLite 기반) 데이터베이스 스키마
-- =============================================================================

-- 1. 한옥 결구 설계 작품 저장 테이블
CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  design_data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. AI 생성 한옥 콘텐츠 저장 테이블
CREATE TABLE IF NOT EXISTS ai_contents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  video_url TEXT,
  tool TEXT,
  prompt TEXT,
  description TEXT,
  created_at TEXT NOT NULL
);
