import { createClient, type Client } from '@libsql/client';
import dotenv from 'dotenv';

// 서버 프로세스 시작 시 .env 로드
dotenv.config();

/**
 * [보안 원칙]: TURSO_DATABASE_URL과 TURSO_AUTH_TOKEN은 오직 Node.js 백엔드 서버에서만 로드됩니다.
 * 프론트엔드 브라우저 번들에 절대 노출되지 않도록 서버 전용 환경변수를 사용합니다.
 */
const databaseUrl = process.env.TURSO_DATABASE_URL || 'file:local_hanok.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

if (!process.env.TURSO_DATABASE_URL) {
  console.warn(
    '[Turso DB Warning]: TURSO_DATABASE_URL이 설정되지 않아 로컬 SQLite 임베디드 파일("file:local_hanok.db")을 사용합니다.'
  );
}

export const db: Client = createClient({
  url: databaseUrl,
  authToken: authToken,
});

/**
 * 서버 시작 시 필요한 테이블(designs, ai_contents)이 없으면 자동으로 생성하고
 * 기본 AI 콘텐츠 데이터를 시딩합니다.
 */
export async function initDatabase(): Promise<void> {
  try {
    // 1. designs 테이블 생성
    await db.execute(`
      CREATE TABLE IF NOT EXISTS designs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        thumbnail TEXT,
        design_data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 2. ai_contents 테이블 생성
    await db.execute(`
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
    `);

    // 3. 기본 AI 샘플 데이터 시딩 (비어있을 때만 추가)
    const existingCount = await db.execute('SELECT COUNT(*) as count FROM ai_contents');
    const count = Number(existingCount.rows[0]?.count || 0);

    if (count === 0) {
      const now = new Date().toISOString();
      await db.batch([
        {
          sql: `INSERT INTO ai_contents (id, title, type, category, image_url, video_url, tool, prompt, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            'ai_1',
            '경복궁 경회루의 달빛 야경',
            'image',
            'HANOK',
            '/images/gallery/ai_hanok_night.jpg',
            null,
            'Midjourney v6',
            'Cinematic photo of traditional Korean palace pavilion Gyeonghoeru over water at night, moonlight reflection, hyper-realistic, 8k',
            '수면 위에 비친 전통 누각과 은은한 달빛의 조화',
            now,
          ],
        },
        {
          sql: `INSERT INTO ai_contents (id, title, type, category, image_url, video_url, tool, prompt, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            'ai_2',
            '사개맞춤 목구조 결구 디테일',
            'image',
            'DETAIL',
            '/images/gallery/ai_joinery_detail.jpg',
            null,
            'DALL-E 3',
            'Close-up architectural macro photography of traditional Korean timber framing joinery, interlocked wooden beams without nails, soft ambient lighting',
            '못 없이 나무와 나무가 서로를 맞물며 지탱하는 한국 고유의 결구 미학',
            now,
          ],
        },
        {
          sql: `INSERT INTO ai_contents (id, title, type, category, image_url, video_url, tool, prompt, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            'ai_3',
            '설경 속 전통 한옥마을',
            'image',
            'LANDSCAPE',
            '/images/gallery/ai_winter_hanok.jpg',
            null,
            'Stable Diffusion XL',
            'Snow covered Korean traditional Hanok tiled roofs, peaceful winter village, soft snowfall, warm light emitting from hanji windows',
            '기와선 위로 고요히 쌓인 눈과 창호지 사이로 스며 나오는 따뜻한 온기',
            now,
          ],
        },
      ]);
      console.log('[Turso DB]: Initial AI contents sample data seeded successfully.');
    }

    console.log('[Turso DB]: Database tables initialized successfully.');
  } catch (error) {
    console.error('[Turso DB Error] Failed to initialize database tables:', error);
    throw error;
  }
}
